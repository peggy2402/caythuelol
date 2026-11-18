// src/app/(dashboard)/booster/jobs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { 
  Briefcase, 
  Search, 
  Clock, 
  DollarSign, 
  User, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  ArrowRightLeft,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getGameById } from '@/lib/games';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const REJECTION_REASONS = [
  'Lịch cày / thi đấu cá nhân bị trùng lặp',
  'Bận công việc đột xuất, không đảm bảo hoàn thành đúng hạn',
  'Mục tiêu rank hoặc yêu cầu tướng/đường vượt ngoài sở trường',
  'Máy chủ hoặc kết nối mạng hiện tại không ổn định',
  'Lý do cá nhân khác',
];

interface Job {
  _id: string;
  orderCode?: string;
  serviceType: string;
  customerId: {
    username: string;
    profile?: { avatar?: string };
  };
  snapshot?: {
    gameCode?: string;
    serviceSlug?: string;
  };
  details: any;
  pricing: {
    booster_earnings: number;
    total_amount: number;
  };
  createdAt: string;
}

export default function JobMarketPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [directJobs, setDirectJobs] = useState<Job[]>([]);
  const [publicJobs, setPublicJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Modal từ chối & chuyển giao đơn chỉ định
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    job: Job | null;
    reason: string;
    customReason: string;
  }>({
    isOpen: false,
    job: null,
    reason: REJECTION_REASONS[0],
    customReason: '',
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/boosters/market');
      const data = await res.json();
      if (data.success) {
        setDirectJobs(data.directRequests || []);
        setPublicJobs(data.publicJobs || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi tải danh sách việc làm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Helper: Xử lý logic API Respond
  const processRespond = async (jobId: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessingId(jobId);
    try {
      const res = await fetch(`/api/orders/${jobId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || data.error || 'Không thể xử lý đơn hàng');

      toast.success(data.message || (action === 'approve' ? 'Đã nhận đơn chỉ định!' : 'Đã từ chối và chuyển giao đơn lên Sàn công khai!'));
      if (action === 'approve') {
          router.push(`/orders/${jobId}`);
      } else {
          fetchJobs(); // Reload list
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setProcessingId(null);
    }
  };

  // Xử lý Approve/Reject cho Đơn chỉ định
  const handleRespond = (job: Job, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      setRejectModal({
        isOpen: true,
        job,
        reason: REJECTION_REASONS[0],
        customReason: '',
      });
      return;
    }
    processRespond(job._id, action);
  };

  const confirmReject = () => {
    if (!rejectModal.job) return;
    const finalReason = rejectModal.reason === 'Lý do cá nhân khác' && rejectModal.customReason.trim()
      ? rejectModal.customReason.trim()
      : rejectModal.reason;
    const jobId = rejectModal.job._id;
    setRejectModal((prev) => ({ ...prev, isOpen: false }));
    processRespond(jobId, 'reject', finalReason);
  };

  // Helper: Xử lý logic API Claim
  const processClaim = async (jobId: string) => {
    setProcessingId(jobId);
    try {
      const res = await fetch(`/api/boosters/jobs/${jobId}/claim`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || data.error || 'Không thể xử lý đơn hàng');

      toast.success('Nhận đơn thành công!');
      router.push(`/orders/${jobId}`);
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
      fetchJobs();
    } finally {
      setProcessingId(null);
    }
  };

  // Xử lý Claim cho Đơn công khai (Có Toast Confirm)
  const handleClaim = (jobId: string) => {
    toast('Xác nhận nhận đơn?', {
      description: 'Sau khi nhận, đơn hàng sẽ chuyển sang trạng thái "Đã nhận". Bạn cần bắt đầu cày sớm nhất có thể.',
      action: {
        label: 'Nhận việc',
        onClick: () => processClaim(jobId),
      },
      cancel: {
        label: "Hủy",
        onClick: () => {},
      },
    });
  };

  // Helper: Render thông tin chi tiết dựa trên loại dịch vụ
  const renderJobInfo = (job: Job) => {
    const { serviceType, details } = job;
    
    if (serviceType === 'RANK_BOOST') {
        return (
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-zinc-400 text-xs">Mục tiêu</span>
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                    {details?.current_rank} <ArrowRight className="w-3 h-3 text-zinc-600" /> <span className="text-blue-400">{details?.desired_rank}</span>
                </div>
            </div>
        );
    }
    
    if (serviceType === 'NET_WINS') {
        return (
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-zinc-400 text-xs">Mục tiêu</span>
                <div className="text-right">
                    <div className="font-bold text-white text-sm">
                        {details?.current_rank || details?.rank}
                        {(details?.current_lp !== undefined && details?.current_lp !== '') && (
                            <span className="text-zinc-400 font-normal ml-1">({details.current_lp} LP)</span>
                        )}
                    </div>
                    <div className="text-xs text-blue-400 font-bold">
                        {details?.calc_mode === 'BY_GAMES' ? `+${details?.num_games} Trận thắng` : `Lên ${details?.target_lp} LP`}
                    </div>
                </div>
            </div>
        );
    }

    if (serviceType === 'PLACEMENTS') {
        return (
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-zinc-400 text-xs">Yêu cầu</span>
                <div className="text-right">
                    <div className="font-bold text-white text-sm">{details?.prev_rank}</div>
                    <div className="text-xs text-blue-400 font-bold">{details?.num_games} Trận đầu mùa</div>
                </div>
            </div>
        );
    }

    if (serviceType === 'PROMOTION') {
        return (
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-zinc-400 text-xs">Chuỗi</span>
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                    {details?.promo_from} <ArrowRight className="w-3 h-3 text-zinc-600" /> <span className="text-blue-400">{details?.promo_to}</span>
                </div>
            </div>
        );
    }

    if (serviceType === 'LEVELING') {
        return (
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-zinc-400 text-xs">Level</span>
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                    {details?.current_level} <ArrowRight className="w-3 h-3 text-zinc-600" /> <span className="text-blue-400">{details?.desired_level}</span>
                </div>
            </div>
        );
    }

    if (serviceType === 'MASTERY') {
        return (
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-zinc-400 text-xs">Thông thạo</span>
                <div className="text-right">
                    <div className="font-bold text-white text-sm">{details?.champion}</div>
                    <div className="text-xs text-blue-400 font-bold">Cấp {details?.current_mastery} ➜ {details?.desired_mastery}</div>
                </div>
            </div>
        );
    }

    if (serviceType === 'COACHING') {
        return (
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-zinc-400 text-xs">Khóa học</span>
                <div className="text-right">
                    <div className="font-bold text-white text-sm">{details?.coaching_type}</div>
                    <div className="text-xs text-blue-400 font-bold">{details?.hours} Giờ</div>
                </div>
            </div>
        );
    }

    if (serviceType === 'ONBET') {
        return (
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-zinc-400 text-xs">Sự kiện</span>
                <div className="text-right">
                    <div className="font-bold text-white text-sm">{details?.rank_label}</div>
                    <div className="text-xs text-blue-400 font-bold">{details?.game_count} Trận</div>
                </div>
            </div>
        );
    }

    // Default fallback
    return (
        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
          <span className="text-zinc-400 text-xs">Mục tiêu</span>
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            {details?.current_rank || details?.current_level || 'Start'} 
            <ArrowRight className="w-3 h-3 text-zinc-600" /> 
            <span className="text-blue-400">{details?.desired_rank || details?.desired_level || 'Target'}</span>
          </div>
        </div>
    );
  };

  // const handleSeedJob = async () => {
  //   setSeeding(true);
  //   try {
  //       const res = await fetch('/api/debug/seed-job', { method: 'POST' });
  //       const data = await res.json();
  //       if (res.ok) {
  //           toast.success('Đã tạo đơn hàng ảo thành công! Hãy thử nhận đơn.');
  //           fetchJobs(); // Tải lại danh sách để thấy đơn mới
  //       } else {
  //           toast.error(data.error);
  //       }
  //   } catch (e) {
  //       toast.error('Lỗi khi tạo đơn ảo');
  //   } finally {
  //       setSeeding(false);
  //   }
  // };

  const JobCard = ({ job, type }: { job: Job, type: 'DIRECT' | 'PUBLIC' }) => {
    const gameCode = job.snapshot?.gameCode || job.details?.game || 'LOL';
    const gameMeta = getGameById(gameCode);
    const gameImg = gameMeta?.bannerUrl || gameMeta?.banner;
    const gameName = gameMeta?.name || gameCode;

    return (
    <div className={`group border rounded-xl p-5 transition-all hover:shadow-lg flex flex-col ${type === 'DIRECT' ? 'bg-blue-900/10 border-blue-500/30 hover:border-blue-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
      {/* Game Identification Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5 min-w-0">
          {gameImg ? (
            <img
              src={gameImg}
              alt={gameName}
              className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0">
              {gameMeta?.shortName || gameCode}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{gameName}</div>
            {job.details?.server && (
              <div className="text-[10px] text-zinc-400">Server: {job.details.server}</div>
            )}
          </div>
        </div>

        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-white/5 text-zinc-300 border border-white/10 shrink-0">
          {job.serviceType.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-700">
            {job.customerId?.profile?.avatar ? (
              <img src={job.customerId.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{job.customerId?.username || 'Khách hàng'}</div>
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> {new Date(job.createdAt).toLocaleDateString('vi-VN')}
              {job.orderCode && (
                <span className="text-[10px] font-mono text-zinc-400">#{job.orderCode}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 space-y-3 mb-6">
        {renderJobInfo(job)}
        {type === 'DIRECT' && (
            <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                <AlertCircle className="w-3 h-3" />
                Khách hàng chỉ định riêng cho bạn
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
        <div>
          <div className="text-xs text-zinc-500">Giá trị đơn</div>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {new Intl.NumberFormat('vi-VN').format(job.pricing.total_amount || 0)} đ
          </div>
        </div>
        
        <div className="flex gap-2">
            {type === 'DIRECT' ? (
                <>
                    <button 
                        onClick={() => handleRespond(job, 'reject')}
                        disabled={!!processingId}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Từ chối"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => handleRespond(job, 'approve')}
                        disabled={!!processingId}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {processingId === job._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Nhận đơn
                    </button>
                </>
            ) : (
                <button 
                    onClick={() => handleClaim(job._id)}
                    disabled={!!processingId}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {processingId === job._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                    Nhận việc
                </button>
            )}
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="text-blue-500" /> {t('jobMarket')}
          </h1>
          <p className="text-zinc-400 text-sm">Tìm kiếm và nhận các đơn hàng phù hợp với bạn.</p>
        </div>

        <div className="flex gap-2">
            {/* <button 
                onClick={handleSeedJob} 
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
                {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                Tạo đơn Test
            </button> */}
            <button 
                onClick={fetchJobs} 
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-8">
            {/* Direct Requests Section */}
            {directJobs.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-500" /> 
                        Bạn đang có {directJobs.length} đơn hàng
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {directJobs.map(job => <JobCard key={job._id} job={job} type="DIRECT" />)}
                    </div>
                </div>
            )}

            {/* Public Jobs Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-zinc-400" /> 
                    Đơn hàng công khai ({publicJobs.length})
                </h2>
                {publicJobs.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl">
                        <p className="text-zinc-500">Hiện chưa có đơn hàng công khai nào.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {publicJobs.map(job => <JobCard key={job._id} job={job} type="PUBLIC" />)}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN TỪ CHỐI & CHUYỂN GIAO ĐƠN CHỈ ĐỊNH (CĂN GIỮA MÀN HÌNH) */}
      <Dialog open={rejectModal.isOpen} onOpenChange={(open) => !open && setRejectModal((prev) => ({ ...prev, isOpen: false }))}>
        <DialogContent className="max-w-md bg-zinc-950 border border-white/10 text-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-1 shadow-inner">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-center text-white">
              Từ Chối & Chuyển Giao Đơn Hàng
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 text-center leading-relaxed">
              Đơn hàng này sẽ <strong className="text-emerald-400">KHÔNG BỊ HỦY</strong>. Hệ thống sẽ tự động chuyển giao đơn lên <strong className="text-blue-400">Sàn việc làm công khai</strong> để các tuyển thủ khác cùng tựa game tiếp nhận ngay lập tức.
            </DialogDescription>
          </DialogHeader>

          {/* Chi tiết tóm tắt đơn hàng */}
          {rejectModal.job && (
            <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-3.5 space-y-2 my-2 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-white">
                  #{rejectModal.job.orderCode || rejectModal.job._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Dịch vụ:</span>
                <span className="font-semibold text-blue-300">
                  {rejectModal.job.snapshot?.gameCode || 'Game'} • {rejectModal.job.serviceType}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Thù lao nhận được:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {new Intl.NumberFormat('vi-VN').format(
                    rejectModal.job.pricing.booster_earnings || (rejectModal.job.pricing.total_amount * 0.8)
                  )} đ
                </span>
              </div>
            </div>
          )}

          {/* Chọn lý do từ chối */}
          <div className="space-y-2 my-2">
            <label className="text-xs font-bold text-zinc-300 block">
              Lý do bạn không thể nhận đơn này:
            </label>
            <div className="space-y-1.5">
              {REJECTION_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    rejectModal.reason === r
                      ? 'bg-blue-500/10 border-blue-500/50 text-white font-medium'
                      : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejection_reason"
                    checked={rejectModal.reason === r}
                    onChange={() => setRejectModal((prev) => ({ ...prev, reason: r }))}
                    className="accent-blue-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            {rejectModal.reason === 'Lý do cá nhân khác' && (
              <div className="pt-2">
                <textarea
                  value={rejectModal.customReason}
                  onChange={(e) => setRejectModal((prev) => ({ ...prev, customReason: e.target.value }))}
                  placeholder="Nhập lý do cụ thể để khách hàng nắm thông tin..."
                  rows={2}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 p-2.5 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-white/10 sm:space-x-0">
            <button
              type="button"
              onClick={() => setRejectModal((prev) => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              Hủy bỏ (Giữ lại đơn)
            </button>
            <button
              type="button"
              disabled={!!processingId}
              onClick={confirmReject}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              {processingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
              <span>Xác nhận chuyển giao</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
