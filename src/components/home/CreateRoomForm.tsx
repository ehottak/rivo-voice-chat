'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function RoomActionsCard() {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  // Create room state
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join room state
  const [roomCodeOrUrl, setRoomCodeOrUrl] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const router = useRouter();

  // Create room handler
  const handleCreate = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = roomName.trim();

      if (trimmed.length === 0) {
        setCreateError('Digite o nome da sala');
        return;
      }

      setIsCreating(true);
      setCreateError('');

      try {
        const res = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        });

        const data = await res.json();

        if (data.success && data.room?.code) {
          router.push(`/room/${data.room.code}`);
        } else {
          setCreateError(data.error || 'Falha ao criar a sala');
        }
      } catch {
        setCreateError('Erro de conexão ao criar a sala');
      } finally {
        setIsCreating(false);
      }
    },
    [roomName, router]
  );

  // Join room handler
  const handleJoin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      let input = roomCodeOrUrl.trim();

      if (!input) {
        setJoinError('Cole o link da sala ou digite o código');
        return;
      }

      // Extract code if user pasted a full URL (e.g. https://.../room/a8F92kL or /room/a8F92kL)
      if (input.includes('/room/')) {
        const parts = input.split('/room/');
        input = parts[parts.length - 1].split('?')[0].split('/')[0].trim();
      }

      if (!input) {
        setJoinError('Código da sala inválido');
        return;
      }

      setIsJoining(true);
      setJoinError('');

      try {
        const res = await fetch(`/api/rooms/${encodeURIComponent(input)}`);
        const data = await res.json();

        if (data.success && data.room?.code) {
          router.push(`/room/${data.room.code}`);
        } else {
          setJoinError(data.error || 'Sala não encontrada. Verifique o código/link.');
        }
      } catch {
        setJoinError('Erro ao verificar a sala');
      } finally {
        setIsJoining(false);
      }
    },
    [roomCodeOrUrl, router]
  );

  return (
    <div>
      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
            activeTab === 'create'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Criar Sala
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('join')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
            activeTab === 'join'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Entrar em Sala
        </button>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleCreate} className="space-y-5">
          <Input
            label="Nome da Sala"
            placeholder="Ex: Galera do Game, Resenha, Reunião"
            value={roomName}
            onChange={(e) => {
              setRoomName(e.target.value);
              setCreateError('');
            }}
            error={createError}
            maxLength={50}
            autoFocus
          />
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Criando sala...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Criar Nova Sala
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="space-y-5">
          <Input
            label="Código ou Link da Sala"
            placeholder="Ex: a8F92kL ou cole o link inteiro"
            value={roomCodeOrUrl}
            onChange={(e) => {
              setRoomCodeOrUrl(e.target.value);
              setJoinError('');
            }}
            error={joinError}
            autoFocus
          />
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isJoining}
          >
            {isJoining ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M19 10a.75.75 0 00-.75-.75H8.704l2.47-2.47a.75.75 0 10-1.06-1.06l-3.75 3.75a.75.75 0 000 1.06l3.75 3.75a.75.75 0 101.06-1.06l-2.47-2.47H18.25A.75.75 0 0019 10z"
                    clipRule="evenodd"
                  />
                </svg>
                Entrar na Sala
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

export { RoomActionsCard as CreateRoomForm };
