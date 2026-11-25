import React from 'react';
import { Info, X } from 'lucide-react';

interface LpGainOption {
  id: string;
  label: string;
  desc: string;
  subLabel: string;
  discountLabel: string;
  badgeClass: string;
  multiplier: number;
}

interface LpGainSectionProps {
  isPromotion: boolean;
  isAov: boolean;
  isMatches: boolean;
  isPlacements: boolean;
  isValorant: boolean;
  showGainTooltip: boolean;
  setShowGainTooltip: React.Dispatch<React.SetStateAction<boolean>>;
  activeGainOptions: LpGainOption[];
  lpGain: string;
  setLpGain: (gain: string) => void;
}

export function LpGainSection({
  isPromotion,
  isAov,
  isMatches,
  isPlacements,
  isValorant,
  showGainTooltip,
  setShowGainTooltip,
  activeGainOptions,
  lpGain,
  setLpGain,
}: LpGainSectionProps) {
  if (isPromotion || isAov || isMatches || isPlacements) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2.5">
        <div className="relative inline-flex items-center gap-1.5">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <span>Điểm cộng mỗi ván ({isValorant ? 'RR Gain' : 'LP Gain'})</span>
            <span className="text-red-500">*</span>
          </label>

          {/* Nút bật/tắt Tooltip giải thích trên cả Desktop & Mobile */}
          <button
            type="button"
            onClick={() => setShowGainTooltip((prev) => !prev)}
            onMouseEnter={() => setShowGainTooltip(true)}
            className="p-1 rounded-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
            title="Bấm để xem giải thích chi tiết"
            aria-label="Xem giải thích điểm cộng mỗi ván"
          >
            <Info size={14} />
          </button>

          {/* Popover Tooltip Floating Card */}
          {showGainTooltip && (
            <div
              onMouseLeave={() => setShowGainTooltip(false)}
              className="absolute left-0 top-7 z-50 w-72 sm:w-84 p-4 rounded-2xl bg-zinc-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-xs space-y-2.5 animate-in fade-in zoom-in-95"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="font-extrabold text-white flex items-center gap-1.5">
                  <Info size={14} className="text-cyan-400" />
                  <span>Điểm cộng ({isValorant ? 'RR' : 'LP'}) là gì?</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowGainTooltip(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Là số điểm <strong>{isValorant ? 'Rank Rating (RR)' : 'League Points (LP)'}</strong> mà tài khoản của bạn nhận được sau một trận thắng xếp hạng gần nhất.
              </p>

              <div className="space-y-1.5 text-[11px] pt-1 border-t border-zinc-800/80">
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-emerald-400 shrink-0">≥ 25 điểm (-10%):</span>
                  <span className="text-zinc-400">MMR ẩn rất cao, tuyển thủ leo cực nhanh nên bạn được chiết khấu giá.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-blue-400 shrink-0">20-24 điểm (0%):</span>
                  <span className="text-zinc-400">Mức điểm chuẩn thông thường của hệ thống Riot Games.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-400 shrink-0">15-19 điểm (+10%):</span>
                  <span className="text-zinc-400">MMR trung bình, cần thêm số trận thắng để hoàn thành mốc rank.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-rose-400 shrink-0">&lt; 15 điểm (+15%):</span>
                  <span className="text-zinc-400">Tài khoản bị kẹt điểm (Hell Elo), tuyển thủ phải gánh thêm nhiều trận đấu hơn.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <span className="text-[11px] text-zinc-400 hidden sm:inline">
          Ảnh hưởng trực tiếp đến tổng giá cày
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {activeGainOptions.map((opt) => {
          const isSelected = lpGain === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLpGain(opt.id)}
              className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-full min-h-[82px] cursor-pointer group ${
                isSelected
                  ? 'bg-cyan-950/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/50'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full mb-1.5">
                <span className={`font-black text-sm tracking-tight ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                  {opt.label}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border font-mono shrink-0 ${opt.badgeClass}`}>
                  {opt.discountLabel}
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] text-zinc-300 font-medium leading-tight">
                  {opt.desc}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {opt.subLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LpGainSection;
