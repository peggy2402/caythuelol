'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, User as UserIcon, Heart, ChevronRight, Loader2, ShieldCheck, Trophy, Zap, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface BoosterCardProps {
  booster: any;
  isBookmarked: boolean;
  onToggleBookmark: (boosterId: string, e: React.MouseEvent) => void;
}

export default function BoosterCard({ booster, isBookmarked, onToggleBookmark }: BoosterCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isNavigatingProfile, setIsNavigatingProfile] = useState(false);
  const [isNavigatingHire, setIsNavigatingHire] = useState(false);

  const rawRank = booster.games?.[0]?.ranks?.[0] || 'CHALLENGER';
  const cleanRankKey = rawRank.split(/[_ ]/)[0].toLowerCase();
  const profileUrl = `/b/${booster.username}`;
  const hireUrl = `/services/lol/rank-boost?booster=@${booster.username}`;

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigatingProfile(true);
    router.push(profileUrl);
  };

  const handleHireClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigatingHire(true);
    router.push(hireUrl);
  };

  return (
    <div className="group relative bg-[#07090e]/90 backdrop-blur-xl border border-zinc-800/80 rounded-3xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(6,182,212,0.15)] flex flex-col justify-between">
      
      {/* Top Banner & Bookmark */}
      <div 
        className="h-28 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-zinc-950 relative cursor-pointer overflow-hidden"
        onClick={handleProfileClick}
      >
        {/* Subtle grid and glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07090e]" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-colors pointer-events-none" />

        {/* Online Status Pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[10px] font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sẵn sàng nhận đơn</span>
        </div>

        {/* Bookmark Heart Button */}
        <button
          type="button"
          onClick={(e) => onToggleBookmark(booster._id, e)}
          className="absolute top-3 right-3 p-2 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 text-white transition-all z-20 group/heart"
          title="Lưu tuyển thủ"
        >
          <Heart className={`w-4 h-4 transition-colors ${isBookmarked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400 group-hover/heart:text-rose-400'}`} />
        </button>

        {/* Center Floating Avatar with Glowing Ring */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.35)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-zinc-950 rounded-2xl overflow-hidden flex items-center justify-center relative">
              {isNavigatingProfile && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                </div>
              )}
              {booster.avatar ? (
                <Image src={booster.avatar} alt={booster.username} fill className="object-cover" sizes="80px" />
              ) : (
                <span className="text-2xl font-black text-cyan-400 font-mono">
                  {booster.username?.charAt(0)?.toUpperCase() || 'P'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Info Section */}
      <div className="pt-12 pb-6 px-6 flex flex-col flex-1 text-center">
        
        {/* Name and KYC Badge */}
        <a href={profileUrl} onClick={handleProfileClick} className="block mb-1 group/name">
          <h3 className="text-lg font-black text-white group-hover/name:text-cyan-300 transition-colors flex items-center justify-center gap-1.5">
            <span>{booster.displayName || booster.username}</span>
            <span title="Đã xác thực KYC"><ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" /></span>
          </h3>
          <span className="text-xs text-zinc-500 font-mono">@{booster.username}</span>
        </a>

        {/* Rating and Orders Count */}
        <div className="flex items-center justify-center gap-3 text-xs my-3 py-1.5 px-3 rounded-xl bg-zinc-950/70 border border-zinc-850">
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{booster.rating ? booster.rating.toFixed(1) : '5.0'}</span>
          </div>
          <span className="text-zinc-600">•</span>
          <div className="flex items-center gap-1 text-zinc-400 font-semibold">
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <span>{booster.completedOrders || 0} đơn xong</span>
          </div>
        </div>

        {/* Rank Badge */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-5 flex-1 items-start">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs font-bold text-cyan-300">
            {/* Rank Icon if available */}
            <img 
              src={`/images/ranks/${cleanRankKey}.png`} 
              alt={rawRank} 
              className="w-4 h-4 object-contain" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} 
            />
            <span>{rawRank.replace(/_/g, ' ')}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-emerald-400">
            <span>94% Winrate</span>
          </span>
        </div>

        {/* Action Buttons: Profile & Hire */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-850">
          <button
            type="button"
            onClick={handleProfileClick}
            disabled={isNavigatingProfile || isNavigatingHire}
            className="py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-1"
          >
            {isNavigatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Hồ sơ</span>}
          </button>

          <button
            type="button"
            onClick={handleHireClick}
            disabled={isNavigatingHire || isNavigatingProfile}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-105 disabled:opacity-60 flex items-center justify-center gap-1"
          >
            {isNavigatingHire ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Thuê ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
