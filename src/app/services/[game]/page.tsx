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
  Percent,
  Coins,
  Sparkles,
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

interface MarketplaceService {
  id: string;
  gameCode: string;
  name: string;
  desc?: string;
  pricingType: 'PER_UNIT' | 'FIXED';
  price: number;
  unitName?: string;
  depositPercent: number;
  requiredFields: string[];
  booster: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    rating: number;
    completedOrders: number;
    coupon?: {
      code: string;
      discountPercent: number;
      isActive: boolean;
    } | null;
  };
}

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

  // Active View Tab: 'SERVICES' or 'BOOSTERS'
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'BOOSTERS'>('SERVICES');

  // Services State
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Boosters State
  const [boosters, setBoosters] = useState<BoosterItem[]>([]);
  const [loadingBoosters, setLoadingBoosters] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [pricingFilter, setPricingFilter] = useState<'ALL' | 'FIXED' | 'PER_UNIT'>('ALL');
  const [selectedServer, setSelectedServer] = useState('');

  // Fetch Services for this Game
  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const gameCode = (game.shortName || game.id).toUpperCase();
        const res = await fetch(`/api/boosters/marketplace/services?gameCode=${encodeURIComponent(gameCode)}`);
        if (res.ok) {
          const data = await res.json();
          setServices(data.data || []);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách dịch vụ:', err);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [game.id, game.shortName]);

  // Fetch Boosters for this Game
  useEffect(() => {
    const fetchBoosters = async () => {
      setLoadingBoosters(true);
      try {
        const query = new URLSearchParams({
          game: game.id.toUpperCase(),
        });
        const res = await fetch(`/api/boosters?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setBoosters(data.boosters || []);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách tuyển thủ:', err);
      } finally {
        setLoadingBoosters(false);
      }
    };

    fetchBoosters();
  }, [game.id]);

  // Filter Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.desc && s.desc.toLowerCase().includes(q)) ||
        s.booster.username.toLowerCase().includes(q) ||
        s.booster.displayName.toLowerCase().includes(q);

      const matchPricing =
        pricingFilter === 'ALL' || s.pricingType === pricingFilter;

      return matchSearch && matchPricing;
    });
  }, [services, searchTerm, pricingFilter]);

  // Filter Boosters
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
        <div className="flex items-center justify-between mb-6">
          <BackButton />
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Link href="/services" className="hover:text-white transition-colors">
              Tất cả Games
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">{game.name}</span>
          </div>
        </div>

        {/* Hero Header */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 mb-8 border border-white/10 bg-gradient-to-r ${game.gradient} overflow-hidden shadow-2xl`}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3">
                <Gamepad2 size={13} />
                <span>{game.shortName} Marketplace</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md mb-2">
                Sàn Dịch Vụ {game.name}
              </h1>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                Khám phá các gói dịch vụ cày thuê do tuyển thủ tự niêm yết giá hoặc lựa chọn tuyển thủ hàng đầu để thuê trực tiếp.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md text-center">
                <div className="text-xl sm:text-2xl font-black text-blue-400">
                  {services.length}
                </div>
                <div className="text-[11px] font-semibold text-zinc-400">
                  Gói Dịch Vụ
                </div>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md text-center">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">
                  {boosters.length}
                </div>
                <div className="text-[11px] font-semibold text-zinc-400">
                  Tuyển Thủ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Tab Switcher: Services Marketplace vs Boosters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="inline-flex p-1 bg-zinc-900/80 border border-white/10 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('SERVICES')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'SERVICES'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Swords size={16} />
              <span>Gói Dịch Vụ ({services.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('BOOSTERS')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'BOOSTERS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users size={16} />
              <span>Danh Sách Tuyển Thủ ({boosters.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder={
                activeTab === 'SERVICES'
                  ? 'Tìm theo tên gói hoặc tuyển thủ...'
                  : 'Tìm tuyển thủ theo tên...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* TAB 1: GÓI DỊCH VỤ MARKETPLACE */}
        {activeTab === 'SERVICES' && (
          <div className="space-y-10">
            {/* 1. DANH MỤC CÁC GÓI DỊCH VỤ CHUẨN CỦA SÀN (LUÔN CÓ MẶT) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="text-blue-500 w-5 h-5" />
                    <span>Dịch vụ cày thuê {game.name} chuẩn sàn</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Chọn loại dịch vụ bạn cần để tính giá tự động và kết nối tuyển thủ uy tín.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {game.defaultServices?.length || 8} gói dịch vụ
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {game.defaultServices
                  .filter((s) => {
                    const q = searchTerm.toLowerCase().trim();
                    return !q || s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q);
                  })
                  .map((svc) => {
                    const IconComp = ICON_MAP[svc.iconName] || Trophy;
                    const isDeposit = svc.depositPercent < 100;

                    return (
                      <div
                        key={svc.slug}
                        className="group bg-zinc-900/70 border border-white/10 hover:border-blue-500/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <IconComp size={20} />
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isDeposit
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}
                            >
                              {isDeposit ? `Cọc ${svc.depositPercent}%` : 'Trọn gói'}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors line-clamp-1 mb-1.5">
                              {svc.name}
                            </h3>
                            <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                              {svc.desc}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase block">Giá từ</span>
                            <span className="text-xs font-bold text-emerald-400 font-mono">
                              {svc.pricingType === 'PER_UNIT'
                                ? `${svc.defaultPrice.toLocaleString('vi-VN')} đ / ${svc.unitName || 'điểm'}`
                                : `${svc.defaultPrice.toLocaleString('vi-VN')} đ`}
                            </span>
                          </div>

                          <Link
                            href={`/services/${game.id}/${svc.slug}`}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 shadow-md shadow-blue-600/20 transition-all hover:scale-105"
                          >
                            <span>Chọn dịch vụ</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 2. DỊCH VỤ NIÊM YẾT RIÊNG BỞI TUYỂN THỦ (NẾU CÓ) */}
            {filteredServices.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4 pt-4 border-t border-zinc-800">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-amber-400 w-5 h-5" />
                      <span>Gói dịch vụ đặc biệt do Tuyển thủ tự niêm yết</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Đặt trực tiếp các gói dịch vụ tùy chỉnh do tuyển thủ thiết kế riêng.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((svc) => {
                  const hasCoupon = svc.booster.coupon?.isActive;

                  return (
                    <div
                      key={svc.id}
                      className="group bg-zinc-900/60 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold uppercase">
                            {svc.gameCode}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {svc.depositPercent < 100 ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold">
                                Cọc {svc.depositPercent}%
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                                Trọn gói
                              </span>
                            )}

                            {hasCoupon && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center gap-0.5">
                                <Tag size={10} />
                                -{svc.booster.coupon?.discountPercent}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors line-clamp-1 mb-2">
                          {svc.name}
                        </h3>
                        <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed mb-4">
                          {svc.desc || 'Gói dịch vụ cày thuê chuyên nghiệp đảm bảo bảo mật và tốc độ cao.'}
                        </p>

                        {/* Price Preview */}
                        <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 mb-4 flex items-center justify-between">
                          <span className="text-xs text-zinc-400">Giá dịch vụ:</span>
                          <span className="font-extrabold text-emerald-400 text-sm">
                            {svc.pricingType === 'PER_UNIT'
                              ? `${svc.price.toLocaleString('vi-VN')} đ / ${svc.unitName || 'điểm'}`
                              : `${svc.price.toLocaleString('vi-VN')} đ`}
                          </span>
                        </div>
                      </div>

                      {/* Booster Info Footer & Book Button */}
                      <div>
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between mb-4">
                          <Link
                            href={`/b/${svc.booster.username}`}
                            className="flex items-center gap-2.5 min-w-0 group/b"
                          >
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                              {svc.booster.avatar ? (
                                <img
                                  src={svc.booster.avatar}
                                  alt={svc.booster.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-full h-full p-1 text-zinc-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white group-hover/b:text-blue-400 transition-colors truncate block">
                                {svc.booster.displayName || svc.booster.username}
                              </span>
                              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span>{svc.booster.rating.toFixed(1)}</span>
                                <span className="text-zinc-500 font-normal">
                                  ({svc.booster.completedOrders} đơn)
                                </span>
                              </div>
                            </div>
                          </Link>

                          <Link
                            href={`/b/${svc.booster.username}`}
                            className="text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors shrink-0"
                          >
                            Xem shop
                          </Link>
                        </div>

                        <Link
                          href={`/services/book/${svc.id}`}
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>Đặt dịch vụ ngay</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

        {/* TAB 2: DANH SÁCH TUYỂN THỦ (SELLERS) */}
        {activeTab === 'BOOSTERS' && (
          <div>
            {loadingBoosters ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-zinc-400 text-sm">Đang tải danh sách tuyển thủ...</p>
              </div>
            ) : filteredBoosters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBoosters.map((booster) => {
                  const isReady = booster.booster_info?.isReady ?? true;
                  const completedCount =
                    booster.completedOrders || booster.booster_info?.completed_orders || 0;

                  return (
                    <div
                      key={booster._id}
                      className="group bg-zinc-900/60 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        {/* Avatar & Online status */}
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
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                {booster.rating?.toFixed(1) || '5.0'}
                              </span>
                              <span className="text-zinc-400 text-[11px]">
                                {completedCount} đơn hoàn thành
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[11px] font-semibold text-blue-400 border border-blue-500/20 flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            Verified Booster
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] font-medium text-zinc-300 border border-white/10">
                            {game.shortName}
                          </span>
                        </div>
                      </div>

                      {/* View Storefront Button */}
                      <Link
                        href={`/b/${booster.username}`}
                        className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5 text-center"
                      >
                        <span>Xem gian hàng & Dịch vụ</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 space-y-3">
                <Users className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-base font-bold text-white">Chưa có tuyển thủ phù hợp</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Không tìm thấy tuyển thủ nào cho tựa game này.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function GameServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <GameServicesContent />
    </Suspense>
  );
}
