'use client';

import { useState, useEffect } from 'react';
import { Gamepad2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { getStoredGamesCatalog, GAMES_CATALOG, type GameDefinition } from '@/lib/games';
import GameCard from '@/components/services/GameCard';

export default function EsportsGamesGrid() {
  const [games, setGames] = useState<GameDefinition[]>(() => {
    if (typeof window !== 'undefined') {
      return getStoredGamesCatalog();
    }
    return GAMES_CATALOG;
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const syncGames = () => {
      setGames(getStoredGamesCatalog());
    };

    window.addEventListener('games-catalog-updated', syncGames);
    return () => window.removeEventListener('games-catalog-updated', syncGames);
  }, []);

  // Chỉ lấy các tựa game đang được bật (active !== false)
  const activeGames = games.filter((g) => g.active !== false);

  // Mặc định hiển thị 8 cards (2 hàng x 4 cards / 1 hàng theo chuẩn yêu cầu), bấm Xem thêm để xem tất cả
  const displayedGames = isExpanded ? activeGames : activeGames.slice(0, 8);
  const remainingCount = Math.max(0, activeGames.length - 8);

  return (
    <section className="py-16 sm:py-20 relative z-10 border-t border-zinc-800/60 bg-[#06080d]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              Hệ Sinh Thái Game Hỗ Trợ
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Chọn Tựa Game Của Bạn
            </h2>
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md">
            Hơn 500+ Booster chuyên nghiệp đạt bậc xếp hạng cao nhất trong từng tựa game sẵn sàng đồng hành cùng bạn 24/7.
          </p>
        </div>

        {/* 4 Cards / 1 Hàng Grid (Chuẩn yêu cầu: 4 cards 1 hàng) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {displayedGames.map((game, idx) => (
            <GameCard key={game.id} game={game} priority={idx < 4} />
          ))}
        </div>

        {/* Nút Xem thêm / Thu gọn các game còn lại */}
        {activeGames.length > 8 && (
          <div className="mt-10 sm:mt-12 flex justify-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="group inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-cyan-500/50 text-white font-bold text-xs sm:text-sm transition-all duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {isExpanded ? (
                <>
                  <span>Thu gọn danh sách</span>
                  <ChevronUp className="w-4 h-4 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>Xem thêm {remainingCount} tựa game khác</span>
                  <ChevronDown className="w-4 h-4 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
