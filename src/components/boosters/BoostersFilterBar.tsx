'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ArrowUpDown, ChevronRight, Flame, Swords, Shield } from 'lucide-react';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import SearchHistoryDropdown, { SearchSuggestionItem } from '@/components/common/SearchHistoryDropdown';

export const SERVICE_OPTIONS = [
  { value: 'RANK_BOOST', label: 'Cày Rank / Elo Siêu Tốc' },
  { value: 'NET_WINS', label: 'Cày Điểm LP Cao Thủ / Thách Đấu' },
  { value: 'PLACEMENTS', label: 'Phân Hạng Đầu Mùa (5 Trận)' },
  { value: 'LEVELING', label: 'Cày Cấp Độ 1-30' },
  { value: 'MASTERY', label: 'Cày Thông Thạo Tướng' },
];

interface BoosterItem {
  _id?: string;
  username: string;
  displayName?: string;
  avatar?: string;
  rating?: number;
  completedOrders?: number;
}

interface BoostersFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterService: string;
  setFilterService: (service: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  boosters?: BoosterItem[];
}

export default function BoostersFilterBar({
  searchTerm,
  setSearchTerm,
  filterService,
  setFilterService,
  sortBy,
  setSortBy,
  boosters = []
}: BoostersFilterBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fetchedSuggestions, setFetchedSuggestions] = useState<SearchSuggestionItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory('recent_boosters_page_search');

  // Tìm kiếm live booster từ backend API khi gõ từ khóa
  useEffect(() => {
    const q = searchTerm.trim();
    if (!q) {
      setFetchedSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/boosters?search=${encodeURIComponent(q)}&limit=6`);
        if (!res.ok) return;
        const data = await res.json();
        const list: BoosterItem[] = data.boosters || [];
        const items: SearchSuggestionItem[] = list.map((b) => ({
          label: b.displayName || b.username,
          subLabel: `@${b.username} • ⭐ ${(b.rating ?? 5).toFixed(1)} (${b.completedOrders ?? 0} đơn)`,
          category: 'Tuyển thủ',
          avatar: b.avatar,
        }));
        setFetchedSuggestions(items);
      } catch (err) {
        console.error('Error fetching booster suggestions:', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Kết hợp data từ prop boosters và live API
  const liveSuggestions: SearchSuggestionItem[] = React.useMemo(() => {
    const map = new Map<string, SearchSuggestionItem>();

    // 1. Thêm từ danh sách boosters hiện có trên trang
    (boosters || []).forEach((b) => {
      const name = b.displayName || b.username;
      map.set(name.toLowerCase(), {
        label: name,
        subLabel: `@${b.username} • ⭐ ${(b.rating ?? 5).toFixed(1)} (${b.completedOrders ?? 0} đơn)`,
        category: 'Tuyển thủ',
        avatar: b.avatar,
      });
    });

    // 2. Thêm từ kết quả live fetch API
    fetchedSuggestions.forEach((s) => {
      if (!map.has(s.label.toLowerCase())) {
        map.set(s.label.toLowerCase(), s);
      }
    });

    return Array.from(map.values());
  }, [boosters, fetchedSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    setSearchTerm(val);
    addSearch(val);
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      addSearch(searchTerm.trim());
      setIsDropdownOpen(false);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-10 backdrop-blur-xl space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div ref={containerRef} className="relative flex-1 z-30">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm kiếm tuyển thủ theo tên hoặc nickname..."
            value={searchTerm}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onKeyDown={handleKeyDown}
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

          {/* Dropdown Lịch Sử & Gợi Ý Tuyển Thủ Trực Tuyến */}
          <SearchHistoryDropdown
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            query={searchTerm}
            history={history}
            onSelect={handleSelect}
            onRemove={removeSearch}
            onClearAll={clearHistory}
            liveSuggestions={liveSuggestions}
            title="Tuyển thủ tìm gần đây"
          />
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
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800">
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
  );
}
