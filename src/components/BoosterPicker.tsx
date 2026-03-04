// src/app/services/lol/components/BoosterPicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Star, CheckCircle2, Loader2, Filter, ChevronRight } from 'lucide-react';

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

export default function BoosterPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentBoosterId = searchParams.get('booster');

  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterServer, setFilterServer] = useState('VN');

  useEffect(() => {
    const fetchBoosters = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/boosters?server=${filterServer}`);
        const data = await res.json();
        setBoosters(data.boosters || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoosters();
  }, [filterServer]);

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
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-sm">1</span>
          Chọn Booster
        </h2>
        
        {/* Server Filter */}
        <div className="relative">
            <select 
                value={filterServer} 
                onChange={(e) => setFilterServer(e.target.value)}
                className="appearance-none bg-zinc-900 border border-white/10 rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-white focus:border-blue-500 outline-none"
            >
                {['VN', 'KR', 'JP', 'EUW', 'NA'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-2xl border border-white/5">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Đang tải danh sách Booster...
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
                {booster.booster_info?.ranks.slice(0, 2).map((rank, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-white/5 text-[10px] font-medium text-zinc-400 border border-white/5">{rank}</span>
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
