// src/app/(dashboard)/booster/services/components/RankTableModal.tsx
'use client';

import React from 'react';
import { Trophy, X, Sparkles, ArrowRight } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games';
import { getRankSteps, getRankImage } from '@/lib/rank-calculator';
import {
  AOV_TIER_PACKAGES,
  distributeAovTierPackageToSteps,
  getAovTierPackageCurrentTotal,
} from '@/lib/aov';
import { CustomService } from './servicesTypes';

interface RankTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRankEditingServiceId: string | null;
  customServices: CustomService[];
  stepOverrides: Record<string, number>;
  activeGameCode: string;
  setCustomServices: React.Dispatch<React.SetStateAction<CustomService[]>>;
  setStepOverrides: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onResetToDefault: () => void;
  onSaveAndClose: () => void;
}

export const RankTableModal: React.FC<RankTableModalProps> = ({
  isOpen,
  onClose,
  activeRankEditingServiceId,
  customServices,
  stepOverrides,
  activeGameCode,
  setCustomServices,
  setStepOverrides,
  onResetToDefault,
  onSaveAndClose,
}) => {
  if (!isOpen) return null;

  const activeEditingService = activeRankEditingServiceId
    ? customServices.find((s) => s.id === activeRankEditingServiceId)
    : null;
  const modalGameCode = (activeEditingService?.gameCode || activeGameCode || 'LOL').toUpperCase();
  const currentRankSteps = getRankSteps(modalGameCode);
  const gameDef = GAMES_CATALOG.find((g) => g.id.toUpperCase() === modalGameCode);

  const activeOverrides = activeRankEditingServiceId
    ? customServices.find((s) => s.id === activeRankEditingServiceId)?.stepOverrides || {}
    : stepOverrides;

  const applyTierPackageChange = (pkg: (typeof AOV_TIER_PACKAGES)[number], val: number) => {
    if (activeRankEditingServiceId) {
      const updated = customServices.map((s) => {
        if (s.id === activeRankEditingServiceId) {
          return {
            ...s,
            stepOverrides: distributeAovTierPackageToSteps(pkg, val, s.stepOverrides || {}),
          };
        }
        return s;
      });
      setCustomServices(updated);
    } else {
      setStepOverrides((prev) => distributeAovTierPackageToSteps(pkg, val, prev));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0e1017] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800/90 flex justify-between items-center bg-zinc-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Bảng Giá Bậc Rank {gameDef?.name || modalGameCode}
                <span className="text-zinc-400 font-semibold text-sm ml-2">
                  ({currentRankSteps[0]?.label} → {currentRankSteps[currentRankSteps.length - 1]?.label})
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tùy chỉnh số tiền thực tế nhận cho từng bậc hoặc từng bước nhảy rank (để trống để dùng giá sàn mặc định).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-dark-scrollbar space-y-6 flex-1">
          {/* CẤU HÌNH NHANH THEO BẬC LỚN CHO LIÊN QUÂN (AOV) */}
          {(modalGameCode === 'AOV' || modalGameCode === 'LIENQUAN') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/25 via-zinc-950/90 to-zinc-950 border border-amber-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={15} className="text-amber-400" />
                    <span>Cấu hình nhanh trọn từng bậc Liên Quân</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Nhập giá trọn bậc — hệ thống tự chia đều cho từng đoàn bên dưới. Từ Cao Thủ trở lên tự do tùy chỉnh.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 w-fit shrink-0">
                  {AOV_TIER_PACKAGES.length} mốc bậc lớn
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AOV_TIER_PACKAGES.map((pkg) => {
                  const currentTotal = getAovTierPackageCurrentTotal(pkg, activeOverrides);
                  const hasCustom = pkg.stepIds.some(
                    (id) => typeof activeOverrides[id] === 'number' && activeOverrides[id] > 0
                  );
                  return (
                    <div
                      key={pkg.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        pkg.isHighRank
                          ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-400/50'
                          : 'bg-zinc-900/70 border-zinc-800 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-xl px-1.5 py-1 shrink-0">
                            <img
                              src={pkg.fromImage}
                              alt={pkg.fromTier}
                              className="w-6 h-6 object-contain"
                            />
                            <ArrowRight size={11} className="text-zinc-500" />
                            <img
                              src={pkg.toImage}
                              alt={pkg.toTier}
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <div
                              className="text-xs font-extrabold text-white truncate"
                              title={pkg.label}
                            >
                              {pkg.shortLabel}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                              {pkg.desc}
                            </div>
                          </div>
                        </div>
                        {pkg.isHighRank && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0">
                            Cao Thủ+
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder={pkg.defaultTotalPrice.toLocaleString('vi-VN')}
                          value={hasCustom ? currentTotal : ''}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            const val = clean ? parseInt(clean, 10) : 0;
                            applyTierPackageChange(pkg, val);
                          }}
                          className={`w-full bg-zinc-950 border rounded-xl pr-7 pl-3 py-2 text-sm font-mono font-extrabold text-right outline-none transition-colors ${
                            hasCustom
                              ? 'border-amber-400/70 text-amber-300 focus:border-amber-400'
                              : 'border-zinc-700/80 text-amber-300 placeholder:text-amber-300/60 focus:border-amber-400'
                          }`}
                        />
                        <span className="text-xs font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          đ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                Tinh chỉnh chi tiết từng nấc bậc ({currentRankSteps.length - 1} bước nhảy)
              </span>
              <span className="text-[11px] text-zinc-500">Để trống = dùng giá sàn mặc định</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {currentRankSteps.slice(0, -1).map((step, idx) => {
                const nextStep = currentRankSteps[idx + 1];
                const currentOverride = activeRankEditingServiceId
                  ? customServices.find((s) => s.id === activeRankEditingServiceId)?.stepOverrides?.[
                      step.id
                    ]
                  : stepOverrides[step.id];
                const stepImg = getRankImage(modalGameCode, step);
                const nextImg = getRankImage(modalGameCode, nextStep);

                return (
                  <div
                    key={step.id}
                    className={`px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                      currentOverride
                        ? 'bg-cyan-950/15 border-cyan-500/40'
                        : 'bg-zinc-950/90 border-zinc-800/90 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-zinc-200 min-w-0">
                      <img
                        src={stepImg}
                        alt={step.label}
                        className="w-7 h-7 object-contain shrink-0 drop-shadow"
                      />
                      <span className="truncate">{step.label}</span>
                      <ArrowRight size={13} className="text-zinc-500 shrink-0" />
                      <img
                        src={nextImg}
                        alt={nextStep.label}
                        className="w-7 h-7 object-contain shrink-0 drop-shadow"
                      />
                      <span className="truncate">{nextStep.label}</span>
                    </div>

                    <div className="relative w-32 shrink-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={step.stepPrice.toLocaleString('vi-VN')}
                        value={currentOverride || ''}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                          const val = clean ? parseInt(clean, 10) : 0;
                          if (activeRankEditingServiceId) {
                            const updated = customServices.map((s) => {
                              if (s.id === activeRankEditingServiceId) {
                                const steps = { ...(s.stepOverrides || {}) };
                                if (isNaN(val) || val <= 0) {
                                  delete steps[step.id];
                                } else {
                                  steps[step.id] = val;
                                }
                                return { ...s, stepOverrides: steps };
                              }
                              return s;
                            });
                            setCustomServices(updated);
                          } else {
                            setStepOverrides((prev) => {
                              const updated = { ...prev };
                              if (isNaN(val) || val <= 0) {
                                delete updated[step.id];
                              } else {
                                updated[step.id] = val;
                              }
                              return updated;
                            });
                          }
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700/90 rounded-xl pr-7 pl-3 py-1.5 text-xs sm:text-[13px] text-white placeholder:text-zinc-500 font-mono font-bold text-right outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[11px] font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        đ
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-950/95 border-t border-zinc-800/90 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={onResetToDefault}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Đặt lại về giá sàn mặc định
          </button>
          <button
            type="button"
            onClick={onSaveAndClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
          >
            Xong &amp; Lưu Bảng Giá
          </button>
        </div>
      </div>
    </div>
  );
};
