'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/socket-events';
import { getSocket } from '@/lib/socket';

interface RoomChatProps {
  roomName: string;
  localPeerId?: string;
  onClose?: () => void;
}

export function RoomChat({ roomName, localPeerId, onClose }: RoomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for real-time incoming chat messages
  useEffect(() => {
    const sock = getSocket();

    const handleMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    sock.on('chat:message', handleMessage);

    return () => {
      sock.off('chat:message', handleMessage);
    };
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const sock = getSocket();
    sock.emit('chat:send', { text });
    setInputText('');
  };

  return (
    <aside className="w-80 sm:w-88 bg-[#0c0c16] border-l border-white/[0.06] flex flex-col justify-between select-none shrink-0 h-full max-h-screen z-30">
      {/* Chat Header */}
      <div className="h-[52px] px-4 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#0e0e1a]/80 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs font-bold">
            #
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white tracking-wide truncate">Chat da Sala</h3>
            <p className="text-[9px] text-white/30 truncate">{roomName || 'RIVO'}</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer active:scale-90"
            title="Fechar Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages List Area */}
      <div className="flex-1 p-3.5 space-y-3 overflow-y-auto min-h-0 text-left">
        {/* Ephemeral Notice Banner */}
        <div className="p-3 bg-violet-950/30 border border-violet-500/20 rounded-2xl space-y-1 text-center">
          <div className="flex items-center justify-center gap-1.5 text-violet-300 font-bold text-[11px]">
            <span>🔒</span>
            <span>Chat Temporário</span>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            As mensagens existem apenas na memória enquanto a sala estiver aberta. Nada é salvo em banco de dados e tudo se apaga ao sair.
          </p>
        </div>

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-30 space-y-1">
            <p className="text-2xl">💬</p>
            <p className="text-xs text-white">Nenhuma mensagem ainda.</p>
            <p className="text-[10px] text-white/70">Envie um oi para começar a conversar!</p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => {
          const isUser = localPeerId === msg.peerId;
          const hue = msg.nickname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

          return (
            <div key={msg.id} className="space-y-1 group">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{
                      background: `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${(hue + 45) % 360}, 60%, 32%))`,
                    }}
                  >
                    {msg.nickname.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[11px] font-bold text-white/90 truncate">{msg.nickname}</span>
                  {isUser && (
                    <span className="text-[8px] px-1 rounded bg-violet-500/20 text-violet-300 font-semibold">
                      você
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-white/25 font-mono shrink-0">{msg.timestamp}</span>
              </div>

              <div
                className={`p-2.5 rounded-2xl text-xs leading-relaxed break-words ${
                  isUser
                    ? 'bg-violet-600/20 border border-violet-500/30 text-violet-100 rounded-tl-sm'
                    : 'bg-white/[0.04] border border-white/[0.06] text-white/90 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Area */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-white/[0.06] bg-[#0a0a14] shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Conversar no chat temporário..."
            maxLength={1000}
            className="flex-1 px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/50 rounded-xl text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-violet-600/20 active:scale-90 shrink-0"
            title="Enviar Mensagem (Enter)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 004.835 9.25h8.415a.75.75 0 010 1.5H4.835a1.5 1.5 0 00-1.142 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.114A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </form>
    </aside>
  );
}
