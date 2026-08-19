'use client';

import { type ReactNode, useRef, useEffect, useState } from 'react';

interface GradientTextProps {
  children: ReactNode;
  colors?: string[];
  className?: string;
  animationSpeed?: number;
}

export function GradientText({
  children,
  colors = ['#7c3aed', '#a855f7', '#ec4899', '#6366f1', '#7c3aed'],
  className = '',
  animationSpeed = 6,
}: GradientTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [backgroundSize, setBackgroundSize] = useState('200%');

  useEffect(() => {
    setBackgroundSize(`${colors.length * 100}%`);
  }, [colors]);

  return (
    <span
      ref={textRef}
      className={className}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
        backgroundSize: `${backgroundSize} auto`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: `gradient-text-shift ${animationSpeed}s ease infinite`,
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}
