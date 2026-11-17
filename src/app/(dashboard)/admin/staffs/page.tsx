'use client';

import { useState, useEffect } from 'react';
import {
  UserCheck,
  Shield,
  Search,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  Users,
  ShieldAlert,
  ClipboardList,
  AlertTriangle,
  DollarSign,
  Wallet,
  CreditCard,
  Newspaper,
  ListTodo,
  Settings,
  CheckCircle2,
  Gamepad2,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import UserSelectDropdown, { AdminUserItem } from '@/components/admin/UserSelectDropdown';

// 10 Quyền hạn chuẩn của hệ thống Back Office
const ALL_STAFF_PERMISSIONS = [
  {
    key: 'users',
    label: 'Quản lý Khách hàng',
    desc: 'Xem danh sách khách hàng, lịch sử và trạng thái tài khoản',
    icon: Users,
    color: 'text-blue-400',
  },
  {
    key: 'boosters',
    label: 'Quản lý Tuyển thủ',
    desc: 'Duyệt đơn đăng ký, xem và quản lý hồ sơ booster',
    icon: ShieldAlert,
    color: 'text-emerald-400',
  },
  {
    key: 'orders',
    label: 'Quản lý Đơn hàng',
    desc: 'Theo dõi tiến độ, chi tiết đơn cày thuê',
    icon: ClipboardList,
    color: 'text-purple-400',
  },
  {
    key: 'disputes',
    label: 'Xử lý Tranh chấp',
    desc: 'Giải quyết khiếu nại và phán quyết hoàn tiền',
    icon: AlertTriangle,
    color: 'text-amber-400',
  },
  {
    key: 'deposits',
    label: 'Quản lý Tiền cọc',
    desc: 'Kiểm tra và xác nhận nạp tiền cọc của booster',
    icon: DollarSign,
    color: 'text-green-400',
  },
  {
    key: 'withdrawals',
    label: 'Quản lý Rút tiền',
    desc: 'Duyệt và xử lý lệnh rút tiền về ngân hàng',
    icon: Wallet,
    color: 'text-cyan-400',
  },
  {
    key: 'transactions',
    label: 'Lịch sử Giao dịch',
    desc: 'Tra cứu biến động số dư và dòng tiền hệ thống',
    icon: CreditCard,
    color: 'text-indigo-400',
  },
  {
    key: 'blogs',
    label: 'Tin tức & Bài viết',
    desc: 'Quản lý nội dung bài viết và cẩm nang người chơi',
    icon: Newspaper,
    color: 'text-pink-400',
  },
  {
    key: 'cron',
    label: 'Tác vụ Tự động (Cron)',
    desc: 'Giám sát và kích hoạt các cronjob định kỳ',
    icon: ListTodo,
    color: 'text-orange-400',
  },
  {
    key: 'games',
    label: 'Cấu hình Tựa Game',
    desc: 'Quản lý danh mục game, bật/tắt hiển thị, gắn nhãn HOT/Mới và banner URL',
    icon: Gamepad2,
    color: 'text-cyan-400',
  },
  {
    key: 'vip',
    label: 'Hội Viên VIP (VIP Pass)',
    desc: 'Quản lý danh sách hội viên VIP, cấp quyền và cấu hình gói LeoRank VIP Pass',
    icon: Crown,
    color: 'text-amber-400',
  },
  {
    key: 'settings',
    label: 'Cài đặt Hệ thống',
    desc: 'Cấu hình tham số, hotline và phí hoa hồng sàn',
    icon: Settings,
    color: 'text-yellow-400',
  },
];

interface StaffMember {
  _id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'BOOSTER';
  staff_permissions?: string[];
  createdAt: string;
  isBanned?: boolean;
}

export default function AdminStaffsPage() {
  const [staffs, setStaffs] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [revokingStaff, setRevokingStaff] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states cho thêm nhân viên mới
  const [addMode, setAddMode] = useState<'existing' | 'new'>('existing');
  const [selectedTargetUser, setSelectedTargetUser] = useState<AdminUserItem | null>(null);
  const [targetUserId, setTargetUserId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPerms, setNewPerms] = useState<string[]>([
    'users',
    'disputes',
    'deposits',
    'cron',
    'settings',
    'blogs',
  ]);

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadStaffs = () => {
    setLoading(true);
    fetch(`/api/admin/staffs?search=${encodeURIComponent(debouncedSearch)}`, {
      headers: getHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStaffs(data.staffs || []);
        } else {
          toast.error(data.message || 'Lỗi khi tải danh sách nhân viên');
        }
      })
      .catch(() => toast.error('Không thể kết nối máy chủ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStaffs();
  }, [debouncedSearch]);

  const handleOpenEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setSelectedPerms(
      Array.isArray(staff.staff_permissions) && staff.staff_permissions.length > 0
        ? staff.staff_permissions
        : ['users', 'disputes', 'deposits', 'cron', 'settings', 'blogs'],
    );
  };

  const handleSavePermissions = async () => {
    if (!editingStaff) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staffs/${editingStaff._id}/permissions`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ permissions: selectedPerms }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Đã cập nhật quyền hạn cho ${editingStaff.username}`);
        setEditingStaff(null);
        loadStaffs();
      } else {
        toast.error(data.message || 'Lỗi khi cập nhật quyền hạn');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStaff = async () => {
    if (addMode === 'existing' && !targetUserId) {
      toast.error('Vui lòng chọn người dùng từ danh sách');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload =
        addMode === 'existing'
          ? {
              userId: targetUserId.trim(),
              permissions: newPerms,
            }
          : {
              username: newUsername.trim(),
              email: newEmail.trim(),
              password: newPassword,
              permissions: newPerms,
            };

      const res = await fetch('/api/admin/staffs', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Phân quyền Nhân viên thành công');
        setShowAddModal(false);
        setSelectedTargetUser(null);
        setTargetUserId('');
        setNewUsername('');
        setNewEmail('');
        setNewPassword('');
        loadStaffs();
      } else {
        toast.error(data.message || 'Thao tác không thành công');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokingStaff) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staffs/${revokingStaff._id}/remove`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Đã thu hồi quyền nhân viên của ${revokingStaff.username}`);
        setRevokingStaff(null);
        loadStaffs();
      } else {
        toast.error(data.message || 'Lỗi khi thu hồi quyền');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePerm = (permKey: string) => {
    setSelectedPerms((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey],
    );
  };

  const toggleNewPerm = (permKey: string) => {
    setNewPerms((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey],
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="text-blue-500 w-7 h-7" /> Quản lý Nhân Viên & Phân Quyền
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Chỉ định nhân viên vận hành và phân quyền truy cập theo từng phân hệ Back Office.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all shrink-0 justify-center"
        >
          <Plus className="w-4 h-4" /> Thêm Nhân Viên Mới
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên theo username, email..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-zinc-400">Đang tải danh sách nhân viên...</p>
          </div>
        ) : staffs.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            Không tìm thấy nhân viên nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-xs font-bold border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Tài khoản Nhân viên</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4">Quyền hạn Back Office</th>
                  <th className="px-6 py-4">Ngày bổ nhiệm</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {staffs.map((staff) => {
                  const isAdmin = staff.role === 'ADMIN';
                  const perms = isAdmin
                    ? ALL_STAFF_PERMISSIONS.map((p) => p.key)
                    : staff.staff_permissions || [];

                  return (
                    <tr key={staff._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {staff.username}
                            {isAdmin && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                ROOT ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 font-mono">{staff.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            <Shield className="w-3.5 h-3.5" /> Quản Trị Viên
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <UserCheck className="w-3.5 h-3.5" /> Nhân Viên Vận Hành
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isAdmin ? (
                          <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-yellow-500" /> Toàn quyền hệ thống ({ALL_STAFF_PERMISSIONS.length}/{ALL_STAFF_PERMISSIONS.length} phân hệ)
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-300">
                                {perms.length} / {ALL_STAFF_PERMISSIONS.length} phân hệ
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {perms.map((pKey) => {
                                const permMeta = ALL_STAFF_PERMISSIONS.find((x) => x.key === pKey);
                                return (
                                  <span
                                    key={pKey}
                                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700"
                                  >
                                    {permMeta?.label || pKey}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-xs font-mono">
                        {staff.createdAt ? format(new Date(staff.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isAdmin ? (
                          <span className="text-xs text-zinc-500 italic">Mặc định</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(staff)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-blue-600/20 text-zinc-300 hover:text-blue-400 border border-zinc-700 text-xs font-semibold transition-colors"
                            >
                              <Edit size={13} /> Phân quyền
                            </button>
                            <button
                              onClick={() => setRevokingStaff(staff)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 transition-colors"
                              title="Thu hồi quyền nhân viên"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL 1: THÊM NHÂN VIÊN MỚI --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="text-blue-500 w-5 h-5" /> Bổ Nhiệm / Tạo Tài Khoản Nhân Viên
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800 text-sm">
              <button
                type="button"
                onClick={() => setAddMode('existing')}
                className={`py-2 rounded-md font-medium transition-all ${
                  addMode === 'existing' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Gán quyền User có sẵn
              </button>
              <button
                type="button"
                onClick={() => setAddMode('new')}
                className={`py-2 rounded-md font-medium transition-all ${
                  addMode === 'new' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tạo tài khoản Nhân viên mới
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {addMode === 'existing' ? (
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase">
                    Chọn người dùng từ hệ thống *
                  </label>
                  <UserSelectDropdown
                    selectedUser={selectedTargetUser}
                    onSelect={(u) => {
                      setSelectedTargetUser(u);
                      setTargetUserId(u ? u._id : '');
                    }}
                    excludeRoles={['ADMIN']}
                    placeholder="Tìm theo tên đăng nhập hoặc email người dùng..."
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Chọn trực tiếp từ dữ liệu người dùng để nâng cấp thành Nhân viên (STAFF) mà không cần nhập ID thủ công.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                        Tên đăng nhập *
                      </label>
                      <input
                        type="text"
                        placeholder="staff_leorank"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                        Mật khẩu *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                      Địa chỉ Email *
                    </label>
                    <input
                      type="email"
                      placeholder="staff@leorank.site"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 outline-none"
                    />
                  </div>
                </>
              )}

              {/* Matrix Checkbox Phân quyền */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                    Tích chọn chức năng cho phép truy cập ({newPerms.length}/
                    {ALL_STAFF_PERMISSIONS.length})
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setNewPerms(ALL_STAFF_PERMISSIONS.map((p) => p.key))}
                      className="text-blue-400 hover:underline font-medium"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-zinc-600">|</span>
                    <button
                      type="button"
                      onClick={() => setNewPerms([])}
                      className="text-zinc-400 hover:underline font-medium"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  {ALL_STAFF_PERMISSIONS.map((perm) => {
                    const checked = newPerms.includes(perm.key);
                    const IconComp = perm.icon;
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                          checked
                            ? 'bg-blue-600/10 border-blue-500/40 text-white'
                            : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleNewPerm(perm.key)}
                          className="mt-0.5 w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-blue-600 focus:ring-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                            <IconComp className={`w-3.5 h-3.5 ${perm.color}`} />
                            {perm.label}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{perm.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white font-medium hover:bg-zinc-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleAddStaff}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận bổ nhiệm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CHỈNH SỬA PHÂN QUYỀN NHÂN VIÊN --- */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit className="text-blue-500 w-5 h-5" /> Phân Quyền Vận Hành
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tài khoản: <strong className="text-white">{editingStaff.username}</strong> ({editingStaff.email})
                </p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Checkbox Matrix 10 Quyền */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Chức năng được phép truy cập ({selectedPerms.length}/{ALL_STAFF_PERMISSIONS.length})
                </span>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedPerms(ALL_STAFF_PERMISSIONS.map((p) => p.key))}
                    className="text-blue-400 hover:underline font-medium"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPerms([])}
                    className="text-zinc-400 hover:underline font-medium"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                {ALL_STAFF_PERMISSIONS.map((perm) => {
                  const checked = selectedPerms.includes(perm.key);
                  const IconComp = perm.icon;
                  return (
                    <label
                      key={perm.key}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                        checked
                          ? 'bg-blue-600/10 border-blue-500/40 text-white'
                          : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePerm(perm.key)}
                        className="mt-0.5 w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-blue-600 focus:ring-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                          <IconComp className={`w-3.5 h-3.5 ${perm.color}`} />
                          {perm.label}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{perm.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white font-medium hover:bg-zinc-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSavePermissions}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu phân quyền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: XÁC NHẬN THU HỒI QUYỀN NHÂN VIÊN --- */}
      {revokingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 border-b border-zinc-800 pb-3">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Thu hồi quyền Nhân viên</h3>
            </div>
            <p className="text-sm text-zinc-300">
              Bạn có chắc chắn muốn thu hồi toàn bộ quyền Back Office của nhân viên{' '}
              <strong className="text-white">{revokingStaff.username}</strong>?
            </p>
            <p className="text-xs text-zinc-400">
              Tài khoản này sẽ được chuyển về vai trò Khách hàng (CUSTOMER) và mất toàn quyền truy cập khu vực quản trị.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setRevokingStaff(null)}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white font-medium hover:bg-zinc-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRevokeConfirm}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận thu hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
