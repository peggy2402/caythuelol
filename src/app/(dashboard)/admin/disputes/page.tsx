'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
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
  createdAt: string;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
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
    </div>
  );
}