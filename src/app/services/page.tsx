'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Gamepad2 } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games';
import ServicesHero, { CategoryKey } from '@/components/services/ServicesHero';
import GameCard from '@/components/services/GameCard';
import EscrowGuarantees from '@/components/services/EscrowGuarantees';

export default function ServicesHubPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('ALL');

  // Filter games based on search and category
  const filteredGames = GAMES_CATALOG.filter((game) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      game.name.toLowerCase().includes(q) ||
      game.shortName.toLowerCase().includes(q) ||
      game.desc.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'MOBA') {
      return ['lol', 'aov', 'wildrift'].includes(game.id);
    }
    if (selectedCategory === 'FPS') {
      return ['valorant'].includes(game.id);
    }
    if (selectedCategory === 'TACTICS') {
      return ['tft'].includes(game.id);
    }
    if (selectedCategory === 'SPORTS') {
      return ['fconline'].includes(game.id);
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden pt-28 pb-32">
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

        {/* 2. Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

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

        {/* 3. Escrow Guarantees */}
        <EscrowGuarantees />
      </main>
    </div>
  );
}
