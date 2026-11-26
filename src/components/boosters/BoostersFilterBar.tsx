'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ArrowUpDown, ChevronDown, RotateCcw } from 'lucide-react';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import SearchHistoryDropdown, { SearchSuggestionItem } from '@/components/common/SearchHistoryDropdown';

export const SERVICE_OPTIONS = [
  { value: 'RANK_BOOST', label: 'Cày Rank / Elo Siêu Tốc' },
  { value: 'NET_WINS', label: 'Cày Điểm LP Cao Thủ / Thách Đấu' },
  { value: 'PLACEMENTS', label: 'Phân Hạng Đầu Mùa (5 Trận)' },
  { value: 'LEVELING', label: 'Cày Cấp Độ 1-30' },
  { value: 'MASTERY', label: 'Cày Thông Thạo Tướng' },
  { value: 'COACHING', label: 'Huấn Luyện Coaching 1-1' },
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

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search booster từ API
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

  // Kết hợp data suggestions
  const liveSuggestions: SearchSuggestionItem[] = React.useMemo(() => {
    const map = new Map<string, SearchSuggestionItem>();

    (boosters || []).forEach((b) => {
      const name = b.displayName || b.username;
      map.set(name.toLowerCase(), {
        label: name,
        subLabel: `@${b.username} • ⭐ ${(b.rating ?? 5).toFixed(1)} (${b.completedOrders ?? 0} đơn)`,
        category: 'Tuyển thủ',
        avatar: b.avatar,
      });
    });

    fetchedSuggestions.forEach((s) => {
      if (!map.has(s.label.toLowerCase())) {
        map.set(s.label.toLowerCase(), s);
      }
    });

    return Array.from(map.values());
  }, [boosters, fetchedSuggestions]);

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

  const hasActiveFilters = Boolean(searchTerm || filterService || sortBy !== 'rating_desc');

  return (
    <div className="mb-8">
      {/* Thanh Console Lọc & Tìm Kiếm Tối Giản, Đẹp Mắt */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        
        {/* 1. Ô Tìm Kiếm Tuyển Thủ (Live Suggestions + History) */}
        <div ref={containerRef} className="relative flex-1 z-30">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
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
            className="w-full bg-zinc-950/80 border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
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

        {/* 2. Dải Bộ Lọc Dịch Vụ & Sắp Xếp */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Lọc Dịch Vụ */}
          <div className="relative flex-1 md:w-56">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="w-full appearance-none bg-zinc-950/80 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm font-medium text-white focus:border-cyan-500 outline-none transition-colors cursor-pointer truncate"
            >
              <option value="">Tất cả dịch vụ</option>
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          </div>

          {/* Sắp Xếp */}
          <div className="relative flex-1 md:w-56">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none bg-zinc-950/80 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm font-medium text-white focus:border-cyan-500 outline-none transition-colors cursor-pointer truncate"
            >
              <option value="rating_desc">⭐ Đánh giá cao nhất</option>
              <option value="orders_desc">🏆 Nhiều đơn hoàn thành nhất</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          </div>

          {/* Nút Reset bộ lọc (khi có lọc) */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterService('');
                setSortBy('rating_desc');
              }}
              title="Đặt lại bộ lọc"
              className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center justify-center shrink-0 text-xs font-bold gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
