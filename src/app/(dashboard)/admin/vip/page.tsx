'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Crown,
  Shield,
  Search,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Gift,
  Zap,
  Percent,
  X,
  Edit,
  Trash2,
  User,
  Users,
  Check,
  Loader2,
  Sparkles,
  RefreshCw,
  Sliders,
  DollarSign,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, isPast } from 'date-fns';
import { apiFetch } from '@/lib/api';
import UserSelectDropdown, { AdminUserItem } from '@/components/admin/UserSelectDropdown';

export interface VipBenefit {
  id: string;
  title: string;
  desc: string;
  active: boolean;
}

export interface VipPackageConfig {
  name: string;
  price: number;
  periodLabel: string;
  discountPercent: number;
  active: boolean;
  benefits: VipBenefit[];
}

export interface VipMember {
  id: string;
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  packageType: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  note?: string;
}

const DEFAULT_VIP_CONFIG: VipPackageConfig = {
  name: 'LeoRank VIP Pass',
  price: 199000,
  periodLabel: 'tháng',
  discountPercent: 10,
  active: true,
  benefits: [
    {
      id: 'discount',
      title: 'Giảm 10% Tất Cả Đơn Hàng',
      desc: 'Tự động áp dụng chiết khấu 10% cho mọi dịch vụ LMHT, Valorant, TFT và game khác.',
      active: true,
    },
    {
      id: 'priority',
      title: 'Ưu Tiên Ghép Booster 3 Phút',
      desc: 'Đơn hàng VIP được đưa lên đầu hàng đợi và gán cho Booster Thách Đấu điểm cao nhất.',
      active: true,
    },
    {
      id: 'free_role',
      title: 'Miễn Phí Chọn Tướng & Đường',
      desc: 'Tiết kiệm thêm 30% phụ phí khi yêu cầu booster thi đấu đúng vị trí và tướng yêu thích.',
      active: true,
    },
    {
      id: 'support',
      title: 'Chuyên Viên Hỗ Trợ 1-1',
      desc: 'Hỗ trợ riêng qua Telegram/Zalo VIP, xử lý mọi yêu cầu phát sinh trong vòng 5 phút.',
      active: true,
    },
    {
      id: 'insurance',
      title: 'Bảo Hiểm Tài Khoản 100%',
      desc: 'Cam kết bồi thường 100% giá trị tài khoản nếu xảy ra bất kỳ rủi ro phạt nào do booster.',
      active: true,
    },
    {
      id: 'leopoint',
      title: 'Tích Điểm LeoPoint Đổi Quà',
      desc: 'Nhận x2 điểm thưởng khi hoàn thành đơn để đổi Skin, Battle Pass hoặc thẻ cào.',
      active: true,
    },
  ],
};

const INITIAL_MEMBERS: VipMember[] = [
  {
    id: 'vip-01',
    userId: 'u-faker',
    username: 'faker_god',
    email: 'faker@leorank.site',
    avatar: 'https://ui-avatars.com/api/?name=Faker+God&background=10b981&color=fff',
    packageType: 'LeoRank VIP Pass (3 Tháng)',
    discountPercent: 10,
    startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    note: 'Khách hàng thân thiết VIP Diamond',
  },
  {
    id: 'vip-02',
    userId: 'u-chovy',
    username: 'tranvanchien24022003',
    email: 'tranvanchien24022003@gmail.com',
    avatar: 'https://ui-avatars.com/api/?name=Chien+Tran&background=06b6d4&color=fff',
    packageType: 'LeoRank VIP Pass (1 Tháng)',
    discountPercent: 10,
    startDate: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'EXPIRING_SOON',
    note: 'Đăng ký qua cổng VietQR',
  },
  {
    id: 'vip-03',
    userId: 'u-zeus',
    username: 'zeus_carry',
    email: 'zeus@gmail.com',
    avatar: 'https://ui-avatars.com/api/?name=Zeus+Carry&background=f59e0b&color=fff',
    packageType: 'LeoRank VIP Pass (1 Năm)',
    discountPercent: 15,
    startDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 265 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    note: 'Gói năm khuyến mãi Sinh Nhật',
  },
];

