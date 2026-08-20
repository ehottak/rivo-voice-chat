import { RoomPageClient } from './client';

export const dynamic = 'force-dynamic';

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: RoomPageProps) {
  const { code } = await params;
  return {
    title: `Sala ${code} — RIVO`,
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params;
  return <RoomPageClient code={code} />;
}
