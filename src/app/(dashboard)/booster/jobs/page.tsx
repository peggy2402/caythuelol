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
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Job {
  _id: string;
  serviceType: string;
  customerId: {
    username: string;
    profile?: { avatar?: string };
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
  const processRespond = async (jobId: string, action: 'approve' | 'reject') => {
    setProcessingId(jobId);
    try {
      const res = await fetch(`/api/orders/${jobId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
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

  // Xử lý Approve/Reject cho Đơn chỉ định (Có Toast Confirm)
  const handleRespond = (jobId: string, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      toast('Xác nhận từ chối đơn?', {
        description: 'Tiền sẽ được hoàn lại cho khách hàng.',
        action: {
          label: 'Xác nhận',
          onClick: () => processRespond(jobId, action),
        },
        cancel: {
          label: "Hủy",
          onClick: () => {
            console.log("Đã hủy");
          },
        },
      });
      return;
    }
    processRespond(jobId, action);
  };

  // Helper: Xử lý logic API Claim
  const processClaim = async (jobId: string) => {
    setProcessingId(jobId);
    try {
      const res = await fetch(`/api/boosters/jobs/${jobId}/claim`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

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
      description: 'Bạn có chắc chắn muốn nhận đơn này không?',
      action: {
        label: 'Nhận đơn',
        onClick: () => processClaim(jobId),
      },
      cancel: {
        label: "Hủy",
        onClick: () => {
          console.log("Đã hủy");
        },
      },
    });
  };

  const JobCard = ({ job, type }: { job: Job, type: 'DIRECT' | 'PUBLIC' }) => (
    <div className={`group border rounded-xl p-5 transition-all hover:shadow-lg flex flex-col ${type === 'DIRECT' ? 'bg-blue-900/10 border-blue-500/30 hover:border-blue-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-700">
            {job.customerId.profile?.avatar ? (
              <img src={job.customerId.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{job.customerId.username}</div>
            <div className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {new Date(job.createdAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>
        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-white/5 text-zinc-400 border border-white/10">
          {job.serviceType.replace('_', ' ')}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
          <span className="text-zinc-400 text-xs">Mục tiêu</span>
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            {job.details?.current_rank || job.details?.current_level || 'Start'} 
            <ArrowRight className="w-3 h-3 text-zinc-600" /> 
            <span className="text-blue-400">{job.details?.desired_rank || job.details?.desired_level || 'Target'}</span>
          </div>
        </div>
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
                        onClick={() => handleRespond(job._id, 'reject')}
                        disabled={!!processingId}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Từ chối"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => handleRespond(job._id, 'approve')}
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
                        Đơn hàng chỉ định ({directJobs.length})
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
                    Sàn việc làm ({publicJobs.length})
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
    </div>
  );
}
