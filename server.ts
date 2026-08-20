import 'dotenv/config';
import { createServer } from 'http';
import next from 'next';
import { setupSocketServer } from './src/server/socket/index.js';
import { roomStore } from './src/server/room-store.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Start with clean in-memory state
  roomStore.clearAll();

  const httpServer = createServer(handle);

  // Attach Socket.IO to the HTTP server
  const io = setupSocketServer(httpServer);

  // Periodic cleanup for inactive empty rooms (every 5 minutes)
  const cleanupInterval = setInterval(async () => {
    try {
      const allRooms = roomStore.getAllRooms();
      for (const room of allRooms) {
        const sockets = await io.in(room.code).fetchSockets();
        const ageMs = Date.now() - new Date(room.createdAt).getTime();
        // If room is empty and older than 5 minutes, purge from memory
        if (sockets.length === 0 && ageMs > 5 * 60 * 1000) {
          console.log(`[Auto-Cleanup Periodic] 🧹 Removendo sala inativa da memória: '${room.code}' (${room.name})`);
          roomStore.deleteRoom(room.code);
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
  ║   → 100% In-Memory (Zero Database)        ║
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
