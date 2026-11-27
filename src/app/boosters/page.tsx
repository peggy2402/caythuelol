'use client';

import { useState, useEffect } from 'react';
import { User as UserIcon, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import BoosterCard, { getBoosterActiveGames } from '@/components/BoosterCard';
import BoostersHero from '@/components/boosters/BoostersHero';
import BoostersFilterBar from '@/components/boosters/BoostersFilterBar';
import BoostersPagination from '@/components/boosters/BoostersPagination';

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

export default function BoostersPage() {
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState('ALL');
  const [gameCounts, setGameCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [sortBy, setSortBy] = useState('rating_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Tính toán số lượng Booster thực tế cho từng nhánh tựa game
  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        const res = await fetch('/api/boosters?limit=100');
        if (!res.ok) return;
        const data = await res.json();
        const list = data.boosters || [];
        const counts: Record<string, number> = { ALL: list.length };

        list.forEach((b: any) => {
          const games = getBoosterActiveGames(b);
          games.forEach((g: string) => {
            const upper = g.toUpperCase();
            let code = 'LOL';
            if (upper.includes('VAL')) code = 'VALORANT';
            else if (upper.includes('LMHT') || upper.includes('LOL')) code = 'LOL';
            else if (upper.includes('LIENQUAN') || upper.includes('AOV') || upper.includes('LIÊN QUÂN')) code = 'AOV';
            else if (upper.includes('DTCL') || upper.includes('TFT') || upper.includes('ĐTCL')) code = 'TFT';
            else if (upper.includes('TỐC CHIẾN') || upper.includes('WILDRIFT')) code = 'WILDRIFT';
            else if (upper.includes('CS2') || upper.includes('CS')) code = 'CS2';

            counts[code] = (counts[code] || 0) + 1;
          });
        });

        setGameCounts(counts);
      } catch (err) {
        console.error('Failed to calculate game counts', err);
      }
    };

    fetchDistribution();
  }, []);

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
          ...(selectedGame !== 'ALL' ? { game: selectedGame } : {}),
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
  }, [debouncedSearch, filterService, sortBy, selectedGame, page]);

  // Fetch bookmarks
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch('/api/user/bookmarks', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const raw = Array.isArray(data) ? data : (data.bookmarks || []);
          const ids = raw.map((item: any) => (typeof item === 'string' ? item : item?._id)).filter(Boolean);
          setBookmarks(ids);
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ boosterId }),
      });
      if (!res.ok) {
        if (res.status === 401) toast.error('Vui lòng đăng nhập để lưu Booster');
        else toast.error('Lỗi khi lưu Booster');
        setBookmarks(bookmarks);
      } else {
        toast.success(isBookmarked ? 'Đã bỏ lưu Booster' : 'Đã lưu Booster vào mục yêu thích');
      }
    } catch {
      setBookmarks(bookmarks);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden pt-28 pb-32">
      <Navbar />

      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.png")' }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* 1. Hero & Nhánh Tựa Game (Game Branches) */}
        <BoostersHero
          selectedGame={selectedGame}
          onSelectGame={(gameId) => {
            setSelectedGame(gameId);
            setPage(1);
          }}
          totalBoosters={gameCounts['ALL'] || boosters.length}
          gameCounts={gameCounts}
        />

        {/* 2. Filters & Search Console */}
        <BoostersFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterService={filterService}
          setFilterService={setFilterService}
          sortBy={sortBy}
          setSortBy={setSortBy}
          boosters={boosters}
        />

        {/* 3. Booster Grid (Responsive 1 col mobile, 2 col sm, 3 col lg, 4 col xl) */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 gap-4 text-cyan-400">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-xs uppercase tracking-wider font-bold text-zinc-500">Đang tải danh sách Booster...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
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
                  <h3 className="text-base font-bold text-white mb-1">Không tìm thấy Booster nào</h3>
                  <p className="text-xs text-zinc-500 mb-6">Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.</p>
                  <button
                    onClick={() => {
                      setSelectedGame('ALL');
                      setSearchTerm('');
                      setFilterService('');
                      setSortBy('rating_desc');
                      setPage(1);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
                  >
                    Xóa Bộ Lọc
                  </button>
                </div>
              )}
            </div>

            {/* 4. Pagination */}
            <BoostersPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
