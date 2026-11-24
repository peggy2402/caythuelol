'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Gamepad2,
  Flame,
  AlertCircle,
  GraduationCap,
  Award,
  type LucideIcon,
} from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games';

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
  GraduationCap,
  Sparkles,
};

interface ServiceVisual {
  icon: LucideIcon;
  iconBoxClass: string;
  hoverBorderClass: string;
  ctaHoverClass: string;
}

function resolveServiceVisual(svc: any): ServiceVisual {
  const key = `${svc?.iconName || ''} ${svc?.slug || ''} ${svc?.serviceType || ''} ${svc?.name || ''}`.toLowerCase();

  if (key.includes('coaching') || key.includes('huấn luyện') || key.includes('dạy kèm') || key.includes('duo')) {
    return {
      icon: GraduationCap,
      iconBoxClass: 'bg-indigo-500/12 text-indigo-400 border-indigo-500/25 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-400',
      hoverBorderClass: 'hover:border-indigo-500/45',
      ctaHoverClass: 'group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-400',
    };
  }
  if (key.includes('net-win') || key.includes('net_win') || key.includes('trận thắng') || key.includes('lp')) {
    return {
      icon: TrendingUp,
      iconBoxClass: 'bg-cyan-500/12 text-cyan-400 border-cyan-500/25 group-hover:bg-cyan-500 group-hover:text-zinc-950 group-hover:border-cyan-400',
      hoverBorderClass: 'hover:border-cyan-500/45',
      ctaHoverClass: 'group-hover:bg-cyan-500 group-hover:text-zinc-950 group-hover:border-cyan-400',
    };
  }
  if (key.includes('placement') || key.includes('phân hạng') || key.includes('đầu mùa')) {
    return {
      icon: Target,
      iconBoxClass: 'bg-amber-500/12 text-amber-400 border-amber-500/25 group-hover:bg-amber-500 group-hover:text-zinc-950 group-hover:border-amber-400',
      hoverBorderClass: 'hover:border-amber-500/45',
      ctaHoverClass: 'group-hover:bg-amber-500 group-hover:text-zinc-950 group-hover:border-amber-400',
    };
  }
  if (key.includes('promo') || key.includes('chuỗi') || key.includes('thăng hạng')) {
    return {
      icon: Medal,
      iconBoxClass: 'bg-violet-500/12 text-violet-400 border-violet-500/25 group-hover:bg-violet-500 group-hover:text-white group-hover:border-violet-400',
      hoverBorderClass: 'hover:border-violet-500/45',
      ctaHoverClass: 'group-hover:bg-violet-500 group-hover:text-white group-hover:border-violet-400',
    };
  }
  if (key.includes('level') || key.includes('cấp độ') || key.includes('1-30') || key.includes('exp')) {
    return {
      icon: Zap,
      iconBoxClass: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25 group-hover:bg-emerald-500 group-hover:text-zinc-950 group-hover:border-emerald-400',
      hoverBorderClass: 'hover:border-emerald-500/45',
      ctaHoverClass: 'group-hover:bg-emerald-500 group-hover:text-zinc-950 group-hover:border-emerald-400',
    };
  }
  if (key.includes('mastery') || key.includes('thông thạo') || key.includes('tướng')) {
    return {
      icon: Flame,
      iconBoxClass: 'bg-orange-500/12 text-orange-400 border-orange-500/25 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-400',
      hoverBorderClass: 'hover:border-orange-500/45',
      ctaHoverClass: 'group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-400',
    };
  }
  if (key.includes('event') || key.includes('battle') || key.includes('nhiệm vụ') || key.includes('onbet') || key.includes('clash')) {
    return {
      icon: Swords,
      iconBoxClass: 'bg-rose-500/12 text-rose-400 border-rose-500/25 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-400',
      hoverBorderClass: 'hover:border-rose-500/45',
      ctaHoverClass: 'group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-400',
    };
  }

  const mappedIcon = (svc?.iconName && ICON_MAP[svc.iconName]) || Trophy;
  return {
    icon: mappedIcon,
    iconBoxClass: 'bg-blue-500/12 text-blue-400 border-blue-500/25 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500',
    hoverBorderClass: 'hover:border-blue-500/45',
    ctaHoverClass: 'group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500',
  };
}

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
  const availableGames = useMemo(() => {
    const registeredCodes =
      boosterGames.length > 0
        ? boosterGames
            .map((g) => normalizeGameCode(g?.gameCode || (g as any)?.game))
            .filter(Boolean)
        : ['LOL'];

    const matchedGames = GAMES_CATALOG.filter(
      (g) =>
        registeredCodes.includes(normalizeGameCode(g.id)) ||
        registeredCodes.includes(normalizeGameCode(g.shortName))
    );

    return matchedGames.length > 0 ? matchedGames : [GAMES_CATALOG[0]];
  }, [boosterGames]);

  // State game đang được chọn trong modal (mặc định game đầu tiên)
  const [selectedGameId, setSelectedGameId] = useState<string>(availableGames[0]?.id || 'lol');

  // Đồng bộ lại game đang chọn khi mở modal hoặc danh sách game booster thay đổi
  useEffect(() => {
    if (!availableGames.some((g) => g.id === selectedGameId)) {
      setSelectedGameId(availableGames[0]?.id || 'lol');
    }
  }, [availableGames, selectedGameId]);

  // Đóng modal bằng phím Escape & khóa cuộn nền khi mở
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const currentGame = availableGames.find((g) => g.id === selectedGameId) || availableGames[0];

  // LỌC CHÍNH XÁC CÁC DỊCH VỤ THỰC TẾ MÀ BOOSTER ĐÃ CẤU HÌNH VÀ BẬT CHO GAME NÀY
  const activeCustomServices = (customServices || []).filter((s: any) => {
    if (s.isActive === false) return false;
    return normalizeGameCode(s.gameCode) === normalizeGameCode(currentGame?.id);
  });

  const boosterGameInfo = boosterGames.find(
    (g) => normalizeGameCode(g.gameCode || (g as any)?.game) === normalizeGameCode(currentGame?.id)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="hire-booster-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hire-booster-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
        >
          <motion.div
            key="hire-booster-panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-[#0B0F1A] border-t sm:border border-white/[0.09] rounded-t-3xl sm:rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.75)] flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden will-change-transform"
          >
        {/* Subtle top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent pointer-events-none" />
        {/* Soft ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-40 bg-blue-500/[0.08] rounded-full blur-3xl pointer-events-none" />

        {/* Mobile drag handle indicator */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden shrink-0 relative z-10">
          <div className="w-10 h-1 rounded-full bg-zinc-700/80" />
        </div>

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-3 sm:pt-5 pb-4 border-b border-white/[0.07] shrink-0 relative z-10">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden ring-2 ring-blue-500/40 shrink-0 bg-zinc-900 shadow-lg shadow-black/40">
              {boosterAvatar ? (
                <Image src={boosterAvatar} alt={boosterName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm sm:text-base bg-gradient-to-br from-blue-600 to-indigo-700">
                  {boosterUsername.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span
                title="Đang sẵn sàng nhận đơn"
                className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#0B0F1A]"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="hire-booster-modal-title"
                  className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate"
                >
                  Thuê {boosterName}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-300 border border-white/[0.08] shrink-0">
                  @{boosterUsername}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                Chọn tựa game và gói dịch vụ để đặt cày trực tiếp với tuyển thủ này.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-dark-scrollbar px-4 sm:px-6 py-4 sm:py-5 space-y-5 relative z-10">
          {/* Step 1: Chọn Tựa Game */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Chọn tựa game
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">
                  ({availableGames.length} game hỗ trợ)
                </span>
              </div>

              {boosterGameInfo?.ranks?.[0] && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  <Award size={12} className="text-amber-400 shrink-0" />
                  <span>Rank: {boosterGameInfo.ranks[0]}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 max-h-40 overflow-y-auto custom-dark-scrollbar p-1 -m-1">
              {availableGames.map((game) => {
                const isSelected = game.id === currentGame?.id;
                const svcCount = (customServices || []).filter(
                  (s: any) =>
                    s.isActive !== false &&
                    normalizeGameCode(s.gameCode) === normalizeGameCode(game.id)
                ).length;
                const thumbSrc = game.bannerUrl || game.banner;

                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => setSelectedGameId(game.id)}
                    className={`group/game flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 border cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 text-white border-blue-500/70 shadow-[0_0_16px_rgba(37,99,235,0.22)] ring-1 ring-blue-500/30'
                        : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:text-zinc-100 hover:bg-white/[0.07] hover:border-white/[0.16]'
                    }`}
                  >
                    <div className="relative w-6 h-6 rounded-lg overflow-hidden bg-zinc-800 ring-1 ring-white/15 shrink-0">
                      {thumbSrc ? (
                        <Image
                          src={thumbSrc}
                          alt={game.name}
                          fill
                          sizes="24px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <Gamepad2 size={13} />
                        </div>
                      )}
                    </div>

                    <span className="tracking-tight">
                      {game.name}
                      {game.shortName && game.shortName.toLowerCase() !== game.name.toLowerCase() && (
                        <span className={`ml-1 text-[11px] font-normal ${isSelected ? 'text-blue-200/80' : 'text-zinc-500'}`}>
                          ({game.shortName})
                        </span>
                      )}
                    </span>

                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : svcCount > 0
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                          : 'bg-white/[0.04] text-zinc-500'
                      }`}
                    >
                      {svcCount} gói
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2: Danh sách gói dịch vụ */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider truncate">
                  Chọn gói dịch vụ • {currentGame?.name}
                </span>
              </div>
              {activeCustomServices.length > 0 && (
                <span className="text-[11px] text-zinc-500 shrink-0 tabular-nums">
                  {activeCustomServices.length} dịch vụ khả dụng
                </span>
              )}
            </div>

            {activeCustomServices.length === 0 ? (
              <div className="py-10 px-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.1] text-center flex flex-col items-center justify-center">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                  <AlertCircle size={20} className="text-amber-400" />
                </div>
                <h4 className="text-sm font-bold text-zinc-200">
                  Chưa có dịch vụ nào cho {currentGame?.name}
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mt-1.5 leading-relaxed">
                  Tuyển thủ <strong className="text-zinc-200">{boosterName}</strong> chưa bật gói dịch vụ nào cho tựa game này. Bạn có thể chuyển sang tựa game khác hoặc liên hệ trực tiếp.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCustomServices.map((svc: any) => {
                  const visual = resolveServiceVisual(svc);
                  const IconComponent = visual.icon;
                  const depositPercent =
                    typeof svc.depositPercent === 'number' ? svc.depositPercent : 100;
                  const isDeposit = depositPercent < 100;

                  // Chuẩn hóa link điều hướng dịch vụ
                  const gameSlug = (currentGame?.id || 'lol').toLowerCase();
                  const serviceSlug = (svc.slug || svc.serviceType || 'rank-boost').toLowerCase();
                  const targetUrl = `/services/${gameSlug}/${serviceSlug}?booster=@${encodeURIComponent(
                    boosterUsername
                  )}${boosterId ? `&boosterId=${boosterId}` : ''}`;

                  // Tách giá và đơn vị để typography rõ ràng, dễ nhìn
                  const rawPrice = Number(
                    svc.price ||
                      svc.defaultPrice ||
                      (svc.pricingType === 'PER_UNIT'
                        ? 30000
                        : svc.pricingType === 'TIER_MATRIX'
                        ? 40000
                        : 50000)
                  );
                  const formattedNumber = `${rawPrice.toLocaleString('vi-VN')}đ`;
                  const pricePrefix = svc.pricingType === 'TIER_MATRIX' ? 'Từ ' : '';
                  const priceUnit =
                    svc.pricingType === 'PER_UNIT' ? ` / ${svc.unitName || 'đơn vị'}` : '';

                  return (
                    <Link
                      key={svc.id || svc.slug || svc.name}
                      href={targetUrl}
                      onClick={onClose}
                      className={`group rounded-2xl p-4 bg-[#111726]/85 hover:bg-[#151D30] border border-white/[0.07] ${visual.hoverBorderClass} transition-all duration-200 flex flex-col justify-between gap-3.5 shadow-sm hover:shadow-lg hover:shadow-black/30`}
                    >
                      <div className="space-y-3">
                        {/* Row 1: Distinct icon + Payment badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-200 ${visual.iconBoxClass}`}
                          >
                            <IconComponent size={18} />
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
                              isDeposit
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDeposit ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                            />
                            {isDeposit ? `Cọc ${depositPercent}%` : 'Trọn gói'}
                          </span>
                        </div>

                        {/* Row 2: Clean full-width title + description */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-white text-[14px] sm:text-[15px] leading-snug group-hover:text-blue-200 transition-colors">
                            {svc.name}
                          </h4>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {svc.desc ||
                              'Dịch vụ cày thuê chuyên nghiệp, bảo mật 100% tài khoản.'}
                          </p>
                        </div>
                      </div>

                      {/* Row 3: Price & CTA Pill */}
                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                        <div className="min-w-0 truncate">
                          {pricePrefix && (
                            <span className="text-[11px] text-zinc-400 font-medium mr-0.5">
                              {pricePrefix}
                            </span>
                          )}
                          <span className="text-[13px] sm:text-sm font-extrabold text-emerald-400 tabular-nums">
                            {formattedNumber}
                          </span>
                          {priceUnit && (
                            <span className="text-[11px] text-zinc-400 font-medium">
                              {priceUnit}
                            </span>
                          )}
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-zinc-200 transition-all duration-150 shrink-0 ${visual.ctaHoverClass}`}
                        >
                          <span>Đặt cày</span>
                          <ArrowRight
                            size={13}
                            className="transition-transform duration-150 group-hover:translate-x-0.5"
                          />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:py-3.5 border-t border-white/[0.07] bg-[#080B13]/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative z-10">
          <div className="flex items-center gap-2 text-xs text-zinc-400 w-full sm:w-auto">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span className="leading-snug">
              Giao dịch được bảo chứng <strong className="text-zinc-200 font-semibold">Escrow 100%</strong> bởi LeoRank.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 hover:text-white font-semibold transition-colors text-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
