'use client';

import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io({
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['polling', 'websocket'],
      timeout: 10000,
      extraHeaders: {
        'bypass-tunnel-reminder': 'true',
        'Bypass-Tunnel-Reminder': 'true',
        'ngrok-skip-browser-warning': 'true',
        'localtunnel-skip-browser-warning': 'true',
      },
    });

    socket.on('connect', () => {
      console.log(`[Socket] ✅ Connected: ${socket?.id}`);
    });
    socket.on('connect_error', (err) => {
      console.warn(`[Socket] ⚠️ Connection error:`, err.message);
    });
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
