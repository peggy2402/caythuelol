'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Trophy, Shield, Sparkles } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games';

interface BoosterGameItem {
  gameCode: string;
  ranks?: string[];
  servers?: string[];
}

interface BoosterRankShowcaseProps {
  boosterGames: BoosterGameItem[];
  defaultCurrentRank?: string;
  defaultHighestRank?: string;
}

// Helper lấy icon rank chuẩn theo từng game và bậc rank
function getGameRankIcon(gameCode: string, rankName: string, isHighest: boolean = false): string {
  const g = (gameCode || 'LOL').toUpperCase();
  const r = (rankName || '').toLowerCase();

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

  // 2. LIÊN QUÂN (AOV)
  if (g === 'AOV' || g === 'LIENQUAN') {
    if (r.includes('thách đấu') || r.includes('challenger')) return '/images/aov/challenger.png';
    if (r.includes('chiến tướng') || r.includes('grandmaster')) return '/images/aov/grandmaster.png';
    if (r.includes('cao thủ') || r.includes('master')) return '/images/aov/master.png';
    if (r.includes('tinh anh') || r.includes('commander')) return '/images/aov/commander.png';
    if (r.includes('kim cương') || r.includes('diamond')) return '/images/aov/diamond.png';
    return isHighest ? '/images/aov/challenger.png' : '/images/aov/master.png';
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

  return isHighest ? '/images/ranks/challenger.png' : '/images/ranks/diamond.png';
}

export default function BoosterRankShowcase({
  boosterGames = [],
  defaultCurrentRank = 'N/A',
  defaultHighestRank = 'N/A',
}: BoosterRankShowcaseProps) {
  // Lấy danh sách các game booster hỗ trợ
  const gamesList = boosterGames.length > 0 ? boosterGames : [{ gameCode: 'LOL', ranks: [], servers: ['VN'] }];
  
  // Game đang được chọn để xem rank
  const [selectedGameCode, setSelectedGameCode] = useState<string>(
    gamesList[0]?.gameCode?.toUpperCase() || 'LOL'
  );

  const currentGameItem = gamesList.find(
    (g) => g.gameCode.toUpperCase() === selectedGameCode.toUpperCase()
  ) || gamesList[0];

  const matchedCatalogGame = GAMES_CATALOG.find(
    (g) => g.id.toUpperCase() === selectedGameCode.toUpperCase() || (g.shortName || '').toUpperCase() === selectedGameCode.toUpperCase()
  );

  const gameDisplayName = matchedCatalogGame?.name || selectedGameCode;

  // Lấy rank của game đang chọn
  const ranksList = currentGameItem?.ranks || [];
  const hasSpecificRank = ranksList.length > 0;
  
  // Nếu game này có cấu hình rank cụ thể, lấy rank đó
  // Nếu chưa có cấu hình riêng:
  // Nếu là LOL và có defaultHighestRank hợp lệ thì dùng, ngược lại hiển thị rank mặc định cam kết
  const highestRankDisplay = hasSpecificRank
    ? ranksList[0]
    : defaultHighestRank && defaultHighestRank !== 'N/A'
    ? defaultHighestRank
    : 'Cao Thủ / Thách Đấu';

  const currentRankDisplay = hasSpecificRank && ranksList.length > 1
    ? ranksList[1]
    : defaultCurrentRank && defaultCurrentRank !== 'N/A'
    ? defaultCurrentRank
    : highestRankDisplay;

  return (
    <div className="bg-[#0d1017]/90 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-md space-y-3.5">
      {/* Header Khối Trình Độ */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <span>Trình độ & Xếp hạng</span>
        </h3>
        <span className="text-[11px] text-zinc-500 font-medium">
          {gamesList.length} tựa game
        </span>
      </div>

      {/* Tabs Chuyển Đổi Nhanh Giữa Các Game Tuyển Thủ Cày */}
      {gamesList.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {gamesList.map((g) => {
            const code = g.gameCode.toUpperCase();
            const isSelected = selectedGameCode === code;
            const catGame = GAMES_CATALOG.find((cg) => cg.id.toUpperCase() === code || (cg.shortName || '').toUpperCase() === code);
            const label = catGame?.shortName || code;

            return (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedGameCode(code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    : 'bg-zinc-950/60 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* 2 Card Rank Cho Game Đang Chọn */}
      <div className="grid grid-cols-2 gap-3">
        {/* RANK HIỆN TẠI Card */}
        <div className="bg-[#090d16] p-3 rounded-2xl border border-cyan-500/30 flex items-center gap-2.5 relative overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="relative w-10 h-10 shrink-0">
            <Image
              src={getGameRankIcon(selectedGameCode, currentRankDisplay, false)}
              alt="Current Rank"
              fill
              className="object-contain drop-shadow"
            />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider truncate">
              RANK HIỆN TẠI
            </div>
            <div className="text-sm font-black text-cyan-300 truncate" title={currentRankDisplay}>
              {currentRankDisplay}
            </div>
          </div>
        </div>

        {/* RANK CAO NHẤT Card */}
        <div className="bg-[#140a1c] p-3 rounded-2xl border border-purple-500/30 flex items-center gap-2.5 relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <div className="relative w-10 h-10 shrink-0">
            <Image
              src={getGameRankIcon(selectedGameCode, highestRankDisplay, true)}
              alt="Highest Rank"
              fill
              className="object-contain drop-shadow"
            />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider truncate">
              RANK CAO NHẤT
            </div>
            <div className="text-sm font-black text-purple-300 truncate" title={highestRankDisplay}>
              {highestRankDisplay}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-0.5">
        <Sparkles size={12} className="text-amber-400 shrink-0" />
        <span className="truncate">
          Trình độ thi đấu chuyên nghiệp tựa game <strong>{gameDisplayName}</strong>
        </span>
      </div>
    </div>
  );
}
