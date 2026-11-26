'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Heart, Loader2, Trophy, ArrowRight, Gamepad2, Clock, Crown } from 'lucide-react';
import UserBadge from '@/components/UserBadge';
import { getBoosterWorkingScheduleText } from '@/lib/booster-helpers';

interface BoosterCardProps {
  booster: any;
  isBookmarked: boolean;
  onToggleBookmark: (boosterId: string, e: React.MouseEvent) => void;
}

// Chuẩn hóa tên tựa game hiển thị
export const formatGameName = (code: string) => {
  const c = (code || '').toUpperCase().trim();
  if (c === 'LOL' || c === 'LMHT' || c === 'LEAGUE OF LEGENDS' || c === 'LEAGUE_OF_LEGENDS') return 'LMHT';
  if (c === 'TFT' || c === 'DTCL') return 'ĐTCL';
  if (c === 'VALORANT' || c === 'VAL') return 'Valorant';
  if (c === 'WILD_RIFT' || c === 'TOCCHIEN' || c === 'WILDRIFT') return 'Tốc Chiến';
  if (c === 'ARENA_OF_VALOR' || c === 'LIENQUAN' || c === 'AOV' || c === 'LQM') return 'Liên Quân';
  if (c === 'FC_ONLINE' || c === 'FO4') return 'FC Online';
  if (c === 'CS2' || c === 'CS' || c === 'CSGO') return 'CS2';
  return code || 'LMHT';
};

// Màu sắc nhận diện từng tựa game trên badge avatar
export const getGameTagColor = (gameName: string) => {
  const g = gameName.toLowerCase();
  if (g.includes('lmht') || g.includes('lol')) {
    return 'text-sky-400 border-sky-500/40 bg-sky-950/80';
  }
  if (g.includes('valorant') || g.includes('val')) {
    return 'text-rose-400 border-rose-500/40 bg-rose-950/80';
  }
  if (g.includes('đtcl') || g.includes('tft')) {
    return 'text-purple-300 border-purple-500/40 bg-purple-950/80';
  }
  if (g.includes('tốc chiến') || g.includes('wild')) {
    return 'text-cyan-300 border-cyan-500/40 bg-cyan-950/80';
  }
  if (g.includes('liên quân')) {
    return 'text-amber-300 border-amber-500/40 bg-amber-950/80';
  }
  if (g.includes('cs2') || g.includes('cs')) {
    return 'text-orange-400 border-orange-500/40 bg-orange-950/80';
  }
  return 'text-zinc-300 border-white/20 bg-zinc-900/80';
};

// Chuyển đổi mã enum dịch vụ backend (RANK_BOOST, NET_WINS...) sang tiếng Việt thân thiện, rõ ràng
export function formatBoosterCardServiceBadge(raw: string): string {
  if (!raw) return 'Cày Thuê';
  const s = String(raw).toUpperCase().replace(/[-\s]/g, '_');
  const map: Record<string, string> = {
    RANK_BOOST: 'Cày Rank',
    RANK_BOOSTING: 'Cày Rank',
    PROMOTION: 'Lên Hạng',
    NET_WINS: 'Thắng Trận',
    PLACEMENTS: 'Phân Hạng',
    PLACEMENT: 'Phân Hạng',
    LEVELING: 'Cày Level',
    MASTERY: 'Thông Thạo',
    COACHING: 'Huấn Luyện',
    ONBET: 'Đấu Đỉnh Cao',
    DUO: 'Duo Cùng Booster',
    DUO_BOOST: 'Duo Booster',
    STAR_BOOST: 'Cày Sao',
    AOV_STAR: 'Cày Sao',
    MATCHES: 'Cày Số Trận',
    POINT_BOOST: 'Cày Điểm LP',
  };

  return map[s] || raw.replace(/_/g, ' ');
}

