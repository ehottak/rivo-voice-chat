import 'dotenv/config';
import { createServer } from 'http';
import next from 'next';
import { setupSocketServer } from './src/server/socket/index.js';
import { prisma } from './src/lib/prisma.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Initial Cleanup: Clean any orphan records from previous runs
  try {
    const deletedParticipants = await prisma.roomParticipant.deleteMany();
    const deletedUsers = await prisma.user.deleteMany();
    const deletedRooms = await prisma.room.deleteMany();
    console.log(`[Database Cleanup] 🧹 Banco limpo na inicialização: ${deletedRooms.count} salas, ${deletedUsers.count} usuários e ${deletedParticipants.count} participantes residuais removidos.`);
  } catch (err) {
    console.warn('[Database Cleanup] Aviso ao limpar banco na inicialização:', err);
  }

  const httpServer = createServer(handle);

  // Attach Socket.IO to the HTTP server
  const io = setupSocketServer(httpServer);

  // Periodic cleanup for inactive empty rooms (every 5 minutes)
  const cleanupInterval = setInterval(async () => {
    try {
      const allRooms = await prisma.room.findMany();
      for (const room of allRooms) {
        const sockets = await io.in(room.code).fetchSockets();
        // If room is empty and older than 3 minutes, purge it
        const ageMs = Date.now() - new Date(room.createdAt).getTime();
        if (sockets.length === 0 && ageMs > 3 * 60 * 1000) {
          console.log(`[Auto-Cleanup Periodic] 🧹 Deletando sala vazia inativa: '${room.code}' (${room.name})`);
          await prisma.roomParticipant.deleteMany({ where: { roomId: room.id } });
          await prisma.room.delete({ where: { id: room.id } });
        }
      }
    } catch (e) {
      console.warn('[Auto-Cleanup Periodic] Erro na rotina periódica:', e);
    }
  }, 5 * 60 * 1000);

  httpServer.listen(port, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🎙️  RIVO                                ║
  ║   → http://${hostname}:${port}                  ║
  ║   → Socket.IO attached                    ║
  ║   → Zero-DB-Pollute & Auto-Cleanup ON     ║
  ║   → Mode: ${dev ? 'development' : 'production '}                  ║
  ╚═══════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[Server] Shutting down...');
    clearInterval(cleanupInterval);
    io.close();
    httpServer.close(() => {
      console.log('[Server] Closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});
