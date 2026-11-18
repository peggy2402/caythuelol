'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Gamepad2,
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Shield,
  Star,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { GAMES_CATALOG, GameDefinition } from '@/lib/games';

interface BoosterGameItem {
  gameCode: string;
  ranks?: string[];
  servers?: string[];
}

interface BoosterGameSelectorModalProps {
  boosterUsername: string;
  boosterName: string;
  boosterAvatar?: string;
  boosterGames?: BoosterGameItem[];
  customServices?: any[];
  onSelectGameToHire?: (gameId: string) => void;
}

export default function BoosterGameSelectorModal({
  boosterUsername,
  boosterName,
  boosterAvatar,
  boosterGames = [],
  customServices = [],
  onSelectGameToHire,
}: BoosterGameSelectorModalProps) {
  // Chuẩn hóa danh sách game mà booster hỗ trợ
  const registeredCodes = boosterGames.length > 0
    ? boosterGames.map((g) => (g?.gameCode || (g as any)?.game || '').toUpperCase()).filter(Boolean)
    : ['LOL'];

  const matchedGames = GAMES_CATALOG.filter((g) =>
    registeredCodes.includes(g.id.toUpperCase()) || registeredCodes.includes((g.shortName || '').toUpperCase())
  );

  const displayGames = matchedGames.length > 0 ? matchedGames : [GAMES_CATALOG[0]];

  // Bộ lọc tag nhanh khi có nhiều game
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'MOBA' | 'FPS' | 'OTHER'>('ALL');

  const filteredGames = displayGames.filter((g) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'MOBA') return ['LOL', 'AOV', 'WR', 'DOTA2'].includes(g.id.toUpperCase());
    if (filterCategory === 'FPS') return ['VALORANT', 'CS2', 'PUBG', 'PUBGM', 'CODM', 'OVERWATCH2', 'DELTAFORCE'].includes(g.id.toUpperCase());
    return true;
  });

  return (
    <div className="space-y-5">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 text-blue-400 shadow-inner">
            <Gamepad2 size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Tựa Game & Dịch Vụ Cung Cấp</span>
              <Sparkles size={16} className="text-amber-400" />
            </h3>
            <p className="text-xs text-zinc-400">
              Hồ sơ năng lực và các tựa game tuyển thủ {boosterName} nhận cày thuê
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 shadow-sm">
            {displayGames.length} tựa game
          </span>
        </div>
      </div>

      {/* FILTER PILLS NẾU CÀY NHIỀU GAME (> 4 GAME) */}
      {displayGames.length > 4 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'ALL', label: 'Tất cả game' },
            { id: 'MOBA', label: 'MOBA (LMHT, LQ...)' },
            { id: 'FPS', label: 'Bắn súng (Valorant, CS2...)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                filterCategory === cat.id
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* GRID SHOWCASE TỰA GAME VỚI HIỆU ỨNG GLOW NEON (ẢNH 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredGames.map((game) => {
          const boosterGameInfo = boosterGames.find(
            (g) => g.gameCode.toUpperCase() === game.id.toUpperCase()
          );
          const topRank = boosterGameInfo?.ranks?.[0] || 'Cao Thủ / Thách Đấu';
          const servicesCount = game.defaultServices?.length || 4;
          const accentColor = game.accentColor || '#3b82f6';

          return (
            <div
              key={game.id}
              onClick={() => onSelectGameToHire?.(game.id)}
              className="group relative bg-[#090d16]/80 hover:bg-[#0d1322] border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
              style={{
                borderColor: `${accentColor}35`,
                boxShadow: `0 4px 20px -2px ${accentColor}15`,
              }}
            >
              {/* Ánh sáng Aura Gradient phát sáng theo màu game (Ảnh 4) */}
              <div 
                className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity duration-500"
                style={{ backgroundColor: `${accentColor}30` }}
              />

              {/* Viền sáng bao quanh khi hover */}
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2"
                style={{
                  borderColor: accentColor,
                  boxShadow: `inset 0 0 15px ${accentColor}20, 0 0 25px ${accentColor}30`,
                }}
              />

              <div className="space-y-3 relative z-10">
                {/* Header Card: Logo + Tên + Badge số dịch vụ */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-md shrink-0 border group-hover:scale-105 transition-transform duration-200"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, #1e1b4b)`,
                        borderColor: `${accentColor}60`,
                        boxShadow: `0 4px 12px ${accentColor}30`,
                      }}
                    >
                      {game.shortName || game.id.toUpperCase()}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white text-base group-hover:text-blue-300 transition-colors">
                        {game.name}
                      </h4>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {servicesCount} gói dịch vụ nhận cày
                      </span>
                    </div>
                  </div>

                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 uppercase tracking-wider"
                    style={{
                      backgroundColor: `${accentColor}15`,
                      color: accentColor,
                      borderColor: `${accentColor}30`,
                    }}
                  >
                    {game.shortName}
                  </span>
                </div>

                {/* Mô tả năng lực */}
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {game.desc || `Dịch vụ cày rank ${game.name}, cày trận thắng và phân hạng chuyên nghiệp cùng tuyển thủ.`}
                </p>

                {/* Badge Trình độ / Rank */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
                  <Trophy size={13} className="text-amber-400 shrink-0" />
                  <span>Trình độ: <strong className="text-amber-200">{topRank}</strong></span>
                </div>
              </div>

              {/* Bottom: Trạng thái & Action CTA */}
              <div className="pt-3.5 mt-3.5 border-t border-white/5 flex items-center justify-between relative z-10 text-xs">
                <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sẵn sàng nhận kèo</span>
                </span>

                <span 
                  className="font-bold flex items-center gap-1 group-hover:translate-x-1 transition-all"
                  style={{ color: accentColor }}
                >
                  <span>Thuê cày game này</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
