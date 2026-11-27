'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Image as ImageIcon,
  ZoomIn,
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  KeyRound,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import ImageLightbox from '@/components/ui/ImageLightbox';

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
  onRefresh,
}: RankMismatchCardProps) {
  const [mounted, setMounted] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'CONFIRM' | 'CANCEL' | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [accountForm, setAccountForm] = useState({
    username: '',
    password: '',
    platform: '',
    server: '',
    note: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showConfirmModal) {
      setAccountForm({
        username: order?.details?.account_info?.username || '',
        password: order?.details?.account_info?.password || '',
        platform: order?.details?.account_info?.platform || 'Garena',
        server: order?.details?.server || 'VN',
        note: order?.details?.note || '',
      });
      setShowPassword(false);
    }
  }, [showConfirmModal, order]);

  useEffect(() => {
    if (!showConfirmModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && loadingAction === null) {
        setShowConfirmModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConfirmModal, loadingAction]);

  const mismatch = order?.mismatch_info;
  if (!mismatch || order.status !== 'RANK_MISMATCH') return null;

  const extraAmount = mismatch.extraAmountNeeded || 0;
  const recalculatedPrice = mismatch.recalculatedPrice || 0;
  const originalPaid = Math.max(0, (order.pricing?.total_amount || 0) - extraAmount);

  const handleConfirmRequote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountForm.username.trim() || !accountForm.password.trim()) {
      toast.error('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu tài khoản game đúng mức Rank');
      return;
    }

    setLoadingAction('CONFIRM');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/orders/${order._id}/confirm-requote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          account_info: {
            username: accountForm.username.trim(),
            password: accountForm.password.trim(),
            platform: accountForm.platform.trim() || order?.details?.account_info?.platform || 'Garena',
          },
          server: accountForm.server.trim() || order?.details?.server,
          note: accountForm.note.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          data.message ||
            'Đã thanh toán chênh lệch và gửi lại thông tin tài khoản cho Booster thành công!'
        );
        setShowConfirmModal(false);
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
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-inner">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Phát hiện sai lệch Rank (Tạm dừng đơn hàng)
                </h3>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300 border border-amber-500/30 shrink-0 whitespace-nowrap">
                  RANK_MISMATCH
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
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
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 flex flex-col justify-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Rank khách khai báo ban đầu:
            </span>
            <div className="mt-1.5 flex items-center gap-2 text-base font-bold text-zinc-300">
              <span className="line-through opacity-70">{mismatch.declaredRank || 'Không rõ'}</span>
            </div>
          </div>

          {/* Rank thực tế + Thumbnail ảnh bằng chứng */}
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block">
                Rank thực tế Booster phát hiện:
              </span>
              <span className="mt-1 text-base font-extrabold text-amber-300 block truncate">
                {mismatch.verifiedRank}
              </span>
              {mismatch.proofImage && (
                <button
                  type="button"
                  onClick={() => setShowProofModal(true)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer group"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="underline underline-offset-2 group-hover:no-underline">
                    Xem ảnh bằng chứng
                  </span>
                </button>
              )}
            </div>

            {mismatch.proofImage && (
              <button
                type="button"
                onClick={() => setShowProofModal(true)}
                title="Nhấn để phóng to ảnh bằng chứng"
                className="relative w-16 h-16 sm:w-20 sm:h-16 rounded-xl overflow-hidden border border-amber-500/40 bg-black/60 shrink-0 group cursor-pointer shadow-md hover:border-amber-400 transition-all"
              >
                <img
                  src={mismatch.proofImage}
                  alt="Ảnh bằng chứng rank thực tế"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 text-white drop-shadow" />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Ghi chú từ Booster nếu có */}
        {mismatch.note && (
          <div className="mt-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
            <strong className="text-zinc-400 font-semibold">Ghi chú từ Booster: </strong>
            {mismatch.note}
          </div>
        )}

        {/* Bảng báo giá lại (Re-quote pricing breakdown) */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="text-xs font-bold text-zinc-300 mb-2.5">Bảng điều chỉnh chi phí đơn hàng:</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-2 text-zinc-400">
              <span>Giá gốc đã thanh toán (theo rank khai):</span>
              <span className="font-mono text-zinc-200 whitespace-nowrap">
                {originalPaid.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="flex justify-between gap-2 text-zinc-400">
              <span>Báo giá chuẩn thực tế ({mismatch.verifiedRank} ➔ Mục tiêu):</span>
              <span className="font-mono text-white font-semibold whitespace-nowrap">
                {recalculatedPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="pt-2.5 border-t border-zinc-800 flex justify-between items-center gap-2 text-sm">
              <span className="font-bold text-amber-400">Số tiền cần thanh toán bổ sung:</span>
              <span className="font-mono text-base font-extrabold text-amber-300 whitespace-nowrap">
                +{extraAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>

        {/* Các nút hành động (Chỉ hiển thị cho Customer) */}
        {isCustomer && (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleCancelMismatch}
              disabled={loadingAction !== null}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              {loadingAction === 'CANCEL' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 text-zinc-400" />
              )}
              <span>Từ chối & Hủy đơn (Hoàn tiền vào ví)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={loadingAction !== null}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-black" />
              <span>Xác nhận bù {extraAmount.toLocaleString('vi-VN')} đ & Gửi lại tài khoản</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal xác nhận thanh toán bù & gửi lại đúng tài khoản game cho Booster */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showConfirmModal && (
              <motion.div
                key="confirm-requote-account-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => {
                  if (loadingAction === null) setShowConfirmModal(false);
                }}
                className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 14 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-amber-500/35 p-5 sm:p-6 shadow-2xl"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-base">
                          Thanh Toán Bù & Xác Nhận Tài Khoản
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Gửi đúng tài khoản ứng với mức Rank để Booster đăng nhập cày
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={loadingAction !== null}
                      onClick={() => setShowConfirmModal(false)}
                      aria-label="Đóng"
                      className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tóm tắt khoản bù & Rank mới */}
                  <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-amber-200/80">Mức Rank thực tế áp dụng:</span>
                      <span className="font-extrabold text-amber-300 whitespace-nowrap">
                        {mismatch.verifiedRank}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-amber-500/20">
                      <span className="text-amber-200/80 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-amber-400" />
                        Số tiền trừ thêm từ ví:
                      </span>
                      <span className="font-mono text-sm font-black text-amber-300 whitespace-nowrap">
                        +{extraAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* Nhắc kiểm tra đúng tài khoản */}
                  <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs text-blue-200/90 flex items-start gap-2.5 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      Vui lòng kiểm tra hoặc nhập lại thông tin tài khoản game{' '}
                      <strong className="text-white">đúng với mức Rank {mismatch.verifiedRank}</strong>{' '}
                      để Booster đăng nhập và tiếp tục cày chính xác.
                    </span>
                  </div>

                  {/* Form gửi lại thông tin tài khoản game */}
                  <form onSubmit={handleConfirmRequote} className="mt-4 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Tên đăng nhập / ID game <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={accountForm.username}
                          onChange={(e) =>
                            setAccountForm((prev) => ({ ...prev, username: e.target.value }))
                          }
                          placeholder="Nhập tên đăng nhập..."
                          className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950 px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Mật khẩu game <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={accountForm.password}
                            onChange={(e) =>
                              setAccountForm((prev) => ({ ...prev, password: e.target.value }))
                            }
                            placeholder="Nhập mật khẩu..."
                            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950 pl-3.5 pr-10 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Nền tảng đăng nhập
                        </label>
                        <input
                          type="text"
                          value={accountForm.platform}
                          onChange={(e) =>
                            setAccountForm((prev) => ({ ...prev, platform: e.target.value }))
                          }
                          placeholder="Garena / Facebook / Riot..."
                          className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Máy chủ (Server)
                        </label>
                        <input
                          type="text"
                          value={accountForm.server}
                          onChange={(e) =>
                            setAccountForm((prev) => ({ ...prev, server: e.target.value }))
                          }
                          placeholder="VN / SEA / KR..."
                          className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950 px-3.5 py-2.5 text-sm uppercase text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Ghi chú cho Booster (tuỳ chọn)
                      </label>
                      <textarea
                        rows={2}
                        value={accountForm.note}
                        onChange={(e) =>
                          setAccountForm((prev) => ({ ...prev, note: e.target.value }))
                        }
                        placeholder="VD: Đã gửi lại đúng tài khoản rank thực tế, vào cày giúp mình nhé..."
                        className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        disabled={loadingAction !== null}
                        onClick={() => setShowConfirmModal(false)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        disabled={loadingAction !== null}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                      >
                        {loadingAction === 'CONFIRM' ? (
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-black" />
                        )}
                        <span>
                          Thanh toán bù {extraAmount.toLocaleString('vi-VN')} đ & Gửi cho Booster
                        </span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Messenger-style Fullscreen Proof Image Viewer */}
      <ImageLightbox
        isOpen={showProofModal && Boolean(mismatch.proofImage)}
        src={mismatch.proofImage || ''}
        alt="Ảnh bằng chứng sai lệch Rank"
        title="Ảnh bằng chứng sai lệch Rank"
        subtitle={`${mismatch.declaredRank || 'Rank khai báo'} ➔ ${mismatch.verifiedRank}`}
        onClose={() => setShowProofModal(false)}
      />
    </>
  );
}
