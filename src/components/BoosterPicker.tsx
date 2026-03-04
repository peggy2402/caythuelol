// src/app/services/lol/components/BoosterPicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Star, CheckCircle2, Loader2, Filter, ChevronRight, Search, X } from 'lucide-react';

interface Booster {
  _id: string;
  username: string;
  profile: { avatar?: string };
  booster_info?: { 
    ranks: string[]; 
    rating: number; 
    services?: string[];
  };
}

const SERVICE_OPTIONS = [
  { value: 'RANK_BOOST', label: 'Cày Rank' },
  { value: 'NET_WINS', label: 'Net Wins' },
  { value: 'PLACEMENTS', label: 'Phân Hạng' },
  { value: 'LEVELING', label: 'Cày Level' },
  { value: 'MASTERY', label: 'Thông Thạo' },
];

export default function BoosterPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentBoosterId = searchParams.get('booster');

  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Smart Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterService, setFilterService] = useState('');

  // Debounce Search Input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchBoosters = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams({ search: debouncedSearch, service: filterService });
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
  }, [debouncedSearch, filterService]);

  const handleSelect = (boosterId: string) => {
    // Giữ lại các params hiện tại, chỉ update booster
    const params = new URLSearchParams(searchParams.toString());
    if (currentBoosterId === boosterId) {
        // Nếu click lại booster đang chọn -> bỏ chọn (optional)
        // params.delete('booster'); 
    } else {
        params.set('booster', boosterId);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

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
        <div className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
          {boosters.map((booster) => (
            <div 
              key={booster._id}
              onClick={() => handleSelect(booster._id)}
              className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 min-w-[260px] snap-center ${
                currentBoosterId === booster._id
                  ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                  : 'border-white/10 bg-zinc-900/60 hover:border-white/20 hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-blue-500 transition-colors">
                  {booster.profile.avatar ? (
                    <img src={booster.profile.avatar} alt={booster.username} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-full h-full p-2 bg-zinc-800 text-zinc-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{booster.username}</h3>
                  <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    {booster.booster_info?.rating.toFixed(1)}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {booster.booster_info?.services?.slice(0, 2).map((svc, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-white/5 text-[10px] font-medium text-zinc-400 border border-white/5">{svc.replace('_', ' ')}</span>
                ))}
              </div>

              {currentBoosterId === booster._id && (
                <div className="absolute top-4 right-4 text-blue-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
