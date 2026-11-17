'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Gamepad2, ChevronDown, ChevronUp } from 'lucide-react';
import { GAMES_CATALOG, getStoredGamesCatalog, type GameDefinition } from '@/lib/games';
import ServicesHero, { CategoryKey } from '@/components/services/ServicesHero';
import GameCard from '@/components/services/GameCard';
import EscrowGuarantees from '@/components/services/EscrowGuarantees';

const INITIAL_DISPLAY_COUNT = 8; // 2 hàng x 4 cards trên Desktop

export default function ServicesHubPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('ALL');
  const [displayCount, setDisplayCount] = useState<number>(INITIAL_DISPLAY_COUNT);
  const [games, setGames] = useState<GameDefinition[]>(GAMES_CATALOG);

  // Đồng bộ cấu hình Game từ localStorage hoặc Backend được Staff cấu hình
  useEffect(() => {
    const loadGames = () => {
      setGames(getStoredGamesCatalog());
    };
    loadGames();

    window.addEventListener('games-catalog-updated', loadGames);
    window.addEventListener('storage', loadGames);
    return () => {
      window.removeEventListener('games-catalog-updated', loadGames);
      window.removeEventListener('storage', loadGames);
    };
  }, []);

  // Filter games based on search, category and active status
  const filteredGames = useMemo(() => {
    return games
      .filter((g) => g.active !== false)
      .filter((game) => {
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !q ||
          game.name.toLowerCase().includes(q) ||
          game.shortName.toLowerCase().includes(q) ||
          game.desc.toLowerCase().includes(q);

        if (!matchesSearch) return false;

        if (selectedCategory === 'ALL') return true;
        if (selectedCategory === 'MOBA') {
          return ['lol', 'dota2', 'aov', 'wildrift'].includes(game.id);
        }
        if (selectedCategory === 'FPS') {
          return [
            'valorant',
            'cs2',
            'valmobile',
            'deltaforce',
            'marvelrivals',
            'pubg',
            'pubgmobile',
            'codm',
            'freefire',
            'truykich2',
            'overwatch2',
          ].includes(game.id);
        }
        if (selectedCategory === 'TACTICS') {
          return ['tft'].includes(game.id);
        }
        if (selectedCategory === 'ACTION') {
          return ['poe2', 'naraka'].includes(game.id);
        }

        return true;
      });
  }, [games, searchTerm, selectedCategory]);

  // Khi tìm kiếm hoặc chọn category, hiển thị toàn bộ kết quả lọc; khi ở trang All thì phân trang xem thêm
  const isFiltered = searchTerm.trim().length > 0 || selectedCategory !== 'ALL';
  const visibleGames = isFiltered ? filteredGames : filteredGames.slice(0, displayCount);
  const remainingCount = filteredGames.length - visibleGames.length;
  const isExpanded = displayCount >= filteredGames.length;

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-x-clip pt-28 pb-32">
      <Navbar />

      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.png")' }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* 1. Hero & Filters */}
        <ServicesHero
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* 2. Games Grid (4 Cards 1 Hàng trên Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {visibleGames.map((game, idx) => (
            <GameCard key={game.id} game={game} priority={idx < 4} />
          ))}
        </div>

        {/* 3. Nút "Xem thêm" & "Thu gọn" */}
        {!isFiltered && filteredGames.length > INITIAL_DISPLAY_COUNT && (
          <div className="flex justify-center items-center gap-3 mt-10">
            {!isExpanded ? (
              <button
                type="button"
                onClick={() => setDisplayCount((prev) => Math.min(prev + 8, filteredGames.length))}
                className="px-6 py-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-cyan-500/50 text-white font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 shadow-xl hover:shadow-cyan-500/10 active:scale-95 group"
              >
                <span>Xem thêm tựa game khác</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono">
                  +{remainingCount}
                </span>
                <ChevronDown size={16} className="text-zinc-400 group-hover:text-cyan-300 group-hover:translate-y-0.5 transition-transform" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDisplayCount(INITIAL_DISPLAY_COUNT)}
                className="px-5 py-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>Thu gọn danh sách</span>
                <ChevronUp size={15} />
              </button>
            )}
          </div>
        )}

        {/* Empty Search Result */}
        {filteredGames.length === 0 && (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 mt-8">
            <Gamepad2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Không tìm thấy tựa game nào</h3>
            <p className="text-xs text-zinc-500 mb-6">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc danh mục.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
              }}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
            >
              Xem Tất Cả Game
            </button>
          </div>
        )}

        {/* 4. Escrow Guarantees */}
        <EscrowGuarantees />
      </main>
    </div>
  );
}
