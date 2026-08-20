'use server';

import { roomStore } from '@/server/room-store';

export async function createRoom(name: string) {
  if (!name || name.trim().length === 0) {
    return { success: false as const, error: 'Nome da sala é obrigatório' };
  }

  if (name.trim().length > 50) {
    return { success: false as const, error: 'Nome da sala muito longo' };
  }

  try {
    const room = roomStore.createRoom(name);

    return {
      success: true as const,
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        createdAt: room.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('[createRoom] Error:', error);
    return { success: false as const, error: 'Falha ao criar sala em memória' };
  }
}

export async function getRoomByCode(code: string) {
  try {
    const room = roomStore.getRoom(code);

    if (!room) {
      return { success: false as const, error: 'Sala não encontrada' };
    }

    return {
      success: true as const,
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        createdAt: room.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('[getRoomByCode] Error:', error);
    return { success: false as const, error: 'Falha ao buscar sala' };
  }
}
