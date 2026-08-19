'use client';

import { useRef, useEffect, useState, memo, useCallback } from 'react';

interface ScreenShareStageProps {
  stream: MediaStream;
  muted: boolean;
  label: string;
}

/**
 * Stable, touch-optimized screen share video player with:
 * - Fullscreen mode (Teams/Discord style)
 * - Touch-friendly Volume slider and mute toggle
 * - Double-tap / double-click to toggle fullscreen
 * - Stable stream attachment preventing re-render flicker
 */
export const ScreenShareStage = memo(function ScreenShareStage({
  stream,
  muted: initialMuted,
  label,
}: ScreenShareStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Bind video stream stably
  useEffect(() => {
    const el = videoRef.current;
    if (el && el.srcObject !== stream) {
      el.srcObject = stream;
    }
  }, [stream]);

  // Keep volume & muted state in sync with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Listen for native fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  // Handle volume slider change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVol === 0) {
      setIsMuted(true);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (volume === 0) setVolume(0.5);
    } else {
      setIsMuted(true);
    }
  };

  // Auto-hide controls when idle
  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        onMouseMove={handleInteraction}
        onTouchStart={handleInteraction}
        onMouseLeave={() => setShowControls(false)}
        onDoubleClick={toggleFullscreen}
        className={`w-full relative rounded-3xl overflow-hidden border border-violet-500/25 bg-[#08080f] shadow-2xl shadow-violet-950/40 group select-none transition-all duration-300 ${
          isFullscreen
            ? 'h-screen max-h-screen rounded-none border-none aspect-auto flex items-center justify-center'
            : 'aspect-video max-h-[38vh] sm:max-h-[58vh]'
        }`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-contain"
        />

        {/* Ambient Top Shadow */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

        {/* Top Info Banner */}
        <div
          className={`absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-white/[0.08] shadow-lg transition-opacity duration-200 ${
            showControls || !isFullscreen ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
          <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-xs">
            {label}
          </span>
          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm shadow-violet-600/30 tracking-wider">
            LIVE
          </span>
        </div>

        {/* Floating Quick Action Bar */}
        <div
          className={`absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 bg-[#0f0f18]/90 backdrop-blur-2xl px-3.5 sm:px-4 py-2 rounded-2xl border border-white/[0.1] shadow-2xl shadow-black/90 transition-all duration-200 max-w-[95%] ${
            showControls || isFullscreen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'
          }`}
        >
          {/* Volume / Mute Button & Slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              title={isMuted ? 'Desmutar Transmissão' : 'Mutar Transmissão'}
              className="p-1 text-white/70 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer active:scale-90"
            >
              {isMuted || volume === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-red-400">
                  <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.764L4.854 13.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.854l3.529-3.264a1 1 0 011-.16zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-violet-300">
                  <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H2.25A1.25 1.25 0 001 8.25v3.5A1.25 1.25 0 002.25 13h2.453l4.033 3.796A.75.75 0 0010 16.25V3.75zM12.923 7.077a.75.75 0 111.06-1.06 6.5 6.5 0 010 8.006.75.75 0 11-1.06-1.06 5 5 0 000-5.886zM15.574 4.426a.75.75 0 111.06-1.06A10.25 10.25 0 0116.634 16.634a.75.75 0 11-1.06-1.06 8.75 8.75 0 000-11.148z" />
                </svg>
              )}
            </button>

            {/* Volume Range Slider */}
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 sm:w-22 h-1.5 bg-white/20 accent-violet-400 rounded-lg cursor-pointer"
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
              <span className="text-[10px] sm:text-[11px] font-mono text-white/60 w-7 text-right">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>

          <div className="h-3.5 sm:h-4 w-px bg-white/[0.1]" />

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Sair da Tela Cheia (Esc)' : 'Tela Cheia (Duplo toque)'}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
          >
            {isFullscreen ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                  <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l3.72 3.72H3.75a.75.75 0 000 1.5h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-1.5 0v2.19l-4.22-4.22zm13.44 0a.75.75 0 00-1.06 0l-4.22 4.22v-2.19a.75.75 0 00-1.5 0v4.5c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-2.19l3.72-3.72a.75.75 0 000-1.06zm-8.22 10.03a.75.75 0 00-.75.75v2.19l-3.72-3.72a.75.75 0 00-1.06 1.06l4.22 4.22h-2.19a.75.75 0 000 1.5h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75zm4.5 0a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-2.19l4.22 4.22a.75.75 0 101.06-1.06l-3.72-3.72h2.19a.75.75 0 000-1.5h-4.5z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Restaurar</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                  <path fillRule="evenodd" d="M3.75 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5H6.81l3.72 3.72a.75.75 0 11-1.06 1.06L5.75 5.56v2.19a.75.75 0 01-1.5 0v-4.5a.75.75 0 01.75-.75zm8 0a.75.75 0 01.75.75v2.19l3.72-3.72a.75.75 0 111.06 1.06L13.56 7.75h2.19a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 01.75-.75zM5.75 14.44l3.72-3.72a.75.75 0 111.06 1.06L6.81 15.5h2.19a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 011.5 0v2.19zm8.51-2.66a.75.75 0 011.06 0l3.72 3.72v-2.19a.75.75 0 011.5 0v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h2.19l-3.72-3.72a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Tela Cheia</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
