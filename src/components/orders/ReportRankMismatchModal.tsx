'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Upload, X, Loader2, ShieldAlert, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import ImageLightbox from '@/components/ui/ImageLightbox';

interface ReportRankMismatchModalProps {
  orderId: string;
  declaredRank?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_RANKS = [
  'Đồng', 'Bạc', 'Vàng', 'Bạch Kim', 'Kim Cương',
  'Tinh Anh V', 'Tinh Anh IV', 'Tinh Anh III', 'Tinh Anh II', 'Tinh Anh I',
  'Cao Thủ', 'Đại Cao Thủ', 'Chiến Tướng', 'Chiến Thần',
];

export default function ReportRankMismatchModal({
  orderId,
  declaredRank,
  isOpen,
  onClose,
  onSuccess,
}: ReportRankMismatchModalProps) {
  const [mounted, setMounted] = useState(false);
  const [verifiedRank, setVerifiedRank] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [note, setNote] = useState('');
  const [proposedPrice] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !previewOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, previewOpen, onClose]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setProofImage(data.url);
        toast.success('Tải ảnh bằng chứng thành công');
      } else {
        toast.error(data.message || 'Tải ảnh thất bại');
      }
    } catch {
      toast.error('Lỗi khi tải ảnh lên server');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedRank.trim()) {
      toast.error('Vui lòng nhập Rank thực tế phát hiện trong game');
      return;
    }
    if (!proofImage.trim()) {
      toast.error('Vui lòng tải ảnh chụp màn hình game làm bằng chứng');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/verify-rank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          verifiedRank: verifiedRank.trim(),
          proofImage: proofImage.trim(),
          note: note.trim(),
          proposedPrice: proposedPrice ? Number(proposedPrice) : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Đã gửi báo cáo sai lệch Rank và báo giá mới cho khách hàng!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Gửi báo cáo thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi gửi báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="report-rank-mismatch-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
              className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 14 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-amber-500/30 p-5 sm:p-6 shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5 text-amber-400 min-w-0">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base truncate">
                        Báo Cáo Sai Lệch Rank (Khai Khống)
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Đơn hàng sẽ tạm dừng để khách xác nhận bù phí
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Đóng hộp thoại"
                    className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  {/* Thông tin Rank khai báo */}
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Rank khách khai báo ban đầu:</span>
                    <span className="font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 whitespace-nowrap">
                      {declaredRank || 'Chưa xác định'}
                    </span>
                  </div>

                  {/* Chọn hoặc nhập Rank thực tế */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Rank thực tế trong tài khoản game <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={verifiedRank}
                      onChange={(e) => setVerifiedRank(e.target.value)}
                      placeholder="Ví dụ: Tinh Anh V, Kim Cương I..."
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
                    />
                    {/* Quick Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {COMMON_RANKS.slice(4, 11).map((r) => (
                        <button
                          type="button"
                          key={r}
                          onClick={() => setVerifiedRank(r)}
                          className={`text-[11px] px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                            verifiedRank === r
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                              : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ảnh chụp màn hình game chứng minh */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Ảnh chụp màn hình sảnh chờ làm bằng chứng <span className="text-rose-400">*</span>
                    </label>
                    {proofImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-700 aspect-video bg-black/50 group">
                        <img
                          src={proofImage}
                          alt="Proof"
                          onClick={() => setPreviewOpen(true)}
                          className="w-full h-full object-contain cursor-zoom-in"
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewOpen(true)}
                          title="Phóng to ảnh"
                          className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/70 hover:bg-black/90 text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-md transition-colors cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" /> Phóng to
                        </button>
                        <button
                          type="button"
                          onClick={() => setProofImage('')}
                          title="Xóa ảnh"
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white hover:bg-rose-600 flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-xl cursor-pointer bg-zinc-950/40 transition-colors">
                        {uploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-amber-400 mb-2" />
                        ) : (
                          <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                        )}
                        <span className="text-xs font-medium text-zinc-300">
                          {uploading ? 'Đang tải ảnh...' : 'Nhấp để tải ảnh chụp màn hình game'}
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">
                          Hỗ trợ JPG, PNG (tối đa 5MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Ghi chú */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Ghi chú thêm cho khách hàng
                    </label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="VD: Tài khoản vào sảnh đã ở Tinh Anh 4 sao, cần bù thêm phí theo bảng giá..."
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || uploading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <span>Gửi báo cáo & Yêu cầu bù phí</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <ImageLightbox
        isOpen={previewOpen && Boolean(proofImage)}
        src={proofImage}
        alt="Xem trước ảnh bằng chứng"
        title="Xem trước ảnh bằng chứng"
        subtitle={verifiedRank ? `Rank thực tế: ${verifiedRank}` : undefined}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
