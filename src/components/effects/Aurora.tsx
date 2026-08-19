'use client';

import { useEffect, useRef } from 'react';

interface AuroraProps {
  colors?: string[];
  speed?: number;
  blur?: number;
  opacity?: number;
  className?: string;
}

export function Aurora({
  colors = ['#7c3aed', '#a855f7', '#6366f1', '#8b5cf6', '#c084fc'],
  speed = 1,
  blur = 80,
  opacity = 0.4,
  className = '',
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const blobs = colors.map((color, i) => ({
      color,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 150 + Math.random() * 200,
      xSpeed: (0.3 + Math.random() * 0.7) * speed * (i % 2 === 0 ? 1 : -1),
      ySpeed: (0.2 + Math.random() * 0.5) * speed * (i % 3 === 0 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      time += 0.003 * speed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      blobs.forEach((blob) => {
        blob.x += Math.sin(time + blob.phase) * blob.xSpeed;
        blob.y += Math.cos(time * 0.7 + blob.phase) * blob.ySpeed;

        // Wrap around edges
        if (blob.x < -blob.radius) blob.x = canvas.width + blob.radius;
        if (blob.x > canvas.width + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = canvas.height + blob.radius;
        if (blob.y > canvas.height + blob.radius) blob.y = -blob.radius;

        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius
        );
        gradient.addColorStop(0, blob.color + 'cc');
        gradient.addColorStop(0.5, blob.color + '44');
        gradient.addColorStop(1, blob.color + '00');

        ctx.globalAlpha = opacity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [colors, speed, blur, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ filter: `blur(${blur}px)` }}
    />
  );
}
