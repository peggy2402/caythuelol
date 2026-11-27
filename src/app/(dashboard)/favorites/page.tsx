'use client';

import { useState, useEffect } from 'react';
import { Loader2, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import BoosterCard from '@/components/BoosterCard';

export default function FavoritesPage() {
  const [boosters, setBoosters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/user/bookmarks', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : (data.bookmarks || []);
        // Chuẩn hóa danh sách booster
        const list = raw.filter((b: any) => b && typeof b === 'object' && b._id);
        setBoosters(list);
      } else {
        setBoosters([]);
      }
    } catch (error) {
      console.error('Failed to fetch favorites', error);
      setBoosters([]);
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
    setBoosters((prev) => prev.filter((b) => b._id !== boosterId));
    toast.success('Đã bỏ lưu Booster khỏi danh sách yêu thích');

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
        toast.error('Lỗi khi cập nhật danh sách yêu thích');
        fetchFavorites(); // Revert nếu lỗi
      }
    } catch (e) {
      toast.error('Lỗi kết nối máy chủ');
      fetchFavorites(); // Revert
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
            <Heart className="w-6 h-6 fill-current" />
          </span>
          <span>Booster Yêu Thích</span>
        </h1>
        <p className="text-zinc-400 text-sm">
          Danh sách các Booster cày thuê bạn đã đánh dấu quan tâm và muốn theo dõi.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
          <p className="text-zinc-400 text-sm">Đang tải danh sách Booster yêu thích...</p>
        </div>
      ) : boosters.length === 0 ? (
        /* Empty State đẹp mắt, hiện đại */
        <div className="text-center py-20 px-6 border-2 border-dashed border-white/10 rounded-3xl bg-[#090d16]/50 backdrop-blur-md max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4 shadow-inner">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1.5">Chưa có Booster yêu thích nào</h3>
          <p className="text-zinc-400 text-xs sm:text-sm mb-6 leading-relaxed">
            Bạn chưa lưu Booster nào. Hãy dạo quanh danh sách cao thủ và bấm vào biểu tượng trái tim để lưu lại nhé!
          </p>
          <Link
            href="/boosters"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <span>Khám phá danh sách Booster</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Lưới Card Booster đồng bộ phong cách với /boosters */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boosters.map((booster) => (
            <BoosterCard
              key={booster._id}
              booster={booster}
              isBookmarked={true}
              onToggleBookmark={(id, e) => removeBookmark(id, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
