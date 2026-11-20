'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ServerFlagProps {
  code?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-8 h-8',
};

const FLAG_IMAGE_MAP: Record<string, { src: string; alt: string }> = {
  VN: { src: '/images/flags/vn.png', alt: 'Vietnam' },
  SEA: { src: '/images/flags/sea.png', alt: 'Southeast Asia' },
  NA: { src: '/images/flags/na.png', alt: 'North America' },
  US: { src: '/images/flags/na.png', alt: 'United States' },
  EUW: { src: '/images/flags/eu.png', alt: 'Europe West' },
  EUNE: { src: '/images/flags/eu.png', alt: 'Europe Nordic & East' },
  EU: { src: '/images/flags/eu.png', alt: 'Europe' },
  JP: { src: '/images/flags/jp.png', alt: 'Japan' },
  KR: { src: '/images/flags/kr.png', alt: 'Korea' },
  TW: { src: '/images/flags/tw.png', alt: 'Taiwan' },
  BR: { src: '/images/flags/br.png', alt: 'Brazil' },
  TR: { src: '/images/flags/tr.png', alt: 'Türkiye' },
  RU: { src: '/images/flags/ru.png', alt: 'Russia' },
  OCE: { src: '/images/flags/oce.png', alt: 'Oceania' },
  LAN: { src: '/images/flags/lan.png', alt: 'Latin America North' },
  LAS: { src: '/images/flags/las.png', alt: 'Latin America South' },
  ME: { src: '/images/flags/me.png', alt: 'Middle East' },
  PBE: { src: '/images/flags/pbe.png', alt: 'Public Beta Environment' },
};

export default function ServerFlag({ code, className, size = 'md' }: ServerFlagProps) {
  const upper = (code || '').trim().toUpperCase();
  const flag = FLAG_IMAGE_MAP[upper];

  if (!flag) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-md bg-zinc-800 border border-white/10 text-[10px] font-mono font-bold text-zinc-200 shrink-0 select-none',
          SIZE_CLASSES[size],
          className
        )}
      >
        {upper.slice(0, 3) || 'GLB'}
      </span>
    );
  }

  return (
    <img
      src={flag.src}
      alt={flag.alt}
      draggable={false}
      className={cn(
        'inline-block shrink-0 object-contain select-none',
        SIZE_CLASSES[size],
        className
      )}
    />
  );
}
