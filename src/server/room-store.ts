/**
 * In-Memory Room Store for RIVO
 * 100% Zero-Database. Rooms live in memory and auto-purge when empty.
 */

export interface InMemoryRoom {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Global cross-module Map attached to Node.js global root
const globalRoot = (typeof globalThis !== 'undefined'
  ? globalThis
  : typeof global !== 'undefined'
  ? global
  : window) as unknown as {
  __RIVO_ROOMS_MAP__?: Map<string, InMemoryRoom>;
};

if (!globalRoot.__RIVO_ROOMS_MAP__) {
  globalRoot.__RIVO_ROOMS_MAP__ = new Map<string, InMemoryRoom>();
}

const roomsMap: Map<string, InMemoryRoom> = globalRoot.__RIVO_ROOMS_MAP__;

class RoomStore {
  createRoom(name: string): InMemoryRoom {
    let code = generateRoomCode();
    while (roomsMap.has(code)) {
      code = generateRoomCode();
    }

    const room: InMemoryRoom = {
      id: `room_${code}_${Date.now()}`,
      code,
      name: name.trim() || 'Sala de Voz',
      createdAt: new Date(),
    };

    roomsMap.set(code, room);
    console.log(`[RoomStore] 🏠 Sala criada: '${code}' (${room.name}) | Total: ${roomsMap.size}`);
    return room;
  }

  createRoomWithCode(code: string, name = 'Sala de Voz'): InMemoryRoom {
    const existing = roomsMap.get(code);
    if (existing) return existing;

    const room: InMemoryRoom = {
      id: `room_${code}_${Date.now()}`,
      code,
      name: name.trim() || 'Sala de Voz',
      createdAt: new Date(),
    };

    roomsMap.set(code, room);
    console.log(`[RoomStore] 🏠 Sala registrada por código: '${code}' (${room.name}) | Total: ${roomsMap.size}`);
    return room;
  }

  getRoom(code: string): InMemoryRoom | null {
    return roomsMap.get(code) || null;
  }

  deleteRoom(code: string): boolean {
    const existed = roomsMap.delete(code);
    if (existed) {
      console.log(`[RoomStore] 🧹 Sala '${code}' apagada da memória | Total: ${roomsMap.size}`);
    }
    return existed;
  }

  getAllRooms(): InMemoryRoom[] {
    return Array.from(roomsMap.values());
  }

  clearAll(): void {
    roomsMap.clear();
    console.log('[RoomStore] 🧹 Todas as salas foram limpas.');
  }
}

export const roomStore = new RoomStore();
