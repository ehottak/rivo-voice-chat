import { getRoomByCode } from '@/server/actions/room-actions';
import { RoomPageClient } from './client';

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: RoomPageProps) {
  const { code } = await params;
  const result = await getRoomByCode(code);

  return {
    title: result.success
      ? `${result.room.name} — RIVO`
      : 'Sala Não Encontrada — RIVO',
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params;
  const result = await getRoomByCode(code);

  if (!result.success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-10 h-10 text-red-400"
            >
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Sala Não Encontrada</h1>
          <p className="text-white/50 mb-6">
            A sala que você está procurando não existe ou foi finalizada.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-500 hover:to-purple-500 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
                clipRule="evenodd"
              />
            </svg>
            Voltar ao Início
          </a>
        </div>
      </main>
    );
  }

  return <RoomPageClient roomInfo={result.room} />;
}
