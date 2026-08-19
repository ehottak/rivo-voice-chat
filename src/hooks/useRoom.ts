'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from './useSocket';
import { useParticipants } from './useParticipants';
import { useWebRTC } from './useWebRTC';
import { getSocket } from '@/lib/socket';
import type { Participant, RoomInfo, ParticipantInfo } from '@/types';

import type { PeerConnectionState } from './useWebRTC';

interface UseRoomProps {
  roomInfo: RoomInfo;
  nickname: string;
  initialDeviceId?: string;
  initialStream?: MediaStream;
}

interface UseRoomReturn {
  isJoined: boolean;
  isJoining: boolean;
  joinStep: string;
  isMuted: boolean;
  error: string | null;
  participants: Participant[];
  localParticipant: Participant | null;
  localStream: MediaStream | null;
  currentDeviceId: string;
  peerStates: Record<string, PeerConnectionState>;
  unlockAllAudio: () => void;
  screenStream: MediaStream | null;
  isSharingScreen: boolean;
  remoteScreenStreams: Record<string, MediaStream>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  cameraStream: MediaStream | null;
  isCameraOn: boolean;
  remoteCameraStreams: Record<string, MediaStream>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  reconnectPeer: (peerId: string) => void;
  joinRoom: () => Promise<void>;
  leaveRoom: () => void;
  toggleMute: () => void;
  changeMicrophoneDevice: (deviceId: string) => Promise<void>;
  currentOutputDeviceId: string;
  changeAudioOutputDevice: (deviceId: string) => Promise<void>;
}

