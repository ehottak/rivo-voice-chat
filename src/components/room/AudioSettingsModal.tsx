'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeviceId?: string;
  onSelectDevice: (deviceId: string) => Promise<void>;
  currentOutputDeviceId?: string;
  onSelectOutputDevice?: (deviceId: string) => Promise<void>;
  localStream: MediaStream | null;
}

export function AudioSettingsModal({
  isOpen,
  onClose,
  currentDeviceId,
  onSelectDevice,
  currentOutputDeviceId,
  onSelectOutputDevice,
  localStream,
}: AudioSettingsModalProps) {
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>(currentDeviceId || '');
  const [selectedOutputId, setSelectedOutputId] = useState<string>(currentOutputDeviceId || 'default');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isSwitchingInput, setIsSwitchingInput] = useState(false);
  const [isSwitchingOutput, setIsSwitchingOutput] = useState(false);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const [sinkIdSupported, setSinkIdSupported] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check sinkId support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSinkIdSupported(typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype);
    }
  }, []);

  // Enumerate input and output devices
  useEffect(() => {
    if (!isOpen) return;

    async function loadDevices() {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        const mics = list.filter((d) => d.kind === 'audioinput');
        const speakers = list.filter((d) => d.kind === 'audiooutput');

        setInputDevices(mics);
        setOutputDevices(speakers);

        if (!selectedInputId && mics.length > 0) {
          setSelectedInputId(mics[0].deviceId);
        }
        if (!selectedOutputId && speakers.length > 0) {
          setSelectedOutputId(speakers[0].deviceId);
        }
      } catch (e) {
        console.error('Error enumerating devices:', e);
      }
    }

    loadDevices();
  }, [isOpen, selectedInputId, selectedOutputId]);

  // Audio meter for microphone
  useEffect(() => {
    if (!isOpen || !localStream) return;

    try {
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioCtx.createMediaStreamSource(localStream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
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

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isOpen, localStream]);

  if (!isOpen) return null;

  // Handle microphone input change
  const handleInputChange = async (newDeviceId: string) => {
    setSelectedInputId(newDeviceId);
    setIsSwitchingInput(true);
    try {
      await onSelectDevice(newDeviceId);
    } catch (err) {
      console.error('Failed to change mic:', err);
    } finally {
      setIsSwitchingInput(false);
    }
  };

  // Handle speaker/headphone output change
  const handleOutputChange = async (newDeviceId: string) => {
    setSelectedOutputId(newDeviceId);
    setIsSwitchingOutput(true);
    try {
      if (onSelectOutputDevice) {
        await onSelectOutputDevice(newDeviceId);
      }
    } catch (err) {
      console.error('Failed to change output device:', err);
    } finally {
      setIsSwitchingOutput(false);
    }
  };

  // Play pleasant chime
  const playTestSound = async () => {
    if (isPlayingTestSound) return;
    setIsPlayingTestSound(true);

    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const ctxWithSink = audioCtx as AudioContext & { setSinkId?: (id: string) => Promise<void> };
      if (typeof ctxWithSink.setSinkId === 'function' && selectedOutputId) {
        await ctxWithSink.setSinkId(selectedOutputId).catch(() => {});
      }

      const playTone = (freq: number, start: number, dur: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);

        gain.gain.setValueAtTime(0, audioCtx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + dur);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + dur);
      };

      playTone(659.25, 0.0, 0.35);
      playTone(830.61, 0.18, 0.4);
      playTone(987.77, 0.36, 0.6);

      setTimeout(() => {
        setIsPlayingTestSound(false);
        audioCtx.close().catch(() => {});
      }, 1100);
    } catch (e) {
      console.warn('Test sound error:', e);
      setIsPlayingTestSound(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg p-6 sm:p-7 bg-[#12121e]/95 border border-white/[0.08] rounded-3xl shadow-2xl shadow-black/80 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-600/30 border border-violet-500/30 text-violet-300 flex items-center justify-center shadow-lg shadow-violet-950/40">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Dispositivos de Voz e Áudio</h3>
              <p className="text-xs text-white/40">Personalize microfones e saídas de som</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* 1. INPUT DEVICE (MICROPHONE) */}
        <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-bold text-white/90">
              <span className="text-violet-400">🎙️</span> Microfone de Entrada
            </label>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              {inputDevices.length} detectado(s)
            </span>
          </div>

          <select
            value={selectedInputId}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={isSwitchingInput}
            className="w-full px-3.5 py-2.5 bg-[#0a0a14] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer disabled:opacity-50"
          >
            {inputDevices.length === 0 ? (
              <option value="" className="bg-zinc-900 text-white">Nenhum microfone encontrado</option>
            ) : (
              inputDevices.map((device, idx) => (
                <option
                  key={device.deviceId || idx}
                  value={device.deviceId}
                  className="bg-zinc-900 text-white"
                >
                  {device.label || `Microfone ${idx + 1}`}
                </option>
              ))
            )}
          </select>

          {/* Live VU Meter */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-white/50">
              <span>Nível de Captação</span>
              <span className="font-mono text-[11px] font-semibold">{micVolume > 15 ? '🟢 Detectando Som' : '⚪ Silêncio'}</span>
            </div>
            <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full transition-all duration-75 rounded-full ${
                  micVolume > 20
                    ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-sm shadow-emerald-500/40'
                    : 'bg-white/15'
                }`}
                style={{ width: `${Math.max(4, micVolume)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. OUTPUT DEVICE (SPEAKERS / HEADPHONES) */}
        <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05] overflow-hidden">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-bold text-white/90">
              <span className="text-violet-400">🔊</span> Onde você ouve (Alto-falante / Fone)
            </label>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              {outputDevices.length > 0 ? `${outputDevices.length} detectado(s)` : 'Padrão'}
            </span>
          </div>

          <div className="space-y-2">
            <select
              value={selectedOutputId}
              onChange={(e) => handleOutputChange(e.target.value)}
              disabled={isSwitchingOutput}
              className="w-full px-3.5 py-2.5 bg-[#0a0a14] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer disabled:opacity-50 truncate"
            >
              <option value="default" className="bg-zinc-900 text-white">
                Dispositivo de Áudio Padrão do Sistema
              </option>
              {outputDevices
                .filter((d) => d.deviceId !== 'default')
                .map((device, idx) => (
                  <option
                    key={device.deviceId || idx}
                    value={device.deviceId}
                    className="bg-zinc-900 text-white"
                  >
                    {device.label || `Saída de Som ${idx + 1}`}
                  </option>
                ))}
            </select>

            {/* Test Sound Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-white/40">Testar saída selecionada</span>
              <button
                type="button"
                onClick={playTestSound}
                disabled={isPlayingTestSound}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                  isPlayingTestSound
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 border-violet-500 text-white shadow-lg shadow-violet-600/40 animate-pulse'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/80 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {isPlayingTestSound ? '🔊 Tocando Som...' : '🎵 Testar Saída de Som'}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
          <div className="flex items-center gap-2 bg-white/[0.02] px-3 py-2 rounded-xl border border-white/[0.04]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>Cancelamento de Eco</span>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.02] px-3 py-2 rounded-xl border border-white/[0.04]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>Supressão de Ruído</span>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button variant="primary" onClick={onClose} className="w-full py-3 font-semibold shadow-lg shadow-violet-600/25">
            Salvar e Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
