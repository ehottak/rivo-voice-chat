'use client';

interface RoomHeaderProps {
  roomName: string;
  roomCode: string;
  participantCount: number;
  onOpenDiagnostics?: () => void;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onOpenInvite: () => void;
}

export function RoomHeader({
  roomName,
  participantCount,
  onOpenDiagnostics,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onToggleChat,
  isChatOpen,
  onOpenInvite,
}: RoomHeaderProps) {
  return (
    <header className="h-[52px] px-3 sm:px-5 bg-zinc-900/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between shrink-0 select-none z-20">
      {/* Left: Mobile Menu Trigger + Channel Info */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Left Sidebar Toggle */}
        {onToggleLeftSidebar && (
          <button
            onClick={onToggleLeftSidebar}
            className="lg:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white transition-all cursor-pointer shrink-0 active:scale-95"
            title="Abrir Canais"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Channel icon with glow */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-violet-500/20 rounded-lg blur-md" />
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/80 to-indigo-600/80 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/90">
              <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
              <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
            </svg>
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="text-[13px] sm:text-sm font-bold text-white tracking-wide truncate max-w-[130px] sm:max-w-xs md:max-w-md">
            {roomName || 'Sala de Voz'}
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <p className="text-[10px] text-white/40 leading-none">
              {participantCount} {participantCount === 1 ? 'conectado' : 'conectados'}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Toggle Chat Button */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
              isChatOpen
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-500'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/[0.06]'
            }`}
            title={isChatOpen ? 'Fechar Chat' : 'Abrir Chat da Sala'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414v3.025c0 .421.49.664.819.4l3.16-2.529c.77-.072 1.53-.175 2.271-.308 1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM6 9a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">Chat</span>
          </button>
        )}

        {/* Share / Invite Modal Trigger */}
        <button
          onClick={onOpenInvite}
          className="group flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-violet-500/15 text-white/60 hover:text-violet-300 border border-white/[0.06] hover:border-violet-500/30 transition-all cursor-pointer active:scale-95"
          title="Convidar Amigos para a Sala"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform">
            <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
            <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
          </svg>
          <span className="hidden sm:inline">Convite</span>
        </button>

        {/* Diagnostics Button */}
        {onOpenDiagnostics && (
          <button
            onClick={onOpenDiagnostics}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all cursor-pointer active:scale-95 border border-white/[0.04]"
            title="Diagnóstico de Voz"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.166a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Members Sidebar Toggle */}
        {onToggleRightSidebar && (
          <button
            onClick={onToggleRightSidebar}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all cursor-pointer relative active:scale-95 border border-white/[0.04]"
            title="Lista de Participantes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
              {participantCount}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
