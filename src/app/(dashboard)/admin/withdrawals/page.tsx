'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, Settings, ChevronLeft, ChevronRight, Eye, Wallet, History } from 'lucide-react';

interface Withdrawal {
  _id: string;
  userId: { 
    _id: string;
    username: string; 
    email: string;
    role: string;
    wallet_balance: number;
    pending_balance: number;
  };
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchWithdrawals = async (page = 1, currentLimit = limit) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals?status=${filter}&page=${page}&limit=${currentLimit}`);
      const data = await res.json();
      if (res.ok) {
        setWithdrawals(data.withdrawals);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setCurrentPage(data.pagination.page);
        }
      }
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
    fetchWithdrawals(1, limit);
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
        fetchWithdrawals(currentPage, limit);
      } else {
        toast.error('Thao tác thất bại');
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleViewUserStats = async (user: any) => {
    setSelectedUser(user);
    setLoadingStats(true);
    try {
        // Lấy 5 giao dịch gần nhất của user này
        const res = await fetch(`/api/admin/transactions?search=${user.username}&limit=5`);
        const data = await res.json();
        if (res.ok) {
            setUserTransactions(data.transactions);
        }
    } catch (e) {
        toast.error('Lỗi tải lịch sử giao dịch');
    } finally {
        setLoadingStats(false);
    }
  };

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
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">
                      {w.userId?.username} <span className="text-zinc-500 font-normal">- {w.userId?.role}</span>
                    </div>
                    <div className="text-xs text-zinc-500">{new Date(w.createdAt).toLocaleString('vi-VN')}</div>
                  </td>
                  <td className="px-6 py-4"><div className="text-white font-medium">{w.bankInfo.bankName}</div><div className="text-xs text-zinc-400">{w.bankInfo.accountNumber}</div><div className="text-xs text-zinc-500 uppercase">{w.bankInfo.accountHolder}</div></td>
                  <td className="px-6 py-4"><div className="font-bold text-green-400">{formatCurrency(w.netAmount)}</div><div className="text-xs text-zinc-500">Gốc: {formatCurrency(w.amount)} | Phí: {formatCurrency(w.fee)}</div></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${w.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : w.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{w.status}</span></td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleViewUserStats(w.userId)}
                      className="p-2 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white rounded-lg transition-colors"
                      title="Xem thông tin tài chính"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {w.status === 'PENDING' && (<><button onClick={() => handleAction(w._id, 'APPROVE')} className="p-2 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button><button onClick={() => handleAction(w._id, 'REJECT')} className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button></>)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Hiển thị</span>
            <select 
              value={limit} 
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setLimit(newLimit);
                fetchWithdrawals(1, newLimit);
              }}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-700"
            >
              {[5, 10, 20, 30, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>dòng / trang</span>
          </div>

          {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchWithdrawals(currentPage - 1, limit)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <span className="text-sm text-zinc-400">
              Trang <span className="text-white font-medium">{currentPage}</span> / {totalPages}
            </span>
            <button
              onClick={() => fetchWithdrawals(currentPage + 1, limit)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          )}
        </div>
      </div>

      {/* User Stats Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 rounded-t-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-500" />
                Thông tin tài chính: <span className="text-blue-400">{selectedUser.username}</span>
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-400 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Balances */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="text-sm text-zinc-500 mb-1">Số dư khả dụng</div>
                  <div className="font-bold text-2xl text-green-400">{formatCurrency(selectedUser.wallet_balance || 0)}</div>
                </div>
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="text-sm text-zinc-500 mb-1">Đang chờ xử lý</div>
                  <div className="font-bold text-2xl text-yellow-500">{formatCurrency(selectedUser.pending_balance || 0)}</div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-zinc-400" /> Giao dịch gần đây
                </h4>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                  {loadingStats ? (
                    <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500"/></div>
                  ) : userTransactions.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">Chưa có giao dịch nào</div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-900 text-zinc-500">
                        <tr>
                          <th className="px-4 py-2">Thời gian</th>
                          <th className="px-4 py-2">Loại</th>
                          <th className="px-4 py-2 text-right">Số tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {userTransactions.map((tx: any) => (
                          <tr key={tx._id}>
                            <td className="px-4 py-2 text-zinc-400">{new Date(tx.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td className="px-4 py-2 text-white">{tx.type}</td>
                            <td className={`px-4 py-2 text-right font-bold ${['DEPOSIT', 'PAYMENT_RELEASE', 'REFUND'].includes(tx.type) ? 'text-green-500' : 'text-red-500'}`}>
                              {['DEPOSIT', 'PAYMENT_RELEASE', 'REFUND'].includes(tx.type) ? '+' : ''}{formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}