// Trích xuất tất cả tựa game có dịch vụ của tuyển thủ
export const getBoosterActiveGames = (booster: any): string[] => {
  const customServices = 
    booster.booster_info?.service_settings?.customServices ||
    booster.service_settings?.customServices ||
    booster.customServices;

  if (Array.isArray(customServices) && customServices.length > 0) {
    const activeServices = customServices.filter((s: any) => s && s.isActive !== false);
    const activeGameCodes = activeServices
      .map((s: any) => s.gameCode || s.game || '')
      .filter((code: string) => Boolean(code.trim()));
    
    if (activeGameCodes.length > 0) {
      return Array.from(new Set(activeGameCodes.map((code: string) => formatGameName(code))));
    }
  }

  if (Array.isArray(booster.games) && booster.games.length > 0) {
    const codes = booster.games.map((g: any) => g.gameCode || g.game).filter(Boolean);
    if (codes.length > 0) {
      return Array.from(new Set(codes.map((c: string) => formatGameName(String(c)))));
    }
  }

  if (Array.isArray(booster.booster_info?.main_games) && booster.booster_info.main_games.length > 0) {
    return Array.from(new Set(booster.booster_info.main_games.map((c: string) => formatGameName(String(c)))));
  }

  return ['LMHT'];
};

// Trích xuất tựa game chính của tuyển thủ
export const getPrimaryGame = (booster: any): string => {
  const customServices = 
    booster.booster_info?.service_settings?.customServices ||
    booster.service_settings?.customServices ||
    booster.customServices;

  if (Array.isArray(customServices) && customServices.length > 0) {
    const active = customServices.find((s: any) => s && s.isActive !== false && (s.gameCode || s.game));
    if (active) return formatGameName(active.gameCode || active.game);
  }

  if (Array.isArray(booster.games) && booster.games.length > 0) {
    const code = booster.games[0]?.gameCode || booster.games[0]?.game;
    if (code) return formatGameName(String(code));
  }

  if (Array.isArray(booster.booster_info?.main_games) && booster.booster_info.main_games.length > 0) {
    return formatGameName(String(booster.booster_info.main_games[0]));
  }

  return 'LMHT';
};

// Trích xuất danh sách dịch vụ cày mà booster cung cấp
export const getBoosterServices = (booster: any): string[] => {
  const list: string[] = [];

  const customServices = 
    booster.booster_info?.service_settings?.customServices ||
    booster.service_settings?.customServices ||
    booster.customServices;

  if (Array.isArray(customServices) && customServices.length > 0) {
    customServices.forEach((s: any) => {
      if (s && s.isActive !== false) {
        const title = s.name || s.serviceType || s.slug;
        if (title && !list.includes(title)) list.push(title);
      }
    });
  }

  if (list.length === 0) {
    const enabled = 
      booster.booster_info?.service_settings?.enabledServices ||
      booster.service_settings?.enabledServices ||
      booster.services ||
      booster.booster_info?.services;

    if (Array.isArray(enabled)) {
      enabled.forEach((s: string) => {
        if (s && !list.includes(s)) list.push(s);
      });
    }
  }

  if (list.length === 0) {
    return ['RANK_BOOST', 'PROMOTION', 'NET_WINS'];
  }

  return list;
};

// Định dạng rank hiển thị có kèm icon vương miện và màu sắc
export const getRankDisplay = (rankStr?: string) => {
  if (!rankStr || rankStr === 'N/A') {
    return {
      text: 'CHALLENGER',
      color: 'text-amber-300 border-amber-500/30 bg-amber-950/40 shadow-amber-500/10'
    };
  }

  const upper = rankStr.toUpperCase().replace(/_/g, ' ');

  if (upper.includes('RADIANT')) {
    return {
      text: 'RADIANT',
      color: 'text-amber-300 border-amber-500/40 bg-amber-950/40 shadow-amber-500/15'
    };
  }
  if (upper.includes('CHALLENGER') || upper.includes('THÁCH ĐẤU')) {
    return {
      text: upper,
      color: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/40 shadow-cyan-500/15'
    };
  }
  if (upper.includes('GRANDMASTER') || upper.includes('ĐẠI CAO THỦ')) {
    return {
      text: upper,
      color: 'text-rose-300 border-rose-500/40 bg-rose-950/40 shadow-rose-500/15'
    };
  }
  if (upper.includes('MASTER') || upper.includes('CAO THỦ')) {
    return {
      text: upper,
      color: 'text-purple-300 border-purple-500/40 bg-purple-950/40 shadow-purple-500/15'
    };
  }
  if (upper.includes('DIAMOND') || upper.includes('KIM CƯƠNG')) {
    return {
      text: upper,
      color: 'text-blue-300 border-blue-500/40 bg-blue-950/40 shadow-blue-500/15'
    };
  }

  return {
    text: upper,
    color: 'text-emerald-300 border-emerald-500/30 bg-emerald-950/30 shadow-emerald-500/10'
  };
};

