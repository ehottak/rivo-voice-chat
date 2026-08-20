'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { NicknameModal } from '@/components/ui/NicknameModal';
import { RoomView } from '@/components/room/RoomView';
import type { RoomInfo } from '@/types';

interface RoomPageClientProps {
  code: string;
}

export function RoomPageClient({ code }: RoomPageClientProps) {
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nickname, setNickname] = useState<string | null>(null);
  const [initialDeviceId, setInitialDeviceId] = useState<string | undefined>(undefined);
  const [initialStream, setInitialStream] = useState<MediaStream | undefined>(undefined);
  const router = useRouter();

  // Load room info dynamically from API
  useEffect(() => {
    let isMounted = true;

    async function loadRoom() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/rooms/${encodeURIComponent(code)}`, {
          cache: 'no-store',
        });
        const data = await res.json();

        if (isMounted) {
          if (data.success && data.room) {
            setRoomInfo(data.room);
          } else {
            setError(data.error || 'A sala que você está procurando não existe ou foi finalizada.');
          }
        }
      } catch {
        if (isMounted) {
          setError('Erro de conexão ao carregar os dados da sala.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRoom();

    return () => {
      isMounted = false;
    };
  }, [code]);

  const handleNicknameSubmit = useCallback((nick: string, deviceId?: string, stream?: MediaStream) => {
    setNickname(nick);
    setInitialDeviceId(deviceId);
    setInitialStream(stream);
  }, []);

  const handleLeave = useCallback(() => {
    router.push('/');
  }, [router]);

  // 1. Loading State
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#080810]">
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="w-12 h-12 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto shadow-lg shadow-violet-600/20" />
          <p className="text-sm font-semibold text-white/70">Carregando sala...</p>
        </div>
      </main>
    );
  }

  // 2. Error / Not Found State
  if (error || !roomInfo) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#080810]">
        <div className="text-center max-w-md p-8 bg-[#12121e]/90 border border-white/[0.08] rounded-3xl shadow-2xl backdrop-blur-2xl animate-fade-in-up">
          <div className="w-18 h-18 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-9 h-9 text-red-400"
            >
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sala Não Encontrada</h1>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">
            {error || 'A sala que você está procurando não existe ou foi finalizada.'}
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-violet-600/30 transition-all active:scale-95 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
                clipRule="evenodd"
              />
            </svg>
            Voltar ao Início
          </a>
        </div>
      </main>
    );
  }

  // 3. Nickname Prompt Modal
  if (!nickname) {
    return (
      <NicknameModal
        onSubmit={handleNicknameSubmit}
        roomName={roomInfo.name}
      />
    );
  }

  // 4. In-Room View
  return (
    <RoomView
      roomInfo={roomInfo}
      nickname={nickname}
      initialDeviceId={initialDeviceId}
      initialStream={initialStream}
      onLeave={handleLeave}
    />
  );
}
