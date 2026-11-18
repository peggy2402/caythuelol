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
  AlertCircle,
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
  customServices?: any[];
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

export default function HireBoosterModal({
  isOpen,
  onClose,
  boosterUsername,
  boosterName,
  boosterAvatar,
  boosterId,
  boosterGames = [],
  customServices = [],
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
  
  // LỌC CHÍNH XÁC CÁC DỊCH VỤ THỰC TẾ MÀ BOOSTER ĐÃ CẤU HÌNH VÀ BẬT CHO GAME NÀY
  const activeCustomServices = (customServices || []).filter((s: any) => {
    if (s.isActive === false) return false;
    return normalizeGameCode(s.gameCode) === normalizeGameCode(currentGame?.id);
  });

  const boosterGameInfo = boosterGames.find(
    (g) => normalizeGameCode(g.gameCode) === normalizeGameCode(currentGame?.id)
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
                // Đếm số dịch vụ thực tế của booster cho game này
                const svcCount = (customServices || []).filter(
                  (s: any) => s.isActive !== false && normalizeGameCode(s.gameCode) === normalizeGameCode(game.id)
                ).length;

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
                    {svcCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {svcCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Danh sách dịch vụ của Game đang chọn (CHỈ HIỂN THỊ DỊCH VỤ THỰC TẾ) */}
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

            {activeCustomServices.length === 0 ? (
              /* Trạng thái chưa cấu hình gói dịch vụ cho game này */
              <div className="py-12 px-6 rounded-2xl bg-zinc-950/60 border border-dashed border-zinc-800 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
                  <AlertCircle size={24} className="text-amber-400" />
                </div>
                <h4 className="text-sm font-bold text-zinc-200">
                  Chưa có dịch vụ nào cho {currentGame?.name}
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mt-1.5 leading-relaxed">
                  Tuyển thủ <strong className="text-zinc-200">{boosterName}</strong> chưa bật gói dịch vụ nào cho tựa game này. Vui lòng chuyển sang tựa game khác có gắn số lượng dịch vụ hoặc liên hệ trao đổi trực tiếp!
                </p>
              </div>
            ) : (
              /* Danh sách dịch vụ thực tế mà Booster đã cấu hình */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeCustomServices.map((svc: any) => {
                  const IconComponent = ICON_MAP[svc.iconName] || Trophy;
                  const depositPercent = typeof svc.depositPercent === 'number' ? svc.depositPercent : 100;
                  const isDeposit = depositPercent < 100;
                  
                  // Chuẩn hóa link điều hướng dịch vụ
                  const gameSlug = (currentGame?.id || 'lol').toLowerCase();
                  const serviceSlug = (svc.slug || svc.serviceType || 'rank-boost').toLowerCase();
                  const targetUrl = `/services/${gameSlug}/${serviceSlug}?booster=@${encodeURIComponent(boosterUsername)}${boosterId ? `&boosterId=${boosterId}` : ''}`;

                  // Format giá hiển thị
                  let priceText = '';
                  if (svc.pricingType === 'PER_UNIT') {
                    priceText = `${Number(svc.price || svc.defaultPrice || 30000).toLocaleString('vi-VN')} đ / ${svc.unitName || 'đơn vị'}`;
                  } else if (svc.pricingType === 'TIER_MATRIX') {
                    priceText = `Từ ${Number(svc.price || svc.defaultPrice || 40000).toLocaleString('vi-VN')} đ`;
                  } else {
                    priceText = `${Number(svc.price || svc.defaultPrice || 50000).toLocaleString('vi-VN')} đ`;
                  }

                  return (
                    <Link
                      key={svc.id || svc.slug || svc.name}
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
                            {isDeposit ? `Cọc ${depositPercent}%` : 'Trọn gói'}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {svc.desc || 'Dịch vụ cày thuê chuyên nghiệp, bảo mật 100% tài khoản.'}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-zinc-800/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {priceText}
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
            )}
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
