'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
  Swords,
  Trophy,
  X,
  StickyNote,
  Filter,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Play,
  Clock,
  Loader2,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import BarLoader from '@/components/ui/BarLoader';
import ImageLightbox from '@/components/ui/ImageLightbox';

interface Dispute {
  _id: string;
  orderCode?: string;
  serviceType: string;
  status: string;
  customerId: { _id?: string; username: string; email: string };
  boosterId: { _id?: string; username: string; email: string };
  dispute: {
    reason: string;
    status: string;
    adminNote?: string;
    evidence?: string;
    createdAt?: string;
  };
  mismatch_info?: {
    declaredRank?: string;
    verifiedRank?: string;
    targetRank?: string;
    proofImage?: string;
    note?: string;
    isTargetExceeded?: boolean;
    newClimbingStars?: number;
    newServiceAmount?: number;
    platformFee?: number;
    newOrderTotal?: number;
    requiredDeposit?: number;
    alreadyPaid?: number;
    additionalDepositNeeded?: number;
    reportedAt?: string;
  };
  pricing: {
    total_amount: number;
    deposit_amount: number;
    deposit_percent?: number;
    booster_earnings?: number;
    platform_fee?: number;
  };
  payment?: {
    deposit_paid?: boolean;
    final_paid?: boolean;
  };
  details: {
    game?: string;
    current_rank?: string;
    desired_rank?: string;
    current_level?: number;
    desired_level?: number;
    server?: string;
    account_info?: any;
  };
  admin_note?: string;
  match_history?: any[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'RESOLVED' | 'ALL'>('PENDING');

  // Quản lý expand mở rộng lý do
  const [expandedReasonIds, setExpandedReasonIds] = useState<Record<string, boolean>>({});

  // Modal xem bằng chứng đối soát
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  // Phóng to ảnh bằng chứng
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Modal Admin Note
  const [noteModal, setNoteModal] = useState<{
    isOpen: boolean;
    orderId: string;
    orderCode: string;
    note: string;
    submitting: boolean;
  }>({
    isOpen: false,
    orderId: '',
    orderCode: '',
    note: '',
    submitting: false,
  });

  // Modal xác nhận giải quyết khiếu nại (thay confirm)
  const [resolveModal, setResolveModal] = useState<{
    isOpen: boolean;
    dispute: Dispute | null;
    decision: 'REFUND_CUSTOMER' | 'PAY_BOOSTER' | 'RESUME' | 'REJECT_DISPUTE_REQUIRE_ACTION';
    submitting: boolean;
  }>({
    isOpen: false,
    dispute: null,
    decision: 'RESUME',
    submitting: false,
  });

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/admin/disputes?status=${filter}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDisputes(data.disputes || []);
      } else {
        toast.error(data.message || 'Lỗi tải danh sách khiếu nại');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [filter]);

