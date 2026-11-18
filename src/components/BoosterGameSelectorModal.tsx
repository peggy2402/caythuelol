'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Gamepad2,
  Trophy,
  Sparkles,
  ArrowRight,
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

// Logo game chuyên nghiệp (khi chưa có file icon SVG/PNG riêng biệt)
function GameLogoBadge({ game }: { game: GameDefinition }) {
  const id = game.id.toLowerCase();
  if (id === 'lol') {
    return (
      <div className="w-10 h-10 rounded-xl bg-black/90 border border-amber-500/60 flex items-center justify-center font-serif text-base font-black text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] shrink-0">
        L
      </div>
    );
  }
  if (id === 'valorant') {
    return (
      <div className="w-10 h-10 rounded-xl bg-black/90 border border-rose-500/60 flex items-center justify-center font-black text-base text-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.25)] shrink-0">
        V
      </div>
    );
  }
  if (id === 'aov') {
    return (
      <div className="w-10 h-10 rounded-xl bg-black/90 border border-sky-500/60 flex items-center justify-center font-black text-xs text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.25)] shrink-0">
        AOV
      </div>
    );
  }
  if (id === 'tft') {
    return (
      <div className="w-10 h-10 rounded-xl bg-black/90 border border-amber-500/60 flex items-center justify-center font-black text-xs text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] shrink-0">
        ĐTCL
      </div>
    );
  }
  if (id === 'cs2') {
    return (
      <div className="w-10 h-10 rounded-xl bg-black/90 border border-orange-500/60 flex items-center justify-center font-black text-xs text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.25)] shrink-0">
        CS2
      </div>
    );
  }

  // Fallback logo tròn / bo góc đa sắc
  const accentColor = game.accentColor || '#3b82f6';
  return (
    <div
      className="w-10 h-10 rounded-xl bg-black/90 border flex items-center justify-center font-black text-xs text-white shadow-md shrink-0"
      style={{
        borderColor: `${accentColor}70`,
        boxShadow: `0 0 12px ${accentColor}30`,
      }}
    >
      {game.shortName || game.id.toUpperCase().slice(0, 3)}
    </div>
  );
}

// Fallback banner game từ thư mục /images/games
function getGameBanner(gameId: string, defaultBanner?: string): string {
  const id = gameId.toLowerCase();
  const map: Record<string, string> = {
    lol: '/images/games/lol-card.jpg',
    valorant: '/images/games/val-card.jpg',
    val: '/images/games/val-card.jpg',
    tft: '/images/games/tft-card.jpg',
    aov: '/images/games/aov-card.jpg',
    cs2: '/images/games/cs2-card.jpg',
    deltaforce: '/images/games/deltaforce-card.jpg',
    poe2: '/images/games/poe2-card.jpg',
    pubg: '/images/games/pubg-card.jpg',
    pubgm: '/images/games/pubgmobile-card.jpg',
    codm: '/images/games/codm-card.jpg',
    overwatch2: '/images/games/overwatch2-card.jpg',
    naraka: '/images/games/naraka-card.jpg',
    wildrift: '/images/games/wildrift-card.jpg',
    wr: '/images/games/wildrift-card.jpg',
    freefire: '/images/games/freefire-card.jpg',
    dota2: '/images/games/dota2-card.jpg',
    truykich2: '/images/games/truykich2-card.jpg',
    valmobile: '/images/games/valmobile-card.jpg',
    marvelrivals: '/images/games/marvelrivals-card.jpg',
  };
  return map[id] || defaultBanner || '/images/games/lol-card.jpg';
}

