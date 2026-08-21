'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { RTC_CONFIG } from '@/lib/webrtc-config';
import { soundEffects } from '@/lib/sound-effects';
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
      result.push('b=AS:5500');
      result.push('b=TIAS:5500000');
    } else if (line.startsWith('m=audio')) {
      result.push('b=AS:128');
      result.push('b=TIAS:128000');
    }
  }

  return result.join('\r\n');
}

/**
 * Configures optimal encoding parameters on RTP sender
 */
async function configureSenderParameters(sender: RTCRtpSender, kind: 'video' | 'audio', isScreen = false) {
  try {
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }

    if (kind === 'video') {
      if (isScreen) {
        params.encodings[0].maxBitrate = 6_000_000; // 6 Mbps
        params.encodings[0].maxFramerate = 60;
        params.encodings[0].priority = 'high';
        params.encodings[0].networkPriority = 'high';
        params.degradationPreference = 'maintain-framerate';
      } else {
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
  const makingOfferRef = useRef<Map<string, boolean>>(new Map());
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

  // Master AudioContext reference
  const masterAudioContextRef = useRef<AudioContext | null>(null);

  const getMasterAudioContext = useCallback(() => {
    if (!masterAudioContextRef.current || masterAudioContextRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        masterAudioContextRef.current = new AudioCtx();
      }
    }
    return masterAudioContextRef.current;
  }, []);

  // Unlock all audio elements and resume WebAudio context on user gesture
  const unlockAllAudio = useCallback(() => {
    const ctx = getMasterAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch((err) => console.warn('[WebRTC] AudioContext resume error:', err));
    }

    const mediaElements = document.querySelectorAll('audio[id^="remote-audio-"], video');
    mediaElements.forEach((el) => {
      const mediaEl = el as HTMLMediaElement;
      mediaEl.play().catch((err) => {
        console.warn('[WebRTC] Unlock media element play() error:', err);
      });
    });
  }, [getMasterAudioContext]);

  // Global listener for first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAllAudio();
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      if (masterAudioContextRef.current) {
        masterAudioContextRef.current.close().catch(() => {});
      }
    };
  }, [unlockAllAudio]);

  // Play remote audio stably without re-mounting
  // Play remote audio stably across all browsers (Brave / Chrome / Firefox / Electron)
  const playRemoteAudio = useCallback(
    (peerId: string, stream: MediaStream) => {
      let audioEl = document.getElementById(`remote-audio-${peerId}`) as HTMLAudioElement | null;
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = `remote-audio-${peerId}`;
        audioEl.autoplay = true;
        audioEl.setAttribute('playsinline', 'true');
        audioEl.setAttribute('preload', 'auto');
        document.body.appendChild(audioEl);
      }

      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
      }

      // Read output volume setting
      try {
        const savedOutVol = typeof localStorage !== 'undefined' ? localStorage.getItem('rivo_output_volume') : null;
        if (savedOutVol !== null) {
          audioEl.volume = Math.min(1, Math.max(0, Number(savedOutVol) / 100));
        }
      } catch {}

      // Handle output device routing
      const mediaEl = audioEl as HTMLMediaElement & { setSinkId?: (sinkId: string) => Promise<void> };
      if (typeof mediaEl.setSinkId === 'function' && currentOutputDeviceId && currentOutputDeviceId !== 'default') {
        mediaEl.setSinkId(currentOutputDeviceId).catch(() => {});
      }

      // Proactive play attempt with audio unpause hooks
      const attemptPlay = () => {
        if (!audioEl) return;
        audioEl.play()
          .then(() => {
            updatePeerState(peerId, { isAudioPlaying: true, audioTrackCount: stream.getAudioTracks().length });
          })
          .catch(() => {
            // If HTMLAudio is paused by browser policy, activate WebAudio bypass
            try {
              const ctx = getMasterAudioContext();
              if (ctx) {
                if (ctx.state === 'suspended') ctx.resume().catch(() => {});
                const source = ctx.createMediaStreamSource(stream);
                const gain = ctx.createGain();
                const savedVol = typeof localStorage !== 'undefined' ? localStorage.getItem('rivo_output_volume') : null;
                gain.gain.value = savedVol !== null ? Math.min(1, Math.max(0, Number(savedVol) / 100)) : 1.0;
                source.connect(gain);
                gain.connect(ctx.destination);
                updatePeerState(peerId, { isAudioPlaying: true, audioTrackCount: stream.getAudioTracks().length });
              }
            } catch {}
          });
      };

      attemptPlay();

      stream.getAudioTracks().forEach((track) => {
        track.onunmute = () => {
          console.log(`[WebRTC] 🔊 Remote audio track unmuted for ${peerId}`);
          attemptPlay();
        };
      });

      audioEl.oncanplay = () => attemptPlay();
      audioEl.onpause = () => attemptPlay();

      // Remote Voice Activity Detection (VAD)
      try {
        const audioCtx = getMasterAudioContext();
        if (audioCtx) {
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

            const pc = peerConnectionsRef.current.get(peerId);
            const isConnected = pc && (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed');

            if (!isConnected) {
              if (wasSpeaking) {
                wasSpeaking = false;
                onSpeakingChange?.(peerId, false);
              }
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
        }
      } catch (vadErr) {
        console.warn(`[WebRTC] Remote VAD error for ${peerId}:`, vadErr);
      }
    },
    [onSpeakingChange, updatePeerState, currentOutputDeviceId, getMasterAudioContext]
  );

  // Flush queued ICE candidates safely
  const flushIceCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const queue = iceCandidateQueuesRef.current.get(peerId);
    if (!queue || queue.length === 0) return;

    const candidates = [...queue];
    iceCandidateQueuesRef.current.delete(peerId);

    for (const candidateInit of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (err) {
        console.warn(`[WebRTC] Failed to add queued ICE candidate for ${peerId}:`, err);
      }
    }
  }, []);

  // Helper to attach all current local tracks to a given RTCPeerConnection
  const attachLocalTracksToPC = useCallback((pc: RTCPeerConnection) => {
    const existingSenders = pc.getSenders();

    // 1. Audio track
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const audioSender = existingSenders.find((s) => s.track?.kind === 'audio');
        if (!audioSender) {
          pc.addTrack(audioTrack, localStreamRef.current);
        } else if (audioSender.track !== audioTrack) {
          audioSender.replaceTrack(audioTrack).catch(() => {});
        }
      }
    }

    // 2. Screen share tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        const isTrackAdded = existingSenders.some((s) => s.track === track);
        if (!isTrackAdded) {
          const sender = pc.addTrack(track, screenStreamRef.current!);
          if (track.kind === 'video') {
            configureSenderParameters(sender, 'video', true);
          }
        }
      });
    }

    // 3. Camera track
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getVideoTracks().forEach((vTrack) => {
        const isTrackAdded = existingSenders.some((s) => s.track === vTrack);
        if (!isTrackAdded) {
          const sender = pc.addTrack(vTrack, cameraStreamRef.current!);
          configureSenderParameters(sender, 'video', false);
        }
      });
    }
  }, []);

  // Active ICE Restart & Renegotiation for Auto-Healing
  const restartIceForPeer = useCallback(
    async (peerId: string) => {
      const pc = peerConnectionsRef.current.get(peerId);
      if (!pc || pc.signalingState === 'closed') return;

      try {
        console.log(`[WebRTC] 🔄 Initiating active ICE Restart for ${peerId}...`);
        attachLocalTracksToPC(pc);
        pc.restartIce();
        const offer = await pc.createOffer({
          iceRestart: true,
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        const boostedOffer = new RTCSessionDescription({
          type: offer.type,
          sdp: boostSdpQuality(offer.sdp || ''),
        });

        await pc.setLocalDescription(boostedOffer);

        const sock = getSocket();
        if (sock.connected) {
          sock.emit('voice:offer', {
            to: peerId,
            sdp: pc.localDescription!,
          });
        }
      } catch (err) {
        console.warn(`[WebRTC] ICE restart failed for ${peerId}:`, err);
      }
    },
    [attachLocalTracksToPC]
  );

  // Create or retrieve RTCPeerConnection
  const getOrCreatePeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      let pc = peerConnectionsRef.current.get(peerId);

      if (pc && pc.signalingState !== 'closed') {
        attachLocalTracksToPC(pc);
        return pc;
      }

      if (pc) {
        try { pc.close(); } catch {}
      }

      pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(peerId, pc);

      attachLocalTracksToPC(pc);

      // Handle incoming remote tracks (audio, screen, camera)
      pc.ontrack = (event) => {
        console.log(`[WebRTC] ✅ Track received from ${peerId}: kind=${event.track.kind}`);

        const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);

        if (event.track.kind === 'video') {
          setRemoteScreenStreams((prev) => ({ ...prev, [peerId]: stream }));
          return;
        }

        // Se a trilha de áudio pertencer a uma stream que possui vídeo (compartilhamento de tela),
        // NÃO enviamos para o playRemoteAudio global. Isso permite que o slider de volume
        // na UI (ScreenShareStage) controle o áudio corretamente e evita que o microfone seja silenciado.
        if (stream.getVideoTracks().length > 0) {
          console.log(`[WebRTC] 🔇 Direcionando áudio da tela para o player local (${peerId})`);
          return;
        }

        // Caso contrário, é o microfone principal
        playRemoteAudio(peerId, stream);
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

      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        const iceState = pc.iceConnectionState;
        updatePeerState(peerId, { iceState });
        console.log(`[WebRTC] 🌐 ICE state for ${peerId}: ${iceState}`);

        if (iceState === 'failed' || iceState === 'disconnected') {
          const sock = getSocket();
          const isPolite = Boolean(sock.id && sock.id < peerId);
          if (isPolite) {
            console.warn(`[WebRTC] ⚡ ICE ${iceState} for ${peerId}. Triggering auto-healing ICE restart in 1.5s...`);
            setTimeout(() => {
              const currentPc = peerConnectionsRef.current.get(peerId);
              if (currentPc && (currentPc.iceConnectionState === 'failed' || currentPc.iceConnectionState === 'disconnected')) {
                restartIceForPeer(peerId);
              }
            }, 1500);
          }
        }
      };

      pc.onconnectionstatechange = () => {
        const connState = pc.connectionState;
        updatePeerState(peerId, { connState });
      };

      return pc;
    },
    [attachLocalTracksToPC, playRemoteAudio, updatePeerState, restartIceForPeer]
  );

  // Sync local audio stream reference
  useEffect(() => {
    localStreamRef.current = localStream;
    if (localStream) {
      peerConnectionsRef.current.forEach((pc) => {
        attachLocalTracksToPC(pc);
      });
    }
  }, [localStream, attachLocalTracksToPC]);

  // Broadcast renegotiation offer to all peers (for screen share / camera toggle)
  const renegotiateAllPeers = useCallback(async () => {
    const sock = getSocket();
    if (!sock.connected) return;

    for (const [peerId, pc] of peerConnectionsRef.current.entries()) {
      if (pc.signalingState === 'closed') continue;

      try {
        attachLocalTracksToPC(pc);
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
          to: peerId,
          sdp: pc.localDescription!,
        });
      } catch (err) {
        console.warn(`[WebRTC] Renegotiation offer failed for ${peerId}:`, err);
      }
    }
  }, [attachLocalTracksToPC]);

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

    peerConnectionsRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video' && sender.track === stream?.getVideoTracks()[0]) {
          pc.removeTrack(sender);
        }
      });
    });

    renegotiateAllPeers();
  }, [renegotiateAllPeers]);

  // Start camera helper
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
      } catch {
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

      peerConnectionsRef.current.forEach((pc) => {
        attachLocalTracksToPC(pc);
      });

      renegotiateAllPeers();
    } catch (err) {
      console.warn('[WebRTC] Camera access denied or failed:', err);
      alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }, [attachLocalTracksToPC, renegotiateAllPeers]);

  // Stop screen share helper
  const stopScreenShare = useCallback(() => {
    const stream = screenStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsSharingScreen(false);

    soundEffects.playScreenShareStop();

    const sock = getSocket();
    sock.emit('screen:stop');

    peerConnectionsRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video' && sender.track === stream?.getVideoTracks()[0]) {
          pc.removeTrack(sender);
        }
      });
    });

    renegotiateAllPeers();
  }, [renegotiateAllPeers]);

  // Start screen share helper
  const startScreenShare = useCallback(async () => {
    try {
      console.log('[WebRTC] 🖥️ Requesting screen share stream (1080p 60fps)...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 60, max: 60 },
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 },
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
        },
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;

      videoTrack.onended = () => {
        stopScreenShare();
      };

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsSharingScreen(true);

      soundEffects.playScreenShareStart();

      const sock = getSocket();
      sock.emit('screen:start');

      peerConnectionsRef.current.forEach((pc) => {
        attachLocalTracksToPC(pc);
      });

      renegotiateAllPeers();
    } catch (err) {
      console.warn('[WebRTC] Screen share cancelled or denied:', err);
    }
  }, [attachLocalTracksToPC, renegotiateAllPeers, stopScreenShare]);

  // Close a specific peer connection
  const closePeerConnection = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    iceCandidateQueuesRef.current.delete(peerId);
    makingOfferRef.current.delete(peerId);

    const audioEl = document.getElementById(`remote-audio-${peerId}`);
    if (audioEl) audioEl.remove();

    setRemoteScreenStreams((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });

    setRemoteCameraStreams((prev) => {
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
    makingOfferRef.current.clear();
    setRemoteScreenStreams({});
    setRemoteCameraStreams({});
  }, []);

  // Initialize connections with existing participants (Single-Initiator rule: Joining peer creates offer)
  const initializePeerConnections = useCallback(
    async (participants: ParticipantInfo[]) => {
      const sock = getSocket();

      for (const participant of participants) {
        if (!participant.peerId || participant.peerId === sock.id) continue;

        console.log(`[WebRTC] 🚀 Creating initial offer to ${participant.nickname} (${participant.peerId})`);
        const pc = getOrCreatePeerConnection(participant.peerId);

        try {
          makingOfferRef.current.set(participant.peerId, true);
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
        } finally {
          makingOfferRef.current.set(participant.peerId, false);
        }
      }
    },
    [getOrCreatePeerConnection]
  );

  // Listen for WebRTC signaling events
  useEffect(() => {
    const sock = getSocket();

    const handleOffer = async (data: VoiceOffer) => {
      if (!data.from) return;
      const peerId = data.from;

      console.log(`[WebRTC] 📥 Received offer from ${peerId}`);
      const pc = getOrCreatePeerConnection(peerId);

      // Collision avoidance (Perfect Negotiation Polite Peer check)
      const isMakingOffer = makingOfferRef.current.get(peerId) || false;
      const offerCollision = isMakingOffer || pc.signalingState !== 'stable';

      // We determine politeness: higher socket ID yields to lower
      const isPolite = Boolean(sock.id && sock.id < peerId);

      if (offerCollision) {
        if (!isPolite) {
          console.log(`[WebRTC] 🛡️ Impolite peer: Ignoring colliding offer from ${peerId}`);
          return;
        }
        console.log(`[WebRTC] 🤝 Polite peer: Rolling back local offer for ${peerId}`);
        await pc.setLocalDescription({ type: 'rollback' });
      }

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
        console.log(`[WebRTC] 📥 Received answer from ${peerId}`);
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
  }, [getOrCreatePeerConnection, flushIceCandidates]);

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

  // Manual reconnect for a specific peer
  const reconnectPeer = useCallback((peerId: string) => {
    console.log(`[WebRTC] 🔄 Manual reconnect requested for ${peerId}`);
    restartIceForPeer(peerId);
  }, [restartIceForPeer]);

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
