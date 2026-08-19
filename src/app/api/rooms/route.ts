import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

    let code = generateRoomCode();
    let existing = await prisma.room.findUnique({ where: { code } });
    while (existing) {
      code = generateRoomCode();
      existing = await prisma.room.findUnique({ where: { code } });
    }

    const room = await prisma.room.create({
      data: {
        code,
        name,
      },
    });

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
      { success: false, error: 'Falha ao criar a sala no banco' },
      { status: 500 }
    );
  }
}
