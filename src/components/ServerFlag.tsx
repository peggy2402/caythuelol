'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ServerFlagProps {
  code?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-6 h-4 rounded-[3px]',
  md: 'w-8 h-[22px] rounded-[4px]',
  lg: 'w-9 h-6 rounded-[5px]',
};

// Tính toán tọa độ ngôi sao 5 cánh chuẩn
function starPoints(cx: number, cy: number, outerR: number, innerR: number, rotateDeg = -90): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = ((i * 36 + rotateDeg) * Math.PI) / 180;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

export default function ServerFlag({ code, className, size = 'md' }: ServerFlagProps) {
  const upper = (code || '').trim().toUpperCase();
  const baseClass = cn(
    'inline-block shrink-0 overflow-hidden shadow-sm ring-1 ring-white/15 select-none',
    SIZE_CLASSES[size],
    className
  );

  switch (upper) {
    case 'VN':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Vietnam">
          <rect width="36" height="24" fill="#DA251D" />
          <polygon points={starPoints(18, 12, 6.2, 2.4)} fill="#FFCD00" />
        </svg>
      );

    case 'SEA':
      return (
        <svg viewBox="0 0 36 24" className={cn('inline-block shrink-0 select-none', size === 'sm' ? 'w-6 h-4' : size === 'lg' ? 'w-9 h-6' : 'w-8 h-[22px]', className)} aria-label="Southeast Asia">
          <defs>
            <radialGradient id="sea-globe-grad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="55%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="12" r="10.5" fill="url(#sea-globe-grad)" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
          {/* Continents */}
          <path d="M12.5 5.5 C15 4.2 19.5 4.5 22 6.8 C23.5 8.2 22.8 10.6 20.8 11.4 C19.4 11.9 18.8 10.4 17.5 10.8 C16.3 11.2 15.8 13 14.3 12.6 C12.4 12.1 11.2 9.2 12.5 5.5 Z" fill="#4ADE80" />
          <path d="M20.2 13.6 C22.4 12.8 25.3 14 25.8 16.2 C26.2 17.9 24.4 19.8 22.2 19.6 C20.4 19.4 19.4 17.5 19.8 15.8 C20 14.8 19.6 13.9 20.2 13.6 Z" fill="#22C55E" />
          <path d="M11.2 13.5 C13 13.8 14.6 15.4 14.3 17.6 C14.1 19 12.5 19.7 11.3 18.8 C9.8 17.6 9.6 14.8 11.2 13.5 Z" fill="#22C55E" />
          <ellipse cx="14.5" cy="7.5" rx="3.2" ry="1.6" fill="rgba(255,255,255,0.2)" transform="rotate(-22 14.5 7.5)" />
        </svg>
      );

    case 'NA':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="North America">
          <rect width="36" height="24" fill="#FFFFFF" />
          <rect y="0" width="36" height="1.85" fill="#B22234" />
          <rect y="3.69" width="36" height="1.85" fill="#B22234" />
          <rect y="7.38" width="36" height="1.85" fill="#B22234" />
          <rect y="11.08" width="36" height="1.85" fill="#B22234" />
          <rect y="14.77" width="36" height="1.85" fill="#B22234" />
          <rect y="18.46" width="36" height="1.85" fill="#B22234" />
          <rect y="22.15" width="36" height="1.85" fill="#B22234" />
          <rect width="15.5" height="12.93" fill="#3C3B6E" />
          {[2.2, 5.4, 8.6, 11.8].map((x) =>
            [2.2, 5.4, 8.6, 11.1].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="0.6" fill="#FFFFFF" />
            ))
          )}
          {[3.8, 7.0, 10.2, 13.4].map((x) =>
            [3.8, 7.0, 9.8].map((y) => (
              <circle key={`b-${x}-${y}`} cx={x} cy={y} r="0.6" fill="#FFFFFF" />
            ))
          )}
        </svg>
      );

    case 'EUW':
    case 'EUNE':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Europe">
          <rect width="36" height="24" fill="#003399" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const cx = 18 + 7.2 * Math.cos(angle);
            const cy = 12 + 7.2 * Math.sin(angle);
            return <polygon key={i} points={starPoints(cx, cy, 1.35, 0.55)} fill="#FFCC00" />;
          })}
        </svg>
      );

    case 'KR':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Korea">
          <rect width="36" height="24" fill="#FFFFFF" />
          {/* Taegeuk */}
          <circle cx="18" cy="12" r="5.4" fill="#CD2E3A" />
          <path d="M12.6 12 A5.4 5.4 0 0 0 23.4 12 A2.7 2.7 0 0 1 18 12 A2.7 2.7 0 0 0 12.6 12 Z" fill="#0047A0" />
          <circle cx="15.3" cy="12" r="2.7" fill="#CD2E3A" />
          <circle cx="20.7" cy="12" r="2.7" fill="#0047A0" />
          {/* 4 corner trigrams */}
          <g stroke="#111827" strokeWidth="1.05" strokeLinecap="butt">
            {/* Top-left (Geon) */}
            <g transform="translate(8.5 6.2) rotate(-34)">
              <line x1="-2.8" y1="-1.5" x2="2.8" y2="-1.5" />
              <line x1="-2.8" y1="0" x2="2.8" y2="0" />
              <line x1="-2.8" y1="1.5" x2="2.8" y2="1.5" />
            </g>
            {/* Top-right (Gam) */}
            <g transform="translate(27.5 6.2) rotate(34)">
              <line x1="-2.8" y1="-1.5" x2="-0.4" y2="-1.5" />
              <line x1="0.4" y1="-1.5" x2="2.8" y2="-1.5" />
              <line x1="-2.8" y1="0" x2="2.8" y2="0" />
              <line x1="-2.8" y1="1.5" x2="-0.4" y2="1.5" />
              <line x1="0.4" y1="1.5" x2="2.8" y2="1.5" />
            </g>
            {/* Bottom-left (Ri) */}
            <g transform="translate(8.5 17.8) rotate(34)">
              <line x1="-2.8" y1="-1.5" x2="2.8" y2="-1.5" />
              <line x1="-2.8" y1="0" x2="-0.4" y2="0" />
              <line x1="0.4" y1="0" x2="2.8" y2="0" />
              <line x1="-2.8" y1="1.5" x2="2.8" y2="1.5" />
            </g>
            {/* Bottom-right (Gon) */}
            <g transform="translate(27.5 17.8) rotate(-34)">
              <line x1="-2.8" y1="-1.5" x2="-0.4" y2="-1.5" />
              <line x1="0.4" y1="-1.5" x2="2.8" y2="-1.5" />
              <line x1="-2.8" y1="0" x2="-0.4" y2="0" />
              <line x1="0.4" y1="0" x2="2.8" y2="0" />
              <line x1="-2.8" y1="1.5" x2="-0.4" y2="1.5" />
              <line x1="0.4" y1="1.5" x2="2.8" y2="1.5" />
            </g>
          </g>
        </svg>
      );

    case 'JP':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Japan">
          <rect width="36" height="24" fill="#FFFFFF" />
          <circle cx="18" cy="12" r="6.3" fill="#BC002D" />
        </svg>
      );

    case 'TW':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Taiwan">
          <rect width="36" height="24" fill="#FE0000" />
          <rect width="18" height="12" fill="#000095" />
          {/* 12-rayed white sun */}
          <g transform="translate(9 6)">
            {Array.from({ length: 12 }).map((_, i) => (
              <polygon
                key={i}
                points="0,-4.4 0.75,-2.1 -0.75,-2.1"
                fill="#FFFFFF"
                transform={`rotate(${i * 30})`}
              />
            ))}
            <circle r="2.1" fill="#000095" />
            <circle r="1.7" fill="#FFFFFF" />
          </g>
        </svg>
      );

    case 'OCE':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Oceania">
          <rect width="36" height="24" fill="#012169" />
          {/* Union Jack canton */}
          <clipPath id="oce-canton">
            <rect width="18" height="12" />
          </clipPath>
          <g clipPath="url(#oce-canton)">
            <path d="M0 0 L18 12 M18 0 L0 12" stroke="#FFFFFF" strokeWidth="2.4" />
            <path d="M0 0 L18 12 M18 0 L0 12" stroke="#C8102E" strokeWidth="1" />
            <path d="M9 0 V12 M0 6 H18" stroke="#FFFFFF" strokeWidth="3.6" />
            <path d="M9 0 V12 M0 6 H18" stroke="#C8102E" strokeWidth="2" />
          </g>
          {/* Commonwealth & Southern Cross stars */}
          <polygon points={starPoints(9, 17.5, 2.3, 1.0)} fill="#FFFFFF" />
          <polygon points={starPoints(27, 5.5, 1.35, 0.55)} fill="#FFFFFF" />
          <polygon points={starPoints(24, 11, 1.35, 0.55)} fill="#FFFFFF" />
          <polygon points={starPoints(30.5, 9.8, 1.35, 0.55)} fill="#FFFFFF" />
          <polygon points={starPoints(27, 18.5, 1.5, 0.6)} fill="#FFFFFF" />
          <circle cx="28.6" cy="14" r="0.7" fill="#FFFFFF" />
        </svg>
      );

    case 'BR':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Brazil">
          <rect width="36" height="24" fill="#009B3A" />
          <polygon points="18,2.8 32.5,12 18,21.2 3.5,12" fill="#FFDF00" />
          <circle cx="18" cy="12" r="5.2" fill="#002776" />
          <path d="M13.1 10.7 Q18.2 9.4 22.9 13.1" fill="none" stroke="#FFFFFF" strokeWidth="1.25" />
        </svg>
      );

    case 'LAN':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Latin America North">
          <rect width="12" height="24" fill="#006847" />
          <rect x="12" width="12" height="24" fill="#FFFFFF" />
          <rect x="24" width="12" height="24" fill="#CE1126" />
          {/* Simplified Coat of Arms */}
          <circle cx="18" cy="12" r="2.8" fill="#8B5A2B" />
          <path d="M15.3 13.6 Q18 16 20.7 13.6" fill="none" stroke="#006847" strokeWidth="1.1" />
        </svg>
      );

    case 'LAS':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Latin America South">
          <rect width="36" height="12" fill="#FFFFFF" />
          <rect y="12" width="36" height="12" fill="#D52B1E" />
          <rect width="12" height="12" fill="#0039A6" />
          <polygon points={starPoints(6, 6, 3.2, 1.25)} fill="#FFFFFF" />
        </svg>
      );

    case 'TR':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Türkiye">
          <rect width="36" height="24" fill="#E30A17" />
          <circle cx="14.2" cy="12" r="5.6" fill="#FFFFFF" />
          <circle cx="15.7" cy="12" r="4.5" fill="#E30A17" />
          <polygon points={starPoints(22.2, 12, 2.7, 1.05, -18)} fill="#FFFFFF" />
        </svg>
      );

    case 'RU':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Russia">
          <rect width="36" height="8" fill="#FFFFFF" />
          <rect y="8" width="36" height="8" fill="#0039A6" />
          <rect y="16" width="36" height="8" fill="#D52B1E" />
        </svg>
      );

    case 'ME':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Middle East">
          <rect x="9" y="0" width="27" height="8" fill="#00732F" />
          <rect x="9" y="8" width="27" height="8" fill="#FFFFFF" />
          <rect x="9" y="16" width="27" height="8" fill="#111111" />
          <rect width="9" height="24" fill="#FF0000" />
        </svg>
      );

    case 'PBE':
      return (
        <svg viewBox="0 0 36 24" className={baseClass} aria-label="Public Beta Environment">
          <defs>
            <linearGradient id="pbe-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4C1D95" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>
          </defs>
          <rect width="36" height="24" fill="url(#pbe-bg)" />
          <path d="M15.5 5 H20.5 M16.5 5 V9.5 L12.8 16.5 C12.2 17.6 13 19 14.3 19 H21.7 C23 19 23.8 17.6 23.2 16.5 L19.5 9.5 V5" fill="none" stroke="#E9D5FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.3 15.2 H21.7 L22.6 16.9 C22.9 17.5 22.4 18.2 21.7 18.2 H14.3 C13.6 18.2 13.1 17.5 13.4 16.9 Z" fill="#34D399" />
          <circle cx="17.2" cy="13.2" r="0.9" fill="#6EE7B7" />
          <circle cx="19.4" cy="11.8" r="0.7" fill="#A7F3D0" />
        </svg>
      );

    default:
      return (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-[4px] bg-zinc-800 border border-white/10 text-[10px] font-mono font-bold text-zinc-200 shrink-0',
            SIZE_CLASSES[size],
            className
          )}
        >
          {upper.slice(0, 3) || 'GLB'}
        </span>
      );
  }
}
