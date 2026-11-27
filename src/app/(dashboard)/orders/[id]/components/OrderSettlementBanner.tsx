'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, ArrowRight, Loader2, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OrderSettlementBannerProps {
  order: any;
  isCustomer: boolean;
  isBooster: boolean;
  walletBalance: number;
  onRefresh: () => void;
  onOpenDepositModal: (missingAmount: number) => void;
}

export default function OrderSettlementBanner({
  order,
  isCustomer,
  isBooster,
  walletBalance,
  onRefresh,
  onOpenDepositModal,
}: OrderSettlementBannerProps) {
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = Number(order?.pricing?.total_amount || 0);
  const depositAmount = Number(order?.pricing?.deposit_amount || 0);
  const remainingAmount = Number(
    order?.pricing?.remaining_amount ?? Math.max(0, totalAmount - depositAmount)
  );

  const isBoosterCompleted = Boolean(
    order?.details?.booster_completion_reported ||
    order?.pricing?.settlement_status === 'CUSTOMER_OWES'
  );

  const isFinalPaid = Boolean(order?.payment?.final_paid || depositAmount >= totalAmount);

  // Nếu đơn đã thanh toán 100% hoặc Booster chưa báo hoàn thành và đơn không ở trạng thái cần thanh toán nốt -> không cần hiện banner
  if (isFinalPaid || (!isBoosterCompleted && order?.pricing?.settlement_status !== 'CUSTOMER_OWES')) {
    return null;
  }

  const handlePayRemaining = async () => {
    if (walletBalance < remainingAmount) {
      const missing = remainingAmount - walletBalance;
      toast.error(
        `Số dư ví (${walletBalance.toLocaleString('vi-VN')} đ) không đủ để thanh toán phần còn lại (${remainingAmount.toLocaleString('vi-VN')} đ). Vui lòng nạp thêm!`,
        { duration: 5000 }
      );
      onOpenDepositModal(missing);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${order._id}/pay-remaining`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Thanh toán phần còn lại và quyết toán đơn hàng thành công!');
        onRefresh();
      } else {
        if (data.insufficientBalance && data.missingAmount) {
          onOpenDepositModal(Number(data.missingAmount));
        }
        toast.error(data.message || data.error || 'Thanh toán thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi thanh toán');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-zinc-900/90 to-zinc-950 p-5 shadow-xl shadow-amber-500/5 mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h4 className="text-sm font-bold text-white tracking-wide">
              {isCustomer
                ? 'Booster đã hoàn thành mục tiêu — Yêu cầu quyết toán'
                : 'Đang chờ Khách hàng thanh toán phần còn lại'}
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
              Escrow Ký Quỹ
            </span>
          </div>

          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            {isCustomer ? (
              <>
                Booster đã báo cáo hoàn thành đơn hàng. Tiền đặt cọc ban đầu{' '}
                <b className="text-amber-300 font-mono">{depositAmount.toLocaleString('vi-VN')} đ</b> đang được giữ an toàn trong két Escrow. Vui lòng thanh toán số tiền còn lại{' '}
                <b className="text-rose-400 font-mono">{remainingAmount.toLocaleString('vi-VN')} đ</b> để hoàn tất bàn giao và giải ngân cho Booster.
              </>
            ) : (
              <>
                Bạn đã gửi báo cáo hoàn thành. Tiền cọc{' '}
                <b className="text-amber-300 font-mono">{depositAmount.toLocaleString('vi-VN')} đ</b> của khách đang được giữ an toàn trong Escrow. Hệ thống đang đợi khách thanh toán nốt{' '}
                <b className="text-rose-400 font-mono">{remainingAmount.toLocaleString('vi-VN')} đ</b> để tự động giải ngân toàn bộ tiền công vào ví của bạn.
              </>
            )}
          </p>

          <div className="flex items-center gap-4 pt-1 text-[11px] text-zinc-400">
            <span>
              Tổng đơn: <b className="text-white font-mono">{totalAmount.toLocaleString('vi-VN')} đ</b>
            </span>
            <span>•</span>
            <span>
              Đã cọc Escrow: <b className="text-amber-300 font-mono">{depositAmount.toLocaleString('vi-VN')} đ</b>
            </span>
            <span>•</span>
            <span>
              Còn thiếu: <b className="text-rose-400 font-mono">{remainingAmount.toLocaleString('vi-VN')} đ</b>
            </span>
          </div>
        </div>

        {isCustomer && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePayRemaining}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý quyết toán...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Thanh toán nốt ({remainingAmount.toLocaleString('vi-VN')} đ)
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
