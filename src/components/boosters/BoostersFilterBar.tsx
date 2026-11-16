'use client';

import { Search, Filter, X, ArrowUpDown, ChevronRight, Flame, Swords, Shield } from 'lucide-react';

export const SERVICE_OPTIONS = [
  { value: 'RANK_BOOST', label: 'Cày Rank / Elo Siêu Tốc' },
  { value: 'NET_WINS', label: 'Cày Điểm LP Cao Thủ / Thách Đấu' },
  { value: 'PLACEMENTS', label: 'Phân Hạng Đầu Mùa (5 Trận)' },
  { value: 'LEVELING', label: 'Cày Cấp Độ 1-30' },
  { value: 'MASTERY', label: 'Cày Thông Thạo Tướng' },
];

interface BoostersFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterService: string;
  setFilterService: (service: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export default function BoostersFilterBar({
  searchTerm,
  setSearchTerm,
  filterService,
  setFilterService,
  sortBy,
  setSortBy
}: BoostersFilterBarProps) {
  return (
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