// Chuẩn hóa mã game để match chính xác giữa các biến thể tên gọi
function normalizeGameCode(code?: string): string {
  const c = (code || '').toUpperCase().trim();
  if (c === 'LMHT' || c === 'LOL') return 'LOL';
  if (c === 'LIENQUAN' || c === 'AOV') return 'AOV';
  if (c === 'VAL' || c === 'VALORANT') return 'VALORANT';
  if (c === 'DTCL' || c === 'TFT') return 'TFT';
  if (c === 'TOCCHIEN' || c === 'WR' || c === 'WILDRIFT') return 'WILDRIFT';
  return c;
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
    <div className="space-y-4">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Gamepad2 size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Tựa Game & Dịch Vụ Cung Cấp</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Nhấn vào tựa game để xem chi tiết bảng giá các dịch vụ của {boosterName}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-white/5">
          {displayGames.length} tựa game
        </span>
      </div>

      {/* FILTER PILLS NẾU CÀY NHIỀU GAME (> 3 GAME) */}
      {displayGames.length > 3 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'ALL', label: `Tất cả (${displayGames.length})` },
            { id: 'MOBA', label: 'MOBA (LMHT, LQ...)' },
            { id: 'FPS', label: 'Bắn súng (Valorant, CS2...)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as any)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                filterCategory === cat.id
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* GRID SHOWCASE TỰA GAME VỚI ARTWORK NHÂN VẬT & NEON AURA Y HỆT ẢNH MẪU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredGames.map((game) => {
          const boosterGameInfo = boosterGames.find(
            (g) => normalizeGameCode(g.gameCode) === normalizeGameCode(game.id)
          );
          const topRank = boosterGameInfo?.ranks?.[0] || 'Cao Thủ / Thách Đấu';
          
          // Đếm chính xác số dịch vụ thực tế mà Booster này đã cấu hình và bật cho game
          const gameServices = (customServices || []).filter(
            (s: any) => s.isActive !== false && normalizeGameCode(s.gameCode) === normalizeGameCode(game.id)
          );
          const servicesCount = gameServices.length;
          const bannerSrc = getGameBanner(game.id, game.banner);

          // Tùy biến accent & border theo màu của từng game
          const isLol = game.id.toLowerCase() === 'lol';
          const isVal = game.id.toLowerCase() === 'valorant' || game.id.toLowerCase() === 'val';

          const borderColor = isLol
            ? 'rgba(0, 188, 212, 0.4)'
            : isVal
            ? 'rgba(244, 63, 94, 0.4)'
            : 'rgba(59, 130, 246, 0.35)';

          const glowShadow = isLol
            ? '0 0 25px rgba(0, 188, 212, 0.15)'
            : isVal
            ? '0 0 25px rgba(244, 63, 94, 0.15)'
            : '0 0 20px rgba(59, 130, 246, 0.12)';

          const actionColor = isLol ? '#00e5ff' : isVal ? '#ff4655' : '#60a5fa';

          return (
            <div
              key={game.id}
              onClick={() => onSelectGameToHire?.(game.id)}
              className="group relative bg-[#0d1017]/90 hover:bg-[#10141f] border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer min-h-[200px]"
              style={{
                borderColor,
                boxShadow: glowShadow,
              }}
            >
              {/* Artwork nhân vật game bên phải card với fade-out gradient cực ảo diệu (Ảnh mẫu) */}
              <div className="absolute top-0 right-0 bottom-0 w-[58%] pointer-events-none overflow-hidden select-none">
                <Image
                  src={bannerSrc}
                  alt={game.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover object-right opacity-60 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
                />
                {/* Lớp phủ Gradient đen mờ dần sang trái để text luôn cực kỳ sắc nét */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0d1017] via-[#0d1017]/85 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-transparent to-transparent opacity-90 z-10" />
              </div>

              {/* Viền sáng bao quanh khi hover */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2 z-20"
                style={{
                  borderColor: actionColor,
                  boxShadow: `inset 0 0 15px ${actionColor}20, 0 0 25px ${actionColor}30`,
                }}
              />

              {/* Nội dung bên trái Card */}
              <div className="space-y-3 relative z-20 max-w-[70%]">
                {/* Header Card: Logo Game + Tên Game + Số Gói Dịch Vụ */}
                <div className="flex items-center gap-3">
                  <GameLogoBadge game={game} />
                  <div>
                    <h4 className="font-extrabold text-white text-base tracking-tight group-hover:text-cyan-300 transition-colors">
                      {game.name}
                    </h4>
                    <span className={`text-[11px] font-medium ${servicesCount > 0 ? 'text-cyan-400' : 'text-zinc-500'}`}>
                      {servicesCount > 0 ? `${servicesCount} gói dịch vụ nhận cày` : 'Chưa mở gói dịch vụ'}
                    </span>
                  </div>
                </div>

                {/* Mô tả ngắn */}
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                  {servicesCount > 0
                    ? (gameServices[0]?.desc || game.desc)
                    : 'Tuyển thủ chưa thiết lập bảng giá dịch vụ cho tựa game này.'}
                </p>

                {/* Badge Trình độ: Cao Thủ */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <Trophy size={13} className="text-amber-400 shrink-0" />
                  <span>
                    Trình độ: <strong className="text-amber-200">{topRank}</strong>
                  </span>
                </div>
              </div>

              {/* Bottom: Action link Xem các dịch vụ */}
              <div className="pt-4 mt-4 relative z-20 flex items-center justify-between">
                <span
                  className="text-xs font-bold flex items-center gap-1.5 group-hover:translate-x-1 transition-all"
                  style={{ color: servicesCount > 0 ? actionColor : '#71717a' }}
                >
                  <span>{servicesCount > 0 ? 'Xem các dịch vụ' : 'Chưa có dịch vụ'}</span>
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
