'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, ArrowRight, Loader2, Image as ImageIcon, Wallet, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

interface RankMismatchCardProps {
  order: any;
  userRole?: string;
  isCustomer?: boolean;
  isBooster?: boolean;
  onRefresh: () => void;
}

export default function RankMismatchCard({
  order,
  isCustomer = false,
  isBooster = false,
  onRefresh,
}: RankMismatchCardProps) {
  const [loadingAction, setLoadingAction] = useState<'CONFIRM' | 'CANCEL' | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);

  const mismatch = order?.mismatch_info;
  if (!mismatch || order.status !== 'RANK_MISMATCH') return null;

  const extraAmount = mismatch.extraAmountNeeded || 0;
  const recalculatedPrice = mismatch.recalculatedPrice || 0;
  const originalPaid = Math.max(0, (order.pricing?.total_amount || 0) - extraAmount);

  const handleConfirmRequote = async () => {
    setLoadingAction('CONFIRM');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/orders/${order._id}/confirm-requote`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Đã xác nhận thanh toán phần chênh lệch và mở lại đơn hàng thành công!');
        onRefresh();
      } else {
        toast.error(data.message || 'Xác nhận thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi xác nhận bù tiền');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancelMismatch = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này và nhận lại toàn bộ tiền cọc vào ví?')) return;

    setLoadingAction('CANCEL');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/orders/${order._id}/cancel-mismatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: 'Khách hàng từ chối mức báo giá lại do sai lệch rank',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Đã hủy đơn hàng và hoàn tiền về ví thành công');
        onRefresh();
      } else {
        toast.error(data.message || 'Hủy đơn thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi hủy đơn');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-950/30 via-zinc-900/90 to-zinc-950 p-5 sm:p-6 shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
        {/* Glow corner */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

        {/* Header Alert */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-inner">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Phát hiện sai lệch Rank (Tạm dừng đơn hàng)
                </h3>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300 border border-amber-500/30">
                  RANK_MISMATCH
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isCustomer
                  ? 'Booster đã vào tài khoản và phát hiện Rank thực tế khác với Rank bạn đã chọn khi đặt đơn.'
                  : 'Báo cáo sai lệch Rank của bạn đã được ghi nhận. Đơn hàng đang tạm dừng chờ khách xác nhận.'}
              </p>
            </div>
          </div>
        </div>

        {/* So sánh Rank khai báo vs Rank thực tế */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rank khai */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Rank khách khai báo ban đầu:
            </span>
            <div className="mt-1 flex items-center gap-2 text-base font-bold text-zinc-300">
              <span className="line-through opacity-70">{mismatch.declaredRank || 'Không rõ'}</span>
            </div>
          </div>

          {/* Rank thực tế */}
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Rank thực tế Booster phát hiện:
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-base font-extrabold text-amber-300">
                {mismatch.verifiedRank}
              </span>
              {mismatch.proofImage && (
                <button
                  type="button"
                  onClick={() => setShowProofModal(true)}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 underline font-semibold transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Xem ảnh bằng chứng
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ghi chú từ Booster nếu có */}
        {mismatch.note && (
          <div className="mt-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80 text-xs text-zinc-300">
            <strong className="text-zinc-400 font-semibold">Ghi chú từ Booster: </strong>
            {mismatch.note}
          </div>
        )}

        {/* Bảng báo giá lại (Re-quote pricing breakdown) */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="text-xs font-bold text-zinc-300 mb-2.5">Bảng điều chỉnh chi phí đơn hàng:</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Giá gốc đã thanh toán (theo rank khai):</span>
              <span className="font-mono text-zinc-200">{originalPaid.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Báo giá chuẩn thực tế ({mismatch.verifiedRank} ➔ Mục tiêu):</span>
              <span className="font-mono text-white font-semibold">
                {recalculatedPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm">
              <span className="font-bold text-amber-400">Số tiền cần thanh toán bổ sung:</span>
              <span className="font-mono text-base font-extrabold text-amber-300">
                +{extraAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>

        {/* Các nút hành động (Chỉ hiển thị cho Customer) */}
        {isCustomer && (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={handleCancelMismatch}
              disabled={loadingAction !== null}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              {loadingAction === 'CANCEL' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 text-zinc-400" />
              )}
              <span>Từ chối & Hủy đơn (Hoàn tiền vào ví)</span>
            </button>

            <button
              onClick={handleConfirmRequote}
              disabled={loadingAction !== null}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              {loadingAction === 'CONFIRM' ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-black" />
              )}
              <span>Xác nhận bù {extraAmount.toLocaleString('vi-VN')} đ & Tiếp tục cày</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal xem full ảnh bằng chứng */}
      {showProofModal && mismatch.proofImage && (
        <div
          onClick={() => setShowProofModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div className="relative max-w-3xl w-full bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img
              src={mismatch.proofImage}
              alt="Rank Proof Evidence"
              className="w-full h-auto rounded-xl object-contain max-h-[80vh]"
            />
            <div className="p-3 text-center text-xs text-zinc-400">
              Nhấp vào bất kỳ đâu để đóng ảnh
            </div>
          </div>
        </div>
      )}
    </>
  );
}
