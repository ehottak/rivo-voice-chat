'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { RTC_CONFIG, RTC_CONFIG_RELAY } from '@/lib/webrtc-config';
import type {
  VoiceOffer,
  VoiceAnswer,
  VoiceIceCandidate,
  ParticipantInfo,
} from '@/types/socket-events';

interface UseWebRTCProps {
  localStream: MediaStream | null;
  onSpeakingChange?: (peerId: string, isSpeaking: boolean) => void;
}

export interface PeerDiagnostics {
  iceState: string;
  connState: string;
  isAudioPlaying: boolean;
  audioTrackCount: number;
}

export type PeerConnectionState = PeerDiagnostics;

/**
 * Boosts SDP parameters for crystal-clear 1080p 60fps screen share & high-fidelity stereo audio
 */
function boostSdpQuality(sdp: string): string {
  let modified = sdp;

  // 1. Boost Opus Audio to high-bitrate stereo (128kbps) with FEC
  modified = modified.replace(
    /a=fmtp:(\d+) minptime=\d+;useinbandfec=1/g,
    'a=fmtp:$1 minptime=10;useinbandfec=1;stereo=1;sprop-stereo=1;maxaveragebitrate=128000;cbr=1'
  );

  // 2. Boost Video & Audio Bitrates (b=AS and b=TIAS)
  const lines = modified.split('\r\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    result.push(line);

    if (line.startsWith('m=video')) {
      // 5.5 Mbps bandwidth for 1080p 60FPS fluid screen share
      result.push('b=AS:5500');
      result.push('b=TIAS:5500000');
    } else if (line.startsWith('m=audio')) {
      // 128 kbps bandwidth for crystal clear voice & game sound
      result.push('b=AS:128');
      result.push('b=TIAS:128000');
    }
  }

  return result.join('\r\n');
}

/**
 * Configures optimal encoding parameters on RTP sender (bitrate, framerate priority)
 */
async function configureSenderParameters(sender: RTCRtpSender, kind: 'video' | 'audio', isScreen = false) {
  try {
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }

    if (kind === 'video') {
      if (isScreen) {
        // High bitrate 60fps for screen share
        params.encodings[0].maxBitrate = 6_000_000; // 6 Mbps
        params.encodings[0].maxFramerate = 60;
        params.encodings[0].priority = 'high';
        params.encodings[0].networkPriority = 'high';
        params.degradationPreference = 'maintain-framerate'; // Never drop FPS for smooth motion
      } else {
        // Webcam
        params.encodings[0].maxBitrate = 1_500_000; // 1.5 Mbps
        params.encodings[0].maxFramerate = 30;
        params.degradationPreference = 'balanced';
      }
    }

    await sender.setParameters(params);
  } catch (err) {
    console.warn('[WebRTC] Could not configure sender parameters:', err);
  }
}

