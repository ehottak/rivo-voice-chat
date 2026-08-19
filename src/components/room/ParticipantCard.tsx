'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import type { Participant } from '@/types';

/** Stable video element that only reassigns srcObject when the stream identity changes */
const StableVideo = memo(function StableVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted className="w-full h-full object-cover" />;
});

interface ParticipantCardProps {
  participant: Participant;
  isLocal?: boolean;
  videoStream?: MediaStream | null;
}

export function ParticipantCard({ participant, isLocal, videoStream }: ParticipantCardProps) {
  const { peerId, nickname, isMuted, isSpeaking } = participant;

  // Local user volume control (0% to 200%)
  const [userVolume, setUserVolume] = useState<number>(100);
  const [isLocallyMuted, setIsLocallyMuted] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Generate a consistent vibrant color from nickname
  const hue = nickname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

  const showSpeaking = isSpeaking && !isMuted;

  // Adjust audio element volume when userVolume or isLocallyMuted changes
  useEffect(() => {
    if (isLocal) return;

    const audioEl = document.getElementById(`remote-audio-${peerId}`) as HTMLAudioElement | null;
    if (audioEl) {
      if (isLocallyMuted) {
        audioEl.muted = true;
      } else {
        audioEl.muted = false;
        // HTMLAudioElement volume ranges 0.0 to 1.0
        audioEl.volume = Math.min(1.0, userVolume / 100);
      }
    }
  }, [userVolume, isLocallyMuted, peerId, isLocal]);

  // Handle right-click / context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = Math.min(window.innerWidth - 270, Math.max(12, e.clientX));
    const y = Math.min(window.innerHeight - 320, Math.max(12, e.clientY));
    setMenuPosition({ x, y });
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPosition(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuPosition(null);
      }
    };

    if (menuPosition) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuPosition]);

  const copyNickname = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(nickname);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [nickname]);

  return (
    <div
      onContextMenu={handleContextMenu}
      className={`flex flex-col items-center gap-2.5 sm:gap-3 p-3 sm:p-5 select-none relative group rounded-3xl transition-all duration-300 cursor-pointer ${
        showSpeaking
          ? 'bg-emerald-950/20 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-[1.02]'
          : 'bg-[#11111a]/70 hover:bg-[#161622] border border-white/[0.05] hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/40'
      }`}
    >
      {/* 3-dots options button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          setMenuPosition({ x: Math.min(window.innerWidth - 270, rect.left), y: rect.bottom + 6 });
        }}
        className="absolute top-2 right-2 p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] text-white/40 hover:text-white opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20 active:scale-90"
        title="Opções do usuário"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
        </svg>
      </button>

      {/* Avatar Container with glowing speaking ring */}
      <div className="relative mt-1">
        {/* Animated outer glowing ring when speaking */}
        {showSpeaking && (
          <>
            <div className="absolute -inset-3 rounded-full bg-emerald-500/25 animate-pulse blur-md pointer-events-none" />
            <div className="absolute -inset-1.5 rounded-full border-2 border-emerald-400/80 animate-ping opacity-40 pointer-events-none" />
          </>
        )}

        {/* Main Avatar Circle or Camera Feed */}
        <div
          className={`
            w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-extrabold text-white
            transition-all duration-200 relative z-10 overflow-hidden shadow-inner
            ${
              showSpeaking
                ? 'border-[3px] border-emerald-400 scale-105 shadow-[0_0_24px_rgba(52,211,153,0.6)] ring-4 ring-emerald-500/20'
                : 'border-2 border-white/[0.08] group-hover:border-white/[0.18]'
            }
          `}
          style={{
            background: `linear-gradient(135deg, hsl(${hue}, 65%, 45%), hsl(${(hue + 45) % 360}, 65%, 28%))`,
          }}
        >
          {videoStream ? (
            <StableVideo stream={videoStream} />
          ) : (
            <span className="drop-shadow-md select-none">{nickname.charAt(0).toUpperCase()}</span>
          )}

          {/* Audio Wave Bars when speaking (Corner Overlay) */}
          {showSpeaking && (
            <div className="absolute bottom-2 left-2 z-20 flex items-end gap-0.5 bg-black/60 backdrop-blur-md px-1.5 py-1 rounded-md border border-emerald-500/40">
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-emerald-300 rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-pulse [animation-delay:300ms]" />
            </div>
          )}
        </div>

        {/* Mute indicator badge */}
        {isMuted ? (
          <div className="absolute -bottom-1 -right-1 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center border-2 border-[#11111a] shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
            >
              <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.764L4.854 13.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.854l3.529-3.264a1 1 0 011-.16zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
            </svg>
          </div>
        ) : (
          <div
            className={`absolute -bottom-1 -right-1 z-20 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border-2 border-[#11111a] transition-all duration-200 ${
              showSpeaking ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-emerald-500/80'
            }`}
          />
        )}
      </div>

      {/* Nickname and info */}
      <div className="text-center w-full min-w-0 px-1">
        <div className="flex items-center justify-center gap-1.5">
          <p
            className={`text-xs sm:text-sm font-bold tracking-wide truncate transition-colors ${
              showSpeaking
                ? 'text-emerald-300'
                : isMuted
                ? 'text-white/40'
                : 'text-white/90 group-hover:text-white'
            }`}
          >
            {nickname}
          </p>
          {isLocal && (
            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 font-bold uppercase tracking-wider shrink-0 border border-violet-500/20">
              você
            </span>
          )}
        </div>

        {!isLocal && isLocallyMuted && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 mt-1 rounded bg-red-500/20 text-red-300 font-medium">
            silenciado
          </span>
        )}
      </div>

      {/* Floating Discord-Style Context Menu */}
      {menuPosition && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            zIndex: 999,
          }}
          className="w-68 p-3.5 bg-[#12121c]/95 border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-2xl text-left space-y-3 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 pb-2.5 border-b border-white/[0.06]">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-md"
              style={{
                background: `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${(hue + 40) % 360}, 60%, 35%))`,
              }}
            >
              {nickname.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight truncate">{nickname}</p>
              <p className="text-[11px] text-white/40 truncate">
                {isLocal ? 'Seu Perfil' : isMuted ? 'Microfone Mutado' : 'Conectado'}
              </p>
            </div>
          </div>

          {!isLocal ? (
            <>
              {/* User Volume Slider */}
              <div className="space-y-1.5 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.04]">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Volume do Usuário</span>
                  <span className="font-mono text-violet-400 font-bold">{userVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={userVolume}
                  onChange={(e) => {
                    setUserVolume(Number(e.target.value));
                    if (isLocallyMuted && Number(e.target.value) > 0) {
                      setIsLocallyMuted(false);
                    }
                  }}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              {/* Local Mute Toggle */}
              <button
                onClick={() => setIsLocallyMuted(!isLocallyMuted)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isLocallyMuted
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                    : 'bg-white/[0.04] text-white/80 hover:bg-white/[0.08] border border-white/[0.05]'
                }`}
              >
                <span>{isLocallyMuted ? 'Desmutar para mim' : 'Silenciar para mim'}</span>
                <span>{isLocallyMuted ? '🔇' : '🔊'}</span>
              </button>
            </>
          ) : (
            <p className="text-xs text-white/40 italic px-1">
              Use as opções de microfone na barra inferior para ajustar seu áudio.
            </p>
          )}

          {/* Copy Nickname */}
          <button
            onClick={copyNickname}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <span>{copied ? 'Apelido Copiado!' : 'Copiar Apelido'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white/40">
              <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
              <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
