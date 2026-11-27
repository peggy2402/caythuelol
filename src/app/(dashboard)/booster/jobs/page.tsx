// src/app/(dashboard)/booster/jobs/page.tsx
'use client';
import BarLoader from '@/components/ui/BarLoader';

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
  X,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  ArrowRightLeft,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getGameById } from '@/lib/games';
import { formatRankDisplayVi } from '@/lib/riotRanks';
import { formatServiceNameVi } from '@/lib/orderStatus';
import { getLaneMeta } from '@/lib/lanes';

const formatServiceTypeVi = (serviceType?: string, details?: any): string => {
  if (details?.is_matches || serviceType === 'MATCHES') {
    return 'Cày Theo Số Trận Thắng';
  }
  if (details?.is_placements || serviceType === 'PLACEMENTS') {
    return 'Phân Hạng Đầu Mùa';
  }
  if (details?.is_point_boost || details?.calc_mode === 'BY_LP' || details?.segment) {
    return 'Cày Điểm LP';
  }
  return formatServiceNameVi(serviceType, details);
};
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getBoosterOrderValue } from '@/lib/orderPricing';

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
  options?: any;
  details: any;
  pricing: {
    booster_earnings: number;
    total_amount: number;
    service_fee?: number;
    original_price?: number;
    booster_order_value?: number;
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

  // Modal xác nhận nhận đơn (Căn giữa màn hình)
  const [acceptModal, setAcceptModal] = useState<{
    isOpen: boolean;
    job: Job | null;
    mode: 'CLAIM' | 'APPROVE';
  }>({
    isOpen: false,
    job: null,
    mode: 'CLAIM',
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/boosters/market');
      const data = await res.json();
      if (data.success) {
        setDirectJobs(data.directRequests || []);
        setPublicJobs(data.publicJobs || []);
        const total = (data.directRequests?.length || 0) + (data.publicJobs?.length || 0);
        window.dispatchEvent(new CustomEvent('booster-jobs-updated', { detail: { count: total } }));
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
    // Xác nhận nhận đơn chỉ định với modal giữa màn hình
    setAcceptModal({
      isOpen: true,
      job,
      mode: 'APPROVE',
    });
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
      let res = await fetch(`/api/boosters/jobs/${jobId}/claim`, {
        method: 'POST',
      });
      if (res.status === 404) {
        res = await fetch(`/api/orders/${jobId}/confirm`, {
          method: 'POST',
        });
      }
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

  // Xử lý Claim cho Đơn công khai (Mở Modal Căn Giữa Màn Hình)
  const handleClaim = (job: Job) => {
    setAcceptModal({
      isOpen: true,
      job,
      mode: 'CLAIM',
    });
  };

  const confirmAccept = () => {
    if (!acceptModal.job) return;
    const jobId = acceptModal.job._id;
    const mode = acceptModal.mode;
    setAcceptModal((prev) => ({ ...prev, isOpen: false }));
    if (mode === 'CLAIM') {
      processClaim(jobId);
    } else {
      processRespond(jobId, 'approve');
    }
  };

  // Helper: Render thông tin chi tiết dựa trên loại dịch vụ
  const renderJobInfo = (job: Job) => {
    const { serviceType, details } = job;
    
    if (serviceType === 'RANK_BOOST') {
        return (
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-zinc-400 text-xs">Mục tiêu</span>
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                    {formatRankDisplayVi(details?.current_rank)} <ArrowRight className="w-3 h-3 text-zinc-600" /> <span className="text-blue-400">{formatRankDisplayVi(details?.desired_rank)}</span>
                </div>
            </div>
        );
    }
    
    if (serviceType === 'NET_WINS') {
        const isPointBoost = Boolean(details?.is_point_boost || details?.calc_mode === 'BY_LP' || details?.segment);
        if (isPointBoost) {
            const unit = details?.unit || 'LP';
            const start = details?.start_lp ?? details?.current_points ?? details?.current_lp ?? 0;
            const target = details?.target_lp ?? details?.desired_points ?? details?.target_points ?? (start + (details?.gained_points || 0));
            const segmentLabel = details?.segment_label || (details?.segment ? formatRankDisplayVi(details.segment) : null);
            const rawRank = segmentLabel || details?.current_rank || 'Cao Thủ';
            const cleanRank = formatRankDisplayVi(rawRank.replace(/\(\s*\d+\s*(LP|Sao)\s*\)/gi, '').trim());

            return (
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                    <span className="text-zinc-400 text-xs font-medium">Mục tiêu</span>
                    <div className="text-right">
                        <div className="font-bold text-white text-sm flex items-center justify-end gap-1.5 flex-wrap">
                            <span>{start} {unit}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-cyan-300 font-bold">{target} {unit}</span>
                            <span className="text-zinc-400 font-normal text-xs">({cleanRank})</span>
                        </div>
                        <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                            (+{Math.max(0, target - start)} {unit} cần cày)
                        </div>
                    </div>
                </div>
            );
        }

        let currentRankClean = (details?.current_rank || details?.rank || 'Khởi điểm');
        currentRankClean = currentRankClean.replace(/\(\s*\d+\s*(LP|Sao)\s*\)/gi, '').trim();
        const rankDisplay = formatRankDisplayVi(currentRankClean);
        const hasLp = details?.current_lp !== undefined && details?.current_lp !== '';

        return (
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-zinc-400 text-xs font-medium">Mục tiêu</span>
                <div className="text-right">
                    <div className="font-bold text-white text-sm">
                        {rankDisplay}
                        {hasLp && (
                            <span className="text-zinc-400 font-normal ml-1">({details.current_lp} LP)</span>
                        )}
                    </div>
                    <div className="text-xs text-blue-400 font-bold mt-0.5">
                        {details?.calc_mode === 'BY_GAMES' || details?.num_games ? `+${details?.num_games || 0} Trận thắng` : `Lên ${details?.target_lp} LP`}
                    </div>
                </div>
            </div>
        );
    }

    if (serviceType === 'MATCHES' || details?.is_matches) {
        const matchCount = details?.match_count || details?.matches || 1;
        const queueVi = details?.queue_type === 'FLEX' ? 'Linh Hoạt (Flex)' : 'Đơn / Đôi';
        return (
            <div className="p-3 bg-black/20 rounded-lg border border-white/5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 text-xs">Mục tiêu</span>
                    <div className="text-right">
                        <div className="font-bold text-white text-sm">
                            Cày đủ <span className="text-emerald-400 font-extrabold">{matchCount}</span> trận thắng
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                            Hàng chờ: <span className="text-zinc-300 font-semibold">{queueVi}</span>
                        </div>
                    </div>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-emerald-300/90 font-medium">
                        • Cam kết đủ {matchCount} trận thắng (đánh bù miễn phí nếu thua)
                    </span>
                </div>
            </div>
        );
    }

    if (serviceType === 'PLACEMENTS' || details?.is_placements) {
        const matches = details?.placement_matches || details?.matches || details?.num_games || 5;
        const prevRank = details?.previous_rank_label || details?.previous_season_rank || details?.prev_rank;
        const queueVi = details?.queue_type === 'FLEX' ? 'Linh Hoạt (Flex)' : 'Đơn / Đôi';
        return (
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-zinc-400 text-xs">Mục tiêu</span>
                <div className="text-right">
                    <div className="font-bold text-white text-sm">
                        <span className="text-amber-400 font-extrabold">{matches}</span> trận phân hạng
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                        Rank mùa trước: <span className="text-amber-300 font-semibold">{formatRankDisplayVi(prevRank || 'Chưa có')}</span> • {queueVi}
                    </div>
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
            {details?.current_rank ? formatRankDisplayVi(details.current_rank) : details?.current_level || 'Start'} 
            <ArrowRight className="w-3 h-3 text-zinc-600" /> 
            <span className="text-blue-400">{details?.desired_rank ? formatRankDisplayVi(details.desired_rank) : details?.desired_level || 'Target'}</span>
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
    <div className={`group border rounded-2xl p-4 sm:p-5 transition-all hover:shadow-lg flex flex-col overflow-hidden relative ${type === 'DIRECT' ? 'bg-blue-900/10 border-blue-500/35 hover:border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.06)]' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
      {/* Game Identification Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-white truncate">{gameName}</div>
            {job.details?.server && (
              <div className="text-[10px] text-zinc-400 truncate">Server: {job.details.server}</div>
            )}
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shrink-0 shadow-sm whitespace-nowrap">
          {formatServiceTypeVi(job.serviceType, job.details)}
        </span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-700 shrink-0">
            {job.customerId?.profile?.avatar ? (
              <img src={job.customerId.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-white text-sm truncate">{job.customerId?.username || 'Khách hàng'}</div>
            <div className="text-xs text-zinc-500 flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(job.createdAt).toLocaleDateString('vi-VN')}</span>
              {job.orderCode && (
                <span className="text-[10px] font-mono text-zinc-400">#{job.orderCode}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 space-y-3 mb-5">
        {renderJobInfo(job)}

        {/* Tóm tắt yêu cầu mở rộng (Lịch cày, Vị trí, Tướng) */}
        {(() => {
          const jRoles: string[] = job.options?.roles || job.options?.selectedRoles || job.details?.roles || job.details?.selectedRoles || [];
          const jChamps: string[] = job.options?.champions || job.options?.selectedChampions || job.details?.champions || job.details?.selectedChampions || [];
          const jSched = job.options?.scheduleDetails || job.details?.scheduleDetails || job.details?.addons?.scheduleDetails;
          if (jRoles.length === 0 && jChamps.length === 0 && !jSched) return null;

          return (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              {jSched && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 font-medium">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span>{jSched.timeWindow || 'Theo lịch hẹn'}</span>
                </span>
              )}
              {jRoles.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-medium">
                  <span>Lane: {jRoles.map(r => getLaneMeta(r, gameCode).shortName || r).join(', ')}</span>
                </span>
              )}
              {jChamps.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                  <span>Tướng: {jChamps.slice(0, 2).join(', ')}{jChamps.length > 2 ? '...' : ''}</span>
                </span>
              )}
            </div>
          );
        })()}

        {type === 'DIRECT' && (
            <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded-xl border border-yellow-500/20">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Khách hàng chỉ định riêng cho bạn</span>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3.5 border-t border-white/5 flex flex-col gap-3 mt-auto">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-zinc-400 font-medium">Thu nhập nhận được</span>
          <span className="text-base sm:text-lg font-black text-emerald-400 font-mono tracking-tight">
            {new Intl.NumberFormat('vi-VN').format(getBoosterOrderValue(job.pricing))} đ
          </span>
        </div>
        
        <div className="w-full">
            {type === 'DIRECT' ? (
                <div className="grid grid-cols-2 gap-2 w-full">
                    <button 
                        type="button"
                        onClick={() => handleRespond(job, 'reject')}
                        disabled={!!processingId}
                        className="h-10 px-3 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/25 text-red-400 hover:text-red-300 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer whitespace-nowrap"
                        title="Từ chối đơn chỉ định này"
                    >
                        <X className="w-4 h-4 shrink-0" />
                        <span>Từ chối</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleRespond(job, 'approve')}
                        disabled={!!processingId}
                        className="h-10 px-3 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:from-blue-700 active:to-cyan-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-md shadow-blue-500/25 hover:shadow-cyan-500/30 flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                        {processingId === job._id ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        <span>Nhận đơn</span>
                    </button>
                </div>
            ) : (
                <button 
                    type="button"
                    onClick={() => handleClaim(job)}
                    disabled={!!processingId}
                    className="w-full h-10 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:from-blue-700 active:to-cyan-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-md shadow-blue-500/25 hover:shadow-cyan-500/30 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                    {processingId === job._id ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Briefcase className="w-4 h-4 shrink-0" />}
                    <span>Nhận việc</span>
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
        <BarLoader className="py-20" />
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
        <DialogContent className="max-w-md sm:max-w-lg bg-zinc-950 border border-white/10 text-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-1 shadow-inner">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-center text-white">
              Từ Chối & Chuyển Giao Đơn Hàng
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 text-center leading-relaxed">
              Đơn hàng này sẽ <strong className="text-emerald-400">KHÔNG BỊ HỦY</strong>. Hệ thống sẽ tự động chuyển giao đơn lên <strong className="text-blue-400">Sàn việc làm công khai</strong> để các Booster khác cùng tựa game tiếp nhận ngay lập tức.
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
                <span className="font-semibold text-cyan-300">
                  {getGameById(rejectModal.job.snapshot?.gameCode || rejectModal.job.details?.game || 'LOL')?.name || 'League of Legends'} • {formatServiceTypeVi(rejectModal.job.serviceType, rejectModal.job.details)}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Giá trị đơn hàng nhận được:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {new Intl.NumberFormat('vi-VN').format(getBoosterOrderValue(rejectModal.job.pricing))} đ
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

      {/* MODAL XÁC NHẬN NHẬN ĐƠN / NHẬN VIỆC (CĂN GIỮA MÀN HÌNH) */}
      <Dialog open={acceptModal.isOpen} onOpenChange={(open) => !open && setAcceptModal((prev) => ({ ...prev, isOpen: false }))}>
        <DialogContent className="max-w-md sm:max-w-lg bg-zinc-950 border border-white/10 text-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-1 shadow-inner shadow-emerald-500/10">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-center text-white">
              {acceptModal.mode === 'APPROVE' ? 'Xác Nhận Nhận Đơn Chỉ Định' : 'Xác Nhận Nhận Đơn Hàng'}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 text-center leading-relaxed">
              Sau khi nhận, đơn hàng sẽ chuyển sang trạng thái <strong className="text-emerald-400">"Đã nhận"</strong>. Bạn cần bắt đầu cày sớm nhất có thể để đảm bảo tiến độ và uy tín Booster.
            </DialogDescription>
          </DialogHeader>

          {/* Chi tiết tóm tắt đơn hàng */}
          {acceptModal.job && (
            <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-3.5 space-y-2 my-2 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-white">
                  #{acceptModal.job.orderCode || acceptModal.job._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Dịch vụ:</span>
                <span className="font-semibold text-cyan-300">
                  {getGameById(acceptModal.job.snapshot?.gameCode || acceptModal.job.details?.game || 'LOL')?.name || 'League of Legends'} • {formatServiceTypeVi(acceptModal.job.serviceType, acceptModal.job.details)}
                </span>
              </div>
              {acceptModal.job.details && (acceptModal.job.details.current_rank || acceptModal.job.details.promo_from || acceptModal.job.details.is_point_boost) && (
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-500">Lộ trình:</span>
                  <span className="font-medium text-zinc-200">
                    {acceptModal.job.details.current_rank && acceptModal.job.details.desired_rank ? (
                      `${formatRankDisplayVi(acceptModal.job.details.current_rank)} ➔ ${formatRankDisplayVi(acceptModal.job.details.desired_rank)}`
                    ) : acceptModal.job.details.is_point_boost ? (
                      `${acceptModal.job.details.start_lp ?? acceptModal.job.details.current_points ?? 0} ${acceptModal.job.details.unit || 'LP'} ➔ ${acceptModal.job.details.target_lp ?? acceptModal.job.details.desired_points ?? 100} ${acceptModal.job.details.unit || 'LP'}`
                    ) : acceptModal.job.details.promo_from ? (
                      `${acceptModal.job.details.promo_from} ➔ ${acceptModal.job.details.promo_to}`
                    ) : (
                      'Theo thỏa thuận'
                    )}
                  </span>
                </div>
              )}

              {/* TÙY CHỌN MỞ RỘNG (YÊU CẦU ĐẶC BIỆT TỪ KHÁCH HÀNG) */}
              {(() => {
                const jobGame = acceptModal.job.snapshot?.gameCode || acceptModal.job.details?.game || 'LOL';
                const jobRoles: string[] =
                  acceptModal.job.options?.roles ||
                  acceptModal.job.options?.selectedRoles ||
                  acceptModal.job.details?.roles ||
                  acceptModal.job.details?.selectedRoles ||
                  [];
                const jobChamps: string[] =
                  acceptModal.job.options?.champions ||
                  acceptModal.job.options?.selectedChampions ||
                  acceptModal.job.details?.champions ||
                  acceptModal.job.details?.selectedChampions ||
                  [];
                const jobSchedule =
                  acceptModal.job.options?.scheduleDetails ||
                  acceptModal.job.details?.scheduleDetails ||
                  acceptModal.job.details?.addons?.scheduleDetails;

                const hasDuo = Boolean(acceptModal.job.options?.duo || acceptModal.job.details?.addons?.duo);
                const hasStream = Boolean(acceptModal.job.options?.livestream || acceptModal.job.options?.streaming);
                const hasFlash = Boolean(acceptModal.job.options?.flash || acceptModal.job.options?.flashPosition);

                const hasAnyOption = jobRoles.length > 0 || jobChamps.length > 0 || Boolean(jobSchedule) || hasDuo || hasStream || hasFlash;
                if (!hasAnyOption) return null;

                return (
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-3 h-3 text-blue-400" /> Yêu cầu dịch vụ kèm theo:
                    </div>

                    {/* Vị trí / Đường */}
                    {jobRoles.length > 0 && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-zinc-400 shrink-0">Vị trí / Đường:</span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {jobRoles.map((r: string) => {
                            const meta = getLaneMeta(r, jobGame);
                            return (
                              <span
                                key={r}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 font-semibold text-[11px]"
                              >
                                {meta.image && (
                                  <img
                                    src={meta.image}
                                    alt={meta.name}
                                    className="w-3.5 h-3.5 object-contain"
                                  />
                                )}
                                <span>{meta.name}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Tướng chỉ định */}
                    {jobChamps.length > 0 && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-zinc-400 shrink-0">Tướng chỉ định:</span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {jobChamps.map((c: string) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold text-[11px]"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lịch cày cam kết */}
                    {jobSchedule && (
                      <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between text-blue-300 font-semibold text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400" /> Lịch cày đặt trước (SLA)
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {jobSchedule.timezone || 'GMT+7'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-300">
                          <span className="text-zinc-400">
                            Bắt đầu:{' '}
                            <strong className="text-white">
                              {jobSchedule.startDate
                                ? jobSchedule.startDate.split('-').reverse().join('/')
                                : 'Hôm nay'}
                            </strong>
                          </span>
                          <span className="font-mono font-bold text-cyan-300">
                            {jobSchedule.timeWindow === 'CUSTOM'
                              ? `${jobSchedule.customStartTime || '08:00'} – ${jobSchedule.customEndTime || '17:30'}`
                              : (jobSchedule.timeWindow || '08:00 – 17:30')}
                          </span>
                        </div>
                        {jobSchedule.customerNote && (
                          <div className="text-[10px] text-zinc-400 italic">
                            Ghi chú: {jobSchedule.customerNote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tùy chọn phụ khác */}
                    {(hasDuo || hasStream || hasFlash) && (
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-zinc-400 shrink-0">Tùy chọn khác:</span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {hasDuo && (
                            <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px]">
                              Duo cùng khách
                            </span>
                          )}
                          {hasStream && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                              Livestream
                            </span>
                          )}
                          {hasFlash && (
                            <span className="px-2 py-0.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-[11px]">
                              Tốc biến (Flash)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-between text-zinc-300 pt-1.5 border-t border-white/5">
                <span className="text-zinc-500">Giá trị đơn hàng nhận được:</span>
                <span className="font-bold text-emerald-400 font-mono text-base">
                  {new Intl.NumberFormat('vi-VN').format(getBoosterOrderValue(acceptModal.job.pricing))} đ
                </span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
            <span>🛡️</span>
            <span>Cam kết bảo mật tài khoản khách hàng và không giao dịch ngoài nền tảng LEORANK.</span>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 sm:space-x-0">
            <button
              type="button"
              onClick={() => setAcceptModal((prev) => ({ ...prev, isOpen: false }))}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!!processingId}
              onClick={confirmAccept}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {processingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{acceptModal.mode === 'APPROVE' ? 'Nhận đơn ngay' : 'Nhận việc'}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
