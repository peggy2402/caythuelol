'use client';

import React from 'react';

export const ALL_SUPPORTED_GAMES = [
  { id: 'ALL', name: 'Tất cả' },
  { id: 'LOL', name: 'LMHT' },
  { id: 'VALORANT', name: 'Valorant' },
  { id: 'AOV', name: 'Liên Quân' },
  { id: 'TFT', name: 'ĐTCL' },
  { id: 'WILDRIFT', name: 'Tốc Chiến' },
  { id: 'CS2', name: 'CS2' },
];

interface BoostersHeroProps {
  selectedGame: string;
  onSelectGame: (gameId: string) => void;
  totalBoosters: number;
  gameCounts?: Record<string, number>;
}

export default function BoostersHero({
  selectedGame,
  onSelectGame,
  totalBoosters,
  gameCounts = {},
}: BoostersHeroProps) {
  // Lọc chỉ hiển thị các nhánh tựa game đang THỰC SỰ CÓ Booster (hoặc tab Tất cả)
  const displayBranches = ALL_SUPPORTED_GAMES.filter((game) => {
    if (game.id === 'ALL') return true;
    const count = gameCounts[game.id] || 0;
    return count > 0;
  });

  return (
    <div className="mb-8 sm:mb-10">
      {/* Header Row: Tiêu đề bên trái, Tabs nhánh Game bên phải phẳng không viền hộp xám */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-4">
        {/* Left Side: Brand badge, Title & Description */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Đội Ngũ Booster Xác Thực</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase mb-3">
            Chọn <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Pro Booster</span> Đồng Hành
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xl">
            Giao diện thẻ Booster thế hệ mới: Trực quan hóa bậc xếp hạng, tỷ lệ thắng và khung giờ hoạt động ngay trong tầm mắt.
          </p>
        </div>

        {/* Right Side: Chia nhánh theo tựa game - THIẾT KẾ PHẲNG KHÔNG VIỀN HỘP XÁM */}
        <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-1">
          <div className="inline-flex items-center gap-1.5 min-w-max p-1">
            {displayBranches.map((game) => {
              const isSelected = selectedGame === game.id;
              const count = game.id === 'ALL' ? totalBoosters : (gameCounts[game.id] || 0);

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => onSelectGame(game.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-600/30 font-extrabold scale-[1.02]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] bg-transparent'
                  }`}
                >
                  <span>{game.name}</span>
                  {count > 0 && (
                    <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'text-zinc-400'
                    }`}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
