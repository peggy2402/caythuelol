import React from 'react';
import {
  TrendingUp,
  Sparkles,
  Crown,
  Target,
  ArrowRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PointBoostTierSegment } from '@/lib/rank-calculator';
import { resolveAovStarRate, getAovHighRankByStars } from '@/lib/aov';
import { StarIcon } from '../StarIcon';

interface PointAndStarBoostSectionProps {
  isPointBoost: boolean;
  isAov: boolean;
  pointUnit: string;
  pointTiers: PointBoostTierSegment[];
  selectedPointSegment: string;
  matchingBoosterStarService: any;
  matchingBoosterService: any;
  aovStarCalc: any;
  handleSelectPointSegment: (tier: PointBoostTierSegment) => void;
  isSelectedAovHighStar: boolean;
  selectedPointTierObj: PointBoostTierSegment;
  aovOddStartStep: any;
  aovOddCurrentStarsInDiv: number;
  setAovOddCurrentStarsInDiv: (stars: number) => void;
  aovOddStarsToAdd: number;
  setAovOddStarsToAdd: React.Dispatch<React.SetStateAction<number>>;
  aovOddTiersInSegment: { tier: string; name: string; icon: string; image: string }[];
  aovOddAvailableSteps: any[];
  setAovOddStartStepId: (id: string) => void;
  aovOddDivisionsForCurrentTier: any[];
  segmentRate: number;
  aovOddTargetRank: any;
  gainedPoints: number;
  currentPoints: number;
  setCurrentPoints: React.Dispatch<React.SetStateAction<number>>;
  desiredPoints: number;
  setDesiredPoints: React.Dispatch<React.SetStateAction<number>>;
  isRiotGame: boolean;
  checkedAccount: any;
}

