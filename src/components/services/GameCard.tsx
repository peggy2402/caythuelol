'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Flame, Sparkles, ThumbsUp, Award, TrendingUp, Info } from 'lucide-react';
import { resolveGameBadge, type GameDefinition } from '@/lib/games';

interface GameCardProps {
  game: GameDefinition;
  priority?: boolean;
}

const BADGE_CONFIG = {
  HOT: {
    label: 'HOT',
    icon: Flame,
    style: 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-[0_0_14px_rgba(244,63,94,0.35)]',
  },
  'Mới': {
    label: 'MỚI',
    icon: Sparkles,
    style: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-[0_0_14px_rgba(16,185,129,0.35)]',
  },
  'Phổ Biến': {
    label: 'PHỔ BIẾN',
    icon: ThumbsUp,
    style: 'bg-sky-500/25 text-sky-300 border-sky-500/50 shadow-[0_0_14px_rgba(14,165,233,0.35)]',
  },
  'Đề xuất': {
    label: 'ĐỀ XUẤT',
    icon: Award,
    style: 'bg-purple-500/25 text-purple-300 border-purple-500/50 shadow-[0_0_14px_rgba(168,85,247,0.35)]',
  },
  'Xu hướng': {
    label: 'XU HƯỚNG',
    icon: TrendingUp,
    style: 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_14px_rgba(245,158,11,0.35)]',
  },
};

export default function GameCard({ game, priority = false }: GameCardProps) {
  // Ưu tiên tải bannerUrl online trước, nếu lỗi hoặc trống thì fallback về banner local
  const initialImage = game.bannerUrl || game.banner || null;
  const [currentSrc, setCurrentSrc] = useState<string | null>(initialImage);
  const [isFailed, setIsFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCurrentSrc(game.bannerUrl || game.banner || null);
    setIsFailed(false);
    setIsLoaded(false);
  }, [game.bannerUrl, game.banner]);

  const handleImageError = () => {
    // Nếu bannerUrl online bị lỗi, thử fallback về local banner nếu có
    if (currentSrc === game.bannerUrl && game.banner && game.banner !== game.bannerUrl) {
      setCurrentSrc(game.banner);
    } else {
      // Cả hai đều không tải được -> fallback về Cyber Neon Glow
      setIsFailed(true);
    }
  };

  // Tính toán nhãn thông minh dựa trên số liệu thực tế của game (HOT, Mới, Đề xuất, Xu hướng, Phổ biến)
  const resolved = resolveGameBadge(game);
  const badgeInfo = resolved.badge ? BADGE_CONFIG[resolved.badge] : null;
  const BadgeIcon = badgeInfo?.icon;
  const servicesCount = game.defaultServices?.length || 0;

  return (
    <Link
      href={`/services/${game.id}`}
      className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800/80 bg-[#0c0e14] hover:border-cyan-500/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(6,182,212,0.18)] flex flex-col justify-between p-4 sm:p-5 h-44 sm:h-48 select-none"
    >
      {/* 1. Large Ghost Watermark Text in Background */}
      <div className="absolute left-4 bottom-4 text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white/[0.04] select-none pointer-events-none truncate max-w-[80%] font-mono leading-none z-0">
        {game.shortName || game.name}
      </div>

      {/* 2. Right Side Character Artwork / Banner with Smooth Gradient Fades */}
      <div className="absolute right-0 top-0 bottom-0 w-3/5 sm:w-1/2 overflow-hidden pointer-events-none z-0">
        {currentSrc && !isFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentSrc}
            alt={game.name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ${
              isLoaded ? 'opacity-75 group-hover:opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="w-full h-full relative flex items-center justify-end pr-4">
            <div
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${game.gradient || 'from-cyan-600 to-blue-700'} blur-3xl opacity-30 group-hover:opacity-50 transition-opacity`}
            />
          </div>
        )}

        {/* Fading Gradient Overlay (from dark background to artwork) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e14] via-[#0c0e14]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14]/90 via-transparent to-transparent" />
      </div>

      {/* 3. Top Content: Tag Badge, Services Count & Nổi Bật (HOT / Mới / Phổ Biến...) */}
      <div className="relative z-10 space-y-2 max-w-[70%]">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-cyan-300 border border-cyan-500/30 shadow-sm">
            {game.shortName}
          </span>

          {badgeInfo && (
            <span
              title={resolved.reason}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border backdrop-blur-md transition-all ${badgeInfo.style}`}
            >
              {BadgeIcon && <BadgeIcon size={10} className="stroke-[2.5]" />}
              {badgeInfo.label}
            </span>
          )}

          {servicesCount > 0 && (
            <span className="text-[10px] font-bold text-emerald-400">
              {servicesCount} gói
            </span>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-snug group-hover:text-cyan-300 transition-colors drop-shadow-md line-clamp-2">
          {game.name}
        </h3>
      </div>

      {/* 4. Bottom Content: Circular Navigation Arrow Only (Chuẩn Riot UI/UX, loại bỏ chữ lặp lại) */}
      <div className="relative z-10 flex items-center justify-between mt-auto pt-2">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900/90 border border-white/10 text-zinc-300 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black group-hover:border-cyan-400 group-hover:scale-110 transition-all duration-300 shadow-md">
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Thông tin phụ mờ nhẹ giúp card cân đối, không lặp lại icon mũi tên */}
        <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-400 transition-colors tracking-wide">
          Bảo chứng Escrow 100%
        </span>
      </div>
    </Link>
  );
}
