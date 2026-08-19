'use client';

import { useEffect, useCallback } from 'react';
import type { Participant } from '@/types';
import type { TypedSocket } from '@/lib/socket';

interface UseParticipantsProps {
  socket: TypedSocket | null;
  isConnected: boolean;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
}

interface UseParticipantsReturn {
  updateSpeakingState: (peerId: string, isSpeaking: boolean) => void;
}

export function useParticipants({
  socket,
  isConnected,
  participants,
  setParticipants,
}: UseParticipantsProps): UseParticipantsReturn {
  const updateSpeakingState = useCallback(
    (peerId: string, isSpeaking: boolean) => {
      setParticipants((prev) =>
        prev.map((p) => (p.peerId === peerId ? { ...p, isSpeaking } : p))
      );
    },
    [setParticipants]
  );

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleParticipantJoined = (data: {
      id: string;
      peerId: string;
      userId: string;
      nickname: string;
      isMuted: boolean;
    }) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.peerId === data.peerId)) return prev;
        return [
          ...prev,
          {
            id: data.id,
            peerId: data.peerId,
            userId: data.userId,
            nickname: data.nickname,
            isMuted: data.isMuted,
            isSpeaking: false,
          },
        ];
      });
    };

    const handleParticipantLeft = (data: { peerId: string }) => {
      setParticipants((prev) =>
        prev.filter((p) => p.peerId !== data.peerId)
      );
    };

    const handleParticipantMuted = (data: { peerId: string }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.peerId === data.peerId ? { ...p, isMuted: true, isSpeaking: false } : p
        )
      );
    };

    const handleParticipantUnmuted = (data: { peerId: string }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.peerId === data.peerId ? { ...p, isMuted: false } : p
        )
      );
    };

    const handleParticipantSpeaking = (data: { peerId: string; isSpeaking: boolean }) => {
      updateSpeakingState(data.peerId, data.isSpeaking);
    };

    socket.on('participant:joined', handleParticipantJoined);
    socket.on('participant:left', handleParticipantLeft);
    socket.on('participant:muted', handleParticipantMuted);
    socket.on('participant:unmuted', handleParticipantUnmuted);
    socket.on('participant:speaking', handleParticipantSpeaking);

    return () => {
      socket.off('participant:joined', handleParticipantJoined);
      socket.off('participant:left', handleParticipantLeft);
      socket.off('participant:muted', handleParticipantMuted);
      socket.off('participant:unmuted', handleParticipantUnmuted);
      socket.off('participant:speaking', handleParticipantSpeaking);
    };
  }, [socket, isConnected, setParticipants, updateSpeakingState]);

  void participants;

  return { updateSpeakingState };
}
