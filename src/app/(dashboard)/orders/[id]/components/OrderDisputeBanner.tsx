'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Clock,
  Pencil,
  XCircle,
  Play,
  CheckSquare,
  Lock,
  Star,
  CheckCircle2,
} from 'lucide-react';

interface OrderDisputeBannerProps {
  order: any;
  isCustomer: boolean;
  isBooster: boolean;
  disputeDeadline: Date | null;
  disputeRemainingMs: number;
  formatDisputeCountdown: (ms: number) => string;
  isDisputeExpired: boolean;
  canRate: boolean;
  isRatingExpired: boolean;
  onOpenEditAccount: () => void;
  onOpenCancelModal: () => void;
  onOpenDisputeModal: () => void;
  onOpenRatingModal: () => void;
  onUpdateStatus: (targetStatus: string) => void;
}

export default function OrderDisputeBanner({
  order,
  isCustomer,
  isBooster,
  disputeDeadline,
  disputeRemainingMs,
  formatDisputeCountdown,
  isDisputeExpired,
  canRate,
  isRatingExpired,
  onOpenEditAccount,
  onOpenCancelModal,
  onOpenDisputeModal,
  onOpenRatingModal,
  onUpdateStatus,
}: OrderDisputeBannerProps) {
  const hasRated = Boolean(order?.rating);

  return (
    <>
      {/* Dispute Deadline Card vs. Accepted & Completed Card */}
      {order.status === 'COMPLETED' && (
        hasRated ? (
          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-950/80 to-emerald-950/30 border border-emerald-500/30 shadow-lg space-y-2.5 relative z-10">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Đơn hàng đã được nghiệm thu hoàn tất</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <CheckCircle2 size={13} />
                Đã nghiệm thu & Đánh giá
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Bạn đã hoàn tất nghiệm thu và đánh giá tuyển thủ. Tiền công đã được quyết toán hoàn toàn vào ví của Tuyển thủ và thời hạn khiếu nại đã chính thức đóng.
            </p>
          </div>
        ) : disputeDeadline ? (
          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 shadow-md space-y-3 relative z-10">
            {/* Title */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
                <span>Thời hạn gửi khiếu nại</span>
              </div>
            </div>

            {/* Content: Hạn cuối + Thời gian + Badge đếm ngược */}
            <div className="space-y-1">
              <div className="text-xs text-zinc-400 font-medium">Hạn cuối</div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                  {(() => {
                    const h = disputeDeadline.getHours();
                    const period = h < 6 ? 'Rạng sáng' : h < 12 ? 'Sáng' : h < 18 ? 'Chiều' : 'Tối';
                    return `${format(disputeDeadline, 'HH:mm:ss')} (${period}) • ${format(
                      disputeDeadline,
                      'dd/MM/yyyy'
                    )}`;
                  })()}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${
                    disputeRemainingMs > 0
                      ? 'bg-amber-950/50 border-amber-900/60 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  {formatDisputeCountdown(disputeRemainingMs)}
                </span>
              </div>
            </div>

            {/* Footer description */}
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              Nếu chưa hài lòng hoặc gặp vấn đề với dịch vụ, đừng ngần ngại gửi khiếu nại để LeoRank hỗ trợ bạn nhé!
            </p>
          </div>
        ) : null
      )}

      {/* Actions */}
      <div className="mt-6 space-y-3">
        {/* Khi đơn đang chờ tuyển thủ nhận (PAID hoặc PENDING_PAYMENT) và người xem là Customer */}
        {isCustomer && ['PENDING_PAYMENT', 'PAID'].includes(order.status) && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-bold text-amber-200">Đơn hàng đang chờ Tuyển thủ nhận việc trên Sàn</p>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Bạn có thể chỉnh sửa thông tin tài khoản hoặc hủy đơn để nhận lại 100% tiền cọc về ví bất kỳ lúc nào.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={onOpenEditAccount}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-zinc-700 text-sm shadow-md cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-blue-400" /> Chỉnh sửa thông tin tài khoản
              </button>
              <button
                onClick={onOpenCancelModal}
                className="w-full py-3 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/30 text-sm shadow-md cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-red-500" /> Hủy đơn hàng (Hoàn 100% tiền)
              </button>
            </div>
          </div>
        )}

        {isBooster && order.status === 'APPROVED' && (
          <button
            onClick={() => onUpdateStatus('IN_PROGRESS')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-500/25"
          >
            <Play className="w-4 h-4" /> Bắt đầu cày
          </button>
        )}
        {isBooster && order.status === 'IN_PROGRESS' && (
          <button
            onClick={() => onUpdateStatus('COMPLETED')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" /> Báo cáo hoàn thành
          </button>
        )}

        {/* Nút báo lỗi chung CHỈ hiển thị khi đơn đã có tuyển thủ nhận việc hoặc hoàn thành (Customer trong vòng 24h và CHƯA nghiệm thu/đánh giá) */}
        {['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status) && (
          hasRated ? (
            <div className="w-full py-3 px-4 bg-emerald-950/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-emerald-500/25 text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Đơn hàng đã được nghiệm thu & đánh giá — Cổng khiếu nại đã đóng dứt điểm.</span>
            </div>
          ) : isDisputeExpired ? (
            <div className="w-full py-3 px-4 bg-zinc-900/60 text-zinc-400 text-xs font-medium rounded-xl flex items-center justify-center gap-2 border border-zinc-800 text-center">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Đã quá thời hạn 24h khiếu nại — Số tiền đơn hàng đã thuộc hoàn toàn về Booster.</span>
            </div>
          ) : (
            <button
              onClick={onOpenDisputeModal}
              className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/20 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" /> Báo lỗi / Có vấn đề
            </button>
          )
        )}

        {/* Nút Đánh giá Booster */}
        {canRate && (
          <button
            onClick={onOpenRatingModal}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-yellow-600/20 cursor-pointer"
          >
            <Star className="w-4 h-4 fill-current" /> Đánh giá Booster
          </button>
        )}

        {/* Thông báo quá hạn đánh giá */}
        {isCustomer && order.status === 'COMPLETED' && !order.rating && isRatingExpired && (
          <div className="w-full py-3 bg-zinc-900/50 text-zinc-500 font-medium rounded-xl flex items-center justify-center gap-2 border border-zinc-800">
            <Clock className="w-4 h-4" /> Đã hết hạn đánh giá (Quá 7 ngày)
          </div>
        )}
      </div>
    </>
  );
}
