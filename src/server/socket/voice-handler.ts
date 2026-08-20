import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../../types/socket-events';

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

export function registerVoiceHandlers(io: TypedServer, socket: TypedSocket): void {
  // Relay WebRTC offer to specific peer
  socket.on('voice:offer', (data) => {
    console.log(`[WebRTC Signaling] 📡 Relaying offer from ${socket.id} to ${data.to}`);
    io.to(data.to).emit('voice:offer', {
      ...data,
      from: socket.id,
    });
  });

  // Relay WebRTC answer to specific peer
  socket.on('voice:answer', (data) => {
    console.log(`[WebRTC Signaling] 📡 Relaying answer from ${socket.id} to ${data.to}`);
    io.to(data.to).emit('voice:answer', {
      ...data,
      from: socket.id,
    });
  });

  // Relay ICE candidate to specific peer
  socket.on('voice:ice-candidate', (data) => {
    io.to(data.to).emit('voice:ice-candidate', {
      ...data,
      from: socket.id,
    });
  });

  // Relay WebRTC Reconnect Request
  socket.on('voice:reconnect-request', (data) => {
    console.log(`[WebRTC Signaling] 🔄 Relaying reconnect request from ${socket.id} to ${data.to}`);
    io.to(data.to).emit('voice:reconnect-request', {
      from: socket.id,
      to: data.to,
    });
  });

  // Broadcast mute/unmute state
  socket.on('participant:muted', () => {
    socket.data.isMuted = true;
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('participant:muted', { peerId: socket.id });
    } else {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit('participant:muted', { peerId: socket.id });
      });
    }
  });

  socket.on('participant:unmuted', () => {
    socket.data.isMuted = false;
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('participant:unmuted', { peerId: socket.id });
    } else {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit('participant:unmuted', { peerId: socket.id });
      });
    }
  });

  // Broadcast deafen/undeafen state
  socket.on('participant:deafened', () => {
    socket.data.isDeafened = true;
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('participant:deafened', { peerId: socket.id });
    } else {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit('participant:deafened', { peerId: socket.id });
      });
    }
  });

  socket.on('participant:undeafened', () => {
    socket.data.isDeafened = false;
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('participant:undeafened', { peerId: socket.id });
    } else {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit('participant:undeafened', { peerId: socket.id });
      });
    }
  });

  // Broadcast speaking state
  socket.on('participant:speaking', (data) => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('participant:speaking', {
        peerId: socket.id,
        isSpeaking: data.isSpeaking,
      });
    } else {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.to(room).emit('participant:speaking', {
            peerId: socket.id,
            isSpeaking: data.isSpeaking,
          });
        }
      });
    }
  });

  // Screen sharing events
  socket.on('screen:start', () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      console.log(`[Screen Share] 🖥️ Peer ${socket.id} started screen sharing in room ${roomCode}`);
      socket.to(roomCode).emit('screen:start', { peerId: socket.id });
    }
  });

  socket.on('screen:stop', () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      console.log(`[Screen Share] ⏹️ Peer ${socket.id} stopped screen sharing in room ${roomCode}`);
      socket.to(roomCode).emit('screen:stop', { peerId: socket.id });
    }
  });

  // Camera events
  socket.on('camera:start', () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      console.log(`[Camera] 📹 Peer ${socket.id} started camera in room ${roomCode}`);
      socket.to(roomCode).emit('camera:start', { peerId: socket.id });
    }
  });

  socket.on('camera:stop', () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      console.log(`[Camera] ⏹️ Peer ${socket.id} stopped camera in room ${roomCode}`);
      socket.to(roomCode).emit('camera:stop', { peerId: socket.id });
    }
  });
}
