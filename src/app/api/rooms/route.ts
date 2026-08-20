import { NextResponse } from 'next/server';
import { roomStore } from '@/server/room-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = body?.name?.trim();

    if (!name || name.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nome da sala é obrigatório' },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Nome da sala muito longo' },
        { status: 400 }
      );
    }

    const room = roomStore.createRoom(name);

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        createdAt: room.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API /api/rooms] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao criar a sala' },
      { status: 500 }
    );
  }
}
