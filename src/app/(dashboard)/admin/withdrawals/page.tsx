'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, Settings, ChevronLeft, ChevronRight, Eye, Wallet, History, AlertTriangle, TrendingUp, ArrowDownLeft } from 'lucide-react';

interface Withdrawal {
  _id: string;
  userId: { 
    _id: string;
    username: string; 
    email: string;
    role: string;
    wallet_balance: number;
    pending_balance: number;
    createdAt: string;
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
  const [userStats, setUserStats] = useState<any>(null); // Thêm state cho thống kê user
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

  const handleViewUserStats = async (user: any, withdrawalAmount: number) => {
    setSelectedUser(user);
    setLoadingStats(true);
    try {
        // Gọi song song 2 API: Lấy thống kê giao dịch & Lấy thông tin User chi tiết (để fix lỗi thiếu ngày tham gia/số dư)
        const [resStats, resUser] = await Promise.all([
            fetch(`/api/admin/users/${user._id}/stats`),
            fetch(`/api/admin/users/${user._id}`) 
        ]);

        const dataStats = await resStats.json();

        if (resStats.ok) {
            setUserStats(dataStats.stats);
            setUserTransactions(dataStats.recentTransactions);
        } else {
            toast.error(dataStats.error || 'Lỗi tải thống kê user');
            setUserStats(null);
        }

        // Cập nhật selectedUser với thông tin đầy đủ nhất từ server (có createdAt, wallet_balance)
        if (resUser.ok) {
            const dataUser = await resUser.json();
            if (dataUser.user) {
                // Merge dữ liệu cũ và mới để đảm bảo không bị mất các field
                setSelectedUser((prev: any) => ({ ...prev, ...dataUser.user }));
            } else {
                console.warn('API User details returned empty user object');
            }
        }
    } catch (e) {
        toast.error('Lỗi tải dữ liệu chi tiết');
    } finally {
        setLoadingStats(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Yêu cầu Rút tiền</h1>
          <p className="text-zinc-400 text-sm">Duyệt và xử lý các khoản thanh toán cho Booster/User</p>
        </div>
        <div className="flex flex-wrap gap-3">
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
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
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
                      onClick={() => handleViewUserStats(w.userId, w.amount)}
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
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden">
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500"/></div>
            ) : withdrawals.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">Không có yêu cầu nào</div>
            ) : (
              withdrawals.map((w) => (
                <div key={w._id} className="p-4 border-b border-zinc-800 last:border-0 space-y-3 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                        <div className="font-bold text-white text-sm">
                        {w.userId?.username} <span className="text-zinc-500 font-normal text-xs">- {w.userId?.role}</span>
                        </div>
                        <div className="text-xs text-zinc-500">{new Date(w.createdAt).toLocaleString('vi-VN')}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${w.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : w.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{w.status}</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-zinc-500">Ngân hàng:</span> <span className="text-white font-medium">{w.bankInfo.bankName}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Số TK:</span> <span className="text-white font-mono">{w.bankInfo.accountNumber}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Chủ TK:</span> <span className="text-white uppercase">{w.bankInfo.accountHolder}</span></div>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-lg">
                    <div className="text-xs text-zinc-500">
                        <div>Gốc: {formatCurrency(w.amount)}</div>
                        <div>Phí: {formatCurrency(w.fee)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-zinc-400">Thực nhận</div>
                        <div className="font-bold text-green-400 text-base">{formatCurrency(w.netAmount)}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => handleViewUserStats(w.userId, w.amount)}
                      className="flex-1 py-2 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-medium"
                    >
                      <Eye className="w-3 h-3" /> Chi tiết
                    </button>
                    {w.status === 'PENDING' && (
                        <>
                            <button onClick={() => handleAction(w._id, 'APPROVE')} className="flex-1 py-2 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-medium"><CheckCircle2 className="w-3 h-3" /> Duyệt</button>
                            <button onClick={() => handleAction(w._id, 'REJECT')} className="flex-1 py-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-medium"><XCircle className="w-3 h-3" /> Từ chối</button>
                        </>
                    )}
                  </div>
                </div>
              ))
            )}
        </div>

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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 rounded-t-2xl">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-lg font-bold text-white">
                  <Wallet className="w-5 h-5 text-blue-500" />
                  Kiểm tra nguồn tiền (Audit)
                </div>

                <div className="text-zinc-400 text-sm flex items-center gap-2">
                  User: <span className="text-white font-bold">{selectedUser.username}</span>
                </div>
                <span className="text-blue-400 text-sm">
                  Vai trò: {selectedUser.role} 
                </span>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-400 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Risk Analysis */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" /> Phân tích rủi ro
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 block mb-1">Ngày tham gia</span>
                          <span className="text-white font-medium">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
                      </div>
                      <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 block mb-1">Tổng số dư hiện tại</span>
                          <span className="text-emerald-400 font-bold font-mono">{formatCurrency(selectedUser.wallet_balance)}</span>
                      </div>
                      <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 block mb-1">Đang chờ xử lý</span>
                          <span className="text-yellow-500 font-bold font-mono">{formatCurrency(selectedUser.pending_balance)}</span>
                      </div>
                  </div>
              </div>

              {/* Balances */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-900/10 rounded-xl border border-blue-500/20">
                  <div className="text-sm text-blue-400 mb-1 font-bold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Nguồn thu (Credit)
                  </div>
                  <div className="text-xs text-zinc-400 mt-2 space-y-1">
                      <p className="flex justify-between">
                        <span>• Nạp tiền:</span> 
                        <span className="text-white font-mono">{userStats ? formatCurrency(userStats.totalDeposit) : '...'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>• Hoàn thành đơn:</span> 
                        <span className="text-white font-mono">{userStats ? formatCurrency(userStats.totalEarned) : '...'}</span>
                      </p>
                  </div>
                </div>
                <div className="p-4 bg-red-900/10 rounded-xl border border-red-500/20">
                  <div className="text-sm text-red-400 mb-1 font-bold flex items-center gap-2">
                      <ArrowDownLeft className="w-4 h-4" /> Đã chi (Debit)
                  </div>
                  <div className="text-xs text-zinc-400 mt-2 space-y-1">
                      <p className="flex justify-between">
                        <span>• Rút tiền:</span> <span className="text-white font-mono">{userStats ? formatCurrency(userStats.totalWithdrawal) : '...'}</span>
                      </p>
                      <p className="flex justify-between"><span>• Thuê Booster:</span> <span className="text-white font-mono">{userStats ? formatCurrency(userStats.totalSpent) : '...'}</span></p>
                  </div>
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
                            <td className="px-4 py-3 text-zinc-400">{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                            <td className="px-4 py-3">
                                <div className="text-white font-medium text-xs">{tx.metadata?.description || tx.description || tx.type}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">{tx.type}</div>
                            </td>
                            {/* SỬA LỖI HIỂN THỊ +- : Dùng logic check amount > 0 */}
                            <td className="px-4 py-3 text-right">
                                <span className={`font-bold font-mono ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                </span>
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