'use client';

interface RivoLogoProps {
  size?: number | string;
  className?: string;
}

export function RivoLogo({ size = 56, className = '' }: RivoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="rivo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <filter id="rivo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="16" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Rounded Box Background */}
      <rect width="512" height="512" rx="128" fill="#0c0c16" />
      <rect
        x="8"
        y="8"
        width="496"
        height="496"
        rx="120"
        stroke="url(#rivo-grad)"
        strokeWidth="6"
        opacity="0.6"
      />

      {/* Stylized Modern 'R' + Wave Logo */}
      <g filter="url(#rivo-glow)">
        <path
          d="M160 128h112c44.183 0 80 35.817 80 80s-35.817 80-80 80H160V128z"
          fill="url(#rivo-grad)"
        />
        <path d="M160 288v96h64v-96h-64z" fill="url(#rivo-grad)" />
        <path
          d="M260 288l88 96h80l-96-104c24-12 40-36 40-68 0-44.183-35.817-80-80-80H160v64h112c17.673 0 32 14.327 32 32s-14.327 32-32 32H224v24z"
          fill="#ffffff"
        />
      </g>
    </svg>
  );
}
