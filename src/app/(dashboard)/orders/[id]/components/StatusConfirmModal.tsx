'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getOrderStatusInfo } from '@/lib/orderStatus';
import { formatRankDisplayVi } from '@/lib/riotRanks';
import { getGameMeta, formatServiceName } from './orderHelpers';

interface StatusConfirmModalProps {
  statusModal: {
    isOpen: boolean;
    targetStatus: string;
    loading: boolean;
  };
  setStatusModal: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      targetStatus: string;
      loading: boolean;
    }>
  >;
  order: any;
  onConfirm: () => void;
}

export default function StatusConfirmModal({
  statusModal,
  setStatusModal,
  order,
  onConfirm,
}: StatusConfirmModalProps) {
  return (
    <Dialog
      open={statusModal.isOpen}
      onOpenChange={(open) => {
        if (!statusModal.loading) {
          setStatusModal((prev) => ({ ...prev, isOpen: open }));
        }
      }}
    >
      <DialogContent className="sm:max-w-[420px] bg-[#0c101a] border border-zinc-800/80 text-white p-5 sm:p-6 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl space-y-4">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xl relative transition-all ${
              statusModal.targetStatus === 'IN_PROGRESS'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/20 ring-4 ring-blue-500/10'
                : statusModal.targetStatus === 'COMPLETED'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/20 ring-4 ring-emerald-500/10'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/20 ring-4 ring-amber-500/10'
            }`}
          >
            {statusModal.targetStatus === 'IN_PROGRESS' ? (
              <Play className="w-8 h-8 fill-blue-400 ml-1 drop-shadow-md" />
            ) : statusModal.targetStatus === 'COMPLETED' ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </div>

          <DialogTitle className="text-lg sm:text-xl font-black text-white tracking-tight">
            {statusModal.targetStatus === 'IN_PROGRESS'
              ? 'Xác nhận Bắt đầu cày'
              : statusModal.targetStatus === 'COMPLETED'
              ? 'Xác nhận Báo cáo hoàn thành'
              : 'Xác nhận thay đổi trạng thái'}
          </DialogTitle>

          <DialogDescription className="text-xs text-zinc-400 leading-relaxed max-w-[340px] text-center">
            {statusModal.targetStatus === 'IN_PROGRESS' || statusModal.targetStatus === 'IN_PROCESS'
              ? 'Sau khi bắt đầu cày, trạng thái đơn sẽ chuyển sang "Đang cày...". Khách hàng sẽ nhận được thông báo để theo dõi tiến độ.'
              : statusModal.targetStatus === 'COMPLETED'
              ? 'Bạn xác nhận đã đạt mục tiêu đơn hàng. Đơn sẽ chuyển sang trạng thái "Hoàn thành" để tiến hành nghiệm thu và quyết toán.'
              : `Bạn có chắc chắn muốn chuyển trạng thái đơn hàng sang "${
                  getOrderStatusInfo(statusModal.targetStatus).label
                }"?`}
          </DialogDescription>
        </DialogHeader>

        {/* Chi tiết đơn tóm tắt */}
        {order && (
          <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-4 space-y-2.5 my-1 text-xs shadow-inner">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-400">Mã đơn hàng:</span>
              <span className="font-mono font-extrabold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                #{order.orderCode || order._id?.slice(-6).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-400">Dịch vụ:</span>
              <span className="font-bold text-blue-400 text-right truncate max-w-[220px]">
                {getGameMeta(order.snapshot?.gameCode || order.details?.game || 'LOL').name} •{' '}
                {formatServiceName(order.serviceType || order.snapshot?.serviceSlug, order.details)}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-400">Mục tiêu:</span>
              <span className="font-bold text-white text-right">
                {(() => {
                  if (order.serviceType === 'MATCHES' || order.details?.is_matches) {
                    const count =
                      order.details?.match_count ||
                      order.details?.matches ||
                      order.details?.steps_count ||
                      order.details?.num_games ||
                      1;
                    const queue = order.details?.queue_type === 'FLEX' ? 'Linh hoạt' : 'Đơn / Đôi';
                    return `Cày ${count} trận (${queue})`;
                  }
                  if (order.serviceType === 'PLACEMENTS' || order.details?.is_placements) {
                    const count =
                      order.details?.placement_matches ||
                      order.details?.matches ||
                      order.details?.steps_count ||
                      5;
                    return `${count} trận phân hạng`;
                  }
                  if (order.serviceType === 'NET_WINS') {
                    return order.details?.num_games
                      ? `+${order.details.num_games} Trận thắng`
                      : `${order.details?.target_lp || 0} LP`;
                  }
                  const curr = order.details?.current_rank
                    ? formatRankDisplayVi(order.details.current_rank)
                    : order.details?.current_level;
                  const des = order.details?.desired_rank
                    ? formatRankDisplayVi(order.details?.desired_rank)
                    : order.details?.desired_level;
                  if (curr && des) return `${curr} ➜ ${des}`;
                  return curr || des || 'Theo yêu cầu';
                })()}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-300 pt-2 border-t border-zinc-800/80">
              <span className="text-zinc-400">Trạng thái mới:</span>
              <span
                className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full text-[11px] border ${
                  statusModal.targetStatus === 'IN_PROGRESS'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : statusModal.targetStatus === 'COMPLETED'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    statusModal.targetStatus === 'IN_PROGRESS'
                      ? 'bg-blue-400 animate-pulse'
                      : 'bg-emerald-400'
                  }`}
                />
                {getOrderStatusInfo(statusModal.targetStatus).label}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80 w-full">
          <button
            type="button"
            disabled={statusModal.loading}
            onClick={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
            className="w-full py-2.5 sm:py-3 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center active:scale-95"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={statusModal.loading}
            onClick={onConfirm}
            className={`w-full py-2.5 sm:py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 ${
              statusModal.targetStatus === 'IN_PROGRESS'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30 ring-1 ring-blue-400/40'
                : statusModal.targetStatus === 'COMPLETED'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {statusModal.loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : statusModal.targetStatus === 'IN_PROGRESS' ? (
              <>
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                <span>Bắt đầu ngay</span>
              </>
            ) : statusModal.targetStatus === 'COMPLETED' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xác nhận</span>
              </>
            ) : (
              <span>Đồng ý</span>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
