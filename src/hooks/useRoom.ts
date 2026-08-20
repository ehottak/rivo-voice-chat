'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from './useSocket';
import { useParticipants } from './useParticipants';
import { useWebRTC } from './useWebRTC';
import { getSocket } from '@/lib/socket';
import { soundEffects } from '@/lib/sound-effects';
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
  isDeafened: boolean;
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
  toggleDeafen: () => void;
  changeMicrophoneDevice: (deviceId: string) => Promise<void>;
  currentOutputDeviceId: string;
  changeAudioOutputDevice: (deviceId: string) => Promise<void>;
}

export function useRoom({ roomInfo, nickname, initialDeviceId, initialStream }: UseRoomProps): UseRoomReturn {
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinStep, setJoinStep] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
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
      soundEffects.playUserLeft();
      closePeerConnection(data.peerId);
    };

    const handleJoined = (data: { id?: string; peerId: string; userId?: string; nickname: string; isMuted?: boolean }) => {
      console.log(`[useRoom] Participant joined: ${data.nickname} (${data.peerId}), waiting for incoming offer...`);
      soundEffects.playUserJoined();
      setParticipants((prev) => {
        if (prev.some((p) => p.peerId === data.peerId)) return prev;
        return [
          ...prev,
          {
            id: data.id || data.peerId,
            peerId: data.peerId,
            userId: data.userId || data.peerId,
            nickname: data.nickname,
            isMuted: data.isMuted ?? false,
            isSpeaking: false,
          },
        ];
      });
    };

    const handleDeafened = (data: { peerId: string }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.peerId === data.peerId ? { ...p, isDeafened: true, isMuted: true } : p))
      );
    };

    const handleUndeafened = (data: { peerId: string }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.peerId === data.peerId ? { ...p, isDeafened: false } : p))
      );
    };

    sock.on('participant:left', handleLeft);
    sock.on('participant:joined', handleJoined);
    sock.on('participant:deafened', handleDeafened);
    sock.on('participant:undeafened', handleUndeafened);

    return () => {
      sock.off('participant:left', handleLeft);
      sock.off('participant:joined', handleJoined);
      sock.off('participant:deafened', handleDeafened);
      sock.off('participant:undeafened', handleUndeafened);
    };
  }, [closePeerConnection]);

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
          const savedEcho = typeof localStorage !== 'undefined' ? localStorage.getItem('rivo_echo_cancellation') : null;
          const savedNoise = typeof localStorage !== 'undefined' ? localStorage.getItem('rivo_noise_suppression') : null;
          const savedAgc = typeof localStorage !== 'undefined' ? localStorage.getItem('rivo_auto_gain_control') : null;

          const audioConstraints: MediaTrackConstraints = {
            echoCancellation: savedEcho !== null ? savedEcho === 'true' : true,
            noiseSuppression: savedNoise !== null ? savedNoise === 'true' : true,
            autoGainControl: savedAgc !== null ? savedAgc === 'true' : true,
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
      soundEffects.playJoinRoom();
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
    soundEffects.playLeaveRoom();

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

    // Audio cue for mute/unmute
    if (newMuted) {
      soundEffects.playMute();
    } else {
      soundEffects.playUnmute();
    }

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

  const toggleDeafen = useCallback(() => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);

    // 1. Mute/Unmute all remote audio elements in DOM
    const audioEls = document.querySelectorAll('audio[id^="remote-audio-"], video');
    audioEls.forEach((el) => {
      (el as HTMLMediaElement).muted = newDeafened;
    });

    // 2. When deafening, automatically mute mic; when undeafening, restore mic
    if (newDeafened) {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = false;
      }
      setIsMuted(true);
      soundEffects.playDeafen();
    } else {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = true;
      }
      setIsMuted(false);
      soundEffects.playUndeafen();
    }

    // 3. Update local participant state
    setLocalParticipant((prev) =>
      prev ? { ...prev, isDeafened: newDeafened, isMuted: newDeafened } : null
    );

    // 4. Notify peers via socket
    const sock = getSocket();
    if (sock.connected) {
      sock.emit(newDeafened ? 'participant:deafened' : 'participant:undeafened');
      sock.emit(newDeafened ? 'participant:muted' : 'participant:unmuted');
    }
  }, [isDeafened]);

  // Switch microphone device dynamically
  const changeMicrophoneDevice = useCallback(
    async (deviceId: string) => {
      setCurrentDeviceId(deviceId);

      if (!localStreamRef.current) return;

      try {
        const savedEcho = typeof localStorage !== 'undefined' ? localStorage.getItem('rivo_echo_cancellation') : null;
        const savedNoise = typeof localStorage !== 'undefined' ? localStorage.getItem('rivo_noise_suppression') : null;
        const savedAgc = typeof localStorage !== 'undefined' ? localStorage.getItem('rivo_auto_gain_control') : null;

        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: deviceId },
            echoCancellation: savedEcho !== null ? savedEcho === 'true' : true,
            noiseSuppression: savedNoise !== null ? savedNoise === 'true' : true,
            autoGainControl: savedAgc !== null ? savedAgc === 'true' : true,
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

  // Local microphone speaking detection (TimeDomain VAD with Noise Gate calibration)
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

        // Read dynamic Noise Gate threshold from user settings
        const savedGate = typeof localStorage !== 'undefined' ? localStorage.getItem('rivo_noise_gate') : null;
        const gateThreshold = savedGate ? (Number(savedGate) / 100) * 16 : 3.2;

        const isSpeakingNow = volume > Math.max(1.8, gateThreshold);

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
      }, 100);
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
    isDeafened,
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
    toggleDeafen,
    changeMicrophoneDevice,
    currentOutputDeviceId,
    changeAudioOutputDevice,
  };
}
