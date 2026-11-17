'use client';

import { ShieldCheck, Search, Swords, Crosshair, Gamepad2, Trophy, Layers, type LucideIcon } from 'lucide-react';

export type CategoryKey = 'ALL' | 'MOBA' | 'FPS' | 'TACTICS' | 'ACTION';

interface CategoryTab {
  id: CategoryKey;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryTab[] = [
  { id: 'ALL', label: 'Tất cả tựa game', icon: Layers },
  { id: 'MOBA', label: 'MOBA', icon: Swords },
  { id: 'FPS', label: 'FPS / Bắn súng', icon: Crosshair },
  { id: 'TACTICS', label: 'Chiến thuật', icon: Gamepad2 },
  { id: 'ACTION', label: 'Sinh tồn / Nhập vai', icon: Trophy },
];

interface ServicesHeroProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: CategoryKey;
  setSelectedCategory: (cat: CategoryKey) => void;
}

export default function ServicesHero({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
}: ServicesHeroProps) {
  return (
    <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <ShieldCheck className="w-4 h-4 text-cyan-400" />
        <span>LeoRank Esports Services • Bảo Chứng 100% Escrow</span>
      </div>

      <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 tracking-tight uppercase">
        Trung Tâm Dịch Vụ <br />
        <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
          Cày Thuê Đa Game Chuyên Nghiệp
        </span>
      </h1>

      <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-8">
        Chọn tựa game của bạn để khám phá danh sách gói dịch vụ chi tiết, bảng giá niêm yết minh bạch và bảng xếp hạng tuyển thủ Thách Đấu sẵn sàng nhận đơn.
      </p>

      {/* Search Bar */}
      <div className="relative max-w-lg mx-auto mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Tìm kiếm tựa game (LMHT, Valorant, ĐTCL, Liên Quân, Tốc Chiến...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:border-cyan-500 outline-none transition-colors shadow-2xl backdrop-blur-xl"
        />
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const TabIcon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-105'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
