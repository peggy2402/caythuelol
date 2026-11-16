'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
  Star,
  Trophy,
  User as UserIcon,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Search,
  Filter,
  X,
  Heart,
  ArrowUpDown,
  Sparkles,
  Flame,
  Swords,
  Shield,
  Zap,
  CheckCircle2,
  Crown,
  Users
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import BoosterCard from '@/components/BoosterCard';

interface Booster {
  _id: string;
  username: string;
  avatar?: string;
  displayName?: string;
  rating: number;
  completedOrders: number;
  services: string[];
  games: {
    gameCode: string;
    ranks: string[];
    servers: string[];
  }[];
}

const SERVICE_OPTIONS = [
  { value: 'RANK_BOOST', label: 'Cày Rank / Elo Siêu Tốc' },
  { value: 'NET_WINS', label: 'Cày Điểm LP Cao Thủ / Thách Đấu' },
  { value: 'PLACEMENTS', label: 'Phân Hạng Đầu Mùa (5 Trận)' },
  { value: 'LEVELING', label: 'Cày Cấp Độ 1-30' },
  { value: 'MASTERY', label: 'Cày Thông Thạo Tướng' },
];

export default function BoostersPage() {
  const { t } = useLanguage();

  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [sortBy, setSortBy] = useState('rating_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchBoosters = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: '12',
          search: debouncedSearch,
          service: filterService,
          sort: sortBy,
        });

        const res = await fetch(`/api/boosters?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (data.success || data.boosters) {
          setBoosters(data.boosters || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error('Failed to fetch boosters', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoosters();
  }, [debouncedSearch, filterService, sortBy, page]);

  // Fetch bookmarks
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await fetch('/api/user/bookmarks');
        if (res.ok) {
          const data = await res.json();
          setBookmarks(data.bookmarks || []);
        }
      } catch (e) {}
    };
    fetchBookmarks();
  }, []);

  const toggleBookmark = async (boosterId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isBookmarked = bookmarks.includes(boosterId);
    const newBookmarks = isBookmarked
      ? bookmarks.filter((id) => id !== boosterId)
      : [...bookmarks, boosterId];

    setBookmarks(newBookmarks);

    try {
      const res = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boosterId }),
      });
      if (!res.ok) {
        if (res.status === 401) toast.error('Vui lòng đăng nhập để lưu Booster');
        else toast.error('Lỗi khi lưu Booster');
        setBookmarks(bookmarks);
      } else {
        toast.success(isBookmarked ? 'Đã bỏ lưu tuyển thủ' : 'Đã lưu tuyển thủ vào mục yêu thích');
      }
    } catch {
      setBookmarks(bookmarks);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden pt-28 pb-32">
      <Navbar />

      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.png")' }}></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* ========================================================================= */}
        {/* HERO BANNER SECTION                                                       */}
        {/* ========================================================================= */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>100% Tuyển Thủ Định Danh KYC • Bảo Chứng Escrow</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 tracking-tight uppercase">
            Đội Ngũ Tuyển Thủ & <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">Booster Thách Đấu</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Khám phá danh sách các tuyển thủ Thách Đấu 1000+ LP, Radiant Valorant được kiểm tra trình độ gắt gao. Xem tỷ lệ thắng, đánh giá và đặt cày trực tiếp.
          </p>

          {/* 4 Trust Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mt-8">
            {[
              { label: 'Tuyển thủ sẵn sàng', value: '500+ Pro', icon: Users, color: 'text-cyan-400' },
              { label: 'Đánh giá hài lòng', value: '4.9/5.0 ★', icon: Star, color: 'text-amber-400' },
              { label: 'Thời gian ghép', value: 'Dưới 3 phút', icon: Zap, color: 'text-emerald-400' },
              { label: 'Bảo chứng tài chính', value: '100% Escrow', icon: Shield, color: 'text-blue-400' }
            ].map((metric, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm flex items-center gap-3 text-left">
                <div className={`p-2 rounded-xl bg-zinc-950 border border-zinc-850 ${metric.color}`}>
                  <metric.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 font-medium">{metric.label}</div>
                  <div className="text-sm font-black text-white font-mono">{metric.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SMART FILTERS & SEARCH CONSOLE                                            */}
        {/* ========================================================================= */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-10 backdrop-blur-xl space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Tìm kiếm tuyển thủ theo tên hoặc nickname..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500 outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Service Filter */}
            <div className="relative min-w-[220px]">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-9 py-3 text-xs sm:text-sm font-medium text-white focus:border-cyan-500 outline-none transition-colors cursor-pointer"
              >
                <option value="">Tất cả dịch vụ cung cấp</option>
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
            </div>

            {/* Sort Filter */}
            <div className="relative min-w-[200px]">
              <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-9 py-3 text-xs sm:text-sm font-medium text-white focus:border-cyan-500 outline-none transition-colors cursor-pointer"
              >
                <option value="rating_desc">Đánh giá cao nhất (⭐ 5.0)</option>
                <option value="orders_desc">Nhiều đơn hoàn thành nhất</option>
              </select>
              <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
            </div>

          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-850">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Bộ lọc nhanh:</span>
            
            <button
              onClick={() => {
                setFilterService('');
                setSortBy('rating_desc');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                !filterService && sortBy === 'rating_desc'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              ⭐ Top Đánh Giá Cao
            </button>

            <button
              onClick={() => {
                setFilterService('');
                setSortBy('orders_desc');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                !filterService && sortBy === 'orders_desc'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Nhiều Đơn Hoàn Thành</span>
            </button>

            <button
              onClick={() => setFilterService('RANK_BOOST')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterService === 'RANK_BOOST'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-blue-400" />
              <span>Cày Rank / Elo</span>
            </button>

            <button
              onClick={() => setFilterService('PLACEMENTS')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterService === 'PLACEMENTS'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phân Hạng Đầu Mùa</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOOSTER GRID & CARDS                                                      */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 gap-4 text-cyan-400">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-xs uppercase tracking-wider font-bold text-zinc-500">Đang tải danh sách tuyển thủ...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {boosters.length > 0 ? (
                boosters.map((booster) => (
                  <BoosterCard
                    key={booster._id}
                    booster={booster}
                    isBookmarked={bookmarks.includes(booster._id)}
                    onToggleBookmark={toggleBookmark}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/40">
                  <UserIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">Không tìm thấy tuyển thủ nào</h3>
                  <p className="text-xs text-zinc-500 mb-6">Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterService('');
                      setSortBy('rating_desc');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
                  >
                    Xóa Bộ Lọc
                  </button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-16 gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                >
                  Trang Trước
                </button>
                <span className="px-4 py-2 text-zinc-400 text-xs font-mono font-bold bg-zinc-950 rounded-xl border border-zinc-850">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                >
                  Trang Sau
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
