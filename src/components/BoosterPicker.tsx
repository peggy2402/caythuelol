// src/components/BoosterPicker.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  User,
  Star,
  CheckCircle2,
  Loader2,
  Filter,
  ChevronRight,
  Search,
  X,
  ArrowUpDown,
  Sparkles,
  Trophy,
  Flame,
  RotateCcw,
  ShieldCheck,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Booster {
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

const SERVICE_OPTIONS = [
  { value: 'RANK_BOOST', label: 'Cày Rank/Elo' },
  { value: 'NET_WINS', label: 'Cày Điểm Cao Thủ/Thách Đấu' },
  { value: 'PLACEMENTS', label: 'Phân Hạng Đầu Mùa' },
  { value: 'LEVELING', label: 'Cày Level 30' },
  { value: 'MASTERY', label: 'Thông Thạo Tướng' },
  { value: 'PROMOTION', label: 'Chuỗi Thăng Hạng' },
  { value: 'COACHING', label: 'Coaching 1-1' },
  { value: 'ONBET', label: 'Cày Sự Kiện' },
];

export default function BoosterPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentBoosterParam = searchParams.get('booster');

  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [sortBy, setSortBy] = useState('rating_desc'); // Mặc định sắp xếp theo đánh giá cao
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // State for mobile view & collapse toggle when booster selected
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce Search Input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside to close search suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchBoosters = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          search: debouncedSearch,
          service: filterService,
          sort: sortBy,
        });
        const res = await fetch(`/api/boosters?${query.toString()}`);
        const data = await res.json();
        setBoosters(data.boosters || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoosters();
  }, [debouncedSearch, filterService, sortBy]);

  const handleSelect = (booster: Booster) => {
    const params = new URLSearchParams(searchParams.toString());
    const identifier = `@${booster.username}`;
    params.set('booster', identifier);
    router.push(`${pathname}?${params.toString().replace(/%40/g, '@')}`, { scroll: false });
    setIsSearchFocused(false);
    setIsManuallyExpanded(false);
  };

  // Find currently selected booster object
  const selectedBooster = useMemo(() => {
    if (!currentBoosterParam) return null;
    const clean = currentBoosterParam.replace(/^@/, '');
    return boosters.find((b) => b.username === clean || b._id === currentBoosterParam) || null;
  }, [boosters, currentBoosterParam]);

  // Prestigious suggestions (Top rated & most orders)
  const topSuggestions = useMemo(() => {
    return [...boosters]
      .sort((a, b) => {
        const ordersA = a.completedOrders ?? a.booster_info?.completed_orders ?? 0;
        const ordersB = b.completedOrders ?? b.booster_info?.completed_orders ?? 0;
        const rateA = a.rating ?? 5;
        const rateB = b.rating ?? 5;
        if (rateB !== rateA) return rateB - rateA;
        return ordersB - ordersA;
      })
      .slice(0, 5);
  }, [boosters]);

  const displayedBoosters = showAll ? boosters : boosters.slice(0, 4);

  // If booster is selected and not manually toggled to expand, show collapsed summary
  const isCollapsed = !!currentBoosterParam && !isManuallyExpanded;

  return (
    <div className="mb-10">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-xs sm:text-sm font-extrabold shadow-md shadow-blue-500/30">
            1
          </span>
          <span>Chọn Booster Uy Tín</span>
        </h2>

        {selectedBooster && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 size={14} />
            Đã chọn: @{selectedBooster.username}
          </span>
        )}
      </div>

      {/* Selected Booster Compact Banner (Specially tailored for mobile next-step flow) */}
      {selectedBooster && isCollapsed ? (
        <div className="relative p-4 sm:p-5 bg-gradient-to-r from-blue-900/30 via-zinc-900/90 to-purple-900/30 border border-blue-500/40 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md shrink-0 bg-zinc-800">
                {selectedBooster.avatar ? (
                  <img
                    src={selectedBooster.avatar}
                    alt={selectedBooster.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-full h-full p-2.5 text-zinc-400" />
                )}
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                    selectedBooster.booster_info?.isReady !== false ? 'bg-green-500' : 'bg-zinc-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base sm:text-lg">
                    {selectedBooster.displayName || selectedBooster.username}
                  </h3>
                  <span className="text-xs text-blue-400 font-mono">@{selectedBooster.username}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs">
                  <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <Star size={12} className="fill-current" />
                    {selectedBooster.rating?.toFixed(1) || '5.0'}
                  </span>
                  <span className="text-zinc-300 font-medium bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                    {selectedBooster.completedOrders ?? selectedBooster.booster_info?.completed_orders ?? 0} đơn hoàn thành
                  </span>
                  <span className="text-emerald-400 text-[11px] font-semibold hidden sm:inline-flex items-center gap-1">
                    <ShieldCheck size={13} />
                    Verified Booster
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Link
                href={`/b/${selectedBooster.username}`}
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all border border-zinc-700"
              >
                Xem hồ sơ
              </Link>
              <button
                type="button"
                onClick={() => setIsManuallyExpanded(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 hover:text-white text-xs font-semibold transition-all border border-blue-500/30"
              >
                <RotateCcw size={13} />
                <span>Đổi Booster khác</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Full Selection View with Search & Prestige Recommendations */
        <div>
          {/* Smart Search & Filter Bar */}
          <div className="bg-zinc-900/60 border border-white/10 p-3.5 sm:p-4 rounded-2xl shadow-lg mb-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* 1. Search Box with interactive suggestions */}
              <div ref={searchContainerRef} className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm tên Booster hoặc xem gợi ý..."
                  value={searchTerm}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Suggestions Dropdown on focus */}
                {isSearchFocused && topSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <Sparkles size={13} />
                        Gợi ý Booster uy tín hàng đầu
                      </span>
                      <span>Xếp hạng</span>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {topSuggestions.map((booster) => {
                        const orders =
                          booster.completedOrders ?? booster.booster_info?.completed_orders ?? 0;
                        return (
                          <div
                            key={booster._id}
                            onClick={() => handleSelect(booster)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                                {booster.avatar ? (
                                  <img
                                    src={booster.avatar}
                                    alt={booster.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-full h-full p-1.5 text-zinc-400" />
                                )}
                              </div>
                              <div className="truncate">
                                <div className="text-sm font-bold text-white group-hover:text-blue-400 truncate">
                                  {booster.displayName || booster.username}
                                </div>
                                <div className="text-[11px] text-zinc-400">@{booster.username}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-xs">
                              <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                                <Star size={11} className="fill-current" />
                                {booster.rating?.toFixed(1) || '5.0'}
                              </span>
                              <span className="text-zinc-400 text-[11px] font-medium hidden sm:inline">
                                {orders} đơn
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Filter Service */}
              <div className="relative min-w-[170px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="">Tất cả dịch vụ</option>
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
              </div>

              {/* 3. Sort By */}
              <div className="relative min-w-[170px]">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="rating_desc">Đánh giá cao nhất (⭐ 5.0)</option>
                  <option value="orders_desc">Nhiều đơn hoàn thành</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Quick recommendation chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/80">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase">Gợi ý nhanh:</span>
              <button
                type="button"
                onClick={() => setSortBy('rating_desc')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  sortBy === 'rating_desc'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/60'
                }`}
              >
                ⭐ Top Đánh Giá Cao
              </button>
              <button
                type="button"
                onClick={() => setSortBy('orders_desc')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  sortBy === 'orders_desc'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/60'
                }`}
              >
                🔥 Nhiều Đơn Nhất
              </button>
              {selectedBooster && (
                <button
                  type="button"
                  onClick={() => setIsManuallyExpanded(false)}
                  className="ml-auto text-xs text-blue-400 hover:underline font-semibold"
                >
                  Thu gọn lại
                </button>
              )}
            </div>
          </div>

          {/* Booster Cards List */}
          {loading ? (
            <div className="text-center py-10 text-zinc-500 bg-zinc-900/30 rounded-2xl border border-white/5">
              <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-blue-500" />
              Đang tải danh sách Booster uy tín...
            </div>
          ) : boosters.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30 text-sm">
              Không tìm thấy Booster nào phù hợp. Vui lòng thử tìm với từ khoá khác.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {displayedBoosters.map((booster) => {
                  const isSelected =
                    currentBoosterParam === booster._id ||
                    currentBoosterParam === `@${booster.username}`;

                  let rank =
                    booster.games?.find((g) => g.gameCode === 'LOL')?.ranks?.[0] ||
                    booster.games?.[0]?.ranks?.[0];
                  if (!rank && booster.booster_info?.ranks?.length) {
                    rank = booster.booster_info.ranks[0];
                  }

                  const isReady = booster.booster_info?.isReady ?? true;
                  const completedCount =
                    booster.completedOrders ?? booster.booster_info?.completed_orders ?? 0;

                  return (
                    <div
                      key={booster._id}
                      onClick={() => handleSelect(booster)}
                      className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.25)] ring-1 ring-blue-500'
                          : 'border-white/10 bg-zinc-900/40 hover:border-white/20 hover:bg-zinc-900/80 shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-blue-500 transition-colors bg-zinc-800 shrink-0">
                          {booster.avatar ? (
                            <img
                              src={booster.avatar}
                              alt={booster.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-full h-full p-2 text-zinc-400" />
                          )}
                          <div
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-zinc-900 ${
                              isReady ? 'bg-green-500' : 'bg-zinc-500'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/b/${booster.username}`}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="block"
                          >
                            <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors truncate">
                              {booster.displayName || booster.username}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5 text-xs">
                            <span className="flex items-center gap-1 text-amber-400 font-bold">
                              <Star className="w-3 h-3 fill-current" />
                              {booster.rating?.toFixed(1) || '5.0'}
                            </span>
                            <span className="text-zinc-500">•</span>
                            <span className="text-zinc-400 font-medium text-[11px]">
                              {completedCount} đơn
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rank & Services badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
                        {rank && (
                          <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-[10px] font-bold text-yellow-400 border border-yellow-500/20">
                            {rank.replace('_', ' ')}
                          </span>
                        )}
                        {(booster.services || booster.booster_info?.services || [])
                          .slice(0, 2)
                          .map((svc, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-medium text-zinc-400 border border-white/5"
                            >
                              {svc.replace('_', ' ')}
                            </span>
                          ))}
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3 text-blue-400 bg-blue-500/20 p-1 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {boosters.length > 4 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="px-5 py-2 bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all hover:bg-zinc-800"
                  >
                    {showAll ? 'Thu gọn danh sách' : `Xem tất cả (${boosters.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
