'use client';

import { useEffect, useState, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  parentClassName?: string;
  animateOn?: 'hover' | 'view';
}

export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  animateOn = 'view',
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let iteration = 0;

    const startAnimation = () => {
      iteration = 0;
      clearInterval(interval);

      interval = setInterval(() => {
        setDisplayText(() =>
          text
            .split('')
            .map((char, index) => {
              if (char === ' ') return ' ';
              if (index < iteration / (maxIterations / text.length)) {
                return text[index];
              }
              return characters[Math.floor(Math.random() * characters.length)];
            })
            .join('')
        );

        iteration++;

        if (iteration >= maxIterations * 1.5) {
          setDisplayText(text);
          clearInterval(interval);
        }
      }, speed);
    };

    if (animateOn === 'view' && !hasAnimated) {
      startAnimation();
      setHasAnimated(true);
    } else if (animateOn === 'hover' && isHovering) {
      startAnimation();
    }

    return () => clearInterval(interval);
  }, [text, speed, maxIterations, characters, animateOn, isHovering, hasAnimated]);

  return (
    <span
      ref={containerRef}
      className={`inline-block ${parentClassName}`}
      onMouseEnter={() => animateOn === 'hover' && setIsHovering(true)}
      onMouseLeave={() => animateOn === 'hover' && setIsHovering(false)}
    >
      <span className={className}>{displayText}</span>
    </span>
  );
}
