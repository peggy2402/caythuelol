'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2, XCircle, ExternalLink, Eye, Swords, Trophy, X } from 'lucide-react';
import Link from 'next/link';

interface Dispute {
  _id: string;
  serviceType: string;
  customerId: { username: string; email: string };
  boosterId: { username: string; email: string };
  dispute: {
    reason: string;
    status: string;
  };
  pricing: {
    total_amount: number;
    deposit_amount: number;
  };
  details: {
    current_rank?: string;
    desired_rank?: string;
    current_level?: number;
    desired_level?: number;
  };
  match_history: any[];
  createdAt: string;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/disputes');
      const data = await res.json();
      if (res.ok) {
        setDisputes(data.disputes);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (id: string, decision: 'REFUND_CUSTOMER' | 'PAY_BOOSTER') => {
    if (!confirm(`Xác nhận giải quyết: ${decision === 'REFUND_CUSTOMER' ? 'Hoàn tiền cho Khách' : 'Thanh toán cho Booster'}?`)) return;

    try {
      const res = await fetch('/api/admin/disputes/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, decision }),
      });
      
      if (res.ok) {
        toast.success('Đã giải quyết khiếu nại');
        fetchDisputes();
      } else {
        toast.error('Thao tác thất bại');
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <AlertTriangle className="text-red-500" /> Quản lý Khiếu nại
      </h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Mã đơn</th>
              <th className="px-6 py-4">Khách hàng / Booster</th>
              <th className="px-6 py-4">Lý do</th>
              <th className="px-6 py-4">Số tiền cọc</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {disputes.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Không có khiếu nại nào cần xử lý.</td></tr>
            ) : (
              disputes.map((d) => (
                <tr key={d._id} className="hover:bg-zinc-800/50">
                  <td className="px-6 py-4">
                    <Link href={`/orders/${d._id}`} className="text-blue-400 hover:underline flex items-center gap-1">
                      #{d._id.slice(-6)} <ExternalLink size={12} />
                    </Link>
                    <div className="text-xs text-zinc-500">{d.serviceType}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white">C: {d.customerId?.username}</div>
                    <div className="text-zinc-400">B: {d.boosterId?.username}</div>
                  </td>
                  <td className="px-6 py-4 text-red-300 max-w-xs truncate" title={d.dispute.reason}>
                    {d.dispute.reason}
                  </td>
                  <td className="px-6 py-4 font-mono text-yellow-500">
                    {d.pricing.deposit_amount.toLocaleString()} đ
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                        onClick={() => setSelectedDispute(d)}
                        className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 text-xs font-bold inline-flex items-center gap-1"
                    >
                        <Eye size={12} /> Xem bằng chứng
                    </button>
                    <button 
                        onClick={() => handleResolve(d._id, 'REFUND_CUSTOMER')}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 text-xs font-bold"
                    >
                        Hoàn tiền Khách
                    </button>
                    <button 
                        onClick={() => handleResolve(d._id, 'PAY_BOOSTER')}
                        className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded hover:bg-green-500/20 text-xs font-bold"
                    >
                        Trả Booster
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Xem Bằng Chứng (Proof of Work) */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-zinc-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Swords className="text-blue-500" /> Bằng chứng công việc (Booster)
                    </h3>
                    <button onClick={() => setSelectedDispute(null)} className="text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* 1. So sánh Tiến độ */}
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                            <Trophy size={14} /> Tiến độ thực tế
                        </h4>
                        <div className="flex items-center justify-between text-sm">
                            <div className="text-center">
                                <div className="text-zinc-500 mb-1">Hiện tại</div>
                                <div className="text-white font-bold text-lg">
                                    {selectedDispute.details.current_rank || selectedDispute.details.current_level || 'N/A'}
                                </div>
                            </div>
                            <div className="h-px flex-1 bg-zinc-800 mx-4 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-600">➜</div>
                            </div>
                            <div className="text-center">
                                <div className="text-zinc-500 mb-1">Mục tiêu</div>
                                <div className="text-blue-400 font-bold text-lg">
                                    {selectedDispute.details.desired_rank || selectedDispute.details.desired_level || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Lịch sử đấu */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-400 uppercase mb-3">Lịch sử trận đấu ({selectedDispute.match_history?.length || 0})</h4>
                        <div className="space-y-2">
                            {selectedDispute.match_history && selectedDispute.match_history.length > 0 ? (
                                selectedDispute.match_history.map((match, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${match.result === 'WIN' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {match.result}
                                            </span>
                                            <span className="text-white font-medium text-sm">{match.champion}</span>
                                        </div>
                                        <div className={`text-sm font-bold ${match.lp_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {match.lp_change > 0 ? '+' : ''}{match.lp_change} LP
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                                    Booster chưa cập nhật trận đấu nào.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-zinc-800 bg-zinc-900/50 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={() => setSelectedDispute(null)} className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-medium">Đóng</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}