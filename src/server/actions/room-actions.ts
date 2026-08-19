'use server';

import { prisma } from '@/lib/prisma';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createRoom(name: string) {
  if (!name || name.trim().length === 0) {
    return { success: false as const, error: 'Room name is required' };
  }

  if (name.trim().length > 50) {
    return { success: false as const, error: 'Room name too long' };
  }

  try {
    // Generate unique code
    let code = generateRoomCode();
    let existing = await prisma.room.findUnique({ where: { code } });
    while (existing) {
      code = generateRoomCode();
      existing = await prisma.room.findUnique({ where: { code } });
    }

    const room = await prisma.room.create({
      data: {
        code,
        name: name.trim(),
      },
    });

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
    return { success: false as const, error: 'Failed to create room' };
  }
}

export async function getRoomByCode(code: string) {
  try {
    const room = await prisma.room.findUnique({
      where: { code },
    });

    if (!room) {
      return { success: false as const, error: 'Room not found' };
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
    return { success: false as const, error: 'Failed to fetch room' };
  }
}
