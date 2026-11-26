'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  QrCode,
  ExternalLink,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount: number;
  currentBalance?: number;
  missingAmount?: number;
  orderTitle?: string;
  onOpenDeposit?: () => void;
}

export default function InsufficientBalanceModal({
  isOpen,
  onClose,
  requiredAmount,
  currentBalance = 0,
  missingAmount,
  orderTitle,
  onOpenDeposit,
}: InsufficientBalanceModalProps) {
  const calculatedMissing = missingAmount !== undefined && missingAmount > 0
    ? missingAmount
    : Math.max(0, requiredAmount - currentBalance);

  // Lắng nghe phím ESC để đóng
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Khóa cuộn trang khi modal mở
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleOpenWalletTab = () => {
    if (typeof window !== 'undefined') {
      window.open('/wallet?tab=deposit', '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', duration: 0.45, bounce: 0.2 }}
            className="relative w-full max-w-lg bg-zinc-950/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-white overflow-hidden z-10"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
              aria-label="Đóng modal"
            >
              <X size={18} />
            </button>

            {/* Header Content */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-3.5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-amber-400/10 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Wallet className="w-8 h-8 text-amber-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-black font-extrabold text-[10px] shadow-sm animate-pulse">
                  !
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
                <AlertTriangle size={12} className="shrink-0" />
                <span>Số dư ví không đủ thanh toán</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Cần nạp thêm tiền vào ví
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-sm">
                {orderTitle
                  ? `Đơn hàng "${orderTitle}" yêu cầu giữ cọc để Tuyển thủ bắt đầu nhận việc.`
                  : 'Số dư hiện tại của bạn không đủ để thanh toán giữ cọc cho đơn hàng này.'}
              </p>
            </div>

            {/* Breakdown Card */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 mb-6 space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-400">
                <span>Số tiền thanh toán / cọc:</span>
                <span className="font-mono font-bold text-white">
                  {requiredAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-400">
                <span>Số dư ví hiện tại:</span>
                <span className="font-mono font-bold text-zinc-300">
                  {currentBalance.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent my-1" />

              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  Số tiền cần nạp thêm:
                </span>
                <span className="font-mono text-lg sm:text-xl font-extrabold text-amber-400 tracking-tight">
                  +{calculatedMissing.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Option 1: Direct VietQR Inline Deposit Modal */}
              {onOpenDeposit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDeposit();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-zinc-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <QrCode size={18} className="text-zinc-950 group-hover:rotate-6 transition-transform" />
                  <span>Quét mã VietQR Nạp Nhanh (Tại chỗ)</span>
                  <ArrowRight size={16} className="text-zinc-950 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* Option 2: Open Wallet Deposit in New Tab */}
              <button
                type="button"
                onClick={handleOpenWalletTab}
                className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-zinc-600"
              >
                <ExternalLink size={15} className="text-blue-400" />
                <span>Nạp tiền ở Tab mới (Bảo lưu cấu hình đơn)</span>
              </button>

              {/* Notice Helper */}
              <p className="text-[11px] text-zinc-500 text-center px-2 leading-relaxed">
                💡 <strong className="text-zinc-400">Mẹo UX:</strong> Mở tab mới hoặc nạp tại chỗ sẽ giúp giữ nguyên toàn bộ thông tin chọn tướng, làn đường và mã giảm giá mà không phải chọn lại!
              </p>

              {/* Footer Dismiss Button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Chỉnh sửa lại đơn hàng hoặc dùng mã giảm giá khác</span>
                </button>
              </div>
            </div>

            {/* Escrow Guarantee Footer */}
            <div className="mt-5 pt-4 border-t border-zinc-900 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
              <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
              <span>Tiền cọc được giữ an toàn trong hệ thống (Escrow) tới khi đơn hoàn tất.</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
