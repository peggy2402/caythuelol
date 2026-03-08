'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Star, User as UserIcon, Loader2, Heart, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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

export default function FavoritesPage() {
  const { t } = useLanguage();
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/bookmarks?populate=true');
      if (res.ok) {
        const data = await res.json();
        setBoosters(data.bookmarks || []);
      }
    } catch (error) {
      console.error('Failed to fetch favorites', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const removeBookmark = async (boosterId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic update
    setBoosters(prev => prev.filter(b => b._id !== boosterId));
    toast.success('Đã xóa khỏi danh sách yêu thích');

    try {
        await fetch('/api/user/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boosterId })
        });
    } catch (e) {
        toast.error('Lỗi kết nối');
        fetchFavorites(); // Revert
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" /> Booster Yêu Thích
        </h1>
        <p className="text-zinc-400">Danh sách các cao thủ bạn đã lưu lại.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      ) : boosters.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
          <Heart className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Chưa có Booster nào</h3>
          <p className="text-zinc-500 mb-6">Hãy dạo quanh danh sách và thả tim cho Booster bạn thích nhé!</p>
          <Link href="/boosters" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
            Tìm Booster ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boosters.map((booster) => {
            const rank = booster.games?.[0]?.ranks?.[0];
            return (
            <div 
              key={booster._id} 
              className="group relative bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-zinc-900/60"
            >
              {/* Cover / Avatar Area */}
              <div className="h-28 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 relative">
                <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                
                {/* Remove Button */}
                <button
                    onClick={(e) => removeBookmark(booster._id, e)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-red-500/20 text-red-500 transition-all z-20"
                    title="Bỏ yêu thích"
                >
                    <Heart className="w-5 h-5 fill-current" />
                </button>

                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                  <Link href={`/b/${booster.username}`} className="block w-20 h-20 rounded-full border-4 border-zinc-950 bg-zinc-900 overflow-hidden flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
                    {booster.avatar ? (
                      <img src={booster.avatar} alt={booster.username} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-zinc-500" />
                    )}
                  </Link>
                </div>
              </div>

              {/* Info Area */}
              <div className="pt-12 pb-6 px-6 text-center">
                <Link href={`/b/${booster.username}`} className="block">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{booster.displayName || booster.username}</h3>
                </Link>
                <div className="flex items-center justify-center gap-1 text-yellow-500 mb-4">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold">{booster.rating?.toFixed(1) || '5.0'}</span>
                  <span className="text-zinc-500 text-sm ml-1">
                    ({booster.completedOrders || 0} đơn)
                  </span>
                </div>

                {/* Ranks */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {rank ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs font-bold text-yellow-500">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={`/images/ranks/${rank.split(/[_ ]/)[0].toLowerCase()}.png`} 
                          alt={rank} 
                          className="w-3.5 h-3.5 object-contain"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                        {rank.replace('_', ' ')}
                      </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-zinc-800/50 border border-white/5 text-xs font-medium text-zinc-300">Challenger</span>
                  )}
                </div>

                <Link 
                  href={`/services?booster=@${booster.username}`} 
                  className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-white/10 hover:shadow-blue-500/30 group/btn"
                >
                  Thuê Ngay
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
