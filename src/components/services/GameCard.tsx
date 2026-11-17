'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { GameDefinition } from '@/lib/games';

interface GameCardProps {
  game: GameDefinition;
}

export default function GameCard({ game }: GameCardProps) {
  const [imageError, setImageError] = useState(false);
  const servicesCount = game.defaultServices?.length || 0;

  return (
    <Link
      href={`/services/${game.id}`}
      className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800/80 bg-[#0c0e14] hover:border-cyan-500/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(6,182,212,0.18)] flex flex-col justify-between p-4 sm:p-5 h-44 sm:h-48 select-none"
    >
      {/* 1. Large Ghost Watermark Text in Background */}
      <div className="absolute left-4 bottom-5 text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white/[0.04] select-none pointer-events-none truncate max-w-[80%] font-mono leading-none z-0">
        {game.shortName || game.name}
      </div>

      {/* 2. Right Side Character Artwork / Image Banner with Smooth Fade */}
      <div className="absolute right-0 top-0 bottom-0 w-3/5 sm:w-1/2 overflow-hidden pointer-events-none z-0">
        {game.banner && !imageError ? (
          <Image
            src={game.banner}
            alt={game.name}
            fill
            onError={() => setImageError(true)}
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-65 group-hover:opacity-90"
          />
        ) : (
          <div className="w-full h-full relative flex items-center justify-end pr-4">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${game.gradient} blur-3xl opacity-25 group-hover:opacity-40 transition-opacity`} />
          </div>
        )}

        {/* Fading Gradient Overlay (from dark background to artwork) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e14] via-[#0c0e14]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14]/90 via-transparent to-transparent" />
      </div>

      {/* 3. Top Content: Tag Badge & Game Title */}
      <div className="relative z-10 space-y-2 max-w-[68%]">
        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-cyan-300 border border-cyan-500/30 shadow-sm">
            {game.shortName}
          </span>
          {servicesCount > 0 && (
            <span className="text-[10px] font-bold text-emerald-400">
              {servicesCount} gói
            </span>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-snug group-hover:text-cyan-300 transition-colors drop-shadow-md line-clamp-2">
          {game.name}
        </h3>
      </div>

      {/* 4. Bottom Content: Circular Navigation Arrow Button & Action Label */}
      <div className="relative z-10 flex items-center justify-between mt-auto pt-2">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800/90 border border-white/10 text-white flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black group-hover:scale-110 transition-all duration-300 shadow-md">
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </div>

        <span className="text-[11px] font-bold text-zinc-400 group-hover:text-cyan-300 transition-colors">
          Xem dịch vụ →
        </span>
      </div>
    </Link>
  );
}
