'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Shield,
  ArrowRight,
  Sparkles,
  Gamepad2,
  CheckCircle2,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import { GAMES_CATALOG, GameDefinition, STANDARD_SERVICE_TEMPLATES } from '@/lib/games';

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Gamepad2,
  Flame,
};

interface BoosterGameItem {
  gameCode: string;
  ranks?: string[];
  servers?: string[];
}

interface HireBoosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  boosterUsername: string;
  boosterName: string;
  boosterAvatar?: string;
  boosterId?: string;
  boosterGames?: BoosterGameItem[];
}

export default function HireBoosterModal({
  isOpen,
  onClose,
  boosterUsername,
  boosterName,
  boosterAvatar,
  boosterId,
  boosterGames = [],
}: HireBoosterModalProps) {
  // Chuẩn hóa danh sách mã game mà booster hỗ trợ
  const registeredCodes = boosterGames.length > 0
    ? boosterGames.map((g) => (g?.gameCode || (g as any)?.game || '').toUpperCase()).filter(Boolean)
    : ['LOL'];

  const matchedGames = GAMES_CATALOG.filter((g) =>
    registeredCodes.includes(g.id.toUpperCase()) || registeredCodes.includes((g.shortName || '').toUpperCase())
  );

  const availableGames = matchedGames.length > 0 ? matchedGames : [GAMES_CATALOG[0]];

  // State game đang được chọn trong modal (mặc định game đầu tiên)
  const [selectedGameId, setSelectedGameId] = useState<string>(availableGames[0]?.id || 'LOL');

  if (!isOpen) return null;

  const currentGame = availableGames.find((g) => g.id === selectedGameId) || availableGames[0];
  
  // Lấy danh sách dịch vụ của game được chọn
  const servicesList = currentGame?.defaultServices?.length > 0
    ? currentGame.defaultServices
    : (STANDARD_SERVICE_TEMPLATES[currentGame?.id?.toUpperCase()] || STANDARD_SERVICE_TEMPLATES['UNIVERSAL'] || []);

  const boosterGameInfo = boosterGames.find(
    (g) => g.gameCode.toUpperCase() === currentGame?.id?.toUpperCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0c101d] border border-blue-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(59,130,246,0.25)] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-md shadow-blue-500/20 shrink-0 bg-zinc-800">
              {boosterAvatar ? (
                <Image src={boosterAvatar} alt={boosterName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-white text-base">
                  {boosterUsername.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-zinc-900 shadow-sm" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Thuê Tuyển Thủ {boosterName}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  @{boosterUsername}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Chọn tựa game và gói dịch vụ để đặt cày trực tiếp với tuyển thủ này.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors shrink-0"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: 2 Phần (Chọn Tựa game & Danh sách Gói Dịch vụ) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-5 space-y-6 relative z-10 pr-1">
          
          {/* 1. Chọn Tựa Game (Pills/Tabs) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Gamepad2 size={15} className="text-blue-400" />
                1. Chọn Tựa Game ({availableGames.length} game tuyển thủ nhận cày)
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {availableGames.map((game) => {
                const isSelected = game.id === currentGame?.id;
                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => setSelectedGameId(game.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all duration-200 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-105'
                        : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: game.accentColor || '#3b82f6' }}
                    />
                    <span>{game.shortName || game.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Danh sách dịch vụ của Game đang chọn */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy size={15} className="text-yellow-400" />
                2. Chọn Gói Dịch Vụ Cho {currentGame?.name}
              </span>
              {boosterGameInfo?.ranks?.[0] && (
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  Rank sở trường: {boosterGameInfo.ranks[0]}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {servicesList.map((svc: any) => {
                const IconComponent = ICON_MAP[svc.iconName] || Trophy;
                const isDeposit = svc.depositPercent < 100;
                
                // Chuẩn hóa link điều hướng dịch vụ
                const gameSlug = (currentGame.id || 'lol').toLowerCase();
                const serviceSlug = (svc.slug || svc.serviceType || 'rank-boost').toLowerCase();
                const targetUrl = `/services/${gameSlug}/${serviceSlug}?booster=@${encodeURIComponent(boosterUsername)}${boosterId ? `&boosterId=${boosterId}` : ''}`;

                return (
                  <Link
                    key={svc.slug || svc.name}
                    href={targetUrl}
                    onClick={onClose}
                    className="group p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-blue-500/60 hover:bg-gradient-to-br hover:from-[#111728] hover:to-zinc-950 transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-blue-500/15 relative overflow-hidden"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <IconComponent size={18} />
                          </div>
                          <h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">
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

                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {svc.desc || 'Dịch vụ cày thuê chuyên nghiệp, bảo mật 100% tài khoản.'}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-zinc-800/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {svc.pricingType === 'PER_UNIT'
                          ? `${Number(svc.defaultPrice || 30000).toLocaleString('vi-VN')} đ / ${svc.unitName || 'đơn vị'}`
                          : `Từ ${Number(svc.defaultPrice || 40000).toLocaleString('vi-VN')} đ`}
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all">
                        <span>Đặt cày</span>
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 relative z-10">
          <div className="flex items-center gap-2 text-zinc-300">
            <Shield size={15} className="text-emerald-400 shrink-0" />
            <span>Mọi giao dịch thanh toán được bảo chứng Escrow 100% bởi LeoRank.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors text-xs"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