export function PointAndStarBoostSection({
  isPointBoost,
  isAov,
  pointUnit,
  pointTiers,
  selectedPointSegment,
  matchingBoosterStarService,
  matchingBoosterService,
  aovStarCalc,
  handleSelectPointSegment,
  isSelectedAovHighStar,
  selectedPointTierObj,
  aovOddStartStep,
  aovOddCurrentStarsInDiv,
  setAovOddCurrentStarsInDiv,
  aovOddStarsToAdd,
  setAovOddStarsToAdd,
  aovOddTiersInSegment,
  aovOddAvailableSteps,
  setAovOddStartStepId,
  aovOddDivisionsForCurrentTier,
  segmentRate,
  aovOddTargetRank,
  gainedPoints,
  currentPoints,
  setCurrentPoints,
  desiredPoints,
  setDesiredPoints,
  isRiotGame,
  checkedAccount,
}: PointAndStarBoostSectionProps) {
  if (!isPointBoost) return null;

  const renderTierCard = (tier: PointBoostTierSegment) => {
    const isHighElo = isAov && tier.isHighEloRange;
    const breakdownItem = isAov ? aovStarCalc?.breakdown.find((b: any) => b.tierId === tier.id) : null;
    const starsInTier = breakdownItem ? breakdownItem.stars : 0;
    // Sáng viền khi có cày số sao thuộc phân khúc này!
    const isSelected = isAov ? starsInTier > 0 : selectedPointSegment === tier.id;

    const customPrice = isAov
      ? resolveAovStarRate(tier.id, matchingBoosterStarService?.tierRates)
      : matchingBoosterService?.tierRates?.[tier.id] ?? tier.defaultPrice;

    // Signature active styles per high-elo rank
    let activeStyle = isSelected
      ? 'bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-zinc-950 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-2 ring-cyan-400/60 scale-[1.01]'
      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60 opacity-80 hover:opacity-100';

    if (isSelected && isHighElo) {
      if (tier.id === 'master_0_19') {
        activeStyle = 'bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/70 scale-[1.01]';
      } else if (tier.id === 'gm_20_49') {
        activeStyle = 'bg-gradient-to-br from-sky-950/40 via-zinc-900 to-zinc-950 border-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.3)] ring-2 ring-sky-400/70 scale-[1.01]';
      } else if (tier.id === 'conqueror_50_99') {
        activeStyle = 'bg-gradient-to-br from-fuchsia-950/40 via-zinc-900 to-zinc-950 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.3)] ring-2 ring-fuchsia-400/70 scale-[1.01]';
      } else if (tier.id === 'legend_100_plus') {
        activeStyle = 'bg-gradient-to-br from-yellow-950/40 via-zinc-900 to-zinc-950 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.35)] ring-2 ring-yellow-400/70 scale-[1.01]';
      }
    }

    return (
      <div
        key={tier.id}
        onClick={() => handleSelectPointSegment(tier)}
        className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group select-none flex flex-col justify-between h-full ${activeStyle}`}
      >
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              {tier.image && (
                <div
                  className={`w-9 h-9 rounded-xl bg-black/60 border p-1 flex items-center justify-center shrink-0 ${
                    tier.id === 'master_0_19'
                      ? 'border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : tier.id === 'gm_20_49'
                      ? 'border-sky-500/40 shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                      : tier.id === 'conqueror_50_99'
                      ? 'border-fuchsia-500/40 shadow-[0_0_10px_rgba(217,70,239,0.2)]'
                      : tier.id === 'legend_100_plus'
                      ? 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                      : 'border-white/10'
                  }`}
                >
                  <img
                    src={tier.image}
                    alt={tier.label}
                    className="w-full h-full object-contain drop-shadow"
                  />
                </div>
              )}
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border whitespace-nowrap font-mono tracking-tight flex items-center gap-1 ${tier.badgeColor}`}>
                {isHighElo && <StarIcon size={11} />}
                <span>{tier.shortLabel}</span>
              </span>
            </div>
            {isSelected && (
              <div className="flex items-center gap-1">
                {isAov && starsInTier > 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-cyan-400 to-emerald-400 text-black text-[10px] font-black font-mono shadow-md flex items-center gap-1">
                    <span>+{starsInTier}</span>
                    <StarIcon size={10} />
                  </span>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-md shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-xs sm:text-sm font-black text-white mb-0.5 leading-snug">
            {tier.label}
          </div>
          <div className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
            {tier.desc}
          </div>
        </div>

        <div className="pt-2.5 border-t border-zinc-800/80 flex items-baseline justify-between mt-auto">
          <span className="text-[11px] text-zinc-400">Đơn giá:</span>
          <div className="text-right">
            <span className="text-sm sm:text-base font-black font-mono text-cyan-400">
              {customPrice.toLocaleString('vi-VN')}
            </span>
            <span className="text-[10px] font-sans text-zinc-500 ml-1">đ/{tier.unit}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
          <TrendingUp size={15} className="text-cyan-400" />
          <span>
            {isAov
              ? 'Chọn Phân Khúc & Đơn Giá Cày Theo Sao Liên Quân'
              : `Chọn Phân Khúc & Mức Giá Theo Điểm ${pointUnit}`}
          </span>
          <span className="text-red-500">*</span>
        </label>
        <span className="text-[11px] text-cyan-400 font-semibold">
          {isAov ? 'Đơn vị tính: Sao (★)' : `Đơn vị tính: Điểm ${pointUnit}`}
        </span>
      </div>

      {/* Grid các Phân Khúc Rank */}
      {isAov ? (
        <div className="space-y-4">
          {/* NHÓM 1: CÀY SAO LẺ (DƯỚI CAO THỦ) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/70">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-cyan-400" />
                <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wide">
                  1. Cày Sao Lẻ (Bậc Dưới Cao Thủ)
                </span>
              </div>
              <span className="text-[10px] text-cyan-300/80 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                Mua 1 – 5 sao lẻ/đoàn
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-stretch">
              {pointTiers.filter((t) => t.category === 'ODD_STAR' || !t.isHighEloRange).map(renderTierCard)}
            </div>
          </div>

          {/* NHÓM 2: CÀY SAO TÍCH LŨY (CAO THỦ TRỞ LÊN) */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-zinc-800/70">
              <div className="flex items-center gap-2">
                <Crown size={15} className="text-amber-400 shrink-0" />
                <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                  2. Cày Sao Tích Lũy (Cao Thủ Trở Lên)
                </span>
              </div>
              <span className="text-[10px] text-amber-300/90 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 self-start sm:self-auto">
                Tích lũy 0★ ➔ 100★+ (Tự tính lũy tiến)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Bấm vào phân khúc để chọn nhanh mốc xuất phát, hoặc nhập trực tiếp số sao hiện tại &amp; mục tiêu ở bảng bên dưới.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-stretch">
              {pointTiers.filter((t) => t.category === 'HIGH_ELO' || t.isHighEloRange).map(renderTierCard)}
            </div>
          </div>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${pointTiers.length === 4 ? 'sm:grid-cols-2' : pointTiers.length >= 5 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-3'} gap-3 items-stretch`}>
          {pointTiers.map(renderTierCard)}
        </div>
      )}

      {/* TRƯỜNG HỢP A: CÀY SAO LẺ DƯỚI CAO THỦ CHO LIÊN QUÂN MOBILE */}
      {isAov && !isSelectedAovHighStar ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-cyan-500/30 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
            <div>
              <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400 shrink-0" />
                <span>Thiết Lập Rank Hiện Tại & Số Sao Cần Cày Thêm</span>
                <span className="text-red-500">*</span>
              </span>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                Chọn đoàn hiện tại của bạn trong phân khúc <strong>{selectedPointTierObj.label}</strong> và số sao muốn Booster cày thêm (+1 đến +5 sao lẻ).
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <span className="text-xs text-cyan-300 font-medium">Cần cày:</span>
              <span className="text-base sm:text-lg font-black font-mono text-cyan-400 leading-none">
                +{aovOddStarsToAdd} Sao
              </span>
            </div>
          </div>

          {/* Banner tổng quan Bậc & Đoàn đang chọn */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-zinc-900 via-cyan-950/20 to-zinc-900 border border-cyan-500/40 shadow-inner flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-black/60 border border-cyan-500/30 p-1 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <img src={aovOddStartStep.image} alt={aovOddStartStep.label} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
                  Bậc & Đoàn Hiện Tại Bạn Đang Chọn:
                </span>
                <div className="text-sm sm:text-base font-black text-white flex items-center gap-2 flex-wrap">
                  <span>{aovOddStartStep.label}</span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono flex items-center gap-1">
                    <span>{aovOddCurrentStarsInDiv} / {aovOddStartStep.starsPerDivision || 5}</span>
                    <StarIcon size={12} />
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end shrink-0">
              <span className="text-[10px] text-zinc-400 font-medium">Phân khúc:</span>
              <span className="text-xs font-black text-cyan-300">
                {selectedPointTierObj.label}
              </span>
            </div>
          </div>

          {/* 1A. Nếu phân khúc có nhiều bậc (Đồng -> Bạch Kim), hiển thị hàng chọn Bậc rõ ràng */}
          {aovOddTiersInSegment.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span>1A. Chọn Bậc Rank Hiện Tại:</span>
                <span className="text-[11px] text-zinc-500">Đồng, Bạc, Vàng hoặc Bạch Kim</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {aovOddTiersInSegment.map((t) => {
                  const isCurrentTier = aovOddStartStep.tier === t.tier;
                  return (
                    <button
                      key={t.tier}
                      type="button"
                      onClick={() => {
                        const tierSteps = aovOddAvailableSteps.filter((s) => s.tier === t.tier);
                        if (tierSteps.length > 0) {
                          const targetStep = tierSteps[Math.floor(tierSteps.length / 2)] || tierSteps[0];
                          setAovOddStartStepId(targetStep.id);
                          const maxS = (targetStep.starsPerDivision || 5) - 1;
                          if (aovOddCurrentStarsInDiv > maxS) setAovOddCurrentStarsInDiv(maxS);
                        }
                      }}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                        isCurrentTier
                          ? 'bg-cyan-500/20 border-cyan-400 ring-1 ring-cyan-400/50 shadow-sm text-cyan-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <img src={t.image} alt={t.name} className="w-6 h-6 object-contain shrink-0" />
                      <div className="min-w-0 text-left">
                        <span className="text-xs font-black block truncate">{t.name}</span>
                      </div>
                      {isCurrentTier && <Check size={14} className="text-cyan-400 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1B. Chọn Đoàn (Division: V -> I) - Hiển thị to rõ, không bao giờ bị cắt chữ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <span>{aovOddTiersInSegment.length > 1 ? '1B.' : '1.'} Chọn Đoàn Rank Hiện Tại:</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-zinc-400">
                Đang chọn: <strong className="text-cyan-300 font-bold">{aovOddStartStep.label}</strong>
              </span>
            </div>

            <div
              className={`grid ${
                aovOddDivisionsForCurrentTier.length === 3
                  ? 'grid-cols-3'
                  : aovOddDivisionsForCurrentTier.length === 4
                  ? 'grid-cols-4'
                  : 'grid-cols-5'
              } gap-2 sm:gap-3`}
            >
              {aovOddDivisionsForCurrentTier.map((step) => {
                const isCurrentStep = aovOddStartStep.id === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setAovOddStartStepId(step.id);
                      const maxS = (step.starsPerDivision || 5) - 1;
                      if (aovOddCurrentStarsInDiv > maxS) setAovOddCurrentStarsInDiv(maxS);
                    }}
                    className={`p-2 sm:p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                      isCurrentStep
                        ? 'bg-gradient-to-b from-cyan-500/25 to-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-[1.02]'
                        : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {/* Icon Rank */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 mb-1 flex items-center justify-center">
                      <img
                        src={step.image}
                        alt={step.label}
                        className="w-full h-full object-contain drop-shadow"
                      />
                    </div>

                    {/* Đoàn La Mã to rõ */}
                    <span
                      className={`text-xs sm:text-sm font-black whitespace-nowrap uppercase tracking-tight ${
                        isCurrentStep ? 'text-white' : 'text-zinc-200'
                      }`}
                    >
                      Đoàn {step.division}
                    </span>

                    {/* Số sao mỗi đoàn */}
                    <span className="text-[10px] text-zinc-400 whitespace-nowrap mt-0.5">
                      {step.starsPerDivision || 5} sao
                    </span>

                    {isCurrentStep && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-md">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Số sao hiện đang có trong đoàn */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300">
                2. Số sao hiện đang có trong đoàn ({aovOddStartStep.label}):
              </label>
              <span className="text-[11px] text-amber-400 font-bold font-mono flex items-center gap-1">
                <span>{aovOddCurrentStarsInDiv} / {aovOddStartStep.starsPerDivision || 5}</span>
                <StarIcon size={12} />
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: aovOddStartStep.starsPerDivision || 5 }).map((_, starNum) => {
                const isSelected = aovOddCurrentStarsInDiv === starNum;
                return (
                  <button
                    key={starNum}
                    type="button"
                    onClick={() => setAovOddCurrentStarsInDiv(starNum)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <StarIcon size={13} className={isSelected ? 'opacity-100' : 'opacity-40 grayscale'} />
                    <span>{starNum} sao</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Số lượng sao muốn cày thêm */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300">
                3. Số lượng sao muốn cày thêm:
              </label>
              <span className="text-[11px] text-cyan-400 font-mono font-bold">
                Đơn giá: {segmentRate.toLocaleString('vi-VN')} đ/Sao
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setAovOddStarsToAdd((s) => Math.max(1, s - 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                >
                  -
                </button>
                <span className="px-3 text-base font-black font-mono text-cyan-400 min-w-[3rem] text-center">
                  +{aovOddStarsToAdd}
                </span>
                <button
                  type="button"
                  onClick={() => setAovOddStarsToAdd((s) => Math.min(10, s + 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAovOddStarsToAdd(num)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      aovOddStarsToAdd === num
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-sm'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    +{num} Sao
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Live Preview Rank Đích */}
          {aovOddTargetRank && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-black/50 border border-white/10 p-1 flex items-center justify-center shrink-0">
                  <img src={aovOddStartStep.image} alt="" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Xuất phát</span>
                  <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1">
                    <span>{aovOddStartStep.label}</span>
                    <span className="text-amber-300 font-mono">({aovOddCurrentStarsInDiv}</span>
                    <StarIcon size={12} />
                    <span className="text-amber-300 font-mono">)</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-center sm:self-auto text-emerald-400">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-black font-mono">
                  <span>+{aovOddStarsToAdd} Sao</span>
                  <ArrowRight size={13} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-black/50 border border-emerald-500/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <img src={aovOddTargetRank.targetImage} alt="" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Dự kiến đạt được</span>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-300">
                    {aovOddTargetRank.targetStepLabel}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Chi tiết lũy tiến nếu cày sao lẻ vượt mốc rank */}
          {aovStarCalc && aovStarCalc.breakdown.length > 1 && (
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Chi tiết tính lũy tiến vượt mốc Rank</span>
                </span>
                <span className="text-zinc-400 font-mono">
                  TB {aovStarCalc.effectiveUnitPrice.toLocaleString('vi-VN')} đ/sao
                </span>
              </div>
              <div className="space-y-1.5">
                {aovStarCalc.breakdown.map((seg: any) => (
                  <div
                    key={seg.tierId}
                    className="flex items-center justify-between gap-2 text-xs py-1 border-b border-zinc-800/70 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={seg.image}
                        alt={seg.label}
                        className="w-5 h-5 object-contain shrink-0"
                      />
                      <span className="text-zinc-300 truncate font-semibold">
                        {seg.label}
                      </span>
                    </div>
                    <div className="font-mono text-white font-bold whitespace-nowrap flex items-center gap-1">
                      <span>{seg.stars}</span>
                      <StarIcon size={12} />
                      <span>× {seg.ratePerStar.toLocaleString('vi-VN')}đ =</span>
                      <span className="text-cyan-400">{seg.subtotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TRƯỜNG HỢP B: CAO THỦ+ LIÊN QUÂN HOẶC CÁC TỰA GAME KHÁC (DUAL INPUTS) */
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <div>
              <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Target size={16} className="text-amber-400 shrink-0" />
                <span>
                  {isAov
                    ? 'Thiết Lập Mốc Sao Cao Thủ+ (Tự Động Tính Lũy Tiến)'
                    : `Thiết Lập Điểm ${pointUnit} (Hiện Tại → Mong Muốn)`}
                </span>
                <span className="text-red-500">*</span>
              </span>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                {isAov
                  ? 'Nhập số sao hiện tại và mục tiêu (0★ → 100★+). Nếu vượt ngưỡng Đại Cao Thủ (20★) hoặc Chiến Tướng (50★), hệ thống tự tính đúng đơn giá từng mốc.'
                  : 'Nhập số điểm thực tế hiện tại và mốc điểm bạn muốn đạt. Hệ thống sẽ tính số điểm chênh lệch cần cày.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs text-amber-300/80 font-medium">Cần cày:</span>
              <span className="text-base sm:text-lg font-black font-mono text-amber-400 leading-none flex items-center gap-1">
                <span>+{gainedPoints}</span>
                {isAov ? <StarIcon size={15} /> : <span>{pointUnit}</span>}
              </span>
            </div>
          </div>

          {/* Preview Huy hiệu Rank Cao Thủ -> Chiến Tướng -> Huyền Thoại theo số sao */}
          {isAov && isSelectedAovHighStar && (() => {
            const startInfo = getAovHighRankByStars(currentPoints);
            const targetInfo = getAovHighRankByStars(desiredPoints);
            return (
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 p-1 flex items-center justify-center shrink-0">
                    <img src={startInfo.image} alt={startInfo.label} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Xuất phát</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">{startInfo.label}</span>
                  </div>
                </div>
                <ArrowRight size={16} className="text-amber-400 hidden sm:block shrink-0" />
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-emerald-500/30 p-1 flex items-center justify-center shrink-0">
                    <img src={targetInfo.image} alt={targetInfo.label} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Mục tiêu đạt được</span>
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-300">{targetInfo.label}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Dual Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Điểm Hiện Tại */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/80 transition-all space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  {isAov ? 'Số Sao Hiện Tại' : 'Điểm Hiện Tại'}
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Bắt đầu từ</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={Boolean(isRiotGame && checkedAccount)}
                  onClick={() => {
                    if (isRiotGame && !checkedAccount) {
                      toast.info('Vui lòng kiểm tra thông tin tài khoản Riot ở ô bắt buộc trên để nhận diện Điểm LP chính xác!');
                      const el = document.getElementById('riot-account-check-box');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      return;
                    }
                    setCurrentPoints((p) => Math.max(0, p - (isAov ? 1 : 10)));
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white font-bold text-base flex items-center justify-center shrink-0 border border-white/5 transition-all select-none ${
                    isRiotGame && checkedAccount ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  -
                </button>
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    readOnly={Boolean(isRiotGame && checkedAccount)}
                    value={currentPoints === 0 ? '' : currentPoints}
                    placeholder="0"
                    onClick={() => {
                      if (isRiotGame && !checkedAccount) {
                        toast.info('Vui lòng kiểm tra thông tin tài khoản Riot ở ô bắt buộc trên để nhận diện Điểm LP chính xác!');
                        const el = document.getElementById('riot-account-check-box');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    onChange={(e) => {
                      if (isRiotGame && checkedAccount) return;
                      const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                      if (!clean) {
                        setCurrentPoints(0);
                        return;
                      }
                      const val = parseInt(clean, 10);
                      setCurrentPoints(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className={`w-full h-9 sm:h-10 bg-zinc-950 border rounded-xl pl-3 pr-10 text-center text-base sm:text-lg font-black font-mono text-white outline-none focus:ring-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${
                      isRiotGame && checkedAccount
                        ? 'border-cyan-500/40 bg-zinc-900/60 cursor-not-allowed text-cyan-300'
                        : currentPoints > desiredPoints
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-zinc-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                    }`}
                  />
                  <span className="text-xs text-zinc-500 font-bold font-mono absolute right-3 pointer-events-none select-none uppercase">
                    {pointUnit}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={Boolean(isRiotGame && checkedAccount)}
                  onClick={() => {
                    if (isRiotGame && !checkedAccount) {
                      toast.info('Vui lòng kiểm tra thông tin tài khoản Riot ở ô bắt buộc trên để nhận diện Điểm LP chính xác!');
                      const el = document.getElementById('riot-account-check-box');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      return;
                    }
                    setCurrentPoints((p) => Math.max(0, p + (isAov ? 1 : 10)));
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white font-bold text-base flex items-center justify-center shrink-0 border border-white/5 transition-all select-none ${
                    isRiotGame && checkedAccount ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  +
                </button>
              </div>
            </div>

            {/* 2. Điểm Mong Muốn */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/80 transition-all space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  {isAov ? 'Số Sao Mong Muốn' : 'Điểm Mong Muốn'}
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Mục tiêu</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDesiredPoints((p) => Math.max(0, p - (isAov ? 1 : 10)))}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white font-bold text-base flex items-center justify-center shrink-0 border border-white/5 transition-all select-none cursor-pointer"
                >
                  -
                </button>
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={desiredPoints === 0 ? '' : desiredPoints}
                    placeholder="0"
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                      if (!clean) {
                        setDesiredPoints(0);
                        return;
                      }
                      const val = parseInt(clean, 10);
                      setDesiredPoints(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className={`w-full h-9 sm:h-10 bg-zinc-950 border rounded-xl pl-3 pr-10 text-center text-base sm:text-lg font-black font-mono text-emerald-400 outline-none focus:ring-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${
                      desiredPoints < currentPoints
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-zinc-700/80 focus:border-emerald-500 focus:ring-emerald-500/20'
                    }`}
                  />
                  <span className="text-xs text-zinc-500 font-bold font-mono absolute right-3 pointer-events-none select-none uppercase">
                    {pointUnit}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDesiredPoints((p) => Math.max(0, p + (isAov ? 1 : 10)))}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white font-bold text-base flex items-center justify-center shrink-0 border border-white/5 transition-all select-none cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Cảnh báo validate */}
          {desiredPoints <= currentPoints && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-400 shrink-0" />
              <span>
                {desiredPoints < currentPoints
                  ? `${isAov ? 'Số sao mong muốn' : 'Điểm mong muốn'} không được nhỏ hơn ${isAov ? 'số sao hiện tại' : 'điểm hiện tại'} (${isAov ? 'Số sao hiện tại' : 'Điểm hiện tại'} không được lớn hơn ${isAov ? 'số sao mong muốn' : 'điểm mong muốn'}).`
                  : `${isAov ? 'Số sao mong muốn' : 'Điểm mong muốn'} phải lớn hơn ${isAov ? 'số sao hiện tại' : 'điểm hiện tại'} ít nhất 1 ${pointUnit}.`}
              </span>
            </div>
          )}

          {/* Bảng phân tích lũy tiến theo mốc sao Liên Quân */}
          {isAov && aovStarCalc && aovStarCalc.breakdown.length > 0 && (
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-cyan-400 uppercase tracking-wider">
                  {aovStarCalc.isProgressive
                    ? 'Chi tiết tính lũy tiến theo từng mốc sao'
                    : 'Chi tiết tạm tính theo sao'}
                </span>
                <span className="text-zinc-400 font-mono">
                  TB {aovStarCalc.effectiveUnitPrice.toLocaleString('vi-VN')} đ/sao
                </span>
              </div>
              <div className="space-y-1.5">
                {aovStarCalc.breakdown.map((seg: any) => (
                  <div
                    key={seg.tierId}
                    className="flex items-center justify-between gap-2 text-xs py-1 border-b border-zinc-800/70 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={seg.image}
                        alt={seg.label}
                        className="w-5 h-5 object-contain shrink-0"
                      />
                      <span className="text-zinc-300 truncate">
                        {seg.label}
                        {typeof seg.fromStar === 'number' && typeof seg.toStar === 'number'
                          ? ` (${seg.fromStar} → ${seg.toStar} sao)`
                          : ''}
                      </span>
                    </div>
                    <div className="font-mono text-white font-bold whitespace-nowrap flex items-center gap-1">
                      <span>{seg.stars}</span>
                      <StarIcon size={12} />
                      <span>× {seg.ratePerStar.toLocaleString('vi-VN')}đ =</span>
                      <span className="text-cyan-400">{seg.subtotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PointAndStarBoostSection;
