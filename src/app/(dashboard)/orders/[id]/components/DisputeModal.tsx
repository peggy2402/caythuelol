'use client';

import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeReason: string;
  setDisputeReason: (reason: string) => void;
  isSubmittingDispute: boolean;
  onConfirmDispute: () => void;
}

export default function DisputeModal({
  isOpen,
  onClose,
  disputeReason,
  setDisputeReason,
  isSubmittingDispute,
  onConfirmDispute,
}: DisputeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-red-500" /> Báo lỗi / Khiếu nại
        </h3>
        <textarea
          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white mb-4 h-32 focus:border-red-500 outline-none"
          placeholder="Mô tả vấn đề của bạn (VD: Tài khoản sai mật khẩu, bị khóa, Booster vi phạm...)"
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white cursor-pointer"
            disabled={isSubmittingDispute}
          >
            Hủy
          </button>
          <button
            onClick={onConfirmDispute}
            disabled={isSubmittingDispute}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center justify-center w-32 disabled:opacity-50 cursor-pointer shadow-lg shadow-red-600/25"
          >
            {isSubmittingDispute ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  );
}