export default function AdminVipManagementPage() {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'CONFIG'>('MEMBERS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data states
  const [vipConfig, setVipConfig] = useState<VipPackageConfig>(DEFAULT_VIP_CONFIG);
  const [members, setMembers] = useState<VipMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');

  // Modal Grant VIP
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [grantDurationDays, setGrantDurationDays] = useState<number>(30);
  const [grantDiscount, setGrantDiscount] = useState<number>(10);
  const [grantNote, setGrantNote] = useState<string>('');

  // Load VIP data from backend settings or localStorage
  useEffect(() => {
    loadVipData();
  }, []);

  const loadVipData = async () => {
    setLoading(true);
    try {
      let loadedConfig = null;
      let loadedMembers = null;

      try {
        const res = await apiFetch<any>('/admin/settings');
        const settingsList = res?.data || res || [];
        if (Array.isArray(settingsList)) {
          const cfgSetting = settingsList.find((s: any) => s.key === 'VIP_CONFIG');
          if (cfgSetting && cfgSetting.value) {
            loadedConfig = typeof cfgSetting.value === 'string' ? JSON.parse(cfgSetting.value) : cfgSetting.value;
          }
          const membersSetting = settingsList.find((s: any) => s.key === 'VIP_MEMBERS_DATA');
          if (membersSetting && membersSetting.value) {
            loadedMembers = typeof membersSetting.value === 'string' ? JSON.parse(membersSetting.value) : membersSetting.value;
          }
        }
      } catch {
        // Fallback
      }

      if (!loadedConfig && typeof window !== 'undefined') {
        const localCfg = localStorage.getItem('leorank_vip_config');
        if (localCfg) loadedConfig = JSON.parse(localCfg);
      }
      if (!loadedMembers && typeof window !== 'undefined') {
        const localMem = localStorage.getItem('leorank_vip_members');
        if (localMem) loadedMembers = JSON.parse(localMem);
      }

      setVipConfig(loadedConfig || DEFAULT_VIP_CONFIG);
      setMembers(loadedMembers || INITIAL_MEMBERS);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu VIP:', err);
      setVipConfig(DEFAULT_VIP_CONFIG);
      setMembers(INITIAL_MEMBERS);
    } finally {
      setLoading(false);
    }
  };

  // Save Config
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('leorank_vip_config', JSON.stringify(vipConfig));
      }
      try {
        await apiFetch('/admin/settings', {
          method: 'POST',
          body: JSON.stringify({
            key: 'VIP_CONFIG',
            value: vipConfig,
            description: 'Cấu hình gói Hội Viên VIP Pass hiển thị trên trang chủ và sàn dịch vụ',
          }),
        });
      } catch {}
      toast.success('Đã lưu cấu hình gói Hội Viên VIP thành công!');
    } catch {
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  // Save Members
  const handleSaveMembers = async (updatedMembers: VipMember[]) => {
    setMembers(updatedMembers);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leorank_vip_members', JSON.stringify(updatedMembers));
    }
    try {
      await apiFetch('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          key: 'VIP_MEMBERS_DATA',
          value: updatedMembers,
          description: 'Danh sách thành viên sở hữu gói Hội Viên VIP',
        }),
      });
    } catch {}
  };

  // Cấp quyền VIP thủ công
  const handleGrantVip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Vui lòng chọn người dùng cần cấp VIP!');
      return;
    }

    const startDate = new Date();
    const endDate = grantDurationDays === -1
      ? new Date(2099, 11, 31) // Vĩnh viễn
      : addDays(startDate, grantDurationDays);

    const newMember: VipMember = {
      id: 'vip-' + Date.now(),
      userId: selectedUser._id,
      username: selectedUser.username,
      email: selectedUser.email,
      avatar: selectedUser.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.username)}&background=10b981&color=fff`,
      packageType: grantDurationDays === -1 ? 'LeoRank VIP Pass (Trọn Đời)' : `LeoRank VIP Pass (${grantDurationDays} Ngày)`,
      discountPercent: grantDiscount,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'ACTIVE',
      note: grantNote.trim() || 'Cấp quyền bởi Staff/Admin',
    };

    // Nếu user đã có trong danh sách thì ghi đè, nếu chưa có thì thêm mới
    const filtered = members.filter((m) => m.userId !== selectedUser._id);
    const updated = [newMember, ...filtered];
    handleSaveMembers(updated);

    toast.success(`Đã cấp quyền Hội Viên VIP thành công cho @${selectedUser.username}!`);
    setIsGrantModalOpen(false);
    setSelectedUser(null);
    setGrantNote('');
  };

  // Gia hạn VIP thêm X ngày
  const handleExtendVip = (memberId: string, daysToAdd: number) => {
    const updated = members.map((m) => {
      if (m.id !== memberId) return m;
      const currentEnd = new Date(m.endDate);
      const baseDate = isPast(currentEnd) ? new Date() : currentEnd;
      const newEnd = addDays(baseDate, daysToAdd);
      return {
        ...m,
        endDate: newEnd.toISOString(),
        status: 'ACTIVE' as const,
      };
    });
    handleSaveMembers(updated);
    toast.success(`Đã gia hạn thêm ${daysToAdd} ngày VIP!`);
  };

  // Hủy quyền VIP
  const handleRevokeVip = (memberId: string) => {
    if (confirm('Bạn có chắc chắn muốn thu hồi quyền VIP của thành viên này?')) {
      const updated = members.filter((m) => m.id !== memberId);
      handleSaveMembers(updated);
      toast.info('Đã thu hồi quyền VIP của người dùng');
    }
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = members.length;
    const now = new Date();
    const active = members.filter((m) => new Date(m.endDate) > now).length;
    const expiringSoon = members.filter((m) => {
      const end = new Date(m.endDate);
      const diffDays = (end.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays > 0 && diffDays <= 7;
    }).length;
    const expired = total - active;
    return { total, active, expiringSoon, expired };
  }, [members]);

  // Danh sách hội viên lọc
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.username.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.note && m.note.toLowerCase().includes(q));

      if (!matchSearch) return false;

      const now = new Date();
      const end = new Date(m.endDate);
      const diffDays = (end.getTime() - now.getTime()) / (1000 * 3600 * 24);

      if (statusFilter === 'ACTIVE' && end <= now) return false;
      if (statusFilter === 'EXPIRING_SOON' && !(diffDays > 0 && diffDays <= 7)) return false;
      if (statusFilter === 'EXPIRED' && end > now) return false;

      return true;
    });
  }, [members, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-zinc-400 text-sm">Đang tải dữ liệu Hội Viên VIP...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm">
              <Crown className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Quản Lý Hội Viên VIP & Đặc Quyền (LeoRank VIP Pass)
            </h1>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Quản trị danh sách thành viên cao cấp, cấp / gia hạn quyền VIP, và tùy chỉnh cấu hình quyền lợi gói LeoRank VIP Pass (199.000 đ/tháng).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsGrantModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:opacity-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cấp Quyền VIP Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-zinc-800/80 shadow-md">
          <p className="text-xs font-medium text-emerald-400 flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" />
            Hội Viên Đang Hoạt Động
          </p>
          <p className="text-2xl font-black text-white mt-1">{stats.active}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-zinc-800/80 shadow-md">
          <p className="text-xs font-medium text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Sắp Hết Hạn (&le; 7 ngày)
          </p>
          <p className="text-2xl font-black text-white mt-1">{stats.expiringSoon}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-zinc-800/80 shadow-md">
          <p className="text-xs font-medium text-cyan-400 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" />
            Chiết Khấu VIP Mặc Định
          </p>
          <p className="text-2xl font-black text-white mt-1">-{vipConfig.discountPercent}%</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-zinc-800/80 shadow-md">
          <p className="text-xs font-medium text-purple-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            Giá Gói Niêm Yết
          </p>
          <p className="text-2xl font-black text-white mt-1 font-mono">
            {vipConfig.price.toLocaleString('vi-VN')} đ
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'MEMBERS'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Users size={16} />
          <span>Danh Sách Hội Viên VIP ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CONFIG')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'CONFIG'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Sliders size={16} />
          <span>Cấu Hình Gói VIP Pass</span>
        </button>
      </div>

      {/* 4. TAB 1: DANH SÁCH HỘI VIÊN VIP */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4">
          {/* Toolbar tìm kiếm & lọc */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0c0e14] border border-zinc-800/80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Tìm hội viên theo username, email, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="EXPIRING_SOON">Sắp hết hạn (&le; 7 ngày)</option>
                <option value="EXPIRED">Đã hết hạn</option>
              </select>
            </div>
          </div>

          {/* Danh sách Hội Viên (Card List) */}
          <div className="space-y-3">
            {filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 bg-[#0c0e14] rounded-2xl border border-zinc-800">
                <Crown className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
                Không tìm thấy hội viên VIP nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredMembers.map((member) => {
                const now = new Date();
                const end = new Date(member.endDate);
                const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
                const isExpired = end <= now;
                const isExpiringSoon = !isExpired && diffDays <= 7;

                return (
                  <div
                    key={member.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#0c0e14] border border-zinc-800/80 hover:border-amber-500/40 transition-all shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative shrink-0">
                        {member.avatar ? (
                          <Image src={member.avatar} alt={member.username} fill unoptimized className="object-cover" />
                        ) : (
                          <User className="w-6 h-6 m-3 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-white text-base">{member.username}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-black text-amber-300">
                            VIP -{member.discountPercent}%
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono">{member.email}</p>
                        {member.note && (
                          <p className="text-[11px] text-zinc-500 italic mt-0.5">{member.note}</p>
                        )}
                      </div>
                    </div>

                    {/* Validity & Time Status */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                      <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block">Gói Sở Hữu</span>
                        <span className="font-bold text-white truncate block">{member.packageType}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block">Ngày Hết Hạn</span>
                        <span className="font-bold text-white block">
                          {end.getFullYear() > 2090 ? 'Vĩnh viễn' : format(end, 'dd/MM/yyyy')}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-zinc-500 block">Thời Gian Còn Lại</span>
                        {isExpired ? (
                          <span className="font-bold text-rose-400 block">Đã hết hạn</span>
                        ) : isExpiringSoon ? (
                          <span className="font-bold text-amber-400 block animate-pulse">
                            Còn {diffDays} ngày
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-400 block">
                            {end.getFullYear() > 2090 ? 'Trọn đời' : `Còn ${diffDays} ngày`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions: Gia Hạn & Thu Hồi */}
                    <div className="flex items-center gap-2 justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
                      <button
                        onClick={() => handleExtendVip(member.id, 30)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition"
                        title="Gia hạn thêm 30 ngày"
                      >
                        +30 Ngày
                      </button>

                      <button
                        onClick={() => handleExtendVip(member.id, 90)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition hidden sm:inline-block"
                        title="Gia hạn thêm 90 ngày"
                      >
                        +90 Ngày
                      </button>

                      <button
                        onClick={() => handleRevokeVip(member.id)}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition"
                        title="Thu hồi quyền VIP"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 2: CẤU HÌNH GÓI VIP PASS */}
      {activeTab === 'CONFIG' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0c0e14] border border-zinc-800/80 shadow-xl space-y-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Sliders className="w-5 h-5 text-amber-400" />
              Cấu Hình Tham Số Gói LeoRank VIP Pass
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Tên Gói VIP Hiển Thị
                </label>
                <input
                  type="text"
                  value={vipConfig.name}
                  onChange={(e) => setVipConfig({ ...vipConfig, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Giá Niêm Yết (VNĐ / Tháng)
                </label>
                <input
                  type="number"
                  step={1000}
                  value={vipConfig.price}
                  onChange={(e) => setVipConfig({ ...vipConfig, price: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-mono font-bold text-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Mức Chiết Khấu Tất Cả Đơn (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={vipConfig.discountPercent}
                  onChange={(e) => setVipConfig({ ...vipConfig, discountPercent: parseInt(e.target.value) || 10 })}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-mono font-bold text-cyan-300"
                />
              </div>
            </div>

            {/* Danh Sách 6 Đặc Quyền */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Gift size={15} className="text-amber-400" />
                  Danh Sách 6 Đặc Quyền Đi Kèm (Hiển thị ngoài Banner Trang Chủ)
                </span>
                <span className="text-[11px] text-zinc-500">Tự động đồng bộ với Landing Page</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {vipConfig.benefits.map((benefit, index) => (
                  <div
                    key={benefit.id}
                    className={`p-3.5 rounded-xl border transition ${
                      benefit.active
                        ? 'bg-zinc-900/80 border-emerald-500/30'
                        : 'bg-zinc-950/40 border-zinc-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <input
                        type="text"
                        value={benefit.title}
                        onChange={(e) => {
                          const newBenefits = [...vipConfig.benefits];
                          newBenefits[index].title = e.target.value;
                          setVipConfig({ ...vipConfig, benefits: newBenefits });
                        }}
                        className="font-bold text-sm text-white bg-transparent border-b border-transparent focus:border-cyan-500 outline-none w-full"
                      />
                      <input
                        type="checkbox"
                        checked={benefit.active}
                        onChange={(e) => {
                          const newBenefits = [...vipConfig.benefits];
                          newBenefits[index].active = e.target.checked;
                          setVipConfig({ ...vipConfig, benefits: newBenefits });
                        }}
                        className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 shrink-0"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={benefit.desc}
                      onChange={(e) => {
                        const newBenefits = [...vipConfig.benefits];
                        newBenefits[index].desc = e.target.value;
                        setVipConfig({ ...vipConfig, benefits: newBenefits });
                      }}
                      className="text-xs text-zinc-400 bg-transparent border-b border-transparent focus:border-cyan-500 outline-none w-full resize-none leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Nút Lưu Cấu Hình */}
            <div className="flex items-center justify-end pt-4 border-t border-zinc-800">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:opacity-95 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5]" />}
                <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi Cấu Hình'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL CẤP QUYỀN VIP CHO NGƯỜI DÙNG */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0c0e14] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Cấp Quyền Hội Viên VIP Cho Người Dùng
              </h2>
              <button onClick={() => setIsGrantModalOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGrantVip} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Chọn Người Dùng <span className="text-rose-500">*</span>
                </label>
                <UserSelectDropdown
                  selectedUser={selectedUser}
                  onSelect={(u) => setSelectedUser(u)}
                  placeholder="Gõ tìm theo username hoặc email khách hàng..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Thời Hạn Cấp Quyền
                  </label>
                  <select
                    value={grantDurationDays}
                    onChange={(e) => setGrantDurationDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value={30}>1 Tháng (30 Ngày)</option>
                    <option value={90}>3 Tháng (90 Ngày)</option>
                    <option value={180}>6 Tháng (180 Ngày)</option>
                    <option value={365}>1 Năm (365 Ngày)</option>
                    <option value={-1}>Trọn Đời (Vĩnh Viễn)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Chiết Khấu Đơn (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={grantDiscount}
                    onChange={(e) => setGrantDiscount(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-bold text-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Ghi Chú Lý Do Cấp VIP
                </label>
                <input
                  type="text"
                  value={grantNote}
                  onChange={(e) => setGrantNote(e.target.value)}
                  placeholder="e.g. Khách hàng thân thiết, thanh toán chuyển khoản VIP..."
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-extrabold text-xs shadow-md hover:opacity-95"
                >
                  Xác Nhận Cấp VIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
