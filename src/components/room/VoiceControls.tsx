'use client';

interface VoiceControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  isSharingScreen?: boolean;
  onToggleScreenShare?: () => void;
  isCameraOn?: boolean;
  onToggleCamera?: () => void;
  onLeave: () => void;
  onOpenSettings: () => void;
}

export function VoiceControls({
  isMuted,
  onToggleMute,
  isSharingScreen,
  onToggleScreenShare,
  isCameraOn,
  onToggleCamera,
  onLeave,
  onOpenSettings,
}: VoiceControlsProps) {
  return (
    <footer className="py-2 sm:py-3 px-3 sm:px-4 bg-zinc-950/90 backdrop-blur-2xl flex items-center justify-center gap-1 sm:gap-2 border-t border-white/[0.06] shrink-0 z-20 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* 1. Mute/Unmute */}
      <button
        id="btn-toggle-mute"
        onClick={onToggleMute}
        className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none active:scale-95 ${
          isMuted
            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40'
            : 'bg-white/[0.06] hover:bg-emerald-500/15 text-white/80 hover:text-emerald-300 border border-white/[0.06] hover:border-emerald-500/30'
        }`}
        title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
            <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM20.57 16.476c.223-.264.377-.567.442-.895a7.48 7.48 0 00-5.327-8.461.75.75 0 10-.424 1.44 5.98 5.98 0 014.312 5.704v.256a.75.75 0 001.5 0v-.256a7.47 7.47 0 00-.503-2.788zM7.263 8.827A3.75 3.75 0 017.5 7.5V4.5a4.5 4.5 0 019 0v.263M12 18a5.988 5.988 0 004.012-1.54l-8.82-8.82A3.75 3.75 0 006 11.25v.75a6 6 0 006 6z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
            <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
            <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
          </svg>
        )}
        <span className="hidden sm:inline">{isMuted ? 'Desmutar' : 'Mudo'}</span>
      </button>

      {/* 2. Camera Button */}
      {onToggleCamera && (
        <button
          id="btn-toggle-camera"
          onClick={onToggleCamera}
          className={`group flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none active:scale-95 ${
            isCameraOn
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 border border-violet-400/30'
              : 'bg-white/[0.06] hover:bg-violet-500/15 text-white/80 hover:text-violet-300 border border-white/[0.06] hover:border-violet-500/30'
          }`}
          title={isCameraOn ? 'Desativar Câmera' : 'Ativar Câmera'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
            <path d="M.5 5.093c0-1.35 1.089-2.093 1.992-2.093h13.016c.903 0 1.992.743 1.992 2.093v13.814c0 1.35-1.089 2.093-1.992 2.093H2.492C1.589 21 .5 20.257.5 18.907V5.093zM18.5 15.5l4.144 2.612a.75.75 0 001.106-.66V6.548a.75.75 0 00-1.106-.66L18.5 8.5v7z" />
          </svg>
          <span className="hidden sm:inline">{isCameraOn ? 'Câmera' : 'Câmera'}</span>
        </button>
      )}

      {/* 3. Screen Share Button */}
      {onToggleScreenShare && (
        <button
          id="btn-toggle-screenshare"
          onClick={onToggleScreenShare}
          className={`group flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none active:scale-95 ${
            isSharingScreen
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 border border-violet-400/30'
              : 'bg-white/[0.06] hover:bg-violet-500/15 text-white/80 hover:text-violet-300 border border-white/[0.06] hover:border-violet-500/30'
          }`}
          title={isSharingScreen ? 'Parar Compartilhamento' : 'Compartilhar Tela'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
            <path d="M2.25 3h19.5c.966 0 1.75.784 1.75 1.75v11.5A1.75 1.75 0 0121.75 18H14v2h2.75a.75.75 0 010 1.5H7.25a.75.75 0 010-1.5H10v-2H2.25A1.75 1.75 0 01.5 16.25V4.75C.5 3.784 1.284 3 2.25 3zM12 14.5a.75.75 0 00.75-.75V8.56l1.22 1.22a.75.75 0 101.06-1.06l-2.5-2.5a.75.75 0 00-1.06 0l-2.5 2.5a.75.75 0 001.06 1.06l1.22-1.22v5.19c0 .414.336.75.75.75z" />
          </svg>
          <span className="hidden sm:inline">{isSharingScreen ? 'Parar' : 'Tela'}</span>
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-6 bg-white/[0.08] mx-0.5 hidden sm:block" />

      {/* 4. Mic Settings Button */}
      <button
        id="btn-audio-settings"
        onClick={onOpenSettings}
        className="group p-2.5 sm:p-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white/50 hover:text-white border border-white/[0.06] transition-all cursor-pointer select-none active:scale-95"
        title="Configurações de Áudio e Microfone"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300">
          <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.855 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.5 7.5 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
        </svg>
      </button>

      {/* 5. Leave Button */}
      <button
        id="btn-leave-room"
        onClick={onLeave}
        className="group flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition-all cursor-pointer select-none active:scale-95 ml-0.5"
        title="Sair do Canal de Voz"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform">
          <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">Sair</span>
      </button>
    </footer>
  );
}
