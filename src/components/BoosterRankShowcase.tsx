'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Trophy, Shield, Sparkles, Flame, Award, Zap } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games';
import { getAovRankImageByInput } from '@/lib/aov';

interface BoosterGameItem {
  gameCode: string;
  ranks?: string[];
  servers?: string[];
  performanceScore?: number;
  tier?: string;
}

interface BoosterRankShowcaseProps {
  boosterGames: BoosterGameItem[];
  defaultCurrentRank?: string;
  defaultHighestRank?: string;
  performanceScore?: number;
  tier?: string;
  tierName?: string;
}

// Helper lấy icon rank chuẩn theo từng game và bậc rank
function getGameRankIcon(gameCode: string, rankName: string, isHighest: boolean = false): string {
  const g = (gameCode || 'LOL').toUpperCase();
  const r = (rankName || '').toLowerCase().trim();

  // 1. VALORANT
  if (g === 'VALORANT' || g === 'VAL') {
    if (r.includes('radiant')) return '/images/valorant/Radiant_Rank.png';
    if (r.includes('immortal 3') || r.includes('immortal_3')) return '/images/valorant/Immortal_3_Rank.png';
    if (r.includes('immortal 2') || r.includes('immortal_2')) return '/images/valorant/Immortal_2_Rank.png';
    if (r.includes('immortal 1') || r.includes('immortal')) return '/images/valorant/Immortal_1_Rank.png';
    if (r.includes('ascendant')) return '/images/valorant/Ascendant_3_Rank.png';
    if (r.includes('diamond')) return '/images/valorant/Diamond_3_Rank.png';
    if (r.includes('platinum')) return '/images/valorant/Platinum_3_Rank.png';
    if (r.includes('gold')) return '/images/valorant/Gold_3_Rank.png';
    return isHighest ? '/images/valorant/Radiant_Rank.png' : '/images/valorant/Diamond_3_Rank.png';
  }

  // 2. LIÊN QUÂN (AOV) - Trỏ đúng tên file tồn tại trong public/images/aov/
  if (g === 'AOV' || g === 'LIENQUAN' || g === 'LQM' || g === 'ARENA_OF_VALOR') {
    if (r) {
      return getAovRankImageByInput(rankName);
    }
    return isHighest ? '/images/aov/Legend.png' : '/images/aov/Master.png';
  }

  // 3. LMHT / LOL (Mặc định)
  if (r.includes('challenger') || r.includes('thách đấu')) return '/images/ranks/challenger.png';
  if (r.includes('grandmaster') || r.includes('đại cao thủ')) return '/images/ranks/grandmaster.png';
  if (r.includes('master') || r.includes('cao thủ')) return '/images/ranks/master.png';
  if (r.includes('diamond') || r.includes('kim cương')) return '/images/ranks/diamond.png';
  if (r.includes('emerald') || r.includes('lục bảo')) return '/images/ranks/emerald.png';
  if (r.includes('platinum') || r.includes('bạch kim')) return '/images/ranks/platinum.png';
  if (r.includes('gold') || r.includes('vàng')) return '/images/ranks/gold.png';
  if (r.includes('silver') || r.includes('bạc')) return '/images/ranks/silver.png';
  if (r.includes('bronze') || r.includes('đồng')) return '/images/ranks/bronze.png';
  if (r.includes('iron') || r.includes('sắt')) return '/images/ranks/iron.png';

  // Fallback icon
  return isHighest ? '/images/ranks/challenger.png' : '/images/ranks/diamond.png';
}

