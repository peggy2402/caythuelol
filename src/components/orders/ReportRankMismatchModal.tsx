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

interface TierConfig {
  divisions?: string[];
  maxStars?: number;
  type: 'division' | 'star';
  unit: string;
  defaultStars: number;
  quickStars?: number[];
}

const AOV_TIER_CONFIGS: Record<string, TierConfig> = {
  'Đồng': {
    divisions: ['III', 'II', 'I'],
    maxStars: 3,
    type: 'division',
    unit: 'sao',
    defaultStars: 1,
  },
  'Bạc': {
    divisions: ['III', 'II', 'I'],
    maxStars: 3,
    type: 'division',
    unit: 'sao',
    defaultStars: 1,
  },
  'Vàng': {
    divisions: ['IV', 'III', 'II', 'I'],
    maxStars: 4,
    type: 'division',
    unit: 'sao',
    defaultStars: 1,
  },
  'Bạch Kim': {
    divisions: ['V', 'IV', 'III', 'II', 'I'],
    maxStars: 5,
    type: 'division',
    unit: 'sao',
    defaultStars: 1,
  },
  'Kim Cương': {
    divisions: ['V', 'IV', 'III', 'II', 'I'],
    maxStars: 5,
    type: 'division',
    unit: 'sao',
    defaultStars: 1,
  },
  'Tinh Anh': {
    divisions: ['V', 'IV', 'III', 'II', 'I'],
    maxStars: 5,
    type: 'division',
    unit: 'sao',
    defaultStars: 4,
  },
  'Cao Thủ': {
    type: 'star',
    unit: 'sao',
    defaultStars: 1,
    quickStars: [1, 5, 10, 15, 20, 30],
  },
  'Đại Cao Thủ': {
    divisions: ['IV', 'III', 'II', 'I'],
    maxStars: 5,
    type: 'division',
    unit: 'sao',
    defaultStars: 1,
  },
  'Chiến Tướng': {
    type: 'star',
    unit: 'điểm/sao',
    defaultStars: 50,
    quickStars: [50, 60, 70, 80, 99],
  },
  'Chiến Thần': {
    type: 'star',
    unit: 'điểm/sao',
    defaultStars: 100,
    quickStars: [100, 120, 150, 200],
  },
};

const RANK_TIERS = Object.keys(AOV_TIER_CONFIGS);

