'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  Users,
  MoreHorizontal,
  Mail,
  Calendar,
  Wallet,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle,
  X,
  Plus,
  Minus,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Info,
} from 'lucide-react';
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
  banned_until?: string | null;
  ban_reason?: string | null;
  banned_at?: string | null;
  stats: {
    totalOrders: number;
    completedOrders: number;
    totalSpent: number;
  };
}

const QUICK_BAN_REASONS = [
  'Gian lận sai lệch Rank',
  'Vu khống / Báo cáo sai sự thật đối soát',
  'Nợ cước / Cố tình không bù tiền thiếu',
  'Phá hoại tiến trình đơn hàng',
  'Ngôn từ xúc phạm / Độc hại',
  'Spam / Tạo tài khoản rác',
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal Detail & Wallet
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Modal Khóa / Mở khóa tài khoản chuyên nghiệp
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [banDurationMode, setBanDurationMode] = useState<'24h' | '3d' | '7d' | '30d' | 'permanent' | 'custom'>('7d');
  const [customBanDate, setCustomBanDate] = useState('');
  const [banReason, setBanReason] = useState('Gian lận sai lệch Rank');
  const [banSubmitting, setBanSubmitting] = useState(false);

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

  // Mở modal khóa tài khoản
  const handleOpenBanModal = (user: User) => {
    setSelectedUser(user);
    setBanDurationMode('7d');
    setBanReason('Gian lận sai lệch Rank');
    // Mặc định ngày mai nếu chọn custom
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const hh = String(tomorrow.getHours()).padStart(2, '0');
    const min = String(tomorrow.getMinutes()).padStart(2, '0');
    setCustomBanDate(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
    setShowBanModal(true);
  };

  // Thực hiện khóa tài khoản
  const handleExecuteBan = async () => {
    if (!selectedUser) return;

    let durationHours: number | undefined;
    let bannedUntil: string | undefined;

    if (banDurationMode === '24h') durationHours = 24;
    else if (banDurationMode === '3d') durationHours = 72;
    else if (banDurationMode === '7d') durationHours = 168;
    else if (banDurationMode === '30d') durationHours = 720;
    else if (banDurationMode === 'permanent') {
      durationHours = 0;
      bannedUntil = undefined;
    } else if (banDurationMode === 'custom') {
      if (!customBanDate) {
        toast.error('Vui lòng chọn ngày, tháng, năm gỡ ban');
        return;
      }
      const selectedTime = new Date(customBanDate).getTime();
      if (selectedTime <= Date.now()) {
        toast.error('Thời điểm gỡ ban phải lớn hơn thời điểm hiện tại');
        return;
      }
      bannedUntil = new Date(customBanDate).toISOString();
    }

    setBanSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}/ban`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBanned: true,
          durationHours,
          bannedUntil,
          reason: banReason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Đã khóa tài khoản thành công');
        setShowBanModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.message || 'Khóa tài khoản thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi khóa tài khoản');
    } finally {
      setBanSubmitting(false);
    }
  };

  // Thực hiện mở khóa tài khoản
  const handleExecuteUnban = async () => {
    if (!selectedUser) return;
    setBanSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}/ban`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: false }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Đã mở khóa tài khoản thành công');
        setShowUnbanModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.message || 'Mở khóa thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi mở khóa tài khoản');
    } finally {
      setBanSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-500" /> Quản lý Khách hàng
          </h1>
          <p className="text-zinc-400 text-sm">Danh sách người dùng, ví tiền và cơ chế xử lý kỷ luật.</p>
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
                <th className="px-6 py-4">Trạng thái</th>
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
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-4 bg-zinc-800 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative shrink-0">
                          {user.profile?.avatar ? (
                            <Image src={user.profile.avatar} alt={user.username} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                              <Users size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{user.username}</span>
                          </div>
                          <div className="text-xs text-zinc-500 flex items-center gap-1">
                            <Mail size={10} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột Trạng thái Ban */}
                    <td className="px-6 py-4">
                      {user.isBanned ? (
                        <div className="inline-flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <Ban size={11} />
                            <span>{user.banned_until ? 'Khóa có thời hạn' : 'Khóa vĩnh viễn'}</span>
                          </span>
                          {user.banned_until && (
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Hết hạn: {format(new Date(user.banned_until), 'HH:mm dd/MM/yy')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle size={11} />
                          <span>Hoạt động</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
                        <Wallet size={14} />
                        {(user.wallet_balance || 0).toLocaleString()} đ
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-zinc-300">
                        <span className="text-white font-bold">{user.stats?.completedOrders || 0}</span> / {user.stats?.totalOrders || 0} đơn
                      </div>
                      <div className="w-24 h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(user.stats?.totalOrders || 0) > 0 ? ((user.stats?.completedOrders || 0) / user.stats.totalOrders) * 100 : 0}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-mono text-yellow-500 font-bold">
                        <ShoppingBag size={14} />
                        {(user.stats?.totalSpent || 0).toLocaleString()} đ
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Tùy chọn quản lý"
                      >
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

      {/* User Detail & Wallet Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden relative">
                  {selectedUser.profile?.avatar ? (
                    <Image src={selectedUser.profile.avatar} alt={selectedUser.username} fill className="object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-zinc-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedUser.username}
                    {selectedUser.isBanned && (
                      <span className="text-xs bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full border border-red-500/30 font-bold">
                        BANNED
                      </span>
                    )}
                  </h3>
                  <p className="text-zinc-400 text-sm">{selectedUser.email}</p>
                  <p className="text-zinc-500 text-xs mt-0.5 font-mono">ID: {selectedUser._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Thông tin tình trạng kỷ luật nếu đang bị ban */}
            {selectedUser.isBanned && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <ShieldAlert size={15} />
                  <span>Tài khoản hiện đang bị đình chỉ:</span>
                </div>
                <div className="text-zinc-300">
                  • <strong>Thời hạn:</strong>{' '}
                  {selectedUser.banned_until ? (
                    <span className="text-amber-300 font-mono">
                      Khóa đến {format(new Date(selectedUser.banned_until), 'HH:mm dd/MM/yyyy')}
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold">Khóa vĩnh viễn</span>
                  )}
                </div>
                {selectedUser.ban_reason && (
                  <div className="text-zinc-400">
                    • <strong>Lý do:</strong> <em>"{selectedUser.ban_reason}"</em>
                  </div>
                )}
              </div>
            )}

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
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Lý do (VD: Hoàn tiền, Thưởng...)"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAdjustBalance('ADD')}
                      className="flex-1 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Cộng tiền
                    </button>
                    <button
                      onClick={() => handleAdjustBalance('SUBTRACT')}
                      className="flex-1 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Minus size={14} /> Trừ tiền
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions: Nút Khóa hoặc Mở khóa chuyên nghiệp */}
              <div className="pt-4 border-t border-zinc-800">
                {selectedUser.isBanned ? (
                  <button
                    onClick={() => setShowUnbanModal(true)}
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 shadow-lg shadow-emerald-950/20 cursor-pointer"
                  >
                    <CheckCircle size={18} /> Mở khóa tài khoản
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenBanModal(selectedUser)}
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/30 cursor-pointer active:scale-98"
                  >
                    <Ban size={18} /> Khóa tài khoản (Ban)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL NÂNG CẤP: KHÓA TÀI KHOẢN (BAN) ĐẦY ĐỦ THỜI HẠN & LÝ DO              */}
      {/* ========================================================================= */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-rose-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Xử Lý Kỷ Luật: Khóa Tài Khoản</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Đình chỉ quyền truy cập của <strong className="text-white">@{selectedUser.username}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBanModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* 1. Chọn Mốc Thời Gian Khóa */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Clock size={13} className="text-rose-400" />
                <span>1. Chọn Thời Hạn Khóa Tài Khoản:</span>
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { id: '24h', label: '24 Giờ' },
                  { id: '3d', label: '3 Ngày' },
                  { id: '7d', label: '7 Ngày' },
                  { id: '30d', label: '30 Ngày' },
                  { id: 'permanent', label: 'Vĩnh viễn' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBanDurationMode(item.id as any)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      banDurationMode === item.id
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500/40 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Tùy chọn 6: Chọn Ngày, tháng, năm cụ thể */}
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => setBanDurationMode('custom')}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-between transition-all cursor-pointer ${
                    banDurationMode === 'custom'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500/40'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Calendar size={14} className="text-rose-400" />
                    <span>Tùy chọn Ngày, Tháng, Năm gỡ ban cụ thể</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40">Custom</span>
                </button>

                {banDurationMode === 'custom' && (
                  <div className="mt-2.5 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 animate-in fade-in">
                    <label className="text-[11px] text-zinc-400 font-medium block">
                      Chọn thời điểm tự động gỡ ban:
                    </label>
                    <input
                      type="datetime-local"
                      value={customBanDate}
                      onChange={(e) => setCustomBanDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Chọn hoặc Nhập Lý Do Khóa */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Info size={13} className="text-rose-400" />
                <span>2. Lý Do Khóa Tài Khoản:</span>
              </label>

              {/* Quick chips */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_BAN_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setBanReason(reason)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      banReason === reason
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Nhập chi tiết lý do kỷ luật..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-rose-500 resize-none leading-relaxed"
              />
            </div>

            {/* Cảnh báo chính sách */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
              • Tài khoản bị khóa sẽ không thể đăng nhập hoặc nhận/tạo đơn hàng.
              <br />• Nếu có thời hạn, hệ thống sẽ <strong>tự động mở khóa</strong> khi hết giờ mà không cần Admin thao tác lại.
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                type="button"
                disabled={banSubmitting}
                onClick={() => setShowBanModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={banSubmitting}
                onClick={handleExecuteBan}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {banSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban size={14} />}
                <span>Xác nhận Khóa tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL MỞ KHÓA TÀI KHOẢN (UNBAN CONFIRMATION)                              */}
      {/* ========================================================================= */}
      {showUnbanModal && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-emerald-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác Nhận Mở Khóa Tài Khoản?</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Khôi phục quyền truy cập đầy đủ cho <strong className="text-white">@{selectedUser.username}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              Sau khi mở khóa, người dùng có thể đăng nhập bình thường, nạp/rút ví và tiếp tục sử dụng các dịch vụ cày thuê.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                type="button"
                disabled={banSubmitting}
                onClick={() => setShowUnbanModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={banSubmitting}
                onClick={handleExecuteUnban}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {banSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle size={14} />}
                <span>Xác nhận Mở khóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}