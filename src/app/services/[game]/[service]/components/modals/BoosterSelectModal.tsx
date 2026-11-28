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
            className="bg-[#0e1017] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-[0_25px_80px_rgba(0,0,0,0.85)] space-y-3.5 sm:space-y-4 relative max-h-[90vh] flex flex-col will-change-transform cursor-default"
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
            <div className="overflow-y-auto custom-dark-scrollbar space-y-2.5 pr-1 flex-1 min-h-[120px] max-h-[65vh] sm:max-h-[480px]">
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
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-950/40 via-zinc-900/90 to-purple-950/20 border-purple-500/80 ring-1 ring-purple-500/50 shadow-lg shadow-purple-950/40'
                          : 'bg-zinc-950/70 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {/* Hàng 1: Avatar + Tên & Username + Nút Chọn/Đang chọn */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden shadow-sm">
                            {b.avatar ? (
                              <Image
                                src={b.avatar}
                                alt=""
                                width={44}
                                height={44}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (b.displayName || b.username || 'B').slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-extrabold text-white text-xs sm:text-sm truncate">
                                {b.displayName || b.username}
                              </span>
                              <UserBadge role="BOOSTER" size="sm" />
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
                              @{b.username}
                            </div>
                          </div>
                        </div>

                        {/* Nút hành động trạng thái chọn */}
                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="px-2.5 py-1 rounded-xl bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1 shadow-md shadow-purple-500/25">
                              <Check size={13} strokeWidth={2.5} />
                              <span>Đang chọn</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="px-3.5 py-1 rounded-xl bg-zinc-800 hover:bg-purple-600 text-zinc-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
                            >
                              Chọn
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Hàng 2: Thông số & Tags - Trải rộng toàn bộ chiều ngang card, không bị bó nghẹt chữ */}
                      <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-2 flex-wrap text-xs">
                        {/* Rating pill */}
                        <span
                          className={`inline-flex items-center gap-1 font-extrabold px-2 py-0.5 rounded-md text-[11px] border ${
                            b.rating && b.rating > 0
                              ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                              : 'text-zinc-500 bg-zinc-800/40 border-zinc-700/40'
                          }`}
                        >
                          <Star size={11} fill="currentColor" />
                          <span>{b.rating && b.rating > 0 ? b.rating.toFixed(1) : '5.0'}</span>
                        </span>

                        {/* Đơn cày thành công */}
                        <span className="text-zinc-300 text-[11.5px] font-medium whitespace-nowrap">
                          <strong className="text-white font-mono">{b.completedOrders || 0}</strong> đơn thành công
                        </span>

                        {/* Hệ số giá nếu có */}
                        {bMultiplier && bMultiplier !== 1.0 && (
                          <span className="text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md text-[10.5px] font-semibold whitespace-nowrap">
                            Hệ số giá: {(bMultiplier * 100).toFixed(0)}%
                          </span>
                        )}

                        {/* Voucher giảm giá nếu có */}
                        {bCoupon?.isActive && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10.5px] whitespace-nowrap">
                            Voucher -{bCoupon.discountPercent}%
                          </span>
                        )}

                        {/* Lịch làm việc */}
                        <span className="px-2 py-0.5 rounded-md bg-cyan-950/30 text-cyan-300 border border-cyan-500/25 font-medium text-[10.5px] flex items-center gap-1 whitespace-nowrap">
                          <Clock size={11} className="text-cyan-400 shrink-0" />
                          <span>{getBoosterWorkingScheduleText(b)}</span>
                        </span>
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
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Có <strong className="text-white font-bold">{filteredBoosters.length}</strong> Booster sẵn sàng</span>
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
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
