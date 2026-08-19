'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket, disconnectSocket, type TypedSocket } from '@/lib/socket';

interface UseSocketReturn {
  socket: TypedSocket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<TypedSocket | null>(null);

  const connect = useCallback(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
    };

    const onDisconnect = (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // If already connected
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
  };
}
