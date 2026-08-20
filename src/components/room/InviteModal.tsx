'use client';

import { useState, useCallback } from 'react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomName: string;
  publicTunnelUrl: string | null;
}

export function InviteModal({
  isOpen,
  onClose,
  roomCode,
  roomName,
  publicTunnelUrl,
}: InviteModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const getInviteUrl = useCallback(() => {
    if (publicTunnelUrl) {
      return `${publicTunnelUrl}/room/${roomCode}`;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/room/${roomCode}`;
    }
    return `/room/${roomCode}`;
  }, [publicTunnelUrl, roomCode]);

  const copyLink = useCallback(async () => {
    const url = getInviteUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [getInviteUrl]);

  const copyCodeOnly = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = roomCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }, [roomCode]);

  if (!isOpen) return null;

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md p-6 bg-[#12121e] border border-white/[0.08] rounded-3xl shadow-2xl space-y-5 text-left animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center font-bold text-sm">
              🔗
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Convidar Amigos</h3>
              <p className="text-[11px] text-white/40">{roomName || 'RIVO'}</p>
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

        {/* Room Code Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-2xl space-y-2">
          <label className="text-[11px] font-bold text-violet-300 uppercase tracking-wider block">
            Código da Sala
          </label>
          <div className="flex items-center justify-between bg-black/40 border border-white/[0.08] p-2.5 rounded-xl">
            <span className="font-mono text-base font-black text-white tracking-widest pl-2">
              {roomCode}
            </span>
            <button
              onClick={copyCodeOnly}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                copiedCode
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30 active:scale-95'
              }`}
            >
              {copiedCode ? 'Copiado!' : 'Copiar Código'}
            </button>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            Seus amigos podem digitar este código na aba <strong>&quot;Entrar em Sala&quot;</strong> na página inicial.
          </p>
        </div>

        {/* Direct Link Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-violet-300 uppercase tracking-wider block">
              Link Direto
            </label>
            {publicTunnelUrl && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Link Cloudflare Ativo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-black/40 border border-white/[0.08] p-2 rounded-xl">
            <input
              readOnly
              value={getInviteUrl()}
              className="flex-1 bg-transparent text-xs text-white/70 truncate outline-none px-1.5 font-mono"
            />
            <button
              onClick={copyLink}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                copiedLink
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-md shadow-violet-600/30 active:scale-95'
              }`}
            >
              {copiedLink ? 'Copiado!' : 'Copiar Link'}
            </button>
          </div>

          {isLocalhost && !publicTunnelUrl && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-200/90 leading-relaxed">
              💡 <strong>Aguardando túnel Cloudflare:</strong> O aplicativo está gerando o link público em segundo plano...
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-white transition-colors cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
