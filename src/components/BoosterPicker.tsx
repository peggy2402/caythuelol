// src/app/services/lol/components/BoosterPicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { User, Star, CheckCircle2, Loader2, Filter, ChevronRight, Search, X, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

interface Booster {
  _id: string;
  username: string;
  avatar?: string; // API mới trả về avatar ở root level
  displayName?: string;
  rating: number;
  services: string[];
  games: {
    gameCode: string;
    ranks: string[];
    servers: string[];
  }[];
  // Thêm kiểu cho booster_info để TypeScript không báo lỗi khi truy cập ranks cũ
  booster_info?: { isReady?: boolean; ranks?: string[] };
}

const SERVICE_OPTIONS = [
  { value: 'RANK_BOOST', label: 'Cày Rank/Elo' },
  { value: 'NET_WINS', label: 'Cày Điểm Cao Thủ/Thách Đấu' },
  { value: 'PLACEMENTS', label: 'Phân Hạng đầu mùa' },
  { value: 'LEVELING', label: 'Cày Level 30' },
  { value: 'MASTERY', label: 'Thông Thạo tướng' },
];

export default function BoosterPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentBoosterId = searchParams.get('booster');

  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Smart Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [sortBy, setSortBy] = useState('');

  // State for mobile view expansion
  const [showAll, setShowAll] = useState(false);

  // Debounce Search Input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchBoosters = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams({ search: debouncedSearch, service: filterService, sort: sortBy });
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
    // Giữ lại các params hiện tại, chỉ update booster
    const params = new URLSearchParams(searchParams.toString());
    const identifier = `@${booster.username}`;
    
    params.set('booster', identifier);
    router.push(`${pathname}?${params.toString().replace(/%40/g, '@')}`, { scroll: false });
  };

  const displayedBoosters = showAll ? boosters : boosters.slice(0, 4);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 shrink-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-sm">1</span>
          Chọn Booster
        </h2>
      </div>

      {/* --- SMART FILTER BAR --- */}
      <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 mb-6">
        {/* 1. Search Username */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text"
            placeholder="Tìm tên Booster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>}
        </div>

        {/* 2. Filter Service */}
        <div className="relative min-w-[180px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <select 
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-8 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all cursor-pointer"
          >
            <option value="">Tất cả dịch vụ</option>
            {SERVICE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
        </div>

        {/* 3. Sort By */}
        <div className="relative min-w-[180px]">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-8 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all cursor-pointer"
          >
            <option value="">Sắp xếp mặc định</option>
            <option value="rating_desc">Đánh giá cao nhất</option>
            <option value="orders_desc">Nhiều đơn nhất</option>
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-2xl border border-white/5">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Đang tải danh sách Booster...
        </div>
      ) : boosters.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
          Không tìm thấy Booster nào phù hợp với bộ lọc.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedBoosters.map((booster) => {
              const isSelected = currentBoosterId === booster._id || currentBoosterId === `@${booster.username}`;
              
              // 1. Tìm rank từ games (Cấu trúc mới)
              let rank = booster.games?.find(g => g.gameCode === 'LOL')?.ranks?.[0] || booster.games?.[0]?.ranks?.[0];
              // 2. Nếu không có, tìm từ booster_info (Cấu trúc cũ)
              if (!rank && booster.booster_info?.ranks?.length) rank = booster.booster_info.ranks[0];

              const isReady = booster.booster_info?.isReady ?? true;
              
              return (
              <div 
                key={booster._id}
                onClick={() => handleSelect(booster)}
                className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                    : 'border-white/10 bg-transparent hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-blue-500 transition-colors">
                    {booster.avatar ? (
                      <img src={booster.avatar} alt={booster.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-2 bg-zinc-800 text-zinc-400" />
                    )}
                    
                    {/* Status Indicator */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${isReady ? 'bg-green-500' : 'bg-zinc-500'}`} title={isReady ? 'Sẵn sàng' : 'Tạm nghỉ'} />
                  </div>
                  <div>
                    <Link 
                      href={`/b/${booster.username}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="block"
                    >
                      <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors hover:underline">
                        {booster.displayName || booster.username}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      {booster.rating?.toFixed(1) || 5.0}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {rank && (
                     <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 text-[10px] font-bold text-yellow-500 border border-yellow-500/20">
                       <img 
                          src={`/images/ranks/${rank.split(/[_ ]/)[0].toLowerCase()}.png`} 
                          alt={rank} 
                          className="w-3.5 h-3.5 object-contain"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                       />
                       {rank.replace('_', ' ')}
                     </span>
                  )}
                  {booster.services?.slice(0, 2).map((svc, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-white/5 text-[10px] font-medium text-zinc-400 border border-white/5">{svc.replace('_', ' ')}</span>
                  ))}
                </div>

                {isSelected && (
                  <div className="absolute top-4 right-4 text-blue-500 z-10">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>
            )})}
          </div>

          {boosters.length > 4 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-2 bg-zinc-800/50 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white text-sm font-bold rounded-lg transition-all"
              >
                {showAll ? 'Thu gọn' : `Xem tất cả (${boosters.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