  const toggleExpandReason = (id: string) => {
    setExpandedReasonIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Mở modal cập nhật Note
  const handleOpenNoteModal = (d: Dispute) => {
    setNoteModal({
      isOpen: true,
      orderId: d._id,
      orderCode: d.orderCode || d._id.slice(-6).toUpperCase(),
      note: d.dispute?.adminNote || d.admin_note || '',
      submitting: false,
    });
  };

  // Submit cập nhật Note
  const handleSaveNote = async () => {
    if (!noteModal.orderId) return;
    setNoteModal((prev) => ({ ...prev, submitting: true }));
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/admin/disputes/note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: noteModal.orderId,
          note: noteModal.note.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Đã lưu ghi chú nội bộ thành công');
        setNoteModal((prev) => ({ ...prev, isOpen: false }));
        fetchDisputes();
      } else {
        toast.error(data.message || 'Lỗi cập nhật ghi chú');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setNoteModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Mở modal xác nhận phán quyết
  const handleOpenResolveModal = (
    dispute: Dispute,
    decision: 'REFUND_CUSTOMER' | 'PAY_BOOSTER' | 'RESUME' | 'REJECT_DISPUTE_REQUIRE_ACTION'
  ) => {
    setResolveModal({
      isOpen: true,
      dispute,
      decision,
      submitting: false,
    });
  };

  // Thực thi phán quyết
  const handleExecuteResolve = async () => {
    if (!resolveModal.dispute) return;
    setResolveModal((prev) => ({ ...prev, submitting: true }));

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/admin/disputes/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: resolveModal.dispute._id,
          decision: resolveModal.decision,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Đã phân xử khiếu nại thành công!');
        setResolveModal((prev) => ({ ...prev, isOpen: false }));
        setSelectedDispute(null);
        fetchDisputes();
      } else {
        toast.error(data.message || 'Thao tác phân xử thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi phân xử khiếu nại');
    } finally {
      setResolveModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  if (loading && disputes.length === 0) return <BarLoader className="py-24" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            Quản lý Tranh chấp &amp; Khiếu nại
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Trung tâm đối soát bằng chứng giữa Khách hàng và Booster · Phân xử tài chính ký quỹ an toàn
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 w-fit">
          <button
            type="button"
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'PENDING'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Đang chờ xử lý
          </button>
          <button
            type="button"
            onClick={() => setFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'RESOLVED'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Đã giải quyết
          </button>
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tất cả
          </button>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-zinc-900 border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/90 text-zinc-400 uppercase text-[11px] font-bold tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-5 py-4">Mã đơn &amp; Dịch vụ</th>
                <th className="px-5 py-4">Khách hàng / Booster</th>
                <th className="px-5 py-4 min-w-[280px]">Nội dung Khiếu nại (Nhấn để xem hết)</th>
                <th className="px-5 py-4">Tài chính Ký quỹ</th>
                <th className="px-5 py-4 text-right">Thao tác phân xử</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {disputes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-500 text-sm">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                    Không có khiếu nại nào trong danh mục này.
                  </td>
                </tr>
              ) : (
                disputes.map((d) => {
                  const isExpanded = Boolean(expandedReasonIds[d._id]);
                  const hasMismatch = Boolean(d.mismatch_info?.proofImage || d.mismatch_info?.verifiedRank);
                  const isRankDispute = d.dispute?.reason?.toLowerCase().includes('lệch rank') ||
                    d.dispute?.reason?.toLowerCase().includes('sai lệch') ||
                    hasMismatch;

                  const depositPaid = d.pricing?.deposit_amount || Math.round((d.pricing?.total_amount || 0) * 0.4);
                  const platformFee = d.pricing?.platform_fee || Math.round(depositPaid * 0.02);
                  const safeBoosterPayout = Math.max(0, depositPaid - platformFee);

                  return (
                    <tr key={d._id} className="hover:bg-zinc-800/40 transition-colors">
                      {/* Cột 1: Mã đơn & Loại dịch vụ */}
                      <td className="px-5 py-4 align-top">
                        <Link
                          href={`/orders/${d._id}`}
                          target="_blank"
                          className="font-mono font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1.5"
                        >
                          <span>#{d.orderCode || d._id.slice(-6).toUpperCase()}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                        </Link>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {d.serviceType}
                          </span>
                          {hasMismatch && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Lệch Rank
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-600" />
                          {new Date(d.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* Cột 2: Khách hàng & Booster */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                              C
                            </span>
                            <span className="text-zinc-200 font-semibold truncate max-w-[150px]">
                              {d.customerId?.username || 'Khách giấu tên'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                              B
                            </span>
                            <span className="text-zinc-400 truncate max-w-[150px]">
                              {d.boosterId?.username || 'Chưa nhận đơn'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Lý do khiếu nại (Có thể click mở rộng) */}
                      <td className="px-5 py-4 align-top">
                        <div
                          onClick={() => toggleExpandReason(d._id)}
                          className="group cursor-pointer rounded-xl p-2.5 bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              {isRankDispute ? 'Tố cáo Booster báo sai Rank' : 'Khiếu nại dịch vụ'}
                            </span>
                            <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 flex items-center gap-0.5">
                              {isExpanded ? (
                                <>
                                  Thu gọn <ChevronUp className="w-3.5 h-3.5" />
                                </>
                              ) : (
                                <>
                                  Xem hết <ChevronDown className="w-3.5 h-3.5" />
                                </>
                              )}
                            </span>
                          </div>

                          <p
                            className={`text-xs text-rose-200/90 leading-relaxed font-normal ${
                              isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
                            }`}
                          >
                            {d.dispute?.reason || 'Không có mô tả chi tiết'}
                          </p>
                        </div>

                        {/* Ghi chú nội bộ Admin nếu có */}
                        {(d.dispute?.adminNote || d.admin_note) && (
                          <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-[11.5px] text-yellow-300/90 flex items-start gap-1.5">
                            <StickyNote className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-yellow-200 font-bold">Admin Note: </strong>
                              {d.dispute?.adminNote || d.admin_note}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Cột 4: Tài chính Ký quỹ */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1 font-mono text-xs">
                          <div className="flex items-center justify-between gap-2 text-zinc-400">
                            <span>Đã cọc:</span>
                            <span className="font-bold text-emerald-400 font-mono">
                              {depositPaid.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-zinc-500 text-[11px]">
                            <span>Tổng đơn:</span>
                            <span>{(d.pricing?.total_amount || 0).toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-zinc-500 text-[11px] pt-1 border-t border-zinc-800">
                            <span>Phí sàn (2%):</span>
                            <span>{platformFee.toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 5: Hành động */}
                      <td className="px-5 py-4 align-top text-right space-y-2">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Nút xem bằng chứng đối soát */}
                          <button
                            type="button"
                            onClick={() => setSelectedDispute(d)}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/35 text-blue-300 hover:bg-blue-500/25 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>Xem đối soát</span>
                          </button>

                          {/* Nút ghi chú nội bộ */}
                          <button
                            type="button"
                            onClick={() => handleOpenNoteModal(d)}
                            title="Ghi chú nội bộ"
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                          >
                            <StickyNote className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Các nút phân xử nếu đơn còn PENDING */}
                        {d.dispute?.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5 pt-1.5 flex-wrap">
                            {isRankDispute && (
                              <button
                                type="button"
                                onClick={() => handleOpenResolveModal(d, 'REJECT_DISPUTE_REQUIRE_ACTION')}
                                title="Bác khiếu nại của khách, xác nhận Booster đúng và chuyển về để khách xử lý tiếp"
                                className="px-2.5 py-1 rounded-lg border border-amber-500/35 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 text-[11px] font-bold transition-all cursor-pointer"
                              >
                                Bác khiếu nại (Khách xử lý)
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenResolveModal(d, 'RESUME')}
                              className="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Tiếp tục cày
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenResolveModal(d, 'REFUND_CUSTOMER')}
                              className="px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Hoàn tiền Khách
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenResolveModal(d, 'PAY_BOOSTER')}
                              className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Trả Booster
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: XEM BẰNG CHỨNG ĐỐI SOÁT (DISPUTE INSPECTION) ================= */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Đối Soát Bằng Chứng Tranh Chấp #
                    {selectedDispute.orderCode || selectedDispute._id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Đối chiếu chứng cứ giữa Khách hàng và Booster trước khi đưa ra phán quyết
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Cột Đối Trọng */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* CỘT TRÁI: PHÍA BOOSTER (BẰNG CHỨNG LỆCH RANK / SẢNH CHỜ) */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-4 space-y-3.5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-amber-500/20">
                    <span className="text-xs font-bold uppercase text-amber-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Phía Booster báo cáo
                    </span>
                    <span className="text-xs text-zinc-400">
                      Booster: <strong className="text-white">{selectedDispute.boosterId?.username}</strong>
                    </span>
                  </div>

                  {/* Rank thực tế Booster báo */}
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 space-y-1">
                    <span className="text-[11px] text-zinc-400 block font-medium">Rank thực tế Booster phát hiện:</span>
                    <div className="text-base font-extrabold text-amber-300">
                      {selectedDispute.mismatch_info?.verifiedRank ||
                        selectedDispute.details?.current_rank ||
                        'Chưa cập nhật'}
                    </div>
                  </div>

                  {/* Ảnh sảnh chờ làm bằng chứng (proofImage) */}
                  <div>
                    <span className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Ảnh chụp màn hình sảnh chờ làm bằng chứng:
                    </span>
                    {selectedDispute.mismatch_info?.proofImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-amber-500/40 aspect-video bg-black/60 group">
                        <img
                          src={selectedDispute.mismatch_info.proofImage}
                          alt="Bằng chứng từ Booster"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxImage(selectedDispute.mismatch_info?.proofImage || null)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs font-bold text-white cursor-pointer"
                        >
                          <ZoomIn className="w-5 h-5 text-amber-300" />
                          <span>Nhấn để xem ảnh phóng to</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                        Booster chưa đăng tải ảnh bằng chứng sảnh chờ.
                      </div>
                    )}
                  </div>

                  {/* Ghi chú của Booster */}
                  {selectedDispute.mismatch_info?.note && (
                    <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 text-xs text-zinc-300">
                      <strong className="text-amber-200 block mb-0.5 font-bold">Ghi chú của Booster:</strong>
                      {selectedDispute.mismatch_info.note}
                    </div>
                  )}

                  {/* Lịch sử trận đấu nếu có */}
                  {selectedDispute.match_history && selectedDispute.match_history.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase block mb-1.5">
                        Lịch sử trận đấu ({selectedDispute.match_history.length})
                      </span>
                      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                        {selectedDispute.match_history.map((m: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-black/40 border border-zinc-800 text-xs flex items-center justify-between"
                          >
                            <span
                              className={`font-black ${
                                m.result === 'WIN' ? 'text-blue-400' : 'text-rose-400'
                              }`}
                            >
                              {m.result}
                            </span>
                            <span className="text-zinc-300 font-semibold">{m.champion}</span>
                            <span className="font-mono text-zinc-400">
                              {m.lp_change >= 0 ? `+${m.lp_change}` : m.lp_change} LP
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CỘT PHẢI: PHÍA KHÁCH HÀNG (KHIẾU NẠI & KHAI BÁO) */}
                <div className="rounded-2xl border border-blue-500/30 bg-blue-950/10 p-4 space-y-3.5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-blue-500/20">
                    <span className="text-xs font-bold uppercase text-blue-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" /> Phía Khách hàng khiếu nại
                    </span>
                    <span className="text-xs text-zinc-400">
                      Khách: <strong className="text-white">{selectedDispute.customerId?.username}</strong>
                    </span>
                  </div>

                  {/* Mức rank khách khai ban đầu */}
                  <div className="p-3 rounded-xl bg-black/40 border border-blue-500/20 space-y-1">
                    <span className="text-[11px] text-zinc-400 block font-medium">Rank ban đầu khách khai:</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <span>
                        {selectedDispute.mismatch_info?.declaredRank ||
                          selectedDispute.details?.current_rank ||
                          'Không rõ'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-500" />
                      <span className="text-blue-400">
                        {selectedDispute.mismatch_info?.targetRank ||
                          selectedDispute.details?.desired_rank ||
                          'Mục tiêu ban đầu'}
                      </span>
                    </div>
                  </div>

                  {/* Nội dung khiếu nại đầy đủ của khách */}
                  <div>
                    <span className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Nội dung khách tố cáo / giải trình:
                    </span>
                    <div className="p-3.5 rounded-xl bg-black/60 border border-rose-500/30 text-xs text-rose-200 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {selectedDispute.dispute?.reason || 'Khách không để lại mô tả'}
                    </div>
                  </div>

                  {/* Thời gian khách gửi khiếu nại */}
                  <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                    <div>
                      Thời gian gửi khiếu nại:{' '}
                      <strong className="text-zinc-200">
                        {new Date(
                          selectedDispute.dispute?.createdAt || selectedDispute.updatedAt
                        ).toLocaleString('vi-VN')}
                      </strong>
                    </div>
                    <div>
                      Email liên hệ khách: <span className="text-zinc-300">{selectedDispute.customerId?.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BẢNG TỔNG KẾT TÀI CHÍNH KÝ QUỸ (ESCROW BREAKDOWN) */}
              {(() => {
                const depositPaid =
                  selectedDispute.pricing?.deposit_amount ||
                  Math.round((selectedDispute.pricing?.total_amount || 0) * 0.4);
                const platformFee =
                  selectedDispute.pricing?.platform_fee || Math.round(depositPaid * 0.02);
                const safeBoosterPayout = Math.max(0, depositPaid - platformFee);

                return (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-emerald-400" /> Bảng phân tích tài chính ký quỹ (Escrow
                        Invariants)
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                        Sàn đang giữ: {depositPaid.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-zinc-500 block mb-0.5">Tiền cọc khách đã trả:</span>
                        <span className="font-mono text-base font-extrabold text-emerald-400">
                          {depositPaid.toLocaleString('vi-VN')} đ
                        </span>
                        <span className="block text-[10.5px] text-zinc-500 mt-0.5">
                          Tối đa hoàn 100% về ví Khách
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-zinc-500 block mb-0.5">Phí sàn Admin (2%):</span>
                        <span className="font-mono text-base font-extrabold text-amber-400">
                          {platformFee.toLocaleString('vi-VN')} đ
                        </span>
                        <span className="block text-[10.5px] text-zinc-500 mt-0.5">Thu về quỹ vận hành sàn</span>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-zinc-500 block mb-0.5">Thực trả Booster (nếu khách sai):</span>
                        <span className="font-mono text-base font-extrabold text-blue-400">
                          {safeBoosterPayout.toLocaleString('vi-VN')} đ
                        </span>
                        <span className="block text-[10.5px] text-zinc-500 mt-0.5">
                          Bồi thường cọc sau khi trừ phí sàn
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer: 3 Nút Hành Động Phân Xử Ngay */}
            <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleOpenNoteModal(selectedDispute)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <StickyNote className="w-4 h-4" />
                <span>Ghi chú nội bộ</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {Boolean(selectedDispute.mismatch_info?.verifiedRank || selectedDispute.mismatch_info?.proofImage) && (
                  <button
                    type="button"
                    onClick={() => handleOpenResolveModal(selectedDispute, 'REJECT_DISPUTE_REQUIRE_ACTION')}
                    className="px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-amber-950/30"
                  >
                    Bác khiếu nại (Khách xử lý tiếp)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenResolveModal(selectedDispute, 'RESUME')}
                  className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Tiếp tục cày
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenResolveModal(selectedDispute, 'REFUND_CUSTOMER')}
                  className="px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-rose-950/30"
                >
                  Hoàn tiền Khách
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenResolveModal(selectedDispute, 'PAY_BOOSTER')}
                  className="px-4 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-emerald-950/30"
                >
                  Trả Booster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: GHI CHÚ ADMIN THAY THẾ PROMPT NGUYÊN THỦY ================= */}
      {noteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <StickyNote className="w-5 h-5 text-amber-400" />
                <span>Ghi chú nội bộ Admin #{noteModal.orderCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setNoteModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Ghi chú này chỉ Admin và BQT xem được, dùng để lưu vết quá trình kiểm tra lịch sử đấu/sảnh chờ game.
            </p>

            <textarea
              rows={4}
              value={noteModal.note}
              onChange={(e) => setNoteModal((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Nhập ghi chú nội bộ (VD: Đã check Riot API nick thực tế đúng là Bạch Kim II, Booster vu khống...)"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors resize-none"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={noteModal.submitting}
                onClick={() => setNoteModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={noteModal.submitting}
                onClick={handleSaveNote}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {noteModal.submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-black" />
                )}
                <span>Lưu ghi chú</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: XÁC NHẬN PHÁN QUYẾT THAY THẾ CONFIRM NGUYÊN THỦY ================= */}
      {resolveModal.isOpen && resolveModal.dispute && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Xác nhận phán quyết tranh chấp</span>
              </div>
              <button
                type="button"
                onClick={() => setResolveModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chi tiết phán quyết */}
            {(() => {
              const d = resolveModal.dispute;
              const depositPaid = d.pricing?.deposit_amount || Math.round((d.pricing?.total_amount || 0) * 0.4);
              const platformFee = d.pricing?.platform_fee || Math.round(depositPaid * 0.02);
              const safeBoosterPayout = Math.max(0, depositPaid - platformFee);

              if (resolveModal.decision === 'REFUND_CUSTOMER') {
                return (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2 text-rose-200">
                    <div className="font-bold text-rose-300 text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      Quyết định: Hoàn tiền cọc cho Khách hàng
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      Khách hàng được xử thắng khiếu nại. Hệ thống sẽ hoàn trả{' '}
                      <strong className="text-emerald-400 font-mono text-sm">
                        +{depositPaid.toLocaleString('vi-VN')} đ
                      </strong>{' '}
                      vào số dư ví web của khách. Đơn hàng sẽ kết thúc ở trạng thái <code>REFUNDED</code>.
                    </p>
                  </div>
                );
              }

              if (resolveModal.decision === 'PAY_BOOSTER') {
                return (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2 text-emerald-200">
                    <div className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Quyết định: Xử Booster thắng (Khách mất cọc)
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      Khách hàng vi phạm hoặc từ chối thanh toán. Sàn giữ lại phí quản lý sàn{' '}
                      <strong className="text-amber-400">{platformFee.toLocaleString('vi-VN')} đ</strong>, giải
                      ngân bồi thường{' '}
                      <strong className="text-emerald-400 font-mono text-sm">
                        +{safeBoosterPayout.toLocaleString('vi-VN')} đ
                      </strong>{' '}
                      vào ví của Booster. Đơn hàng chuyển sang <code>COMPLETED</code>.
                    </p>
                  </div>
                );
              }

              if (resolveModal.decision === 'REJECT_DISPUTE_REQUIRE_ACTION') {
                return (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 text-amber-200">
                    <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Quyết định: Bác bỏ khiếu nại (Xác nhận Booster đúng)
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      Admin xác nhận bằng chứng sảnh chờ từ Booster là chính xác, khiếu nại của khách không có cơ sở. Đơn hàng sẽ chuyển về lại trạng thái <code className="text-amber-300 font-bold">RANK_MISMATCH</code> để Khách hàng tiếp tục xử lý (bù thêm cọc hoặc cung cấp lại tài khoản đúng rank).
                    </p>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/20 text-[11px] text-zinc-400 space-y-1">
                      <div>• Tiền cọc <strong className="text-emerald-400 font-mono">+{depositPaid.toLocaleString('vi-VN')} đ</strong> vẫn được bảo lưu an toàn trong quỹ Escrow.</div>
                      <div>• Hệ thống sẽ gửi thông báo đến Khách hàng kèm kết luận của Admin.</div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2 text-blue-200">
                  <div className="font-bold text-blue-300 text-sm flex items-center gap-2">
                    <Play className="w-4 h-4 text-blue-400" />
                    Quyết định: Bác khiếu nại &amp; Tiếp tục cày
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    Tranh chấp được giải tỏa. Đơn hàng sẽ chuyển trạng thái về <code>IN_PROGRESS</code> để Booster
                    tiếp tục hoàn thành nhiệm vụ.
                  </p>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={resolveModal.submitting}
                onClick={() => setResolveModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={resolveModal.submitting}
                onClick={handleExecuteResolve}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {resolveModal.submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-black" />
                )}
                <span>Xác nhận thực hiện</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox phóng to ảnh sảnh chờ */}
      <ImageLightbox
        isOpen={Boolean(lightboxImage)}
        src={lightboxImage || ''}
        alt="Bằng chứng từ Booster"
        title="Bằng chứng sảnh chờ game từ Booster"
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