export default function BoosterCard({ booster, isBookmarked, onToggleBookmark }: BoosterCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const rawAvatar = booster.avatar || booster.profile?.avatar;
  const initialAvatar = rawAvatar && rawAvatar.trim() ? rawAvatar.trim() : '/default-avatar.png';
  const [currentAvatar, setCurrentAvatar] = useState(initialAvatar);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const handleAvatarError = () => {
    if (currentAvatar !== '/default-avatar.png') {
      setCurrentAvatar('/default-avatar.png');
    } else {
      setAvatarFailed(true);
    }
  };

  const profileUrl = `/b/${booster.username}`;

  // Dữ liệu đánh giá & hoàn thành
  const rating = typeof booster.rating === 'number' && booster.rating > 0 ? booster.rating : 5.0;
  const completedOrders = booster.completedOrders || booster.booster_info?.completed_orders || 0;
  
  // Tỷ lệ thắng xác định theo seed cố định nếu chưa có field
  const deterministicSeed = (booster._id || booster.username || 'booster')
    .split('')
    .reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
  const calculatedWinrate = 89 + (deterministicSeed % 10);
  const winrate = booster.winrate || booster.booster_info?.winrate || calculatedWinrate;

  // Rank & Tựa Game chính
  const rawRank = (booster.games?.[0]?.ranks?.[0] && booster.games[0].ranks[0] !== 'N/A')
    ? booster.games[0].ranks[0]
    : (booster.booster_info?.highestRank || booster.booster_info?.currentRank || 'Challenger');
  const rankInfo = getRankDisplay(rawRank);

  const primaryGame = getPrimaryGame(booster);
  const gameTagStyle = getGameTagColor(primaryGame);

  // Danh sách dịch vụ chuyển thể sang tiếng Việt có icon 🎮
  const services = getBoosterServices(booster);
  const displayedServices = services.slice(0, 3);
  const hasMoreServices = services.length > 3;

  const isReady = booster.booster_info?.isReady !== false;
  const workingSchedule = getBoosterWorkingScheduleText(booster);

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push(profileUrl);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-[#0a0d16] hover:bg-[#0e1320] border border-white/[0.08] hover:border-cyan-500/40 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.12)] cursor-pointer overflow-hidden backdrop-blur-xl"
    >
      {/* 1. Header Grid Pattern & Ambient Glow */}
      <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-cyan-600/10 via-blue-600/5 to-transparent pointer-events-none" />
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-28 bg-cyan-500/15 blur-3xl pointer-events-none rounded-full" />
      <div 
        className="absolute top-0 left-0 right-0 h-36 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '12px 12px' }}
      />

      <div>
        {/* 2. Top Bar: Trạng thái nhận đơn & Thả tim */}
        <div className="relative z-10 flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] sm:text-[11px] font-bold text-emerald-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
            <span>{isReady ? 'Sẵn sàng nhận đơn' : 'Tạm nghỉ'}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(booster._id, e);
            }}
            className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-rose-400 transition-all hover:scale-110 active:scale-95"
            title={isBookmarked ? 'Bỏ lưu tuyển thủ' : 'Lưu tuyển thủ'}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isBookmarked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'}`} />
          </button>
        </div>

        {/* 3. Avatar Tuyển thủ với Badge Game gắn liền chân Avatar */}
        <div className="relative z-10 flex justify-center mt-2 mb-3">
          <div className="relative">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl p-0.5 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_25px_rgba(6,182,212,0.25)] group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#0a0d16] rounded-2xl overflow-hidden flex items-center justify-center relative">
                {isNavigating && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-20">
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                )}
                {!avatarFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={currentAvatar} 
                    alt={booster.username} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={handleAvatarError}
                  />
                ) : (
                  <span className="text-2xl font-black text-cyan-400 font-mono">
                    {booster.username?.charAt(0)?.toUpperCase() || 'B'}
                  </span>
                )}
              </div>
            </div>

            {/* Game Badge dính chân avatar */}
            <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider shadow-md whitespace-nowrap z-20 ${gameTagStyle}`}>
              {primaryGame}
            </div>
          </div>
        </div>

        {/* 4. Tên hiển thị & Huy hiệu Booster chính thức & Username */}
        <div className="relative z-10 text-center mt-4 mb-2">
          <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-cyan-400 transition-colors flex items-center justify-center gap-1.5">
            <span className="truncate">{booster.displayName || booster.username}</span>
            <UserBadge role="BOOSTER" size="sm" />
          </h3>
          <span className="text-xs text-zinc-500 font-mono">@{booster.username}</span>
        </div>

        {/* 5. Rank Badge sang trọng (Challenger, Radiant, Thách đấu...) */}
        <div className="relative z-10 flex justify-center mb-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-extrabold tracking-wide shadow-sm ${rankInfo.color}`}>
            <Crown size={13} className="shrink-0" />
            <span className="truncate">{rankInfo.text}</span>
          </div>
        </div>

        {/* 6. Hộp 3 Cột Chỉ Số (Đánh giá, Đơn xong, Tỷ lệ thắng) */}
        <div className="relative z-10 grid grid-cols-3 gap-1 py-2 px-2.5 rounded-2xl bg-white/[0.03] border border-white/5 my-2.5 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-xs sm:text-sm font-black text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{rating.toFixed(1)}</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-medium mt-0.5">Đánh giá</div>
          </div>

          <div className="border-x border-white/5">
            <div className="flex items-center justify-center gap-1 text-xs sm:text-sm font-black text-cyan-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>{completedOrders}</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-medium mt-0.5">Đơn xong</div>
          </div>

          <div>
            <div className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
              {winrate}%
            </div>
            <div className="text-[10px] text-zinc-500 font-medium mt-0.5">Tỷ lệ thắng</div>
          </div>
        </div>

        {/* 7. Danh sách Dịch vụ cung cấp (Tiếng Việt thân thiện + Icon 🎮, KHÔNG dùng enum thô) */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 my-2.5 min-h-[26px]">
          {displayedServices.map((srv, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] font-semibold text-zinc-300"
            >
              <Gamepad2 size={12} className="text-cyan-400 shrink-0" />
              <span>{formatBoosterCardServiceBadge(srv)}</span>
            </span>
          ))}

          {hasMoreServices && (
            <span 
              title="Còn các dịch vụ khác..."
              className="inline-flex items-center px-2 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-300"
            >
              +{services.length - 3}
            </span>
          )}
        </div>

        {/* 8. Khung giờ làm việc */}
        <div className="relative z-10 my-2 py-1.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <Clock size={12} className="text-cyan-400 shrink-0" />
          <span className="truncate">{workingSchedule}</span>
        </div>
      </div>

      {/* 9. Nút CTA xem dịch vụ & bảng giá */}
      <div className="relative z-10 pt-2 mt-auto">
        <div className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold transition-all shadow-lg shadow-indigo-600/25 group-hover:shadow-indigo-500/40 flex items-center justify-center gap-1.5 group-hover:scale-[1.01]">
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
  );
}
