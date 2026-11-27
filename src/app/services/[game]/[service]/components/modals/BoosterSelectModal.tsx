'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Search, Star, Check, Clock } from 'lucide-react';
import Image from 'next/image';
import UserBadge from '@/components/UserBadge';
import { getBoosterWorkingScheduleText } from '@/lib/booster-helpers';

interface BoosterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  boosters: any[];
  assignedBooster: any;
  onSelectBooster: (booster: any) => void;
}

export function BoosterSelectModal({
  isOpen,
  onClose,
  boosters,
  assignedBooster,
  onSelectBooster,
}: BoosterSelectModalProps) {
  const [boosterSearchTerm, setBoosterSearchTerm] = useState('');

  const filteredBoosters = useMemo(() => {
    const q = boosterSearchTerm.toLowerCase().trim();
    if (!q) return boosters;
    return boosters.filter((b) => {
      const matchName = (b.displayName || '').toLowerCase().includes(q);
      const matchUser = (b.username || '').toLowerCase().includes(q);
      return matchName || matchUser;
    });
  }, [boosters, boosterSearchTerm]);

  const handleClose = () => {
    onClose();
    setBoosterSearchTerm('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="booster-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            key="booster-modal-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#0e1017] border border-white/10 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-[0_25px_80px_rgba(0,0,0,0.85)] space-y-4 relative max-h-[90vh] flex flex-col will-change-transform cursor-default"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Crown size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Chọn Booster Cày Thuê</h3>
                  <p className="text-xs text-zinc-400">
                    Chọn Booster uy tín để đảm bảo tiến độ và tỷ lệ thắng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Input Search Box */}
            <div className="relative shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm theo tên hiển thị hoặc username..."
                value={boosterSearchTerm}
                onChange={(e) => setBoosterSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Booster List Scrollable */}
            <div className="overflow-y-auto custom-dark-scrollbar space-y-2.5 pr-1 flex-1 min-h-[260px] max-h-[480px]">
              {filteredBoosters.length > 0 ? (
                filteredBoosters.map((b) => {
                  const isSelected = assignedBooster?.user?._id === b._id;
                  const bProfile = b.boosterProfile || b.booster_info || b;
                  const bCoupon = bProfile?.service_settings?.coupon;
                  const bMultiplier = bProfile?.service_settings?.standardConfig?.rankPriceMultiplier;
                  const bSchedule = bProfile?.service_settings?.addonsConfig?.schedule;

                  return (
                    <div
                      key={b._id}
                      onClick={() => {
                        onSelectBooster(b);
                        handleClose();
                      }}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-950/30 border-purple-500/80 ring-1 ring-purple-500/50 shadow-md shadow-purple-950/50'
                          : 'bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-white font-bold text-base shrink-0">
                          {b.avatar ? (
                            <Image
                              src={b.avatar}
                              alt=""
                              width={44}
                              height={44}
                              className="rounded-2xl object-cover"
                            />
                          ) : (
                            (b.displayName || b.username || 'B').slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-extrabold text-white text-xs sm:text-sm truncate">
                                {b.displayName || b.username}
                              </span>
                              <UserBadge role="BOOSTER" size="sm" />
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono truncate">
                              @{b.username}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
                            <span
                              className={`flex items-center gap-1 font-bold ${
                                b.rating && b.rating > 0 ? 'text-amber-400' : 'text-zinc-500'
                              }`}
                            >
                              <Star size={11} fill="currentColor" />
                              {b.rating && b.rating > 0 ? b.rating.toFixed(1) : '0.0'}
                            </span>
                            <span>•</span>
                            <span className="text-zinc-300">
                              {b.completedOrders || 0} đơn thành công
                            </span>
                            {bMultiplier && bMultiplier !== 1.0 && (
                              <>
                                <span>•</span>
                                <span className="text-cyan-400 font-semibold">
                                  Giá: {(bMultiplier * 100).toFixed(0)}%
                                </span>
                              </>
                            )}
                            {bCoupon?.isActive && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                                Voucher -{bCoupon.discountPercent}%
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold text-[10px] flex items-center gap-1">
                              <Clock size={10} />
                              <span className="truncate max-w-[170px]">{getBoosterWorkingScheduleText(b)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="px-2.5 py-1 rounded-xl bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1">
                            <Check size={13} />
                            <span>Đang chọn</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-purple-600 text-zinc-300 hover:text-white text-xs font-semibold transition-all"
                          >
                            Chọn
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <Search className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-xs">Không tìm thấy Booster nào khớp với &quot;{boosterSearchTerm}&quot;</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
              <span>Có {filteredBoosters.length} Booster sẵn sàng</span>
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-zinc-400 hover:text-white font-medium"
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

export default BoosterSelectModal;
