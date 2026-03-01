'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, Search, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    profile: { avatar: string };
  };
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, SUCCESS

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/transactions');
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions);
      } else {
        toast.error('Không thể tải danh sách giao dịch');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleApprove = async (transactionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn duyệt giao dịch này? Tiền sẽ được cộng vào ví khách hàng.')) return;

    setProcessingId(transactionId);
    try {
      const res = await fetch('/api/wallet/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Duyệt giao dịch thành công!');
        fetchTransactions(); // Reload lại danh sách
      } else {
        toast.error(data.error || 'Lỗi khi duyệt');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'ALL') return true;
    return tx.status === filter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Quản lý Giao dịch</h1>
            <p className="text-zinc-400">Duyệt nạp tiền và kiểm soát dòng tiền hệ thống.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>Tất cả</button>
            <button onClick={() => setFilter('PENDING')} className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'PENDING' ? 'bg-yellow-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>Chờ duyệt</button>
            <button onClick={fetchTransactions} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"><RefreshCw className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Loại / Nội dung</th>
                  <th className="px-6 py-4">Số tiền</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-zinc-500">Không có giao dịch nào.</td></tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-zinc-800/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{tx.userId?.username || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500">{tx.userId?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                            {tx.type === 'DEPOSIT' ? <ArrowDownLeft className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                            <span className="font-medium">{tx.type}</span>
                        </div>
                        <div className="text-xs text-zinc-400 max-w-[200px] truncate" title={tx.description}>{tx.description}</div>
                      </td>
                      <td className={`px-6 py-4 font-bold ${tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' : tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-right">
                        {tx.status === 'PENDING' && tx.type === 'DEPOSIT' && (
                          <button 
                            onClick={() => handleApprove(tx._id)}
                            disabled={processingId === tx._id}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 ml-auto disabled:opacity-50"
                          >
                            {processingId === tx._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Duyệt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}