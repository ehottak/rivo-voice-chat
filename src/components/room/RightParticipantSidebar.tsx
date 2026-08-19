'use client';

import type { Participant } from '@/types';

interface RightParticipantSidebarProps {
  participants: Participant[];
  localParticipant: Participant | null;
  onClose?: () => void;
}

export function RightParticipantSidebar({
  participants,
  localParticipant,
  onClose,
}: RightParticipantSidebarProps) {
  const allParticipants = localParticipant
    ? [localParticipant, ...participants]
    : participants;

  const onlineCount = allParticipants.length;

  return (
    <aside className="w-72 sm:w-[260px] bg-[#0e0e16] border-l border-white/[0.05] flex flex-col select-none shrink-0 h-full max-h-screen">
      {/* Header */}
      <div className="h-[52px] px-4 border-b border-white/[0.05] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/30">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
          </svg>
          <span className="text-xs font-bold text-white/50 tracking-wider uppercase">
            Membros — {onlineCount}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {/* Online section header */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-bold tracking-[0.12em] text-emerald-400/50 uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Online — {onlineCount}
        </p>
      </div>

      {/* Participant List */}
      <div className="px-2 pb-3 space-y-0.5 overflow-y-auto flex-1">
        {allParticipants.map((p) => {
          const isUser = localParticipant?.peerId === p.peerId;
          const pHue = p.nickname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

          return (
            <div
              key={p.peerId}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner transition-all ${
                      p.isSpeaking && !p.isMuted
                        ? 'ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                        : 'ring-2 ring-white/[0.06] group-hover:ring-white/[0.12]'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, hsl(${pHue}, 55%, 42%), hsl(${(pHue + 45) % 360}, 55%, 30%))`,
                    }}
                  >
                    {p.nickname.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0e0e16] ${
                      p.isMuted ? 'bg-zinc-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-semibold text-white/80 truncate group-hover:text-white transition-colors">
                      {p.nickname}
                    </p>
                    {isUser && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-violet-500/20 text-violet-300/80 font-bold uppercase tracking-wider shrink-0">
                        you
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] font-medium ${
                    p.isMuted ? 'text-zinc-500' : p.isSpeaking ? 'text-emerald-400/80' : 'text-white/25'
                  }`}>
                    {p.isMuted ? 'Mutado' : p.isSpeaking ? 'Falando...' : 'Conectado'}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {p.isMuted ? (
                  <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-red-400/70">
                      <path d="M3.28 2.22a.75.75 0 00-1.06 1.06L5.94 7l-2.72 2.72a.75.75 0 101.06 1.06L7 8.06l2.72 2.72a.75.75 0 101.06-1.06L8.06 7l2.72-2.72a.75.75 0 00-1.06-1.06L7 5.94 3.28 2.22z" />
                    </svg>
                  </div>
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    p.isSpeaking ? 'bg-emerald-500/15' : 'bg-white/[0.03]'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-3 h-3 ${
                      p.isSpeaking ? 'text-emerald-400' : 'text-white/20'
                    }`}>
                      <path d="M7 4a3 3 0 016 0v4a3 3 0 01-6 0V4z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
