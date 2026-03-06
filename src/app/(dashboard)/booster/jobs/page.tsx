'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, Eye, Clock } from 'lucide-react';
import Link from 'next/link';

interface Job {
  _id: string;
  serviceType: string;
  status: string;
  pricing: {
    total_amount: number;
    deposit_amount: number;
    booster_earnings: number;
  };
  details: {
    current_rank?: string;
    desired_rank?: string;
    server: string;
  };
  createdAt: string;
}

export default function BoosterJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Fetch orders where status is PAID (Pending Approve) and boosterId matches current user
      // Or if it's a public job market, fetch orders with no boosterId
      // Assuming here we fetch orders assigned to this booster but not yet started
      const res = await fetch('/api/orders?status=PAID'); 
      const data = await res.json();
      if (res.ok) {
        // Filter client-side for now if API returns all
        // In real app, API should support filtering
        const pendingJobs = (data.orders || []).filter((o: any) => 
            o.status === 'PAID' || o.status === 'PENDING_PAYMENT' // Adjust based on your flow
        );
        setJobs(pendingJobs);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách việc làm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAction = async (orderId: string, action: 'APPROVE' | 'REJECT') => {
    if (!confirm(`Bạn có chắc chắn muốn ${action === 'APPROVE' ? 'NHẬN' : 'TỪ CHỐI'} đơn này?`)) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'APPROVE' ? 'IN_PROGRESS' : 'REJECTED' }),
      });

      if (res.ok) {
        toast.success(action === 'APPROVE' ? 'Đã nhận đơn thành công!' : 'Đã từ chối đơn hàng');
        fetchJobs();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Thao tác thất bại');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Đơn chờ nhận (Jobs)</h1>
      
      {jobs.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed">
          Hiện chưa có đơn hàng nào đang chờ bạn.
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-700 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">CHỜ DUYỆT</span>
                    <span className="text-zinc-500 text-xs flex items-center gap-1"><Clock size={12}/> {new Date(job.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{job.serviceType} <span className="text-zinc-500 text-sm font-normal">#{job._id.slice(-6)}</span></h3>
                <div className="text-sm text-zinc-400">
                    {job.details.current_rank || 'N/A'} ➔ {job.details.desired_rank || 'N/A'} • {job.details.server}
                </div>
                <div className="text-sm font-medium text-green-400">
                    Thu nhập: {job.pricing?.booster_earnings?.toLocaleString() || 0} đ
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <Link href={`/orders/${job._id}`} className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                    <Eye size={16} /> Xem
                </Link>
                <button 
                    onClick={() => handleAction(job._id, 'REJECT')}
                    className="flex-1 md:flex-none px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <XCircle size={16} /> Từ chối
                </button>
                <button 
                    onClick={() => handleAction(job._id, 'APPROVE')}
                    className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                >
                    <CheckCircle2 size={16} /> Nhận đơn
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}