import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'RIVO — Plataforma de Voz e Comunidades em Tempo Real',
  description: 'Conecte-se com sua comunidade em tempo real. Salas de voz ultrarrápidas, vídeo HD e compartilhamento de tela sem barreiras.',
  keywords: ['RIVO', 'voice chat', 'comunidades', 'WebRTC', 'real-time', 'discord alternative', 'audio em tempo real'],
  manifest: '/site.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'RIVO — Plataforma de Comunicação em Tempo Real',
    description: 'Voz de ultra-baixa latência, vídeo em alta definição e compartilhamento de tela em tempo real.',
    siteName: 'RIVO',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RIVO — Voz & Comunidades',
    description: 'Voz e comunicação de alta performance em tempo real.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-grid antialiased">
        {children}
      </body>
    </html>
  );
}
