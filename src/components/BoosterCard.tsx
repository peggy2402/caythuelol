'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Heart, Loader2, ShieldCheck, Trophy, ArrowRight, Gamepad2, Clock } from 'lucide-react';
import UserBadge from '@/components/UserBadge';
import { getAovRankImageByInput } from '@/lib/aov';
import { getBoosterWorkingScheduleText } from '@/lib/booster-helpers';

interface BoosterCardProps {
  booster: any;
  isBookmarked: boolean;
  onToggleBookmark: (boosterId: string, e: React.MouseEvent) => void;
}

// Chuẩn hóa tên tựa game hiển thị: LOL và LMHT là 1
const formatGameName = (code: string) => {
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

// Màu sắc nhận diện từng tựa game
const getGameBadgeStyle = (gameName: string) => {
  const g = gameName.toLowerCase();
  if (g.includes('lmht') || g.includes('lol')) {
    return 'bg-blue-500/10 border-blue-500/25 text-blue-400';
  }
  if (g.includes('valorant') || g.includes('val')) {
    return 'bg-rose-500/10 border-rose-500/25 text-rose-400';
  }
  if (g.includes('đtcl') || g.includes('tft')) {
    return 'bg-purple-500/10 border-purple-500/25 text-purple-300';
  }
  if (g.includes('tốc chiến') || g.includes('wild')) {
    return 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300';
  }
  if (g.includes('liên quân')) {
    return 'bg-amber-500/10 border-amber-500/25 text-amber-300';
  }
  if (g.includes('cs2') || g.includes('cs')) {
    return 'bg-orange-500/10 border-orange-500/25 text-orange-400';
  }
  return 'bg-zinc-800/80 border-white/10 text-zinc-300';
};

// Trích xuất danh sách game có ít nhất 1 dịch vụ đang BẬT
const getBoosterActiveGames = (booster: any): string[] => {
  const customServices = 
    booster.booster_info?.service_settings?.customServices ||
    booster.service_settings?.customServices ||
    booster.customServices;

  if (Array.isArray(customServices) && customServices.length > 0) {
    // Chỉ lấy game của các service có isActive !== false
    const activeServices = customServices.filter((s: any) => s && s.isActive !== false);
    const activeGameCodes = activeServices
      .map((s: any) => s.gameCode || s.game || '')
      .filter((code: string) => Boolean(code.trim()));
    
    return Array.from(new Set(activeGameCodes.map((code: string) => formatGameName(code))));
  }

  // Nếu booster có service_settings nhưng customServices rỗng (chưa tạo dịch vụ nào cho game đã chọn)
  if (booster.booster_info?.service_settings || booster.service_settings) {
    const enabledServices = 
      booster.booster_info?.service_settings?.enabledServices ||
      booster.service_settings?.enabledServices;
    
    if (Array.isArray(enabledServices) && enabledServices.length > 0) {
      const mapped = enabledServices.map((srv: string) => {
        const s = String(srv).toUpperCase();
        if (s.includes('LOL') || s.includes('LMHT')) return 'LMHT';
        if (s.includes('VAL')) return 'Valorant';
        if (s.includes('TFT') || s.includes('DTCL')) return 'ĐTCL';
        if (s.includes('WR') || s.includes('TOCCHIEN')) return 'Tốc Chiến';
        return formatGameName(srv);
      });
      return Array.from(new Set(mapped.filter(Boolean)));
    }

    // Nếu có service_settings mà không có active service nào thì trả về rỗng
    return [];
  }

  // Trường hợp dữ liệu cũ không có service_settings, lấy từ profile games
  if (Array.isArray(booster.games) && booster.games.length > 0) {
    const codes = booster.games.map((g: any) => g.gameCode || g.game).filter(Boolean);
    return Array.from(new Set(codes.map((c: string) => formatGameName(String(c)))));
  }

  if (Array.isArray(booster.booster_info?.main_games) && booster.booster_info.main_games.length > 0) {
    return Array.from(new Set(booster.booster_info.main_games.map((c: string) => formatGameName(String(c)))));
  }

  return [];
};

// Ánh xạ tên rank (tiếng Anh hoặc tiếng Việt) sang tên file icon có sẵn trong public/images/ranks/
const resolveRankImageKey = (rank: string): string | null => {
  if (!rank) return null;
  const normalized = rank
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .trim();

  if (normalized.includes('challenger') || normalized.includes('thach dau')) return 'challenger';
  if (normalized.includes('grandmaster') || normalized.includes('dai cao thu')) return 'grandmaster';
  if (normalized.includes('master') || normalized.includes('cao thu')) return 'master';
  if (normalized.includes('diamond') || normalized.includes('kim cuong')) return 'diamond';
  if (normalized.includes('emerald') || normalized.includes('luc bao')) return 'emerald';
  if (normalized.includes('platinum') || normalized.includes('bach kim')) return 'platinum';
  if (normalized.includes('gold') || normalized.includes('vang')) return 'gold';
  if (normalized.includes('silver') || normalized.includes('bac')) return 'silver';
  if (normalized.includes('bronze') || normalized.includes('dong')) return 'bronze';
  if (normalized.includes('iron') || normalized.includes('sat')) return 'iron';
  return null;
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

  // Lấy dữ liệu thật, không mock
  const rating = typeof booster.rating === 'number' && booster.rating > 0 ? booster.rating : 0;
  const completedOrders = booster.completedOrders || booster.booster_info?.completed_orders || 0;
  
  // Game & Rank thật
  const primaryGameCode = (booster.games?.[0]?.gameCode || booster.games?.[0]?.game || '').toUpperCase();
  const userRank = (booster.games?.[0]?.ranks?.[0] && booster.games[0].ranks[0] !== 'N/A')
    ? booster.games[0].ranks[0]
    : (booster.booster_info?.highestRank || booster.booster_info?.currentRank || '');
  const cleanRankKey = resolveRankImageKey(userRank);
  const isPrimaryAov =
    ['AOV', 'LIENQUAN', 'LQM', 'ARENA_OF_VALOR'].includes(primaryGameCode) ||
    /tinh anh|veteran|chiến tướng|conqueror|huyền thoại|chiến thần/i.test(userRank);
  const userRankImgSrc = userRank
    ? isPrimaryAov
      ? getAovRankImageByInput(userRank)
      : cleanRankKey
      ? `/images/ranks/${cleanRankKey}.png`
      : null
    : null;
  
  // Chuẩn hóa danh sách game nhận cày thực tế (chỉ game đang BẬT dịch vụ, tối đa 3 badge + badge 3+)
  const normalizedGames = getBoosterActiveGames(booster);
  const displayedGames = normalizedGames.slice(0, 3);
  const hasMoreGames = normalizedGames.length > 3;
  const remainingGames = normalizedGames.slice(3);
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
            <UserBadge role="BOOSTER" size="sm" />
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
              <span>0/0</span>
            </div>
          )}
          <span className="text-zinc-700">•</span>
          <div className="flex items-center gap-1 text-zinc-400 font-semibold">
            <Trophy className="w-3.5 h-3.5 text-blue-400" />
            <span>{completedOrders} đơn xong</span>
          </div>
        </div>

        {/* Danh sách Game hỗ trợ (Chỉ hiển thị game có dịch vụ đang BẬT, tối đa 3 badge + badge 3+) */}
        <div className="flex flex-wrap justify-center items-center gap-1.5 my-2 min-h-[28px]">
          {userRank && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-300">
              {userRankImgSrc && (
                <img 
                  src={userRankImgSrc} 
                  alt={userRank} 
                  className="w-3.5 h-3.5 object-contain" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }} 
                />
              )}
              <span>{userRank.replace(/_/g, ' ')}</span>
            </span>
          )}

          {displayedGames.map((game) => (
            <span
              key={game}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getGameBadgeStyle(game)}`}
            >
              <Gamepad2 className="w-3 h-3 shrink-0" />
              <span>{game}</span>
            </span>
          ))}

          {hasMoreGames && (
            <span 
              title={`Các tựa game khác: ${remainingGames.join(', ')}`}
              className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-black text-cyan-300 font-mono tracking-tight hover:bg-cyan-500/25 transition-colors cursor-help"
            >
              3+
            </span>
          )}

          {!userRank && displayedGames.length === 0 && (
            <span className="text-[11px] font-medium text-zinc-500 italic">
              Chưa mở dịch vụ
            </span>
          )}

          {/* Winrate chỉ hiển thị nếu có số liệu thật */}
          {winrate ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
              {winrate}% Winrate
            </span>
          ) : null}
        </div>

        {/* Khung giờ làm việc / Lịch cày */}
        <div className="my-1.5 flex items-center justify-center gap-1.5 text-[11px] text-cyan-300 bg-cyan-950/30 border border-cyan-500/20 py-1 px-2.5 rounded-xl">
          <Clock size={12} className="text-cyan-400 shrink-0" />
          <span className="truncate">{getBoosterWorkingScheduleText(booster)}</span>
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