export function useRoom({ roomInfo, nickname, initialDeviceId, initialStream }: UseRoomProps): UseRoomReturn {
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinStep, setJoinStep] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>(initialDeviceId || '');
  const [localStream, setLocalStream] = useState<MediaStream | null>(initialStream || null);

  const localStreamRef = useRef<MediaStream | null>(initialStream || null);
  const autoJoinAttempted = useRef(false);

  const { socket, isConnected, connect, disconnect } = useSocket();

  const { updateSpeakingState } = useParticipants({
    socket,
    isConnected,
    participants,
    setParticipants,
  });

  const {
    initializePeerConnections,
    closePeerConnection,
    closeAllConnections,
    replaceAudioTrack,
    peerStates,
    unlockAllAudio,
    screenStream,
    isSharingScreen,
    remoteScreenStreams,
    startScreenShare,
    stopScreenShare,
    cameraStream,
    isCameraOn,
    remoteCameraStreams,
    startCamera,
    stopCamera,
    reconnectPeer,
    currentOutputDeviceId,
    changeAudioOutputDevice,
  } = useWebRTC({
    localStream,
    onSpeakingChange: updateSpeakingState,
  });

  // Handle participant leaving: close their peer connection
  useEffect(() => {
    const sock = getSocket();

    const handleLeft = (data: { peerId: string }) => {
      closePeerConnection(data.peerId);
    };

    const handleJoined = (data: { id?: string; peerId: string; userId?: string; nickname: string; isMuted?: boolean }) => {
      console.log(`[useRoom] Participant joined: ${data.nickname} (${data.peerId}), instant WebRTC connection...`);
      initializePeerConnections([
        {
          id: data.id || data.peerId,
          peerId: data.peerId,
          userId: data.userId || data.peerId,
          nickname: data.nickname,
          isMuted: data.isMuted ?? false,
        },
      ]);
    };

    sock.on('participant:left', handleLeft);
    sock.on('participant:joined', handleJoined);

    return () => {
      sock.off('participant:left', handleLeft);
      sock.off('participant:joined', handleJoined);
    };
  }, [closePeerConnection, initializePeerConnections]);

  const joinRoom = useCallback(async () => {
    if (isJoining || isJoined) return;
    setIsJoining(true);
    setError(null);
    setJoinStep('🎙️ Verificando áudio...');

    try {
      let stream: MediaStream | null = localStreamRef.current;

      // Check if we already have an active stream from user gesture
      const hasActiveTracks = stream && stream.getAudioTracks().some((t) => t.readyState === 'live');

      if (!hasActiveTracks) {
        console.log('[useRoom] 1. Requesting microphone access...');
        try {
          const audioConstraints: MediaTrackConstraints = {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          };

          if (currentDeviceId && currentDeviceId !== 'default') {
            audioConstraints.deviceId = { ideal: currentDeviceId };
          }

          stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
            video: false,
          });
        } catch (micErr: unknown) {
          console.warn('[useRoom] Retry with default audio constraints...', micErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
          } catch (retryErr: unknown) {
            console.warn('[useRoom] Microphone not immediately available (listener mode enabled):', retryErr);
            stream = null;
          }
        }
      }

      if (stream) {
        localStreamRef.current = stream;
        setLocalStream(stream);
      } else {
        setIsMuted(true);
      }

      console.log('[useRoom] 2. Connecting socket...');
      setJoinStep('🔌 Conectando ao servidor WebSockets...');
      const sock = getSocket();

      if (!sock.connected) {
        sock.connect();
        await new Promise<void>((resolve, reject) => {
          if (sock.connected) {
            resolve();
            return;
          }

          const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Tempo limite ao conectar com o servidor (tente recarregar).'));
          }, 8000);

          const onConnect = () => {
            cleanup();
            resolve();
          };

          const onConnectError = (err: Error) => {
            cleanup();
            reject(new Error(`Erro de conexão com o servidor: ${err.message}`));
          };

          function cleanup() {
            clearTimeout(timeout);
            sock.off('connect', onConnect);
            sock.off('connect_error', onConnectError);
          }

          sock.once('connect', onConnect);
          sock.once('connect_error', onConnectError);
        });
      }

      console.log('[useRoom] 3. Joining room on server...', roomInfo.code);
      setJoinStep('🤝 Entrando na sala e sincronizando participantes...');
      const result = await new Promise<{
        success: boolean;
        error?: string;
        participants?: ParticipantInfo[];
        userId?: string;
      }>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Tempo limite ao sincronizar com a sala de voz.'));
        }, 8000);

        sock.emit('room:join', { roomCode: roomInfo.code, nickname }, (res) => {
          clearTimeout(timeout);
          resolve(res);
        });
      });

      if (!result.success) {
        throw new Error(result.error || 'Falha ao entrar na sala');
      }

      console.log('[useRoom] 4. Joined successfully! Existing participants:', result.participants?.length || 0);

      // Set local participant
      setLocalParticipant({
        id: sock.id!,
        peerId: sock.id!,
        userId: result.userId!,
        nickname,
        isMuted: false,
        isSpeaking: false,
      });

      // Set existing participants
      if (result.participants) {
        setParticipants(
          result.participants.map((p) => ({
            ...p,
            isSpeaking: false,
          }))
        );

        // Initialize WebRTC connections with existing peers instantly
        if (result.participants.length > 0) {
          initializePeerConnections(result.participants);
        }
      }

      setIsJoined(true);
      setJoinStep('');
    } catch (err) {
      console.error('[useRoom] Join error:', err);
      setError(err instanceof Error ? err.message : 'Falha ao conectar na sala');
      setJoinStep('');

      // Cleanup on failure
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
      disconnect();
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, isJoined, currentDeviceId, disconnect, roomInfo.code, nickname, initializePeerConnections]);

  // Auto-join on mount when nickname is ready
  useEffect(() => {
    if (!autoJoinAttempted.current && nickname && !isJoined && !isJoining) {
      autoJoinAttempted.current = true;
      joinRoom();
    }
  }, [nickname, isJoined, isJoining, joinRoom]);

  const leaveRoom = useCallback(() => {
    const sock = getSocket();
    if (sock.connected) {
      sock.emit('room:leave');
    }

    // Stop local media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Close all WebRTC connections
    closeAllConnections();

    // Disconnect socket
    disconnect();

    // Reset state
    setIsJoined(false);
    setParticipants([]);
    setLocalParticipant(null);
    setIsMuted(false);
  }, [disconnect, closeAllConnections]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;

    const newMuted = !isMuted;
    audioTrack.enabled = !newMuted;
    setIsMuted(newMuted);

    // Update local participant
    setLocalParticipant((prev) =>
      prev ? { ...prev, isMuted: newMuted } : null
    );

    // Notify others
    const sock = getSocket();
    if (sock.connected) {
      sock.emit(newMuted ? 'participant:muted' : 'participant:unmuted');
    }
  }, [isMuted]);

  // Switch microphone device dynamically
  const changeMicrophoneDevice = useCallback(
    async (deviceId: string) => {
      setCurrentDeviceId(deviceId);

      if (!localStreamRef.current) return;

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        const newTrack = newStream.getAudioTracks()[0];
        if (newTrack) {
          newTrack.enabled = !isMuted;
          await replaceAudioTrack(newTrack);

          // Stop old tracks
          localStreamRef.current.getTracks().forEach((t) => t.stop());

          localStreamRef.current = newStream;
          setLocalStream(newStream);
        }
      } catch (err) {
        console.error('[useRoom] Error switching mic device:', err);
        throw err;
      }
    },
    [isMuted, replaceAudioTrack]
  );

  // Local microphone speaking detection (TimeDomain VAD)
  useEffect(() => {
    if (!localStream || isMuted || !isJoined) {
      setLocalParticipant((prev) => (prev?.isSpeaking ? { ...prev, isSpeaking: false } : prev));
      const sock = getSocket();
      if (sock.connected) {
        sock.emit('participant:speaking', { isSpeaking: false });
      }
      return;
    }

    let audioContext: AudioContext | null = null;
    let intervalId: NodeJS.Timeout | null = null;
    let speechTimeout: NodeJS.Timeout | null = null;

    try {
      audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      const source = audioContext.createMediaStreamSource(localStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      const timeData = new Uint8Array(analyser.fftSize);
      let wasSpeaking = false;

      intervalId = setInterval(() => {
        analyser.getByteTimeDomainData(timeData);
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
          sum += Math.abs(timeData[i] - 128);
        }
        const volume = sum / timeData.length;
        // In silence, volume is 0 ~ 1.5. When speaking, volume is > 3.5.
        const isSpeakingNow = volume > 3.5;

        if (isSpeakingNow) {
          if (speechTimeout) clearTimeout(speechTimeout);
          if (!wasSpeaking) {
            wasSpeaking = true;
            setLocalParticipant((prev) => (prev ? { ...prev, isSpeaking: true } : null));
            const sock = getSocket();
            if (sock.connected) {
              sock.emit('participant:speaking', { isSpeaking: true });
            }
          }
          speechTimeout = setTimeout(() => {
            wasSpeaking = false;
            setLocalParticipant((prev) => (prev ? { ...prev, isSpeaking: false } : null));
            const sock = getSocket();
            if (sock.connected) {
              sock.emit('participant:speaking', { isSpeaking: false });
            }
          }, 350);
        }
      }, 60);
    } catch (e) {
      console.warn('Local speaking detection error:', e);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (speechTimeout) clearTimeout(speechTimeout);
      if (audioContext) {
        audioContext.close().catch(() => {});
      }
    };
  }, [localStream, isMuted, isJoined]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      closeAllConnections();
    };
  }, [closeAllConnections]);

  return {
    isJoined,
    isJoining,
    joinStep,
    isMuted,
    error,
    participants,
    localParticipant,
    localStream,
    currentDeviceId,
    peerStates,
    unlockAllAudio,
    screenStream,
    isSharingScreen,
    remoteScreenStreams,
    startScreenShare,
    stopScreenShare,
    cameraStream,
    isCameraOn,
    remoteCameraStreams,
    startCamera,
    stopCamera,
    reconnectPeer,
    joinRoom,
    leaveRoom,
    toggleMute,
    changeMicrophoneDevice,
    currentOutputDeviceId,
    changeAudioOutputDevice,
  };
}
