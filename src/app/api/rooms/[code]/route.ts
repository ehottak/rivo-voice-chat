import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código da sala não fornecido' },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { code },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

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
    console.error('[API /api/rooms/[code]] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar sala' },
      { status: 500 }
    );
  }
}
