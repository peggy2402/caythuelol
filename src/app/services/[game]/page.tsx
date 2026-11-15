// src/app/services/[game]/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import {
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Banknote,
  Gamepad2,
  Crosshair,
  Shield,
  Star,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  User,
  ArrowUpDown,
  Tag,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { getGameById, GAMES_CATALOG } from '@/lib/games';

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Banknote,
  Gamepad2,
  Crosshair,
  Shield,
};

interface BoosterItem {
  _id: string;
  username: string;
  avatar?: string;
  displayName?: string;
  rating: number;
  completedOrders?: number;
  services: string[];
  games: {
    gameCode: string;
    ranks: string[];
    servers: string[];
  }[];
  booster_info?: {
    isReady?: boolean;
    ranks?: string[];
    services?: string[];
    completed_orders?: number;
    rating?: number;
  };
}

function GameServicesContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const gameId = (params?.game as string) || 'lol';
  const game = getGameById(gameId) || GAMES_CATALOG[0];

  const initialService = searchParams.get('service') || game.defaultServices[0]?.slug || 'rank-boost';
  const [selectedServiceSlug, setSelectedServiceSlug] = useState(initialService);

  const [boosters, setBoosters] = useState<BoosterItem[]>([]);
  const [loadingBoosters, setLoadingBoosters] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [sortBy, setSortBy] = useState('rating_desc');

  // Selected Service Object
  const activeService = useMemo(() => {
    return (
      game.defaultServices.find((s) => s.slug === selectedServiceSlug) ||
      game.defaultServices[0]
    );
  }, [game, selectedServiceSlug]);

  // Update URL search params when service changes
  const handleSelectService = (slug: string) => {
    setSelectedServiceSlug(slug);
    const p = new URLSearchParams(searchParams.toString());
    p.set('service', slug);
    router.replace(`/services/${game.id}?${p.toString()}`, { scroll: false });
  };

  // Fetch Boosters
  useEffect(() => {
    const fetchBoosters = async () => {
      setLoadingBoosters(true);
      try {
        const query = new URLSearchParams({
          game: game.id.toUpperCase(),
          sort: sortBy,
        });
        const res = await fetch(`/api/boosters?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setBoosters(data.boosters || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBoosters(false);
      }
    };

    fetchBoosters();
  }, [game.id, sortBy]);

  // Filter boosters by search term and server
  const filteredBoosters = useMemo(() => {
    return boosters.filter((b) => {
      const q = searchTerm.toLowerCase().trim();
      const matchName =
        !q ||
        b.username.toLowerCase().includes(q) ||
        (b.displayName && b.displayName.toLowerCase().includes(q));

      const matchServer =
        !selectedServer ||
        b.games?.some((g) => g.servers?.includes(selectedServer));

      return matchName && matchServer;
    });
  }, [boosters, searchTerm, selectedServer]);

  return (
    <div className="min-h-screen bg-[#070709] text-white font-sans selection:bg-blue-500/30">
      <Navbar />

      <main className="relative pt-24 pb-28 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Navigation & Breadcrumbs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/services" label="Tất cả game" />
            <span className="text-zinc-600">/</span>
            <span className="text-sm font-bold text-white">{game.name}</span>
          </div>

          {/* Upwork/Fiverr Flow Steps Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/services"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <span>Bước 1: {game.shortName}</span>
            </Link>
            <span className="text-zinc-600">➔</span>
            <span className="px-3 py-1 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 font-semibold">
              Bước 2: Chọn Dịch Vụ
            </span>
            <span className="text-zinc-600">➔</span>
            <span className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500">
              Bước 3: Chọn Booster
            </span>
          </div>
        </div>

        {/* Game Banner Header */}
        <div className={`relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r ${game.gradient} border border-white/10 shadow-2xl overflow-hidden mb-10`}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  {game.shortName}
                </span>
                <span className="text-xs text-white/80 font-medium">
                  Hệ thống cày thuê uy tín
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                DỊCH VỤ {game.name.toUpperCase()}
              </h1>
              <p className="text-white/80 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
                {game.desc}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md text-center">
                <div className="text-xs text-zinc-400 font-medium">Dịch vụ sẵn có</div>
                <div className="text-lg font-black text-white">{game.defaultServices.length}</div>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md text-center">
                <div className="text-xs text-zinc-400 font-medium">Tuyển thủ sẵn sàng</div>
                <div className="text-lg font-black text-emerald-400">{boosters.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: LIST SERVICES (Category & Service Selector) */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold">
                  2
                </span>
                <span>Chọn loại dịch vụ bạn cần</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Nhấn vào dịch vụ để xem danh sách tuyển thủ và bảng giá chi tiết
              </p>
            </div>
          </div>

          {/* Services Grid (Fiverr Gigs Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {game.defaultServices.map((svc) => {
              const ServiceIcon = ICON_MAP[svc.iconName] || Swords;
              const isSelected = svc.slug === selectedServiceSlug;

              return (
                <div
                  key={svc.slug}
                  onClick={() => handleSelectService(svc.slug)}
                  className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-600/20 ring-1 ring-blue-500 -translate-y-1'
                      : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div
                        className={`p-2 rounded-xl border transition-colors ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                            : 'bg-white/5 border-white/10 text-zinc-300 group-hover:text-white'
                        }`}
                      >
                        <ServiceIcon size={18} />
                      </div>

                      {svc.depositPercent < 100 ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                          Cọc {svc.depositPercent}%
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          Trọn gói
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                      {svc.name}
                    </h3>
                    <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                      {svc.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">
                      {svc.pricingType === 'PER_UNIT'
                        ? `${svc.defaultPrice.toLocaleString('vi-VN')} đ / ${svc.unitName || 'điểm'}`
                        : `Từ ${svc.defaultPrice.toLocaleString('vi-VN')} đ`}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}
                    >
                      {isSelected ? 'Đang chọn' : 'Chọn dịch vụ'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 3: LIST BOOSTERS FOR SELECTED SERVICE (Fiverr/Upwork Freelancer Profiles) */}
        <div>
          {/* Section Header & Filters Bar */}
          <div className="bg-zinc-900/60 border border-white/10 p-4 rounded-2xl shadow-xl mb-6 backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold">
                    3
                  </span>
                  <span>Danh sách Tuyển thủ: {activeService?.name}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Lựa chọn Booster uy tín, xem bảng giá và đặt lịch thuê ngay
                </p>
              </div>

              {/* Quick sort & server filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Box */}
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Tìm tên Booster..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Server Filter */}
                <div className="relative">
                  <select
                    value={selectedServer}
                    onChange={(e) => setSelectedServer(e.target.value)}
                    className="appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-300 outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="">Tất cả máy chủ</option>
                    {game.standardServers.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                </div>

                {/* Sort Filter */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-300 outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="rating_desc">Đánh giá cao nhất</option>
                    <option value="orders_desc">Nhiều đơn hoàn thành</option>
                  </select>
                  <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Boosters Freelancers Grid */}
          {loadingBoosters ? (
            <div className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-white/5">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-zinc-500 text-sm">Đang tải danh sách Booster...</p>
            </div>
          ) : filteredBoosters.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
              <p className="text-zinc-500 text-sm">Chưa tìm thấy Booster nào phù hợp với bộ lọc.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBoosters.map((booster) => {
                const isReady = booster.booster_info?.isReady ?? true;
                const completedCount =
                  booster.completedOrders ?? booster.booster_info?.completed_orders ?? 0;
                const rank =
                  booster.games?.find((g) => g.gameCode === game.id.toUpperCase())?.ranks?.[0] ||
                  booster.booster_info?.ranks?.[0];

                const hireUrl = `/b/${booster.username}`;

                return (
                  <div
                    key={booster._id}
                    className="group relative bg-zinc-900/60 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: Avatar, Names, Online */}
                      <div className="flex items-start gap-3.5 mb-4">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-blue-500 transition-colors bg-zinc-800 shrink-0">
                          {booster.avatar ? (
                            <img
                              src={booster.avatar}
                              alt={booster.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-full h-full p-3 text-zinc-400" />
                          )}
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                              isReady ? 'bg-green-500' : 'bg-zinc-500'
                            }`}
                            title={isReady ? 'Sẵn sàng nhận đơn' : 'Tạm nghỉ'}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <Link href={`/b/${booster.username}`} className="block">
                            <h4 className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors truncate">
                              {booster.displayName || booster.username}
                            </h4>
                          </Link>
                          <div className="text-xs text-zinc-400 font-mono">@{booster.username}</div>

                          <div className="flex items-center gap-2 mt-1.5 text-xs">
                            <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              <Star size={11} className="fill-current" />
                              {booster.rating?.toFixed(1) || '5.0'}
                            </span>
                            <span className="text-zinc-400 text-[11px] font-medium">
                              {completedCount} đơn hoàn thành
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rank badge & Service Price Preview */}
                      <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3 mb-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Dịch vụ:</span>
                          <span className="font-bold text-white truncate max-w-[180px]">
                            {activeService?.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Giá đề xuất:</span>
                          <span className="font-extrabold text-emerald-400">
                            {activeService?.pricingType === 'PER_UNIT'
                              ? `${activeService.defaultPrice.toLocaleString('vi-VN')} đ / ${activeService.unitName || 'điểm'}`
                              : `Từ ${activeService?.defaultPrice.toLocaleString('vi-VN')} đ`}
                          </span>
                        </div>
                        {activeService?.depositPercent && activeService.depositPercent < 100 && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                            <span className="text-zinc-500">Mức cọc:</span>
                            <span className="font-semibold text-amber-400">
                              Cọc {activeService.depositPercent}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {rank && (
                          <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-[11px] font-bold text-yellow-400 border border-yellow-500/20">
                            {rank.replace('_', ' ')}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[11px] font-semibold text-blue-400 border border-blue-500/20 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Verified
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                      <Link
                        href={hireUrl}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <span>Thuê Tuyển Thủ Này</span>
                        <ArrowRight size={14} />
                      </Link>
                      <Link
                        href={`/b/${booster.username}`}
                        className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs border border-zinc-700 transition-colors"
                      >
                        Hồ sơ
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function GameServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070709] flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <GameServicesContent />
    </Suspense>
  );
}
