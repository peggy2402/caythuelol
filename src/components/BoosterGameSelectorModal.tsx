'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Banknote,
  X,
  ArrowRight,
  Shield,
  Star,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { GAMES_CATALOG, GameDefinition } from '@/lib/games';

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Banknote,
  Gamepad2,
};

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
}

export default function BoosterGameSelectorModal({
  boosterUsername,
  boosterName,
  boosterAvatar,
  boosterGames = [],
  customServices = [],
}: BoosterGameSelectorModalProps) {
  const [activeGameModal, setActiveGameModal] = useState<GameDefinition | null>(null);

  // Chuẩn hóa danh sách game mà booster hỗ trợ (mặc định luôn có LOL)
  const registeredCodes = (boosterGames.length > 0
    ? boosterGames.map((g) => g.gameCode.toUpperCase())
    : ['LOL']
  );

  const matchedGames = GAMES_CATALOG.filter((g) =>
    registeredCodes.includes(g.id.toUpperCase()) || registeredCodes.includes((g.shortName || '').toUpperCase())
  );

  const displayGames = matchedGames.length > 0 ? matchedGames : [GAMES_CATALOG[0]];

  const handleOpenGame = (game: GameDefinition) => {
    setActiveGameModal(game);
  };

  const handleClose = () => {
    setActiveGameModal(null);
  };

  return (
    <div className="space-y-4">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Gamepad2 size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Tựa Game & Dịch Vụ Cung Cấp</h3>
            <p className="text-xs text-zinc-400">
              Nhấn vào tựa game để xem chi tiết bảng giá các dịch vụ của {boosterName}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
          {displayGames.length} tựa game
        </span>
      </div>

      {/* GAMES GRID CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayGames.map((game) => {
          const boosterGameInfo = boosterGames.find(
            (g) => g.gameCode.toUpperCase() === game.id.toUpperCase()
          );
          const topRank = boosterGameInfo?.ranks?.[0] || 'Cao Thủ / Thách Đấu';

          return (
            <div
              key={game.id}
              onClick={() => handleOpenGame(game)}
              className="group relative bg-zinc-900/80 hover:bg-zinc-850 border border-white/10 hover:border-blue-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {game.shortName || game.id.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                        {game.name}
                      </h4>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {game.defaultServices?.length || 8} gói dịch vụ
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {game.desc}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 w-fit">
                  <Trophy size={13} />
                  <span>Trình độ: <strong>{topRank}</strong></span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                <span>Xem các dịch vụ</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODAL POPUP GIỮA MÀN HÌNH: DANH SÁCH DỊCH VỤ CỦA TỰA GAME ĐƯỢC CHỌN --- */}
      {activeGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl p-6 sm:p-7 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg">
                  {activeGameModal.shortName || activeGameModal.id.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-white">
                      {activeGameModal.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {boosterName}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Chọn dịch vụ bạn cần để xem bảng giá và đặt lịch cày trực tiếp với tuyển thủ.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Services Grid trong Modal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGameModal.defaultServices.map((svc) => {
                const IconComponent = ICON_MAP[svc.iconName] || Trophy;
                const isDeposit = svc.depositPercent < 100;
                const targetUrl = `/services/${activeGameModal.id}/${svc.slug}?booster=@${encodeURIComponent(boosterUsername)}`;

                return (
                  <div
                    key={svc.slug}
                    className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-blue-500/50 hover:bg-zinc-950 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                            <IconComponent size={18} />
                          </div>
                          <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                            {svc.name}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            isDeposit
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {isDeposit ? `Cọc ${svc.depositPercent}%` : 'Trọn gói'}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {svc.desc}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-zinc-800/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block">Bảng giá</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {svc.pricingType === 'PER_UNIT'
                            ? `${svc.defaultPrice.toLocaleString('vi-VN')} đ / ${svc.unitName || 'đơn vị'}`
                            : `Từ ${svc.defaultPrice.toLocaleString('vi-VN')} đ`}
                        </span>
                      </div>

                      <Link
                        href={targetUrl}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:scale-105"
                      >
                        <span>Chọn dịch vụ</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-400" />
                Mọi giao dịch được bảo chứng Escrow 100% bởi LeoRank.
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-zinc-300 hover:text-white font-medium hover:bg-zinc-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
