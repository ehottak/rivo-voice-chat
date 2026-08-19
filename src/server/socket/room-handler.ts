import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ParticipantInfo,
} from '../../types/socket-events';
import { prisma } from '../../lib/prisma';

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

      // Verify room exists in database
      const room = await prisma.room.findUnique({
        where: { code: data.roomCode },
      });

      if (!room) {
        console.warn(`[Socket ${socket.id}] ❌ Room '${data.roomCode}' not found in database`);
        callback({ success: false, error: 'Sala não encontrada ou já expirou' });
        return;
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

      console.log(`[Socket ${socket.id}] ✅ Joined room '${data.roomCode}' as '${data.nickname}' (RAM only, 0 DB writes). Online: ${participants.length + 1}`);

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
      console.log(`[Auto-Cleanup] 🧹 Sala '${roomCode}' ficou vazia (0 pessoas). Deletando do banco...`);

      // Delete room and any residual records from the database immediately
      try {
        const room = await prisma.room.findUnique({
          where: { code: roomCode },
        });

        if (room) {
          await prisma.roomParticipant.deleteMany({
            where: { roomId: room.id },
          });
          await prisma.room.delete({
            where: { id: room.id },
          });
          console.log(`[Auto-Cleanup] ✅ Sala '${roomCode}' deletada com sucesso do banco de dados.`);
        }
      } catch (dbErr) {
        console.warn(`[Auto-Cleanup] Aviso ao deletar sala vazia '${roomCode}':`, dbErr);
      }
    } else {
      console.log(`[Room '${roomCode}'] Restam ${remainingSockets.length} participante(s) online.`);
    }
  } catch (error) {
    console.error('[room:leave] Error:', error);
  }
}
