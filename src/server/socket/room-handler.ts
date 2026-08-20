import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ParticipantInfo,
  ChatMessage,
} from '../../types/socket-events';
import { roomStore } from '../room-store';

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('room:join', async (data, callback) => {
    console.log(`[Socket ${socket.id}] 📥 Event 'room:join' received for roomCode '${data?.roomCode}', nickname '${data?.nickname}'`);
    try {
      if (!data?.roomCode || !data?.nickname) {
        console.warn(`[Socket ${socket.id}] ⚠️ Invalid room:join payload`);
        callback({ success: false, error: 'Dados da sala/nickname inválidos' });
        return;
      }

      // Get or auto-register room in in-memory roomStore (Zero DB & Resilient)
      let room = roomStore.getRoom(data.roomCode);
      if (!room) {
        room = roomStore.createRoomWithCode(data.roomCode, 'Sala de Voz');
      }

      // Ephemeral User ID based on socket ID (Zero DB Pollution!)
      const ephemeralUserId = `usr_${socket.id}`;

      // Store in memory directly on the socket instance
      socket.data.userId = ephemeralUserId;
      socket.data.nickname = data.nickname;
      socket.data.roomCode = data.roomCode;
      socket.data.isMuted = false;

      // Join Socket.IO room channel in RAM
      await socket.join(data.roomCode);

      // Get current active participants in the room directly from memory
      const roomSockets = await io.in(data.roomCode).fetchSockets();
      const participants: ParticipantInfo[] = roomSockets
        .filter((s) => s.id !== socket.id)
        .map((s) => ({
          id: s.id,
          peerId: s.id,
          userId: s.data.userId || s.id,
          nickname: s.data.nickname || 'Anônimo',
          isMuted: s.data.isMuted ?? false,
        }));

      // Notify existing participants about the new member
      const newParticipant: ParticipantInfo = {
        id: socket.id,
        peerId: socket.id,
        userId: ephemeralUserId,
        nickname: data.nickname,
        isMuted: false,
      };
      socket.to(data.roomCode).emit('participant:joined', newParticipant);

      console.log(`[Socket ${socket.id}] ✅ Joined room '${data.roomCode}' as '${data.nickname}' (In-Memory). Online: ${participants.length + 1}`);

      callback({
        success: true,
        participants,
        userId: ephemeralUserId,
      });
    } catch (error) {
      console.error(`[Socket ${socket.id}] ❌ Error during room:join:`, error);
      callback({ success: false, error: 'Erro interno ao entrar na sala' });
    }
  });

  // Real-Time In-Memory Ephemeral Chat
  socket.on('chat:send', (data) => {
    const text = data?.text?.trim();
    const roomCode = socket.data.roomCode;
    const nickname = socket.data.nickname || 'Anônimo';

    if (!text || !roomCode || text.length > 2000) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      peerId: socket.id,
      nickname,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    console.log(`[Chat ${roomCode}] 💬 ${nickname}: ${text.slice(0, 30)}`);
    io.in(roomCode).emit('chat:message', message);
  });

  socket.on('room:leave', async () => {
    await handleLeaveRoom(io, socket);
  });

  socket.on('disconnect', async () => {
    await handleLeaveRoom(io, socket);
  });
}

async function handleLeaveRoom(io: TypedServer, socket: TypedSocket): Promise<void> {
  const roomCode = socket.data.roomCode;
  const nickname = socket.data.nickname;
  if (!roomCode) return;

  try {
    // 1. Notify remaining participants in the room
    socket.to(roomCode).emit('participant:left', { peerId: socket.id });

    // 2. Leave the Socket.IO room in memory
    await socket.leave(roomCode);

    // 3. Clear socket data
    socket.data.roomCode = '';
    socket.data.userId = '';
    socket.data.nickname = '';

    console.log(`[Socket ${socket.id}] 👋 '${nickname || 'Participante'}' saiu da sala '${roomCode}'`);

    // 4. Check if the room is now completely empty
    const remainingSockets = await io.in(roomCode).fetchSockets();

    if (remainingSockets.length === 0) {
      console.log(`[Auto-Cleanup] 🧹 Sala '${roomCode}' ficou vazia (0 pessoas). Removendo da memória...`);
      roomStore.deleteRoom(roomCode);
    } else {
      console.log(`[Room '${roomCode}'] Restam ${remainingSockets.length} participante(s) online.`);
    }
  } catch (error) {
    console.error('[room:leave] Error:', error);
  }
}
