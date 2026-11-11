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
  { value: 'RANK_BOOST', label: 'Cày Rank/Elo' },
  { value: 'NET_WINS', label: 'Cày Điểm Cao Thủ/Thách Đấu' },
  { value: 'PLACEMENTS', label: 'Phân Hạng Đầu Mùa' },
  { value: 'LEVELING', label: 'Cày Level 30' },
  { value: 'MASTERY', label: 'Thông Thạo Tướng' },
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
      }
    } catch {
      setBookmarks(bookmarks);
    }
  };

  return (
    <div
      className="min-h-screen bg-zinc-950 text-white pt-24 pb-32 px-4 sm:px-6 relative overflow-hidden selection:bg-blue-500/30 font-sans"
      suppressHydrationWarning
    >
      <Navbar />

      {/* Background Effects */}
      <div
        className="fixed inset-0 bg-[url('/noise.png')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"
        suppressHydrationWarning
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" /> Trusted by 10,000+ Players
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-3 tracking-tight">
            {t('boosterListTitle')}
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
            {t('boosterListDesc')}
          </p>
        </div>

        {/* Smart Filters & Search */}
        <div className="bg-zinc-900/60 border border-white/10 p-4 sm:p-5 rounded-2xl shadow-xl mb-8 backdrop-blur-md space-y-3.5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Tìm kiếm Booster theo tên..."
                value={searchTerm}
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
            </div>

            <div className="relative min-w-[180px]">
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

            <div className="relative min-w-[180px]">
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

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Bộ lọc nhanh:</span>
            <button
              onClick={() => {
                setFilterService('');
                setSortBy('rating_desc');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                !filterService && sortBy === 'rating_desc'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800/70 text-zinc-400 hover:text-white border border-zinc-700/60'
              }`}
            >
              ⭐ Top Đánh Giá Cao
            </button>
            <button
              onClick={() => {
                setFilterService('');
                setSortBy('orders_desc');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                !filterService && sortBy === 'orders_desc'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-zinc-800/70 text-zinc-400 hover:text-white border border-zinc-700/60'
              }`}
            >
              🔥 Nhiều Đơn Hoàn Thành
            </button>
            <button
              onClick={() => setFilterService('RANK_BOOST')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterService === 'RANK_BOOST'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-zinc-800/70 text-zinc-400 hover:text-white border border-zinc-700/60'
              }`}
            >
              ⚔️ Cày Rank / Elo
            </button>
            <button
              onClick={() => setFilterService('PLACEMENTS')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterService === 'PLACEMENTS'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800/70 text-zinc-400 hover:text-white border border-zinc-700/60'
              }`}
            >
              🛡️ Phân Hạng Đầu Mùa
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : (
          /* Grid List */
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
                <div className="col-span-full text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
                  Không tìm thấy Booster nào phù hợp với bộ lọc hiện tại.
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-12 gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                >
                  Trang trước
                </button>
                <span className="px-4 py-2 text-zinc-400 text-sm font-medium">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                >
                  Trang sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
