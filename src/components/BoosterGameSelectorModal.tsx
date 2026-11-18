'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Gamepad2,
  Trophy,
  Sparkles,
  ArrowRight,
  Flame,
  ChevronDown,
  Swords,
  Crosshair,
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

type FilterCategoryType = 'SERVICES' | 'ALL' | 'MOBA' | 'FPS' | 'STRATEGY' | 'SURVIVAL_RPG';

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

  // 1. Phân loại các game ĐÃ CẤU HÌNH GÓI DỊCH VỤ THỰC TẾ
  const gamesWithServices = displayGames.filter((game) => {
    return (customServices || []).some(
      (s: any) => s.isActive !== false && normalizeGameCode(s.gameCode) === normalizeGameCode(game.id)
    );
  });

  // Mặc định chọn tab "Có dịch vụ" nếu có game đã mở gói cày, giúp UI cực kỳ gọn và đẹp!
  const [filterCategory, setFilterCategory] = useState<FilterCategoryType>(
    gamesWithServices.length > 0 ? 'SERVICES' : 'ALL'
  );

  // State mở rộng thêm game khi xem tab "Tất cả"
  const [showAllCards, setShowAllCards] = useState(false);

  // Lọc game theo tab chuẩn xác theo yêu cầu người dùng
  const filteredGames = displayGames.filter((g) => {
    const code = g.id.toUpperCase();
    if (filterCategory === 'SERVICES') {
      return (customServices || []).some(
        (s: any) => s.isActive !== false && normalizeGameCode(s.gameCode) === normalizeGameCode(g.id)
      );
    }
    if (filterCategory === 'MOBA') {
      return ['LOL', 'LMHT', 'AOV', 'LIENQUAN', 'WR', 'WILDRIFT', 'TOCCHIEN', 'DOTA2'].includes(code);
    }
    if (filterCategory === 'FPS') {
      return ['VALORANT', 'VAL', 'CS2', 'OVERWATCH2', 'DELTAFORCE', 'TRUYKICH2', 'CODM', 'VALMOBILE'].includes(code);
    }
    if (filterCategory === 'STRATEGY') {
      return ['TFT', 'DTCL'].includes(code);
    }
    if (filterCategory === 'SURVIVAL_RPG') {
      return ['PUBG', 'PUBGM', 'PUBGMOBILE', 'NARAKA', 'FREEFIRE', 'POE2', 'MARVELRIVALS'].includes(code);
    }
    return true;
  });

  // Giới hạn hiển thị nếu nhiều hơn 4 card để layout luôn cân đối tuyệt đối
  const visibleGames = (filterCategory === 'ALL' && !showAllCards && filteredGames.length > 4)
    ? filteredGames.slice(0, 4)
    : filteredGames;

  // Danh sách các game còn lại chưa mở gói dịch vụ để hiển thị chip nhỏ tinh tế
  const otherGames = displayGames.filter(
    (g) => !gamesWithServices.some((sg) => sg.id === g.id)
  );

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

      {/* FILTER TABS THÔNG MINH - Y HỆT ẢNH MẪU CỦA NGƯỜI DÙNG */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
        {/* Tab Có dịch vụ sẵn sàng */}
        {gamesWithServices.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setFilterCategory('SERVICES');
              setShowAllCards(false);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
              filterCategory === 'SERVICES'
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.35)]'
                : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Sparkles size={13} className="text-amber-300" />
            <span>Có dịch vụ ({gamesWithServices.length})</span>
          </button>
        )}

        {/* Tab Tất cả */}
        <button
          type="button"
          onClick={() => {
            setFilterCategory('ALL');
            setShowAllCards(false);
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
            filterCategory === 'ALL'
              ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Tất cả ({displayGames.length})
        </button>

        {/* 1. MOBA */}
        <button
          type="button"
          onClick={() => {
            setFilterCategory('MOBA');
            setShowAllCards(false);
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
            filterCategory === 'MOBA'
              ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Swords size={13} />
          <span>MOBA</span>
        </button>

        {/* 2. FPS / Bắn súng */}
        <button
          type="button"
          onClick={() => {
            setFilterCategory('FPS');
            setShowAllCards(false);
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
            filterCategory === 'FPS'
              ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Crosshair size={13} />
          <span>FPS / Bắn súng</span>
        </button>

        {/* 3. Chiến thuật */}
        <button
          type="button"
          onClick={() => {
            setFilterCategory('STRATEGY');
            setShowAllCards(false);
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
            filterCategory === 'STRATEGY'
              ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Gamepad2 size={13} />
          <span>Chiến thuật</span>
        </button>

        {/* 4. Sinh tồn / Nhập vai */}
        <button
          type="button"
          onClick={() => {
            setFilterCategory('SURVIVAL_RPG');
            setShowAllCards(false);
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
            filterCategory === 'SURVIVAL_RPG'
              ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Trophy size={13} />
          <span>Sinh tồn / Nhập vai</span>
        </button>
      </div>

      {/* GRID SHOWCASE TỰA GAME VỚI ARTWORK NHÂN VẬT & NEON AURA (ĐÃ LOẠI BỎ AVATAR BỊ VỠ CHỮ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visibleGames.map((game) => {
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
              className="group relative bg-[#0d1017]/90 hover:bg-[#10141f] border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer min-h-[195px]"
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

              {/* Nội dung bên trái Card: ĐÃ BỎ AVATAR BỊ VỠ CHỮ, TÊN GAME RỘNG RÃI & SẮC NÉT */}
              <div className="space-y-2.5 relative z-20 max-w-[70%]">
                {/* Header Card: Tên Game + Trạng Thái Gói Cày */}
                <div>
                  <h4 className="font-extrabold text-white text-base sm:text-lg tracking-tight group-hover:text-cyan-300 transition-colors leading-snug">
                    {game.name}
                  </h4>
                  <div className="mt-0.5">
                    <span className={`text-[11px] font-semibold inline-flex items-center gap-1.5 ${
                      servicesCount > 0 ? 'text-cyan-400' : 'text-zinc-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        servicesCount > 0 ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-600'
                      }`} />
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
              <div className="pt-3.5 mt-3.5 relative z-20 flex items-center justify-between">
                <span
                  className="text-xs font-bold flex items-center gap-1.5 group-hover:translate-x-1 transition-all"
                  style={{ color: servicesCount > 0 ? actionColor : '#71717a' }}
                >
                  <span>{servicesCount > 0 ? 'Xem các dịch vụ' : 'Chưa mở dịch vụ'}</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nút Xem thêm nếu đang ở Tab "Tất cả" và có nhiều game */}
      {filterCategory === 'ALL' && filteredGames.length > 4 && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setShowAllCards(!showAllCards)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 text-xs font-semibold transition-all"
          >
            <span>{showAllCards ? 'Thu gọn danh sách game' : `Xem thêm (${filteredGames.length - 4} tựa game khác)`}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${showAllCards ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* THANH CHIP PHỤ TINH TẾ: CÁC GAME KHÁC TUYỂN THỦ CŨNG NHẬN CÀY */}
      {otherGames.length > 0 && filterCategory === 'SERVICES' && (
        <div className="pt-2 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-zinc-500 font-medium">
              Nhận cày thêm theo yêu cầu:
            </span>
            {otherGames.map((og) => (
              <button
                key={og.id}
                type="button"
                onClick={() => onSelectGameToHire?.(og.id)}
                className="px-2.5 py-1 rounded-lg bg-zinc-950/60 hover:bg-zinc-800 border border-white/5 hover:border-blue-500/30 text-zinc-400 hover:text-zinc-200 text-[11px] transition-all"
              >
                {og.shortName || og.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