export default function ReportRankMismatchModal({
  orderId,
  declaredRank,
  isOpen,
  onClose,
  onSuccess,
}: ReportRankMismatchModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('Tinh Anh');
  const [selectedDivision, setSelectedDivision] = useState<string>('III');
  const [selectedStars, setSelectedStars] = useState<number>(4);
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [verifiedRank, setVerifiedRank] = useState('Tinh Anh III (4 sao)');
  const [proofImage, setProofImage] = useState('');
  const [note, setNote] = useState('');
  const [proposedPrice] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Cập nhật chuỗi verifiedRank khi thay đổi lựa chọn
  const buildRankString = (tier: string, div: string, stars: number) => {
    const config = AOV_TIER_CONFIGS[tier] || AOV_TIER_CONFIGS['Tinh Anh'];
    if (config.type === 'star') {
      return `${tier} (${stars} ${config.unit})`;
    }
    return `${tier} ${div} (${stars} sao)`;
  };

  const handleSelectTier = (tier: string) => {
    setSelectedTier(tier);
    const config = AOV_TIER_CONFIGS[tier];
    let newDiv = selectedDivision;
    let newStars = selectedStars;

    if (config?.divisions) {
      if (!config.divisions.includes(newDiv)) {
        newDiv = config.divisions[0];
        setSelectedDivision(newDiv);
      }
      if (config.maxStars && newStars > config.maxStars) {
        newStars = config.maxStars;
        setSelectedStars(newStars);
      }
    } else if (config?.type === 'star') {
      newStars = config.defaultStars;
      setSelectedStars(newStars);
    }

    setVerifiedRank(buildRankString(tier, newDiv, newStars));
  };

  const handleSelectDivision = (div: string) => {
    setSelectedDivision(div);
    setVerifiedRank(buildRankString(selectedTier, div, selectedStars));
  };

  const handleSelectStars = (stars: number) => {
    setSelectedStars(stars);
    setVerifiedRank(buildRankString(selectedTier, selectedDivision, stars));
  };

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
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-amber-500/30 p-5 sm:p-6 shadow-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700/70 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600"
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
                  <div className="space-y-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 p-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                        Rank thực tế trong tài khoản game <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsManualInput(!isManualInput)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold transition-colors"
                      >
                        {isManualInput ? 'Chọn theo nấc chuẩn' : 'Nhập tay tự do'}
                      </button>
                    </div>

                    {isManualInput ? (
                      <input
                        type="text"
                        required
                        value={verifiedRank}
                        onChange={(e) => setVerifiedRank(e.target.value)}
                        placeholder="Ví dụ: Tinh Anh III (4 sao), Cao Thủ (1 sao)..."
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    ) : (
                      (() => {
                        const currentConfig = AOV_TIER_CONFIGS[selectedTier] || AOV_TIER_CONFIGS['Tinh Anh'];
                        const starList = currentConfig.maxStars
                          ? Array.from({ length: currentConfig.maxStars }, (_, i) => i + 1)
                          : [];

                        return (
                          <div className="space-y-3">
                            {/* 1. Bậc xếp hạng */}
                            <div>
                              <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">1. Bậc xếp hạng:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {RANK_TIERS.map((tier) => (
                                  <button
                                    type="button"
                                    key={tier}
                                    onClick={() => handleSelectTier(tier)}
                                    className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                                      selectedTier === tier
                                        ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md shadow-amber-500/20'
                                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                                    }`}
                                  >
                                    {tier}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 2. Nhánh phân bậc (Chỉ hiện với các bậc có phân nhánh) */}
                            {currentConfig.divisions && currentConfig.divisions.length > 0 && (
                              <div>
                                <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">2. Nhánh phân bậc:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {currentConfig.divisions.map((div) => (
                                    <button
                                      type="button"
                                      key={div}
                                      onClick={() => handleSelectDivision(div)}
                                      className={`text-[11px] px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                                        selectedDivision === div
                                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/40 shadow-sm'
                                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                                      }`}
                                    >
                                      {selectedTier} {div}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 3. Số sao / Điểm thực tế */}
                            <div>
                              <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                                3. {currentConfig.type === 'star' ? `Số ${currentConfig.unit} thực tế:` : 'Số sao thực tế:'}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {currentConfig.type === 'division' && starList.map((s) => (
                                  <button
                                    type="button"
                                    key={s}
                                    onClick={() => handleSelectStars(s)}
                                    className={`text-[11px] px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                                      selectedStars === s
                                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40 shadow-sm'
                                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                                    }`}
                                  >
                                    {s} ⭐
                                  </button>
                                ))}

                                {currentConfig.type === 'star' && (
                                  <>
                                    {currentConfig.quickStars?.map((s) => (
                                      <button
                                        type="button"
                                        key={s}
                                        onClick={() => handleSelectStars(s)}
                                        className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                                          selectedStars === s
                                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                                        }`}
                                      >
                                        {s} {currentConfig.unit}
                                      </button>
                                    ))}
                                    <div className="flex items-center gap-1.5 ml-1">
                                      <span className="text-[10px] text-zinc-500">hoặc nhập:</span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={999}
                                        value={selectedStars}
                                        onChange={(e) => handleSelectStars(Number(e.target.value) || 0)}
                                        className="w-20 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white text-center font-bold focus:border-amber-500 outline-none"
                                        placeholder={`Số ${currentConfig.unit}`}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Preview kết quả đã chọn */}
                            <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between text-xs">
                              <span className="text-zinc-400">Rank thực tế đã chọn:</span>
                              <span className="text-amber-300 font-extrabold text-sm">{verifiedRank || 'Chưa chọn'}</span>
                            </div>
                          </div>
                        );
                      })()
                    )}
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
