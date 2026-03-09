'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, Users, MoreHorizontal, Mail, Calendar, Wallet, ShoppingBag, ChevronLeft, ChevronRight, Ban, CheckCircle, X, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface User {
  _id: string;
  username: string;
  email: string;
  profile?: { avatar?: string };
  wallet_balance: number;
  createdAt: string;
  isBanned?: boolean;
  stats: {
    totalOrders: number;
    completedOrders: number;
    totalSpent: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: debouncedSearch,
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error('Lỗi tải danh sách người dùng');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch]);

  const handleAdjustBalance = async (type: 'ADD' | 'SUBTRACT') => {
    if (!selectedUser || !adjustAmount) return;
    if (!confirm(`Bạn có chắc muốn ${type === 'ADD' ? 'cộng' : 'trừ'} ${parseInt(adjustAmount).toLocaleString()}đ cho user này?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(adjustAmount), type, reason: adjustReason }),
      });
      
      if (res.ok) {
        toast.success('Cập nhật số dư thành công');
        setAdjustAmount('');
        setAdjustReason('');
        fetchUsers();
        setSelectedUser(null);
      } else {
        toast.error('Lỗi cập nhật số dư');
      }
    } catch (e) { toast.error('Lỗi kết nối'); }
  };

  const handleToggleBan = async () => {
    if (!selectedUser) return;
    if (!confirm(`Xác nhận ${selectedUser.isBanned ? 'MỞ KHÓA' : 'KHÓA'} tài khoản này?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}/ban`, { method: 'POST' });
      if (res.ok) {
        toast.success(selectedUser.isBanned ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
        fetchUsers();
        setSelectedUser(null);
      } else {
        toast.error('Thao tác thất bại');
      }
    } catch (e) { toast.error('Lỗi kết nối'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-500" /> Quản lý Khách hàng
          </h1>
          <p className="text-zinc-400 text-sm">Danh sách người dùng và thống kê chi tiêu.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, email..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Ví tiền</th>
                <th className="px-6 py-4">Thống kê đơn</th>
                <th className="px-6 py-4">Tổng chi tiêu</th>
                <th className="px-6 py-4">Ngày tham gia</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-full"></div></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-zinc-500">Không tìm thấy khách hàng nào.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative shrink-0">
                          {user.profile?.avatar ? (
                            <Image src={user.profile.avatar} alt={user.username} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500"><Users size={20} /></div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white">{user.username}</div>
                          <div className="text-xs text-zinc-500 flex items-center gap-1">
                            <Mail size={10} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
                        <Wallet size={14} />
                        {user.wallet_balance.toLocaleString()} đ
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-zinc-300">
                        <span className="text-white font-bold">{user.stats.completedOrders}</span> / {user.stats.totalOrders} đơn
                      </div>
                      <div className="w-24 h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${user.stats.totalOrders > 0 ? (user.stats.completedOrders / user.stats.totalOrders) * 100 : 0}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-mono text-yellow-500 font-bold">
                        <ShoppingBag size={14} />
                        {user.stats.totalSpent.toLocaleString()} đ
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedUser(user)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 p-4 border-t border-zinc-800 bg-zinc-900/50">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <span className="text-sm text-zinc-400">Trang <span className="text-white font-medium">{page}</span> / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden relative">
                  {selectedUser.profile?.avatar ? (
                    <Image src={selectedUser.profile.avatar} alt={selectedUser.username} fill className="object-cover" />
                  ) : <Users className="w-8 h-8 text-zinc-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedUser.username}
                    {selectedUser.isBanned && <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20">BANNED</span>}
                  </h3>
                  <p className="text-zinc-400 text-sm">{selectedUser.email}</p>
                  <p className="text-zinc-500 text-xs mt-1">ID: {selectedUser._id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              {/* Wallet Adjustment */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
                  <Wallet size={16} /> Điều chỉnh số dư
                </h4>
                <div className="text-2xl font-mono font-bold text-white mb-4">
                  {selectedUser.wallet_balance.toLocaleString()} đ
                </div>
                <div className="space-y-3">
                  <input 
                    type="number" 
                    placeholder="Nhập số tiền..." 
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Lý do (VD: Hoàn tiền, Thưởng...)" 
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleAdjustBalance('ADD')} className="flex-1 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1"><Plus size={14}/> Cộng tiền</button>
                    <button onClick={() => handleAdjustBalance('SUBTRACT')} className="flex-1 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1"><Minus size={14}/> Trừ tiền</button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-zinc-800">
                <button 
                  onClick={handleToggleBan}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${selectedUser.isBanned ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-600 text-white hover:bg-red-500'}`}
                >
                  {selectedUser.isBanned ? <><CheckCircle size={18} /> Mở khóa tài khoản</> : <><Ban size={18} /> Khóa tài khoản (Ban)</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}