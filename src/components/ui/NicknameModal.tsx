'use client';

import { useState, useCallback, useEffect, useRef, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface NicknameModalProps {
  onSubmit: (nickname: string, deviceId?: string, stream?: MediaStream) => void;
  roomName: string;
}

export function NicknameModal({ onSubmit, roomName }: NicknameModalProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [micVolume, setMicVolume] = useState(0);
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);

  const testStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Softly check if devices are already allowed without throwing errors
  useEffect(() => {
    async function checkExistingDevices() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const mics = devices.filter((d) => d.kind === 'audioinput');
          if (mics.length > 0 && mics[0].label) {
            setAudioDevices(mics);
            setSelectedDevice(mics[0].deviceId);
          }
        }
      } catch (e) {
        console.warn('Could not enumerate devices yet:', e);
      }
    }
    checkExistingDevices();

    return () => {
      stopMicMeter();
    };
  }, []);

  function startMicMeter(stream: MediaStream) {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }

      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (audioCtx.state === 'closed') return;
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('Audio meter error:', e);
    }
  }

  function stopMicMeter() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }

  // When user clicks the Test Mic button explicitly
  const handleTestMicClick = async () => {
    try {
      stopMicMeter();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      });
      testStreamRef.current = stream;
      startMicMeter(stream);
      setIsMicTesting(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((d) => d.kind === 'audioinput');
      setAudioDevices(mics);
      if (mics.length > 0 && !selectedDevice) {
        setSelectedDevice(mics[0].deviceId);
      }
    } catch (err) {
      console.warn('Test mic permission error:', err);
    }
  };

  // Main proceed handler: called DIRECTLY on user button click (User Gesture)
  const handleProceed = useCallback(async () => {
    const trimmed = nickname.trim();

    if (trimmed.length < 2) {
      setError('O apelido deve ter no mínimo 2 caracteres');
      return;
    }
    if (trimmed.length > 20) {
      setError('O apelido deve ter no máximo 20 caracteres');
      return;
    }

    setIsRequestingMic(true);
    setError('');

    let acquiredStream: MediaStream | undefined = undefined;

    // Request microphone permission inside the exact click handler stack
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        };

        if (selectedDevice && selectedDevice !== 'default') {
          audioConstraints.deviceId = { ideal: selectedDevice };
        }

        acquiredStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false,
        });
      }
    } catch (micErr) {
      console.warn('[NicknameModal] Direct mic request failed or denied:', micErr);
      // Try with generic audio: true
      try {
        acquiredStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (fallbackErr) {
        console.warn('[NicknameModal] Fallback mic request also denied:', fallbackErr);
      }
    }

    stopMicMeter();
    setIsRequestingMic(false);
    onSubmit(trimmed, selectedDevice, acquiredStream);
  }, [nickname, selectedDevice, onSubmit]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleProceed();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Glow effect behind the card */}
        <div className="absolute inset-0 -z-10 mx-auto w-72 h-72 bg-violet-600/15 rounded-full blur-[100px]" />

        <div className="relative p-6 sm:p-8 bg-zinc-900/90 border border-white/[0.08] rounded-2xl backdrop-blur-2xl shadow-2xl shadow-violet-950/50 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 rounded-2xl bg-violet-500/25 blur-xl animate-pulse-slow" />
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 shadow-lg shadow-violet-600/40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-white"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
              Entrar na Sala
            </h2>
            <p className="text-white/40 text-sm">
              Sala: <span className="text-violet-400 font-semibold">{roomName}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nickname Input */}
            <Input
              label="Seu Apelido"
              placeholder="Ex: Eduardo, João, Ana"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              error={error}
              maxLength={20}
              autoFocus
            />

            {/* Microphone Device Selector (if already enumerated) */}
            {audioDevices.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/60">
                  Microfone
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 cursor-pointer truncate transition-all"
                >
                  {audioDevices.map((device, index) => (
                    <option
                      key={device.deviceId || index}
                      value={device.deviceId}
                      className="bg-zinc-900 text-white"
                    >
                      {device.label || `Microfone ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Test Mic Button & VU Meter */}
            {isMicTesting ? (
              <div className="p-3.5 bg-white/[0.03] rounded-xl space-y-2 border border-white/[0.06]">
                <div className="flex justify-between text-xs text-white/50">
                  <span>Captando áudio do microfone</span>
                  <span className="font-mono text-[11px]">{micVolume > 10 ? '🟢 Detectando' : '⚪ Fale algo...'}</span>
                </div>
                <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 rounded-full ${
                      micVolume > 15
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-sm shadow-emerald-500/50'
                        : 'bg-white/15'
                    }`}
                    style={{ width: `${Math.max(5, micVolume)}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTestMicClick}
                className="text-xs text-violet-400/80 hover:text-violet-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span className="group-hover:scale-110 transition-transform">🎙️</span> Testar microfone antes de entrar
              </button>
            )}

            {/* Submit Button */}
            <Button
              type="button"
              onClick={handleProceed}
              disabled={isRequestingMic}
              className="w-full py-3 text-base font-semibold shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2.5 hover:shadow-violet-600/40 transition-shadow"
              size="lg"
            >
              {isRequestingMic ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Solicitando Microfone...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                    <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                  </svg>
                  <span>Entrar no Canal de Voz</span>
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-[11px] text-white/30 leading-relaxed">
            🔒 No celular, toque em <strong className="text-white/50">&quot;Permitir&quot;</strong> quando o navegador solicitar acesso ao microfone.
          </p>
        </div>
      </div>
    </div>
  );
}
