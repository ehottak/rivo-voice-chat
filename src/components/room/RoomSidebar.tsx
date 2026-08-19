'use client';

import type { Participant } from '@/types';
import { RivoLogo } from '@/components/ui/RivoLogo';

interface RoomSidebarProps {
  roomName: string;
  nickname: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  localParticipant: Participant | null;
  participants: Participant[];
  onClose?: () => void;
}

export function RoomSidebar({
  roomName,
  nickname,
  isMuted,
  onToggleMute,
  onOpenSettings,
  localParticipant,
  participants,
  onClose,
}: RoomSidebarProps) {
  const allParticipants = localParticipant
    ? [localParticipant, ...participants]
    : participants;

  const userHue = nickname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

  return (
    <aside className="w-72 sm:w-[260px] bg-[#0e0e16] border-r border-white/[0.05] flex flex-col justify-between select-none shrink-0 h-full max-h-screen">
      {/* Server Header */}
      <div>
        <div className="h-[52px] px-4 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <RivoLogo size={32} className="shrink-0 drop-shadow-md" />
            <div className="min-w-0">
              <span className="block truncate text-sm font-bold text-white/90 tracking-wide">{roomName.toUpperCase() || 'RIVO'}</span>
              <span className="block text-[10px] text-white/30 font-medium">Servidor de Voz</span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>

        {/* Channels List */}
        <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-190px)]">
          {/* Text Channels Section */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold tracking-[0.12em] text-white/25 uppercase flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 opacity-40">
                <path d="M3.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A1.75 1.75 0 0115 5.75v8.5A1.75 1.75 0 0113.25 16H2.75A1.75 1.75 0 011 14.25v-8.5C1 4.784 1.784 4 2.75 4H3V2.75A.75.75 0 013.75 2z" />
              </svg>
              Canais de Texto
            </p>
            <div className="space-y-0.5">
              <div className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/25 flex items-center gap-2 cursor-not-allowed hover:bg-white/[0.02] transition-colors">
                <span className="text-white/20 font-bold">#</span>
                <span>geral</span>
              </div>
              <div className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/25 flex items-center gap-2 cursor-not-allowed hover:bg-white/[0.02] transition-colors">
                <span className="text-white/20 font-bold">#</span>
                <span>avisos</span>
              </div>
            </div>
          </div>

          {/* Voice Channels Section */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold tracking-[0.12em] text-white/25 uppercase flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 opacity-40">
                <path d="M7 4a3 3 0 016 0v4a3 3 0 01-6 0V4z" />
              </svg>
              Canais de Voz
            </p>

            {/* Active Voice Channel */}
            <div className="bg-violet-500/[0.08] border border-violet-500/20 rounded-xl p-2 space-y-2">
              <div className="px-2 py-1 flex items-center justify-between text-xs font-semibold text-violet-300/80">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-violet-400">
                    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                    <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                  </svg>
                  <span>Sala de Voz</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300/70 font-mono tabular-nums">
                  {allParticipants.length}
                </span>
              </div>

              {/* Nested Voice Channel Participant List */}
              <div className="pl-3 space-y-0.5 border-l-2 border-violet-500/20 ml-2">
                {allParticipants.map((p) => {
                  const isUser = localParticipant?.peerId === p.peerId;
                  const pHue = p.nickname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

                  return (
                    <div
                      key={p.peerId}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative shrink-0">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                            style={{
                              background: `linear-gradient(135deg, hsl(${pHue}, 60%, 45%), hsl(${(pHue + 45) % 360}, 60%, 32%))`,
                            }}
                          >
                            {p.nickname.charAt(0).toUpperCase()}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#0e0e16]" />
                        </div>
                        <span className="truncate text-white/70 font-medium group-hover:text-white/90 transition-colors">{p.nickname}</span>
                        {isUser && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-violet-500/20 text-violet-300/80 font-bold uppercase tracking-wider">
                            you
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] opacity-40 group-hover:opacity-70 transition-opacity shrink-0">
                        {p.isMuted ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-red-400">
                            <path d="M3.28 2.22a.75.75 0 00-1.06 1.06L5.94 7l-2.72 2.72a.75.75 0 101.06 1.06L7 8.06l2.72 2.72a.75.75 0 101.06-1.06L8.06 7l2.72-2.72a.75.75 0 00-1.06-1.06L7 5.94 3.28 2.22z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-emerald-400">
                            <path d="M7 4a3 3 0 016 0v4a3 3 0 01-6 0V4z" />
                          </svg>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status & Profile Area */}
      <div className="p-2.5 bg-[#0a0a12] border-t border-white/[0.05] space-y-2">
        {/* Connected Voice Card */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-400/90 leading-tight truncate">Voz conectada</p>
                <p className="text-[9px] text-white/30 truncate">RIVO</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onToggleMute}
                className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-90 ${
                  isMuted ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white'
                }`}
                title={isMuted ? 'Desmutar' : 'Mutar'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  {isMuted ? (
                    <path d="M3.28 2.22a.75.75 0 00-1.06 1.06L5.94 7l-2.72 2.72a.75.75 0 101.06 1.06L7 8.06l2.72 2.72a.75.75 0 101.06-1.06L8.06 7l2.72-2.72a.75.75 0 00-1.06-1.06L7 5.94 3.28 2.22z" />
                  ) : (
                    <path d="M7 4a3 3 0 016 0v4a3 3 0 01-6 0V4z" />
                  )}
                </svg>
              </button>
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer active:scale-90 group"
                title="Configurações de Microfone"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300">
                  <path fillRule="evenodd" d="M6.455 1.45A.5.5 0 016.952 1h2.096a.5.5 0 01.497.45l.186 1.858a4.996 4.996 0 011.466.848l1.703-.769a.5.5 0 01.639.206l1.047 1.814a.5.5 0 01-.142.656l-1.517 1.09a5.026 5.026 0 010 1.694l1.517 1.09a.5.5 0 01.142.656l-1.047 1.814a.5.5 0 01-.639.206l-1.703-.769c-.433.36-.928.65-1.466.848l-.186 1.858a.5.5 0 01-.497.45H6.952a.5.5 0 01-.497-.45l-.186-1.858a4.993 4.993 0 01-1.466-.848l-1.703.769a.5.5 0 01-.639-.206L1.414 12.42a.5.5 0 01.142-.656l1.517-1.09a5.026 5.026 0 010-1.694L1.556 7.89a.5.5 0 01-.142-.656l1.047-1.814a.5.5 0 01.639-.206l1.703.769c.433-.36.928-.65 1.466-.848L6.455 1.45zM8 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* User Profile Bar */}
        <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-inner ring-2 ring-white/[0.06] group-hover:ring-violet-500/30 transition-all"
                style={{
                  background: `linear-gradient(135deg, hsl(${userHue}, 60%, 45%), hsl(${(userHue + 45) % 360}, 60%, 32%))`,
                }}
              >
                {nickname.charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0a0a12]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white/90 truncate">{nickname}</p>
              </div>
              <p className="text-[10px] text-emerald-400/70 font-medium">Online</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