// Màu sắc và huy hiệu theo Tier
const TIER_META: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  BRONZE: { color: 'text-amber-500', bg: 'bg-amber-950/40', border: 'border-amber-700/50', glow: 'shadow-amber-900/30' },
  SILVER: { color: 'text-slate-300', bg: 'bg-slate-900/50', border: 'border-slate-500/40', glow: 'shadow-slate-500/20' },
  GOLD: { color: 'text-yellow-400', bg: 'bg-yellow-950/40', border: 'border-yellow-500/50', glow: 'shadow-yellow-500/30' },
  PLATINUM: { color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/50', glow: 'shadow-cyan-500/30' },
  DIAMOND: { color: 'text-sky-300', bg: 'bg-sky-950/50', border: 'border-sky-400/60', glow: 'shadow-sky-400/40' },
  MASTER: { color: 'text-purple-400', bg: 'bg-purple-950/50', border: 'border-purple-500/60', glow: 'shadow-purple-500/40' },
  GRANDMASTER: { color: 'text-rose-400', bg: 'bg-rose-950/50', border: 'border-rose-500/60', glow: 'shadow-rose-500/40' },
  CHALLENGER: { color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-400/60', glow: 'shadow-amber-400/40' },
};

// Ánh xạ sang tên tiếng Việt dễ hiểu cho game thủ
const TIER_VIETNAMESE_NAMES: Record<string, string> = {
  BRONZE: 'Đồng',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
  PLATINUM: 'Bạch Kim',
  DIAMOND: 'Kim Cương',
  MASTER: 'Cao Thủ',
  GRANDMASTER: 'Đại Cao Thủ',
  CHALLENGER: 'Thách Đấu',
};

export default function BoosterRankShowcase({
  boosterGames = [],
  defaultCurrentRank,
  defaultHighestRank,
  performanceScore = 88,
  tier = 'DIAMOND',
  tierName = 'Diamond',
}: BoosterRankShowcaseProps) {
  // CHỈ LẤY NHỮNG GAME ĐÃ ĐƯỢC CẤU HÌNH RANK (loại bỏ hoàn toàn các game có ranks rỗng [])
  const configuredGames = (boosterGames || []).filter(
    (g) => g.ranks && g.ranks.length > 0 && g.ranks.some((r) => r && r !== 'N/A' && r.trim() !== '')
  );

  const gamesList = configuredGames.length > 0
    ? configuredGames
    : [{ gameCode: 'LOL', ranks: [defaultHighestRank || 'Thách Đấu', defaultCurrentRank || 'Cao Thủ'], servers: ['VN'] }];

  // Game đang được chọn để xem rank
  const [selectedGameCode, setSelectedGameCode] = useState<string>(
    gamesList[0]?.gameCode?.toUpperCase() || 'LOL'
  );

  // Đảm bảo selectedGameCode luôn nằm trong danh sách gamesList hợp lệ
  const activeCode = gamesList.some((g) => g.gameCode.toUpperCase() === selectedGameCode.toUpperCase())
    ? selectedGameCode
    : gamesList[0].gameCode;

  const currentGameItem = gamesList.find(
    (g) => g.gameCode.toUpperCase() === activeCode.toUpperCase()
  ) || gamesList[0];

  const matchedCatalogGame = GAMES_CATALOG.find(
    (g) => g.id.toUpperCase() === activeCode.toUpperCase() || (g.shortName || '').toUpperCase() === activeCode.toUpperCase()
  );

  const gameDisplayName = matchedCatalogGame?.name || activeCode;

  // Lấy rank của game đang chọn trực tiếp từ cấu hình của tuyển thủ
  const ranksList = currentGameItem?.ranks || [];

  // Rank cao nhất (ưu tiên ranksList[0], không bị ghi đè thành Thách Đấu nếu có rank tùy chỉnh như TEST)
  const highestRankDisplay = (ranksList.length > 0 && ranksList[0] && ranksList[0] !== 'N/A')
    ? ranksList[0]
    : defaultHighestRank || 'Thách Đấu';

  // Rank hiện tại (ưu tiên ranksList[1], fallback ranksList[0])
  const currentRankDisplay = (ranksList.length > 1 && ranksList[1] && ranksList[1] !== 'N/A')
    ? ranksList[1]
    : (ranksList.length > 0 && ranksList[0] && ranksList[0] !== 'N/A')
    ? ranksList[0]
    : defaultCurrentRank || highestRankDisplay;

  const currentTierKey = (tier || 'DIAMOND').toUpperCase();
  const tierMeta = TIER_META[currentTierKey] || TIER_META.DIAMOND;
  const vietnameseTierName = TIER_VIETNAMESE_NAMES[currentTierKey] || tierName || 'Kim Cương';

  return (
    <div className="bg-[#0d1017]/90 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md space-y-4">
      {/* 1. Header: Tiêu đề + Cấp Bậc Tier Tuyển Thủ & Performance Score */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/5">
        <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <Trophy size={16} className="text-amber-400 shrink-0" />
          <span>Trình độ & Cấp bậc Tuyển thủ</span>
        </h3>

        {/* Tier Badge & Performance Score - Rõ nghĩa tiếng Việt */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold border ${tierMeta.bg} ${tierMeta.border} ${tierMeta.color} shadow-sm`}
            title={`Cấp bậc đánh giá năng lực tuyển thủ: ${vietnameseTierName}`}
          >
            <Award size={13} className="shrink-0" />
            <span>Hạng: {vietnameseTierName}</span>
          </span>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold"
            title="Điểm hiệu suất tuyển thủ"
          >
            <Zap size={12} className="text-amber-400 shrink-0" />
            <span>{performanceScore}/100</span>
          </span>
        </div>
      </div>

      {/* 2. Tabs Chuyển Đổi Nhanh Giữa Các Game Tuyển Thủ Cày (Chỉ hiển thị các game ĐÃ CẤU HÌNH) */}
      {gamesList.length > 1 && (
        <div>
          <div className="text-[11px] text-zinc-400 mb-1.5 font-medium flex items-center justify-between">
            <span>Chọn tựa game để xem chi tiết rank:</span>
            <span className="text-zinc-500">{gamesList.length} game đã xác thực</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {gamesList.map((g) => {
              const code = g.gameCode.toUpperCase();
              const isSelected = activeCode.toUpperCase() === code;
              const catGame = GAMES_CATALOG.find((cg) => cg.id.toUpperCase() === code || (cg.shortName || '').toUpperCase() === code);
              const label = catGame?.shortName || code;
              const bannerImg = catGame?.banner || `/images/games/${code.toLowerCase()}-card.jpg`;

              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedGameCode(code)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
                      : 'bg-zinc-950/80 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <div className="relative w-4 h-4 rounded overflow-hidden shrink-0">
                    <Image
                      src={bannerImg}
                      alt={label}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 2 Card Rank Cho Game Đang Chọn: Hiển thị đầy đủ chữ không bao giờ bị cắt '...' */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* RANK HIỆN TẠI Card */}
        <div className="bg-[#090d16] p-3 sm:p-3.5 rounded-2xl border border-cyan-500/30 flex items-center gap-3 relative overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="relative w-12 h-12 shrink-0">
            <Image
              src={getGameRankIcon(activeCode, currentRankDisplay, false)}
              alt="Current Rank"
              fill
              className="object-contain drop-shadow"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-0.5">
              RANK HIỆN TẠI
            </div>
            <div
              className="text-sm sm:text-base font-black text-cyan-300 leading-snug break-words"
              title={currentRankDisplay}
            >
              {currentRankDisplay}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {matchedCatalogGame?.name || activeCode}
            </div>
          </div>
        </div>

        {/* RANK CAO NHẤT Card */}
        <div className="bg-[#140a1c] p-3 sm:p-3.5 rounded-2xl border border-purple-500/30 flex items-center gap-3 relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <div className="relative w-12 h-12 shrink-0">
            <Image
              src={getGameRankIcon(activeCode, highestRankDisplay, true)}
              alt="Highest Rank"
              fill
              className="object-contain drop-shadow"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-0.5">
              RANK CAO NHẤT (PEAK)
            </div>
            <div
              className="text-sm sm:text-base font-black text-purple-300 leading-snug break-words"
              title={highestRankDisplay}
            >
              {highestRankDisplay}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {matchedCatalogGame?.name || activeCode}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-0.5">
        <Sparkles size={12} className="text-amber-400 shrink-0" />
        <span className="truncate">
          Trình độ tuyển thủ xác thực cho tựa game <strong>{gameDisplayName}</strong>
        </span>
      </div>
    </div>
  );
}
