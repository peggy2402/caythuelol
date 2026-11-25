import React from 'react';
import { Trophy, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AOV_SINGLE_STEP_TIERS } from '../../constants/bookingConfig';
import { AOV_TIER_PACKAGES, getAovTierPackageCurrentTotal } from '@/lib/aov';

interface RankLadderSectionProps {
  isValorant: boolean;
  isAov: boolean;
  isRiotGame: boolean;
  checkedAccount: any;
  currentRankObj: any;
  desiredRankObj: any;
  currentTierMeta: any;
  desiredTierMeta: any;
  currentRankImg: string;
  desiredRankImg: string;
  currentRankIndex: number;
  desiredRankIndex: number;
  calculation: any;
  handleOpenRankModal: (target: 'CURRENT' | 'DESIRED') => void;
  activeRankSteps: any[];
  currentRankId: string;
  desiredRankId: string;
  setCurrentRankId: (id: string) => void;
  setDesiredRankId: (id: string) => void;
  assignedBooster: any;
  boosterStepOverrides: any;
  effectiveRankMultiplier: number;
}

export function RankLadderSection({
  isValorant,
  isAov,
  isRiotGame,
  checkedAccount,
  currentRankObj,
  desiredRankObj,
  currentTierMeta,
  desiredTierMeta,
  currentRankImg,
  desiredRankImg,
  currentRankIndex,
  desiredRankIndex,
  calculation,
  handleOpenRankModal,
  activeRankSteps,
  currentRankId,
  desiredRankId,
  setCurrentRankId,
  setDesiredRankId,
  assignedBooster,
  boosterStepOverrides,
  effectiveRankMultiplier,
}: RankLadderSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
          <Trophy size={14} className="text-amber-400" />
          <span>
            {isValorant
              ? 'Lộ trình Cày Rank Valorant (Iron 1 → Radiant)'
              : isAov
              ? 'Lộ trình Cày Rank Liên Quân (Đồng III → Huyền Thoại 100★)'
              : 'Lộ trình Cày Rank (Sắt IV → Cao Thủ)'}
          </span>
          <span className="text-red-500">*</span>
        </label>
        <span className="text-[11px] text-blue-400 font-semibold">
          Nhấn vào thẻ để đổi rank
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
        {/* Card Rank Hiện Tại */}
        <div
          onClick={() => handleOpenRankModal('CURRENT')}
          className={`md:col-span-5 p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden bg-gradient-to-br ${currentTierMeta.bgGradient} ${currentTierMeta.borderColor} hover:border-blue-400/80 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.99]`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
              <span>Rank Hiện Tại</span>
              <span className="text-red-500">*</span>
            </span>
            <span
              className={`text-[10px] font-bold ${
                isRiotGame && checkedAccount
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded'
                  : isRiotGame
                  ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded group-hover:underline'
                  : 'text-blue-400 group-hover:underline'
              }`}
            >
              {isRiotGame && checkedAccount
                ? '✓ Đã đồng bộ Riot'
                : isRiotGame
                ? 'Cần kiểm tra Riot *'
                : 'Thay đổi'}
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center p-1.5 shadow-inner">
              <img
                src={currentRankImg}
                alt={currentRankObj.label}
                className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-200"
              />
            </div>
            <div className="min-w-0">
              <div className={`text-base sm:text-lg font-black tracking-tight ${currentTierMeta.textColor}`}>
                {currentRankObj.label}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentTierMeta.badgeBg}`}>
                  {isValorant
                    ? currentRankObj.tier === 'RADIANT'
                      ? 'Radiant'
                      : `Bậc ${currentRankObj.division}`
                    : isAov && AOV_SINGLE_STEP_TIERS.includes(currentRankObj.tier)
                    ? currentTierMeta.name
                    : currentRankObj.tier === 'MASTER'
                    ? 'Cao Thủ'
                    : `Bậc ${currentRankObj.division}`}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Mốc #{currentRankIndex + 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Icon Chuyển Giao Mũi Tên */}
        <div className="md:col-span-1 flex items-center justify-center py-1 md:py-0">
          <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-md">
            <ArrowRight size={15} className="rotate-90 md:rotate-0" />
          </div>
        </div>

        {/* Card Rank Mong Muốn */}
        <div
          onClick={() => handleOpenRankModal('DESIRED')}
          className={`md:col-span-5 p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden bg-gradient-to-br ${desiredTierMeta.bgGradient} ${desiredTierMeta.borderColor} hover:border-emerald-400/80 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99]`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
              <span>Rank Mong Muốn</span>
              <span className="text-red-500">*</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 group-hover:underline">
              Thay đổi
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center p-1.5 shadow-inner">
              <img
                src={desiredRankImg}
                alt={desiredRankObj.label}
                className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-200"
              />
            </div>
            <div className="min-w-0">
              <div className={`text-base sm:text-lg font-black tracking-tight ${desiredTierMeta.textColor}`}>
                {desiredRankObj.label}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${desiredTierMeta.badgeBg}`}>
                  {isValorant
                    ? desiredRankObj.tier === 'RADIANT'
                      ? 'Radiant'
                      : `Bậc ${desiredRankObj.division}`
                    : isAov && AOV_SINGLE_STEP_TIERS.includes(desiredRankObj.tier)
                    ? desiredTierMeta.name
                    : desiredRankObj.tier === 'MASTER'
                    ? 'Cao Thủ'
                    : `Bậc ${desiredRankObj.division}`}
                </span>
                <span className="text-[11px] text-emerald-400 font-bold">
                  +{calculation.stepsCount} bậc nhảy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng giá trọn bậc Liên Quân */}
      {isAov && (
        <div className="mt-4 p-4 rounded-2xl bg-zinc-950/80 border border-amber-500/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              <span>Chọn Nhanh Theo Bậc Lớn Liên Quân</span>
            </span>
            <span className="text-[11px] text-zinc-400">
              Nhấn vào gói để chọn lộ trình ngay
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AOV_TIER_PACKAGES.map((pkg) => {
              const fromStepId = pkg.stepIds[0];
              const lastStepIdx = activeRankSteps.findIndex(
                (s) => s.id === pkg.stepIds[pkg.stepIds.length - 1]
              );
              const toStep = activeRankSteps[lastStepIdx + 1];
              const pkgTotal = Math.round(
                getAovTierPackageCurrentTotal(pkg, assignedBooster ? boosterStepOverrides : undefined) *
                effectiveRankMultiplier
              );
              const isCurrentPkg =
                currentRankId === fromStepId && toStep && desiredRankId === toStep.id;

              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => {
                    if (!toStep) return;
                    setCurrentRankId(fromStepId);
                    setDesiredRankId(toStep.id);
                    toast.success(`Đã chọn lộ trình ${pkg.shortLabel}`);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isCurrentPkg
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/50'
                      : pkg.isHighRank
                      ? 'bg-zinc-900/70 border-purple-500/25 hover:border-purple-400/60'
                      : 'bg-zinc-900/70 border-zinc-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <img src={pkg.fromImage} alt="" className="w-5 h-5 object-contain" />
                      <ArrowRight size={10} className="text-zinc-500" />
                      <img src={pkg.toImage} alt="" className="w-5 h-5 object-contain" />
                    </div>
                    {pkg.isHighRank && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        Cao Thủ+
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-white leading-tight truncate">
                    {pkg.shortLabel}
                  </div>
                  <div className="text-xs font-black font-mono text-amber-400">
                    {pkgTotal.toLocaleString('vi-VN')} đ
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cảnh báo nếu rank không hợp lệ */}
      {currentRankIndex >= desiredRankIndex && (
        <div className="mt-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={15} className="shrink-0" />
          <span>
            Lộ trình chưa hợp lệ: <strong>Rank hiện tại ({currentRankObj.label})</strong> phải thấp hơn{' '}
            <strong>Rank mong muốn ({desiredRankObj.label})</strong>. Vui lòng bấm vào thẻ để chọn lại.
          </span>
        </div>
      )}
    </div>
  );
}

export default RankLadderSection;
