'use client';

import { type ReactNode } from 'react';
import './ShinyText.css';

interface ShinyTextProps {
  children: ReactNode;
  className?: string;
  shimmerWidth?: number;
  speed?: number;
}

export function ShinyText({
  children,
  className = '',
  shimmerWidth = 100,
  speed = 3,
}: ShinyTextProps) {
  return (
    <span
      className={`shiny-text ${className}`}
      style={{
        '--shimmer-width': `${shimmerWidth}px`,
        '--speed': `${speed}s`,
      } as React.CSSProperties}
    >
      {children}
    </span>
  );
}
