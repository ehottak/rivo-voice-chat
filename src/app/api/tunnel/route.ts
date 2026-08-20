import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tunnelFilePath = path.join(process.cwd(), '.tunnel-info.json');

    if (fs.existsSync(tunnelFilePath)) {
      const content = fs.readFileSync(tunnelFilePath, 'utf-8');
      const data = JSON.parse(content);
      if (data?.url) {
        return NextResponse.json({
          success: true,
          url: data.url,
          status: 'online',
        });
      }
    }

    return NextResponse.json({
      success: false,
      url: null,
      status: 'starting',
    });
  } catch (error) {
    console.error('[API /api/tunnel] Error:', error);
    return NextResponse.json({
      success: false,
      url: null,
      error: 'Falha ao obter URL do túnel',
    });
  }
}
