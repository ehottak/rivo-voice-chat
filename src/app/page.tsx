'use client';

import { CreateRoomForm } from '@/components/home/CreateRoomForm';
import { Aurora } from '@/components/effects/Aurora';
import { FloatingParticles } from '@/components/effects/FloatingParticles';
import { SpotlightCard } from '@/components/effects/SpotlightCard';
import { GradientText } from '@/components/effects/GradientText';
import { ShinyText } from '@/components/effects/ShinyText';
import { DecryptedText } from '@/components/effects/DecryptedText';
import { RivoLogo } from '@/components/ui/RivoLogo';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#080810]">
      {/* Layer 1: Aurora ambient lighting */}
      <Aurora
        colors={['#4f46e5', '#7c3aed', '#9333ea', '#6366f1', '#a855f7']}
        speed={0.5}
        blur={110}
        opacity={0.3}
      />

      {/* Layer 2: Interactive floating particles with mouse attraction */}
      <FloatingParticles count={40} />

      {/* Layer 3: Cyber grid */}
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-40" />

      {/* Layer 4: Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(8, 8, 16, 0.85) 100%)',
        }}
      />

      {/* Main Content */}
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center mb-8">
          {/* Animated Logo */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 rounded-3xl bg-violet-500/30 blur-2xl animate-pulse-slow" />
            <div className="relative inline-block animate-float drop-shadow-[0_0_25px_rgba(124,58,237,0.5)]">
              <RivoLogo size={84} />
            </div>
          </div>

          {/* RIVO Title with Animated Gradient & Decrypted Text on hover */}
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-3">
            <GradientText
              colors={['#ffffff', '#c084fc', '#a855f7', '#818cf8', '#ffffff']}
              animationSpeed={5}
              className="font-black tracking-wider"
            >
              RIVO
            </GradientText>
          </h1>

          {/* Subtitle / Positioning Statement */}
          <div className="space-y-1">
            <p className="text-sm sm:text-base font-semibold text-white/90">
              <DecryptedText
                text="Comunicação e voz em tempo real."
                speed={35}
                maxIterations={8}
                animateOn="view"
                className="text-white/90 font-medium"
              />
            </p>
            <ShinyText shimmerWidth={140} speed={4} className="text-xs sm:text-sm text-white/50 block font-normal max-w-xs mx-auto leading-relaxed">
              Crie uma sala, compartilhe o link e conecte-se com sua comunidade instantaneamente.
            </ShinyText>
          </div>
        </div>

        {/* Room Action Spotlight Card (ReactBits Inspired) */}
        <SpotlightCard
          spotlightColor="rgba(124, 58, 237, 0.22)"
          className="shadow-2xl shadow-violet-950/60 animate-glow-pulse"
        >
          <div className="p-6 sm:p-8">
            <CreateRoomForm />
          </div>
        </SpotlightCard>

        {/* Feature Badges */}
        <div className="mt-7 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Voz P2P Baixa Latência
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
              </span>
              HD 60 FPS &amp; Áudio
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              Sem Cadastro
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <p className="text-center text-[11px] text-white/20 mt-6 tracking-[0.2em] uppercase font-semibold">
          RIVO • Real-Time Voice Platform
        </p>
      </div>
    </main>
  );
}
