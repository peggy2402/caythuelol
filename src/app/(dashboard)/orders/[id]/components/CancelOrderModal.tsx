'use client';

import React from 'react';
import { XCircle, Loader2 } from 'lucide-react';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  isSubmittingCancel: boolean;
  onConfirmCancel: () => void;
}

export default function CancelOrderModal({
  isOpen,
  onClose,
  order,
  cancelReason,
  setCancelReason,
  isSubmittingCancel,
  onConfirmCancel,
}: CancelOrderModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-red-400 mb-4">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Xác nhận Hủy Đơn Hàng</h3>
            <p className="text-xs text-zinc-400">Hoàn tiền 100% ngay lập tức vào Ví tài khoản</p>
          </div>
        </div>

        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 mb-4 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Mã đơn hàng:</span>
            <span className="font-mono text-cyan-300 font-bold">
              #{order.orderCode || order._id?.slice(-6).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Số tiền hoàn trả:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {((order.pricing?.deposit_amount ?? order.pricing?.total_amount) || 0).toLocaleString()} đ
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Hình thức hoàn:</span>
            <span className="text-zinc-300 font-medium">Cộng trực tiếp vào số dư ví</span>
          </div>
        </div>

        <div className="space-y-1.5 mb-6">
          <label className="text-xs font-semibold text-zinc-400 block">Lý do hủy đơn (tùy chọn):</label>
          <textarea
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:border-red-500 outline-none h-24"
            placeholder="Ví dụ: Đổi ý, muốn đặt gói cày khác, bận công việc..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            disabled={isSubmittingCancel}
          >
            Đóng
          </button>
          <button
            onClick={onConfirmCancel}
            disabled={isSubmittingCancel}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
          >
            {isSubmittingCancel ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận hủy & Hoàn tiền'}
          </button>
        </div>
      </div>
    </div>
  );
}
