'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck } from 'lucide-react';
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
      className="group relative rounded-3xl overflow-hidden border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_40px_rgba(6,182,212,0.15)] flex flex-col justify-between"
    >
      {/* Header Banner Area with Artwork or Stylish Gradient */}
      <div className="relative h-48 w-full bg-zinc-950 overflow-hidden">
        {game.banner && !imageError ? (
          <Image
            src={game.banner}
            alt={game.name}
            fill
            onError={() => setImageError(true)}
            className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-70 group-hover:opacity-90"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${game.gradient} opacity-40`} />
        )}

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-black text-cyan-300 border border-cyan-500/30">
            {game.shortName}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 backdrop-blur-md">
            {servicesCount} Dịch vụ
          </span>
        </div>

        {/* Game Title Bottom of Banner */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md group-hover:text-cyan-300 transition-colors">
            {game.name}
          </h3>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
        <p className="text-zinc-400 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-5">
          {game.desc}
        </p>

        {/* Service Preview Pills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {game.defaultServices?.slice(0, 3).map((svc, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-medium text-zinc-300"
            >
              {svc.name}
            </span>
          ))}
          {servicesCount > 3 && (
            <span className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-cyan-400">
              +{servicesCount - 3} gói khác
            </span>
          )}
        </div>

        {/* Footer Action Strip */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Bảo chứng Escrow 100%</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-black text-cyan-400 group-hover:text-cyan-300 transition-colors">
            <span>Xem dịch vụ</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
