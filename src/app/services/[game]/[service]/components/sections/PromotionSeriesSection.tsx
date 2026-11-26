import React from 'react';
import { Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { LOL_PROMOTION_SERIES, PromotionTierItem } from '@/lib/games';

interface PromotionSeriesSectionProps {
  isPromotion: boolean;
  selectedPromoId: string;
  setSelectedPromoId: (id: string) => void;
  selectedPromo: PromotionTierItem;
  assignedBooster: any;
  matchingBoosterService: any;
}

export function PromotionSeriesSection({
  isPromotion,
  selectedPromoId,
  setSelectedPromoId,
  selectedPromo,
  assignedBooster,
  matchingBoosterService,
}: PromotionSeriesSectionProps) {
  if (!isPromotion) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            <span>Rank hiện tại</span>
            <span className="text-red-500">*</span>
          </label>
          <span className="text-[11px] text-zinc-400">
            Chọn bậc hiện tại để cày thăng hạng lên bậc kế tiếp
          </span>
        </div>

        {/* Dãy 7 Huy Hiệu Rank Nằm Ngang (Sắt I -> Kim Cương I) */}
        <div className="relative">
          <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4 overflow-x-auto sm:overflow-visible pt-10 pb-4 px-3 scrollbar-none">
            {LOL_PROMOTION_SERIES.map((promo) => {
              const isSelected = selectedPromoId === promo.id;
              return (
                <div key={promo.id} className="relative flex flex-col items-center shrink-0">
                  {/* Tooltip Bong Bóng Nói (Speech Bubble) trên Badge Đang Chọn */}
                  {isSelected && (
                    <div className="absolute -top-9 z-20 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                      <div className="bg-white text-zinc-950 font-extrabold text-[11px] px-2.5 py-0.5 rounded shadow-lg border border-zinc-200 relative">
                        {promo.fromLabel}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPromoId(promo.id)}
                    className={`relative w-12 h-14 sm:w-16 sm:h-18 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-red-500 bg-red-500/10 shadow-[0_0_18px_rgba(239,68,68,0.35)] scale-110 z-10'
                        : 'border border-transparent hover:border-zinc-700 bg-transparent hover:bg-zinc-800/40 opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    title={promo.fromLabel}
                  >
                    <img
                      src={promo.icon}
                      alt={promo.fromLabel}
                      className="w-10 h-10 sm:w-13 sm:h-13 object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thẻ Lộ Trình Thăng Hạng & Cam Kết */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Bắt đầu */}
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center p-1 shadow-inner">
                <img
                  src={selectedPromo.icon}
                  alt={selectedPromo.fromLabel}
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                  Rank bắt đầu
                </span>
                <span className="text-base font-extrabold text-white">
                  {selectedPromo.fromLabel}
                </span>
              </div>
            </div>

            {/* Mũi tên */}
            <div className="flex items-center justify-center text-amber-400 px-1">
              <ArrowRight size={20} />
            </div>

            {/* Đích đến */}
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-black/50 border border-emerald-500/30 flex items-center justify-center p-1 shadow-inner shadow-emerald-500/10">
                <img
                  src={selectedPromo.targetIcon}
                  alt={selectedPromo.toLabel}
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                  Mục tiêu thăng hạng
                </span>
                <span className="text-base font-extrabold text-emerald-400">
                  {selectedPromo.toLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Giá & Cam kết */}
          <div className="text-left sm:text-right pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Đơn Giá Chuỗi
            </div>
            <div className="text-xl font-black font-mono text-cyan-400">
              {(
                assignedBooster?.stepOverrides?.[selectedPromo.id] ??
                matchingBoosterService?.stepOverrides?.[selectedPromo.id] ??
                selectedPromo.defaultPrice
              ).toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-sans text-zinc-500">đ</span>
            </div>
            <div className="text-[11px] text-emerald-400/90 font-medium mt-0.5 flex items-center sm:justify-end gap-1">
              <CheckCircle2 size={13} className="shrink-0" />
              <span>Cam kết vượt chuỗi 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromotionSeriesSection;
