'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, Settings } from 'lucide-react';

interface Withdrawal {
  _id: string;
  userId: { username: string; email: string };
  amount: number;
  netAmount: number;
  fee: number;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  status: string;
  createdAt: string;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [currentFee, setCurrentFee] = useState(0);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals?status=${filter}`);
      const data = await res.json();
      if (res.ok) setWithdrawals(data.withdrawals);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchFee = async () => {
    try {
      const res = await fetch('/api/settings/withdraw-fee');
      const data = await res.json();
      setCurrentFee(data.fee);
    } catch (e) {}
  };

  useEffect(() => {
    fetchWithdrawals();
    fetchFee();
  }, [filter]);

  const handleUpdateFee = async () => {
    const newFee = prompt('Nhập phí rút tiền mới (VNĐ):', currentFee.toString());
    if (newFee !== null && !isNaN(Number(newFee))) {
      try {
        const res = await fetch('/api/settings/withdraw-fee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fee: Number(newFee) }),
        });
        if (res.ok) {
          setCurrentFee(Number(newFee));
          toast.success('Đã cập nhật phí rút tiền');
        } else {
          toast.error('Lỗi cập nhật');
        }
      } catch (e) {
        toast.error('Lỗi kết nối');
      }
    }
  };

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    let reason = '';
    if (action === 'REJECT') {
      reason = prompt('Nhập lý do từ chối:') || '';
      if (!reason) return;
    } else {
      if (!confirm('Xác nhận đã chuyển khoản cho user này?')) return;
    }

    try {
      const res = await fetch('/api/admin/withdrawals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id, action, reason }),
      });
      
      if (res.ok) {
        toast.success(action === 'APPROVE' ? 'Đã duyệt thành công' : 'Đã từ chối và hoàn tiền');
        fetchWithdrawals();
      } else {
        toast.error('Thao tác thất bại');
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Yêu cầu Rút tiền</h1>
          <p className="text-zinc-400 text-sm">Duyệt và xử lý các khoản thanh toán cho Booster/User</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleUpdateFee}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Phí: {formatCurrency(currentFee)}
          </button>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white"
          >
            <option value="ALL">Tất cả</option>
            <option value="PENDING">Đang chờ</option>
            <option value="COMPLETED">Đã duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Ngân hàng</th>
              <th className="px-6 py-4">Số tiền (Net)</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500"/></td></tr>
            ) : withdrawals.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Không có yêu cầu nào</td></tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w._id} className="hover:bg-zinc-800/50">
                  <td className="px-6 py-4"><div className="font-bold text-white">{w.userId?.username}</div><div className="text-xs text-zinc-500">{new Date(w.createdAt).toLocaleString('vi-VN')}</div></td>
                  <td className="px-6 py-4"><div className="text-white font-medium">{w.bankInfo.bankName}</div><div className="text-xs text-zinc-400">{w.bankInfo.accountNumber}</div><div className="text-xs text-zinc-500 uppercase">{w.bankInfo.accountHolder}</div></td>
                  <td className="px-6 py-4"><div className="font-bold text-green-400">{formatCurrency(w.netAmount)}</div><div className="text-xs text-zinc-500">Gốc: {formatCurrency(w.amount)} | Phí: {formatCurrency(w.fee)}</div></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${w.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : w.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{w.status}</span></td>
                  <td className="px-6 py-4 text-right space-x-2">{w.status === 'PENDING' && (<><button onClick={() => handleAction(w._id, 'APPROVE')} className="p-2 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button><button onClick={() => handleAction(w._id, 'REJECT')} className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button></>)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}