'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Info, Crown } from 'lucide-react';

interface RankSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankModalTarget: 'CURRENT' | 'DESIRED';
  gameId: string;
  isValorant: boolean;
  isAov: boolean;
  activeTierConfig: Record<string, any>;
  activeRankSteps: any[];
  currentRankObj: { label: string; [key: string]: any };
  desiredRankObj: { label: string; [key: string]: any };
  currentRankIndex: number;
  desiredRankIndex: number;
  tempTier: string;
  setTempTier: (tier: string) => void;
  tempDivision: string;
  setTempDivision: (div: string) => void;
  handleConfirmRank: () => void;
  getDivisionsForTier: (gameCode: string, tier: string) => string[];
  findRankStepIndex: (gameCode: string, tier: string, div?: string) => number;
}

export function RankSelectModal({
  isOpen,
  onClose,
  rankModalTarget,
  gameId,
  isValorant,
  isAov,
  activeTierConfig,
  activeRankSteps,
  currentRankObj,
  desiredRankObj,
  currentRankIndex,
  desiredRankIndex,
  tempTier,
  setTempTier,
  tempDivision,
  setTempDivision,
  handleConfirmRank,
  getDivisionsForTier,
  findRankStepIndex,
}: RankSelectModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="rank-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="rank-modal-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#0e1017] border border-white/10 rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-[0_25px_80px_rgba(0,0,0,0.85)] space-y-5 relative max-h-[92vh] flex flex-col will-change-transform cursor-default"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Trophy size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {rankModalTarget === 'CURRENT' ? 'Chọn Rank Hiện Tại' : 'Chọn Rank Mong Muốn'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {rankModalTarget === 'CURRENT'
                      ? `Rank hiện tại phải thấp hơn Rank mong muốn (${desiredRankObj.label})`
                      : `Rank mong muốn phải cao hơn Rank hiện tại (${currentRankObj.label})`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Context Banner */}
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs shrink-0 ${
                rankModalTarget === 'CURRENT'
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Info size={14} className="shrink-0 text-blue-400" />
                <span className="truncate">
                  {rankModalTarget === 'CURRENT' ? (
                    <>
                      Đang chọn rank xuất phát để cày lên: <strong className="text-white">{desiredRankObj.label}</strong>
                    </>
                  ) : (
                    <>
                      Đang chọn mốc rank đích cần đạt từ: <strong className="text-white">{currentRankObj.label}</strong>
                    </>
                  )}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white shrink-0 ml-2">
                {rankModalTarget === 'CURRENT'
                  ? `Yêu cầu: < ${desiredRankObj.label}`
                  : `Yêu cầu: > ${currentRankObj.label}`}
              </span>
            </div>

            {/* Scroll Content */}
            <div className="overflow-y-auto custom-dark-scrollbar space-y-5 pr-1 flex-1">
              {/* 1. Chọn Tier Lớn */}
              <div>
                <span className="text-xs sm:text-sm font-bold text-zinc-200 block mb-2.5">
                  1. Chọn Hạng (Tier):
                </span>
                <div
                  className={`grid ${
                    isValorant || isAov ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-4'
                  } gap-2.5 sm:gap-3`}
                >
                  {Object.entries(activeTierConfig).map(([tierKey, meta]) => {
                    const tierSteps = activeRankSteps.filter((r) => r.tier === tierKey);
                    const lowestInTierIdx =
                      tierSteps.length > 0
                        ? activeRankSteps.findIndex((r) => r.id === tierSteps[0].id)
                        : -1;
                    const highestInTierIdx =
                      tierSteps.length > 0
                        ? activeRankSteps.findIndex((r) => r.id === tierSteps[tierSteps.length - 1].id)
                        : -1;

                    const isMaxTierKey = isValorant ? 'RADIANT' : isAov ? 'LEGEND' : 'MASTER';
                    const isTierDisabled =
                      rankModalTarget === 'CURRENT'
                        ? tierKey === isMaxTierKey || lowestInTierIdx >= desiredRankIndex
                        : highestInTierIdx <= currentRankIndex;

                    const isSelected = tempTier === tierKey;

                    return (
                      <button
                        key={tierKey}
                        type="button"
                        disabled={isTierDisabled}
                        onClick={() => {
                          if (isTierDisabled) return;
                          setTempTier(tierKey);
                          const tierDivs = getDivisionsForTier(gameId, tierKey);
                          if (tierDivs.length === 0) {
                            setTempDivision('');
                          } else {
                            if (rankModalTarget === 'CURRENT') {
                              const validDivs = tierDivs.filter((d) => {
                                const idx = findRankStepIndex(gameId, tierKey, d);
                                return idx !== -1 && idx < desiredRankIndex;
                              });
                              if (validDivs.includes(tempDivision)) {
                                // keep
                              } else if (validDivs.length > 0) {
                                setTempDivision(validDivs[validDivs.length - 1]);
                              }
                            } else {
                              const validDivs = tierDivs.filter((d) => {
                                const idx = findRankStepIndex(gameId, tierKey, d);
                                return idx !== -1 && idx > currentRankIndex;
                              });
                              if (validDivs.includes(tempDivision)) {
                                // keep
                              } else if (validDivs.length > 0) {
                                setTempDivision(validDivs[0]);
                              }
                            }
                          }
                        }}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 relative ${
                          isTierDisabled
                            ? 'bg-zinc-950/20 border-zinc-900/60 opacity-25 cursor-not-allowed select-none'
                            : isSelected
                            ? `${meta.activeBorder} ${meta.bgGradient} ${meta.glowClass}`
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                          <img
                            src={meta.image}
                            alt={meta.name}
                            className={`w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] ${
                              isTierDisabled ? 'grayscale' : ''
                            }`}
                          />
                        </div>
                        <span
                          className={`text-xs font-bold truncate max-w-full ${
                            isTierDisabled
                              ? 'text-zinc-600'
                              : isSelected
                              ? meta.textColor
                              : 'text-zinc-300'
                          }`}
                        >
                          {meta.name}
                        </span>
                        {isTierDisabled && (
                          <span className="text-[9px] text-zinc-600 font-medium -mt-0.5">
                            {rankModalTarget === 'CURRENT' ? 'Quá cao' : 'Quá thấp'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Chọn Bậc (Division) */}
              {(() => {
                const tierDivisions = getDivisionsForTier(gameId, tempTier);
                if (tierDivisions.length > 0) {
                  return (
                    <div>
                      <span className="text-xs font-bold text-zinc-300 block mb-2">
                        2. Chọn Phân Bậc (Division):
                      </span>
                      <div
                        className={`grid ${
                          tierDivisions.length === 3
                            ? 'grid-cols-3'
                            : tierDivisions.length === 5
                            ? 'grid-cols-5'
                            : 'grid-cols-4'
                        }`}
                      >
                        {tierDivisions.map((div) => {
                          const stepIdx = findRankStepIndex(gameId, tempTier, div);

                          const isDivisionDisabled =
                            rankModalTarget === 'CURRENT'
                              ? stepIdx >= desiredRankIndex
                              : stepIdx <= currentRankIndex;

                          const isSelected = tempDivision === div;

                          return (
                            <button
                              key={div}
                              type="button"
                              disabled={isDivisionDisabled}
                              onClick={() => setTempDivision(div)}
                              className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                isDivisionDisabled
                                  ? 'bg-zinc-950/30 border-zinc-900 opacity-25 cursor-not-allowed text-zinc-600 select-none'
                                  : isSelected
                                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-300'
                                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                              }`}
                            >
                              <span className="text-sm font-extrabold font-mono tracking-wider">
                                Bậc {div}
                              </span>
                              {isDivisionDisabled && (
                                <span className="text-[9px] text-zinc-500">
                                  {rankModalTarget === 'CURRENT'
                                    ? stepIdx === desiredRankIndex
                                      ? 'Bằng rank đích'
                                      : 'Cao hơn'
                                    : stepIdx === currentRankIndex
                                    ? 'Bằng rank hiện tại'
                                    : 'Thấp hơn'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const highStep = activeRankSteps.find((s) => s.tier === tempTier);
                return (
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                    <Crown size={18} className="shrink-0 text-amber-400" />
                    <span>
                      <strong>{highStep?.label || activeTierConfig[tempTier]?.name || tempTier}:</strong>{' '}
                      {isAov
                        ? 'Mốc bậc cao (tính theo sao chuẩn — Booster có thể tùy chỉnh giá). Nếu muốn cày số sao lẻ bất kỳ, hãy chọn tab "Tính tiền theo Số Sao".'
                        : 'Mốc rank đích cao nhất trong bảng giá leo rank theo bậc.'}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Footer Preview & Confirm */}
            {(() => {
              const tempRankIdx = findRankStepIndex(gameId, tempTier, tempDivision);
              const isSelectionValid =
                tempRankIdx !== -1 &&
                (rankModalTarget === 'CURRENT'
                  ? tempRankIdx < desiredRankIndex
                  : tempRankIdx > currentRankIndex);
              const selectedLabel =
                tempRankIdx !== -1
                  ? activeRankSteps[tempRankIdx].label
                  : `${activeTierConfig[tempTier]?.name || tempTier}${tempDivision ? ` ${tempDivision}` : ''}`;

              return (
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Đang chọn:</span>
                    <span
                      className={`text-sm font-black ${
                        isSelectionValid ? 'text-white' : 'text-red-400'
                      }`}
                    >
                      {selectedLabel}
                    </span>
                    {!isSelectionValid && (
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                        {rankModalTarget === 'CURRENT'
                          ? `Phải < ${desiredRankObj.label}`
                          : `Phải > ${currentRankObj.label}`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={!isSelectionValid}
                      onClick={handleConfirmRank}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelectionValid
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer'
                          : 'bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      Xác Nhận
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RankSelectModal;
