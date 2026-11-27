// src/app/services/[game]/components/GameHeroBanner.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Gamepad2, Swords, Users } from 'lucide-react';
import { GameDefinition } from '@/lib/games';

interface GameHeroBannerProps {
  game: GameDefinition;
  servicesCount: number;
  boostersCount: number;
}

export function GameHeroBanner({ game, servicesCount, boostersCount }: GameHeroBannerProps) {
  return (
    <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 lg:p-10 border border-white/10 shadow-2xl mb-7 bg-[#0b0e17]">
      {/* Background Banner Game */}
      {game.banner && (
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <Image
            src={game.banner}
            alt={game.name}
            fill
            className="object-cover object-center scale-105 filter blur-[1px]"
            priority
          />
        </div>
      )}
      <div className={`absolute inset-0 bg-gradient-to-r ${game.gradient} opacity-25 mix-blend-screen pointer-events-none`} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#080b12]/95 via-[#090d16]/80 to-[#080b12]/55 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 text-cyan-300 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
            <Gamepad2 size={13} className="text-cyan-400" />
            <span>{game.shortName} Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            Sàn Dịch Vụ {game.name}
          </h1>
          <p className="text-zinc-300/90 text-xs sm:text-sm leading-relaxed max-w-xl">
            Khám phá các gói dịch vụ cày thuê do Booster tự niêm yết giá hoặc lựa chọn Booster hàng đầu để thuê trực tiếp.
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
          <div className="px-4 sm:px-5 py-3.5 rounded-2xl bg-black/45 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center min-w-[116px] shadow-inner">
            <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-black text-blue-400 font-mono leading-none">
              <Swords size={16} className="text-blue-400/80 shrink-0" />
              <span>{servicesCount}</span>
            </div>
            <div className="text-[11px] font-semibold text-zinc-400 mt-1.5 whitespace-nowrap">
              Gói Dịch Vụ
            </div>
          </div>
          <div className="px-4 sm:px-5 py-3.5 rounded-2xl bg-black/45 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center min-w-[116px] shadow-inner">
            <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-black text-emerald-400 font-mono leading-none">
              <Users size={16} className="text-emerald-400/80 shrink-0" />
              <span>{boostersCount}</span>
            </div>
            <div className="text-[11px] font-semibold text-zinc-400 mt-1.5 whitespace-nowrap">
              Booster
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
