'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  Eye, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal,
  Loader2,
  Copy
} from 'lucide-react';

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    profile?: { avatar: string };
  };
  type: string;
  amount: number;
  status: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal Detail
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Build Query String
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);

      const res = await fetch(`/api/admin/transactions?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setTransactions(data.transactions);
      } else {
        toast.error(data.error || 'Lỗi tải danh sách giao dịch');
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, statusFilter, typeFilter]);

  const handleReject = async (txId: string) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason === null) return; // Cancelled

    try {
      const res = await fetch('/api/admin/transactions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId, reason }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Đã từ chối giao dịch');
        fetchTransactions();
        setSelectedTx(null);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Lỗi hệ thống');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Giao dịch</h1>
          <p className="text-zinc-400 text-sm">Xem và kiểm soát dòng tiền hệ thống</p>
        </div>
        <button onClick={() => fetchTransactions()} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
          <Clock className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Tìm theo Username, Nội dung CK, Mã GD..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select 
          className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ (PENDING)</option>
          <option value="SUCCESS">Thành công (SUCCESS)</option>
          <option value="FAILED">Thất bại (FAILED)</option>
        </select>

        <select 
          className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">Tất cả loại GD</option>
          <option value="DEPOSIT">Nạp tiền</option>
          <option value="WITHDRAWAL">Rút tiền</option>
          <option value="PAYMENT_HOLD">Giữ tiền</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Loại / Nội dung</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500"/></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-zinc-500">Không tìm thấy giao dịch nào</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{tx.userId?.username || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500">{tx.userId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-xs text-zinc-300 mb-1">{tx.type}</div>
                      <div className="text-zinc-400 truncate max-w-[200px]" title={tx.description}>
                        {tx.metadata?.content || tx.description}
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-bold ${
                      ['DEPOSIT', 'PAYMENT_RELEASE', 'REFUND'].includes(tx.type) ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {['DEPOSIT', 'PAYMENT_RELEASE', 'REFUND'].includes(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                        tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                        {tx.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {tx.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedTx(tx)}
                        className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 z-10">
              <h3 className="text-xl font-bold text-white">Chi tiết Giao dịch</h3>
              <button onClick={() => setSelectedTx(null)} className="text-zinc-400 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="text-sm text-zinc-500 mb-1">Mã giao dịch</div>
                  <div className="font-mono text-white text-sm break-all">{selectedTx._id}</div>
                </div>
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="text-sm text-zinc-500 mb-1">Số tiền</div>
                  <div className="font-bold text-xl text-white">{formatCurrency(selectedTx.amount)}</div>
                </div>
              </div>

              {/* Metadata Viewer (JSON từ SePay) */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-400">Dữ liệu gốc từ cổng thanh toán (Metadata)</div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 overflow-x-auto">
                  <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                    {selectedTx.metadata ? JSON.stringify(selectedTx.metadata, null, 2) : 'Không có dữ liệu metadata'}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              {selectedTx.status === 'PENDING' && (
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button 
                    onClick={() => handleReject(selectedTx._id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Từ chối Giao dịch
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}