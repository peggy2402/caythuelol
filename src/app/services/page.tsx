// src/app/services/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import {
  ArrowRight,
  Gamepad2,
  Swords,
  Crosshair,
  Shield,
  Trophy,
  Flame,
  Search,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games';

const ICON_MAP: Record<string, LucideIcon> = {
  Swords,
  Gamepad2,
  Crosshair,
  Shield,
  Trophy,
  Flame,
};

export default function ServicesHubPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGames = GAMES_CATALOG.filter((game) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      game.name.toLowerCase().includes(q) ||
      game.shortName.toLowerCase().includes(q) ||
      game.desc.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#070709] text-white font-sans selection:bg-blue-500/30">
      <Navbar />

      <main className="relative pt-28 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Background ambient lighting */}
        <div className="fixed inset-0 pointer-events-none opacity-20">
          <div className="absolute top-10 left-1/3 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[160px]" />
          <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px]" />
        </div>

        {/* Hero Header (Upwork/Fiverr Category Style) */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-4">
            <CheckCircle2 size={14} />
            <span>Nền tảng cày thuê Game chuyên nghiệp</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            CHỌN TỰA GAME BẠN MUỐN THUÊ
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-8">
            Bước 1: Chọn tựa game yêu thích để khám phá danh sách dịch vụ chi tiết và bảng giá từ các Booster hàng đầu.
          </p>

          {/* Search Game Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm kiếm game (LMHT, Valorant, ĐTCL, Liên Quân...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-blue-500 outline-none transition-all shadow-xl backdrop-blur-md"
            />
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filteredGames.map((game) => {
            const GameIcon = ICON_MAP[game.iconName] || Gamepad2;
            return (
              <Link
                key={game.id}
                href={`/services/${game.id}`}
                className="group relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-blue-500/40 flex flex-col justify-between"
              >
                {/* Header Banner */}
                <div className={`h-40 w-full bg-gradient-to-br ${game.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  
                  {/* Subtle Icon watermark */}
                  <GameIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 group-hover:scale-110 group-hover:text-white/15 transition-all duration-500" />

                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold text-white border border-white/10">
                      {game.shortName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold border border-blue-500/30">
                      {game.defaultServices.length} Dịch vụ
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md group-hover:text-blue-300 transition-colors">
                      {game.name}
                    </h3>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
                  <p className="text-zinc-400 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-6">
                    {game.desc}
                  </p>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">
                      Khám phá danh sách
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 group-hover:text-blue-300">
                      <span>Xem chi tiết</span>
                      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 mt-8">
            <p className="text-zinc-500 text-sm">Không tìm thấy tựa game phù hợp với từ khoá "{searchTerm}".</p>
          </div>
        )}
      </main>
    </div>
  );
}