export function useWebRTC({ localStream, onSpeakingChange }: UseWebRTCProps) {
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidateQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Screen share & Camera states
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [remoteScreenStreams, setRemoteScreenStreams] = useState<Record<string, MediaStream>>({});

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [remoteCameraStreams, setRemoteCameraStreams] = useState<Record<string, MediaStream>>({});

  // Audio output device management
  const [currentOutputDeviceId, setCurrentOutputDeviceId] = useState<string>('default');

  // Diagnostics state
  const [peerStates, setPeerStates] = useState<Record<string, PeerDiagnostics>>({});
  const updatePeerState = useCallback((peerId: string, update: Partial<PeerDiagnostics>) => {
    setPeerStates((prev) => {
      const existing = prev[peerId] || {
        iceState: 'connecting',
        connState: 'connecting',
        isAudioPlaying: false,
        audioTrackCount: 0,
      };
      return {
        ...prev,
        [peerId]: {
          ...existing,
          ...update,
        },
      };
    });
  }, []);

  // Change audio output device
  const changeAudioOutputDevice = useCallback(async (deviceId: string) => {
    setCurrentOutputDeviceId(deviceId);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('rivo_output_device', deviceId);
      }
    } catch {}

    const audioEls = document.querySelectorAll('audio[id^="remote-audio-"], video');
    audioEls.forEach((el) => {
      const mediaEl = el as HTMLMediaElement & { setSinkId?: (sinkId: string) => Promise<void> };
      if (typeof mediaEl.setSinkId === 'function') {
        mediaEl.setSinkId(deviceId).catch((err) => {
          console.warn('[WebRTC] setSinkId error:', err);
        });
      }
    });
  }, []);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    const stream = cameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    cameraStreamRef.current = null;
    setCameraStream(null);
    setIsCameraOn(false);

    const sock = getSocket();
    sock.emit('camera:stop');

    peerConnectionsRef.current.forEach(async (pc, peerId) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video' && sender.track === stream?.getVideoTracks()[0]) {
          pc.removeTrack(sender);
        }
      });
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        const boostedOffer = new RTCSessionDescription({
          type: offer.type,
          sdp: boostSdpQuality(offer.sdp || ''),
        });
        await pc.setLocalDescription(boostedOffer);
        sock.emit('voice:offer', { to: peerId, sdp: pc.localDescription! });
      } catch (err) {
        console.warn(`[WebRTC] Error renegotiating stop camera for ${peerId}:`, err);
      }
    });
  }, []);

  // Start camera (Mobile + Desktop friendly)
  const startCamera = useCallback(async () => {
    try {
      console.log('[WebRTC] 📹 Requesting camera stream...');
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('[WebRTC] Fallback to basic video: true', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;

      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setIsCameraOn(true);

      const sock = getSocket();
      sock.emit('camera:start');

      peerConnectionsRef.current.forEach(async (pc, peerId) => {
        const sender = pc.addTrack(videoTrack, stream);
        configureSenderParameters(sender, 'video', false);

        try {
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
          const boostedOffer = new RTCSessionDescription({
            type: offer.type,
            sdp: boostSdpQuality(offer.sdp || ''),
          });
          await pc.setLocalDescription(boostedOffer);
          sock.emit('voice:offer', { to: peerId, sdp: pc.localDescription! });
        } catch (err) {
          console.error(`[WebRTC] Error renegotiating camera for ${peerId}:`, err);
        }
      });
    } catch (err) {
      console.warn('[WebRTC] Camera access denied or failed:', err);
      alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }, []);

  // Stop screen sharing helper
  const stopScreenShare = useCallback(() => {
    const stream = screenStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsSharingScreen(false);

    const sock = getSocket();
    sock.emit('screen:stop');

    peerConnectionsRef.current.forEach(async (pc, peerId) => {
      pc.getSenders().forEach((sender) => {
        // Remove tracks originating from this screen stream
        if (stream?.getTracks().includes(sender.track!)) {
          pc.removeTrack(sender);
        }
      });
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        const boostedOffer = new RTCSessionDescription({
          type: offer.type,
          sdp: boostSdpQuality(offer.sdp || ''),
        });
        await pc.setLocalDescription(boostedOffer);
        sock.emit('voice:offer', { to: peerId, sdp: pc.localDescription! });
      } catch (err) {
        console.warn(`[WebRTC] Error renegotiating stop screen share for ${peerId}:`, err);
      }
    });
  }, []);

  // Start screen sharing (With 60FPS High-Res + Audio Transmission)
  const startScreenShare = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('O compartilhamento de tela não é suportado pelo navegador do seu celular. No celular, utilize o botão de Câmera!');
        return;
      }

      console.log('[WebRTC] 🖥️ Requesting HD 60FPS screen + system audio...');
      
      // Request HD 60fps video + system/tab audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 },
          frameRate: { ideal: 60, max: 60 },
        } as MediaTrackConstraints,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
        },
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsSharingScreen(true);

      const sock = getSocket();
      sock.emit('screen:start');

      const allTracks = stream.getTracks(); // includes both video and system/game audio if user enabled it

      peerConnectionsRef.current.forEach(async (pc, peerId) => {
        allTracks.forEach((track) => {
          const sender = pc.addTrack(track, stream);
          if (track.kind === 'video') {
            configureSenderParameters(sender, 'video', true);
          }
        });

        try {
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
          const boostedOffer = new RTCSessionDescription({
            type: offer.type,
            sdp: boostSdpQuality(offer.sdp || ''),
          });
          await pc.setLocalDescription(boostedOffer);
          sock.emit('voice:offer', { to: peerId, sdp: pc.localDescription! });
        } catch (err) {
          console.error(`[WebRTC] Error renegotiating screen share for ${peerId}:`, err);
        }
      });

      videoTrack.onended = () => {
        console.log('[WebRTC] 🛑 Screen share stopped by user UI');
        stopScreenShare();
      };
    } catch (err) {
      console.warn('[WebRTC] Screen share cancelled or failed:', err);
    }
  }, [stopScreenShare]);

  // Keep localStreamRef in sync with prop
  useEffect(() => {
    localStreamRef.current = localStream;

    if (localStream) {
      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const hasAudioSender = senders.some((s) => s.track?.kind === 'audio');

        if (!hasAudioSender) {
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
          });
        } else {
          localStream.getAudioTracks().forEach((newTrack) => {
            senders.forEach((sender) => {
              if (sender.track?.kind === 'audio') {
                sender.replaceTrack(newTrack).catch((err) => {
                  console.warn('[WebRTC] Error replacing audio track:', err);
                });
              }
            });
          });
        }
      });
    }
  }, [localStream]);

  // Unlock all audio elements
  const unlockAllAudio = useCallback(() => {
    const audioElements = document.querySelectorAll('audio[id^="remote-audio-"], video');
    audioElements.forEach((el) => {
      const mediaEl = el as HTMLMediaElement;
      mediaEl.play().catch((err) => {
        console.warn('[WebRTC] Unlock audio element play() error:', err);
      });
    });
  }, []);

  // Flush queued ICE candidates
  const flushIceCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const queue = iceCandidateQueuesRef.current.get(peerId);
    if (!queue || queue.length === 0) return;

    for (const candidateInit of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (err) {
        console.warn(`[WebRTC] Failed to add queued ICE candidate for ${peerId}:`, err);
      }
    }
    iceCandidateQueuesRef.current.delete(peerId);
  }, []);

  // Play remote audio
  const playRemoteAudio = useCallback(
    (peerId: string, stream: MediaStream) => {
      let audioEl = document.getElementById(`remote-audio-${peerId}`) as HTMLAudioElement | null;
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = `remote-audio-${peerId}`;
        audioEl.autoplay = true;
        audioEl.setAttribute('playsinline', 'true');
        document.body.appendChild(audioEl);
      }

      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
      }

      // Apply output device sinkId if supported
      const mediaEl = audioEl as HTMLMediaElement & { setSinkId?: (sinkId: string) => Promise<void> };
      if (typeof mediaEl.setSinkId === 'function' && currentOutputDeviceId && currentOutputDeviceId !== 'default') {
        mediaEl.setSinkId(currentOutputDeviceId).catch(() => {});
      }

      audioEl.play()
        .then(() => {
          updatePeerState(peerId, { isAudioPlaying: true, audioTrackCount: stream.getAudioTracks().length });
        })
        .catch((err) => {
          console.warn(`[WebRTC] Autoplay prevented for ${peerId}:`, err);
          updatePeerState(peerId, { isAudioPlaying: false, audioTrackCount: stream.getAudioTracks().length });
        });

      // Voice Activity Detection (VAD)
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const timeData = new Uint8Array(analyser.fftSize);
        let wasSpeaking = false;
        let speechTimeout: NodeJS.Timeout | null = null;

        const vadInterval = setInterval(() => {
          if (audioCtx.state === 'closed') {
            clearInterval(vadInterval);
            return;
          }
          analyser.getByteTimeDomainData(timeData);
          let sum = 0;
          for (let i = 0; i < timeData.length; i++) {
            sum += Math.abs(timeData[i] - 128);
          }
          const volume = sum / timeData.length;
          const isSpeakingNow = volume > 3.0;

          if (isSpeakingNow) {
            if (speechTimeout) clearTimeout(speechTimeout);
            if (!wasSpeaking) {
              wasSpeaking = true;
              onSpeakingChange?.(peerId, true);
            }
            speechTimeout = setTimeout(() => {
              wasSpeaking = false;
              onSpeakingChange?.(peerId, false);
            }, 400);
          }
        }, 100);
      } catch (vadErr) {
        console.warn(`[WebRTC] Remote VAD error for ${peerId}:`, vadErr);
      }
    },
    [onSpeakingChange, updatePeerState, currentOutputDeviceId]
  );

  // Create peer connection for a specific peer
  const createPeerConnection = useCallback(
    (peerId: string, forceRelay = false): RTCPeerConnection => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing) {
        existing.close();
      }

      const config = forceRelay ? RTC_CONFIG_RELAY : RTC_CONFIG;
      const pc = new RTCPeerConnection(config);
      peerConnectionsRef.current.set(peerId, pc);

      // 1. Add local audio tracks if available
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // 2. If local screen share is active, add tracks (video + screen audio)
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          const sender = pc.addTrack(track, screenStreamRef.current!);
          if (track.kind === 'video') {
            configureSenderParameters(sender, 'video', true);
          }
        });
      }

      // 3. If local camera is active, add camera track
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getVideoTracks().forEach((vTrack) => {
          const sender = pc.addTrack(vTrack, cameraStreamRef.current!);
          configureSenderParameters(sender, 'video', false);
        });
      }

      // Handle incoming remote tracks (audio, screen, camera)
      pc.ontrack = (event) => {
        console.log(`[WebRTC] ✅ Track received from ${peerId}: kind=${event.track.kind}`);

        if (event.track.kind === 'video') {
          const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
          setRemoteScreenStreams((prev) => ({ ...prev, [peerId]: stream }));
          return;
        }

        if (event.streams && event.streams[0]) {
          playRemoteAudio(peerId, event.streams[0]);
        } else {
          const fallbackStream = new MediaStream([event.track]);
          playRemoteAudio(peerId, fallbackStream);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const sock = getSocket();
          if (sock.connected) {
            sock.emit('voice:ice-candidate', {
              to: peerId,
              candidate: event.candidate.toJSON(),
            });
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        updatePeerState(peerId, { iceState: pc.iceConnectionState });

        if (pc.iceConnectionState === 'failed') {
          console.warn(`[WebRTC] ❌ ICE FAILED for ${peerId}, falling back to RELAY-ONLY...`);
          try { pc.close(); } catch {}
          peerConnectionsRef.current.delete(peerId);
          setTimeout(() => {
            createPeerConnection(peerId, true);
          }, 800);
        }
      };

      pc.onconnectionstatechange = () => {
        updatePeerState(peerId, { connState: pc.connectionState });
      };

      return pc;
    },
    [playRemoteAudio, updatePeerState]
  );

  // Close a specific peer connection
  const closePeerConnection = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    iceCandidateQueuesRef.current.delete(peerId);

    const audioEl = document.getElementById(`remote-audio-${peerId}`);
    if (audioEl) audioEl.remove();

    setRemoteScreenStreams((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  // Close all connections
  const closeAllConnections = useCallback(() => {
    peerConnectionsRef.current.forEach((pc, peerId) => {
      pc.close();
      const audioEl = document.getElementById(`remote-audio-${peerId}`);
      if (audioEl) audioEl.remove();
    });
    peerConnectionsRef.current.clear();
    iceCandidateQueuesRef.current.clear();
    setRemoteScreenStreams({});
  }, []);

  // Initialize connections with existing participants (initiator)
  const initializePeerConnections = useCallback(
    async (participants: ParticipantInfo[]) => {
      const sock = getSocket();

      for (const participant of participants) {
        const pc = createPeerConnection(participant.peerId);

        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });

          const boostedOffer = new RTCSessionDescription({
            type: offer.type,
            sdp: boostSdpQuality(offer.sdp || ''),
          });

          await pc.setLocalDescription(boostedOffer);

          sock.emit('voice:offer', {
            to: participant.peerId,
            sdp: pc.localDescription!,
          });
        } catch (error) {
          console.error(`[WebRTC] Error creating offer for ${participant.peerId}:`, error);
        }
      }
    },
    [createPeerConnection]
  );

  // Listen for WebRTC signaling events
  useEffect(() => {
    const sock = getSocket();

    const handleOffer = async (data: VoiceOffer) => {
      if (!data.from) return;
      const peerId = data.from;
      const pc = createPeerConnection(peerId);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await flushIceCandidates(peerId, pc);

        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        const boostedAnswer = new RTCSessionDescription({
          type: answer.type,
          sdp: boostSdpQuality(answer.sdp || ''),
        });

        await pc.setLocalDescription(boostedAnswer);

        sock.emit('voice:answer', {
          to: peerId,
          sdp: pc.localDescription!,
        });
      } catch (error) {
        console.error(`[WebRTC] Error handling offer from ${peerId}:`, error);
      }
    };

    const handleAnswer = async (data: VoiceAnswer) => {
      if (!data.from) return;
      const peerId = data.from;
      const pc = peerConnectionsRef.current.get(peerId);
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await flushIceCandidates(peerId, pc);
      } catch (error) {
        console.error(`[WebRTC] Error handling answer from ${peerId}:`, error);
      }
    };

    const handleIceCandidate = async (data: VoiceIceCandidate) => {
      if (!data.from) return;
      const peerId = data.from;
      const pc = peerConnectionsRef.current.get(peerId);

      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error(`[WebRTC] Error adding ICE candidate from ${peerId}:`, error);
        }
      } else {
        const queue = iceCandidateQueuesRef.current.get(peerId) || [];
        queue.push(data.candidate);
        iceCandidateQueuesRef.current.set(peerId, queue);
      }
    };

    const handleScreenStop = (data: { peerId: string }) => {
      setRemoteScreenStreams((prev) => {
        const next = { ...prev };
        delete next[data.peerId];
        return next;
      });
    };

    const handleCameraStop = (data: { peerId: string }) => {
      setRemoteCameraStreams((prev) => {
        const next = { ...prev };
        delete next[data.peerId];
        return next;
      });
    };

    sock.on('voice:offer', handleOffer);
    sock.on('voice:answer', handleAnswer);
    sock.on('voice:ice-candidate', handleIceCandidate);
    sock.on('screen:stop', handleScreenStop);
    sock.on('camera:stop', handleCameraStop);

    return () => {
      sock.off('voice:offer', handleOffer);
      sock.off('voice:answer', handleAnswer);
      sock.off('voice:ice-candidate', handleIceCandidate);
      sock.off('screen:stop', handleScreenStop);
      sock.off('camera:stop', handleCameraStop);
    };
  }, [createPeerConnection, flushIceCandidates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      closeAllConnections();
    };
  }, [closeAllConnections]);

  // Replace outgoing audio track when mic changes
  const replaceAudioTrack = useCallback(async (newTrack: MediaStreamTrack) => {
    const promises: Promise<void>[] = [];
    peerConnectionsRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'audio') {
          promises.push(sender.replaceTrack(newTrack));
        }
      });
    });
    await Promise.all(promises);
  }, []);

  // Reconnect a specific peer
  const reconnectPeer = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      try { pc.close(); } catch {}
      peerConnectionsRef.current.delete(peerId);
    }
    setTimeout(() => {
      createPeerConnection(peerId);
    }, 400);
  }, [createPeerConnection]);

  return {
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
  };
}
