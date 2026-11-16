'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Heart, Loader2, ShieldCheck, Trophy, ArrowRight, Gamepad2 } from 'lucide-react';

interface BoosterCardProps {
  booster: any;
  isBookmarked: boolean;
  onToggleBookmark: (boosterId: string, e: React.MouseEvent) => void;
}

export default function BoosterCard({ booster, isBookmarked, onToggleBookmark }: BoosterCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const profileUrl = `/b/${booster.username}`;

  // Lấy dữ liệu thật, không mock
  const rating = typeof booster.rating === 'number' && booster.rating > 0 ? booster.rating : 0;
  const completedOrders = booster.completedOrders || booster.booster_info?.completed_orders || 0;
  
  // Game & Rank thật
  const userRank = booster.games?.[0]?.ranks?.[0] || booster.booster_info?.currentRank || '';
  const cleanRankKey = userRank ? userRank.split(/[_ ]/)[0].toLowerCase() : '';
  
  // Danh sách game nhận cày
  const mainGames = booster.games?.map((g: any) => g.gameCode || g.game) || booster.booster_info?.main_games || ['LMHT'];
  const winrate = booster.winrate || booster.booster_info?.winrate || null;

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push(profileUrl);
  };

  const isReady = booster.booster_info?.isReady !== false;

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-[#090d16]/90 hover:bg-[#0d1322] border border-white/10 hover:border-blue-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(37,99,235,0.18)] flex flex-col justify-between cursor-pointer"
    >
      {/* Top Banner */}
      <div className="h-24 bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/15 via-transparent to-transparent pointer-events-none" />

        {/* Trạng thái sẵn sàng */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-emerald-400">
          <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
          <span>{isReady ? 'Sẵn sàng nhận đơn' : 'Tạm nghỉ'}</span>
        </div>

        {/* Nút yêu thích / Thả tim */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(booster._id, e);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all z-20 hover:scale-110 active:scale-95 group/heart"
          title={isBookmarked ? 'Bỏ lưu tuyển thủ' : 'Lưu tuyển thủ'}
        >
          <Heart className={`w-4 h-4 transition-colors ${isBookmarked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400 group-hover/heart:text-rose-400'}`} />
        </button>
      </div>

      {/* Avatar Container: Nổi lên giữa đường phân cách, KHÔNG bị overflow-hidden cắt */}
      <div className="relative -mt-12 px-6 flex justify-center z-10">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 p-0.5 shadow-[0_0_25px_rgba(59,130,246,0.35)] group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-[#090d16] rounded-2xl overflow-hidden flex items-center justify-center relative">
              {isNavigating && (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-20">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              )}
              {booster.avatar || booster.profile?.avatar ? (
                <Image 
                  src={booster.avatar || booster.profile?.avatar} 
                  alt={booster.username} 
                  fill 
                  className="object-cover" 
                  sizes="80px" 
                />
              ) : (
                <span className="text-2xl font-black text-blue-400 font-mono">
                  {booster.username?.charAt(0)?.toUpperCase() || 'B'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin tuyển thủ */}
      <div className="pt-3 pb-5 px-5 flex flex-col flex-1 text-center">
        {/* Tên & Tag */}
        <div className="mb-2">
          <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5">
            <span>{booster.displayName || booster.username}</span>
            <span title="Tuyển thủ xác thực">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            </span>
          </h3>
          <span className="text-xs text-zinc-400 font-mono">@{booster.username}</span>
        </div>

        {/* Số liệu Đánh giá & Số đơn - Minh bạch thực tế */}
        <div className="flex items-center justify-center gap-2.5 text-xs my-2 py-1.5 px-3 rounded-xl bg-white/[0.03] border border-white/5">
          {rating > 0 ? (
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{rating.toFixed(1)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-zinc-400 text-[11px] font-medium">
              <Star className="w-3.5 h-3.5 text-zinc-500" />
              <span>Chưa có đánh giá</span>
            </div>
          )}
          <span className="text-zinc-700">•</span>
          <div className="flex items-center gap-1 text-zinc-400 font-semibold">
            <Trophy className="w-3.5 h-3.5 text-blue-400" />
            <span>{completedOrders} đơn xong</span>
          </div>
        </div>

        {/* Bậc Rank hoặc Game hỗ trợ */}
        <div className="flex flex-wrap justify-center items-center gap-1.5 my-2 min-h-[28px]">
          {userRank ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-300">
              <img 
                src={`/images/ranks/${cleanRankKey}.png`} 
                alt={userRank} 
                className="w-4 h-4 object-contain" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} 
              />
              <span>{userRank.replace(/_/g, ' ')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-zinc-400">
              <Gamepad2 className="w-3 h-3 text-blue-400" />
              <span>{mainGames.slice(0, 2).join(' / ')}</span>
            </span>
          )}

          {/* Winrate chỉ hiển thị nếu có số liệu thật */}
          {winrate ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
              {winrate}% Winrate
            </span>
          ) : null}
        </div>

        {/* CTA: Xem dịch vụ & Bảng giá của Tuyển thủ */}
        <div className="pt-3 mt-auto border-t border-white/5">
          <div className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold transition-all shadow-lg shadow-blue-600/25 group-hover:shadow-blue-500/40 flex items-center justify-center gap-1.5">
            {isNavigating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Xem dịch vụ & Bảng giá</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
