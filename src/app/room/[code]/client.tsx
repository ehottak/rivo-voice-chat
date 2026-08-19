'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { NicknameModal } from '@/components/ui/NicknameModal';
import { RoomView } from '@/components/room/RoomView';
import type { RoomInfo } from '@/types';

interface RoomPageClientProps {
  roomInfo: RoomInfo;
}

export function RoomPageClient({ roomInfo }: RoomPageClientProps) {
  const [nickname, setNickname] = useState<string | null>(null);
  const [initialDeviceId, setInitialDeviceId] = useState<string | undefined>(undefined);
  const [initialStream, setInitialStream] = useState<MediaStream | undefined>(undefined);
  const router = useRouter();

  const handleNicknameSubmit = useCallback((nick: string, deviceId?: string, stream?: MediaStream) => {
    setNickname(nick);
    setInitialDeviceId(deviceId);
    setInitialStream(stream);
  }, []);

  const handleLeave = useCallback(() => {
    router.push('/');
  }, [router]);

  // Show nickname modal if no nickname set
  if (!nickname) {
    return (
      <NicknameModal
        onSubmit={handleNicknameSubmit}
        roomName={roomInfo.name}
      />
    );
  }

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
