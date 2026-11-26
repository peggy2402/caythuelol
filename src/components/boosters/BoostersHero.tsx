'use client';

import React from 'react';
import { ShieldCheck, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export const GAME_BRANCHES = [
  { id: 'ALL', name: 'Tất cả' },
  { id: 'LOL', name: 'LMHT' },
  { id: 'VALORANT', name: 'Valorant' },
  { id: 'AOV', name: 'Liên Quân' },
  { id: 'TFT', name: 'ĐTCL' },
  { id: 'WILDRIFT', name: 'Tốc Chiến' },
];

interface BoostersHeroProps {
  selectedGame: string;
  onSelectGame: (gameId: string) => void;
  totalBoosters: number;
}

export default function BoostersHero({
  selectedGame,
  onSelectGame,
  totalBoosters,
}: BoostersHeroProps) {
  return (
    <div className="mb-8 sm:mb-10">
      {/* Header Row: Tiêu đề bên trái, Tabs nhánh Game bên phải theo Mẫu thiết kế */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        {/* Left Side: Brand badge, Title & Description */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3.5 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Đội Ngũ Tuyển Thủ Xác Thực</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase mb-3">
            Chọn <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Pro Booster</span> Đồng Hành
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xl">
            Giao diện thẻ tuyển thủ thế hệ mới: Trực quan hóa bậc xếp hạng, tỷ lệ thắng và khung giờ hoạt động ngay trong tầm mắt.
          </p>
        </div>

        {/* Right Side: Chia nhánh theo tựa game (Game Branches Tabs) */}
        <div className="w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-white/10 backdrop-blur-xl shadow-xl min-w-max">
            {GAME_BRANCHES.map((game) => {
              const isSelected = selectedGame === game.id;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => onSelectGame(game.id)}
                  className={`relative px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="activeGameBranchPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_4px_16px_rgba(37,99,235,0.4)]"
                    />
                  )}
                  <span className="relative z-10">
                    {game.name}
                    {game.id === 'ALL' && totalBoosters > 0 && ` (${totalBoosters})`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
