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
  Sparkles,
  Lock,
  Users,
  Zap,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { GAMES_CATALOG, type GameDefinition } from '@/lib/games';

const ICON_MAP: Record<string, LucideIcon> = {
  Swords,
  Gamepad2,
  Crosshair,
  Shield,
  Trophy,
  Flame,
};

// Category filter tabs
type CategoryKey = 'ALL' | 'MOBA' | 'FPS' | 'TACTICS' | 'SPORTS';

const CATEGORIES: { id: CategoryKey; label: string; icon: LucideIcon }[] = [
  { id: 'ALL', label: 'Tất cả tựa game', icon: Layers },
  { id: 'MOBA', label: 'MOBA', icon: Swords },
  { id: 'FPS', label: 'FPS / Bắn súng', icon: Crosshair },
  { id: 'TACTICS', label: 'Chiến thuật', icon: Gamepad2 },
  { id: 'SPORTS', label: 'Thể thao / Khác', icon: Trophy },
];

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
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.png")' }}></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">

        {/* ========================================================================= */}
        {/* HERO BANNER SECTION                                                       */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* GAMES HUB GRID                                                            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => {
            const GameIcon = ICON_MAP[game.iconName] || Gamepad2;
            const servicesCount = game.defaultServices?.length || 0;

            return (
              <Link
                key={game.id}
                href={`/services/${game.id}`}
                className="group relative rounded-3xl overflow-hidden border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_40px_rgba(6,182,212,0.15)] flex flex-col justify-between"
              >
                {/* Header Banner Area with Artwork or Stylish Gradient */}
                <div className="relative h-48 w-full bg-zinc-950 overflow-hidden">
                  {game.banner ? (
                    <Image
                      src={game.banner}
                      alt={game.name}
                      fill
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
                        className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-850 text-[11px] font-medium text-zinc-300"
                      >
                        {svc.name}
                      </span>
                    ))}
                    {servicesCount > 3 && (
                      <span className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-850 text-[11px] font-bold text-cyan-400">
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
          })}
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

        {/* ========================================================================= */}
        {/* TRUST & GUARANTEES BOTTOM STRIP                                           */}
        {/* ========================================================================= */}
        <div className="mt-20 rounded-3xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-cyan-950/30 border border-zinc-800 p-8 backdrop-blur-xl">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">100% Tiền Giữ Tại Escrow</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Tiền cọc của bạn được đóng băng an toàn và chỉ giải ngân cho Booster khi bạn kiểm tra và xác nhận hoàn thành đơn.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Booster Thách Đấu Định Danh</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Toàn bộ tuyển thủ đều được xác thực danh tính KYC, ký hợp đồng cam kết trách nhiệm và đóng quỹ bảo chứng uy tín.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Ảo Hóa VPN & Ẩn Danh</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Tự động gán VPN theo IP khu vực của bạn, bật chế độ Offline không hiển thị online với bạn bè trong game.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
