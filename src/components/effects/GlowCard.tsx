'use client';

import { type ReactNode } from 'react';
import './GlowCard.css';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(124, 58, 237, 0.4)',
}: GlowCardProps) {
  return (
    <div
      className={`glow-card ${className}`}
      style={{ '--glow-color': glowColor } as React.CSSProperties}
    >
      <div className="glow-card-border" />
      <div className="glow-card-content">{children}</div>
    </div>
  );
}
