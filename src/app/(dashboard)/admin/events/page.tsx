'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Calendar, DollarSign, Trophy, Percent, Gift, Flame, 
  CheckCircle2, Clock, X, Edit, Trash2, ExternalLink, AlertCircle, 
  Search, Filter, ChevronRight, ArrowUpRight, BarChart3, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Image from 'next/image';

interface EventItem {
  id: string;
  title: string;
  type: 'CASHBACK' | 'LEADERBOARD' | 'DISCOUNT' | 'GIFTCODE';
  status: 'ACTIVE' | 'UPCOMING' | 'ENDED';
  budgetTotal: number;
  budgetSpent: number;
  startDate: string;
  endDate: string;
  bannerUrl: string;
  description: string;
  rules?: string;
  isFeatured?: boolean;
}

const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-001',
    title: 'Đua Top Thách Đấu - Nhận Thưởng Tiền Mặt',
    type: 'LEADERBOARD',
    status: 'ACTIVE',
    budgetTotal: 10000000,
    budgetSpent: 4500000,
    startDate: '2026-11-20',
    endDate: '2026-12-20',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60',
    description: 'Sự kiện vinh danh top 10 Booster có số đơn hoàn thành cao nhất và khách hàng có thứ hạng cao nhất trong tháng.',
    rules: 'Top 1 nhận 5.000.000đ, Top 2 nhận 3.000.000đ, Top 3-5 nhận 1.000.000đ.',
    isFeatured: true,
  },
  {
    id: 'evt-002',
    title: 'Giờ Vàng Cày Thuê - Giảm 15% Toàn Sàn',
    type: 'DISCOUNT',
    status: 'ACTIVE',
    budgetTotal: 8000000,
    budgetSpent: 6200000,
    startDate: '2026-11-25',
    endDate: '2026-12-05',
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=60',
    description: 'Khung giờ vàng 19:00 - 23:00 mỗi tối, toàn bộ đơn hàng được trợ giá 15% trích trực tiếp từ Quỹ Admin.',
    rules: 'Áp dụng cho tất cả tựa game LMHT, Valorant, Liên Quân, TFT.',
    isFeatured: false,
  },
  {
    id: 'evt-003',
    title: 'Quà Tân Thủ - Tặng 50.000đ Cho Đơn Đầu Tiên',
    type: 'GIFTCODE',
    status: 'ACTIVE',
    budgetTotal: 5000000,
    budgetSpent: 2150000,
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=60',
    description: 'Khách hàng mới đăng ký tài khoản và hoàn tất nạp ví đầu tiên được tặng ngay voucher 50.000đ.',
    rules: 'Mỗi tài khoản chỉ nhận 1 lần.',
    isFeatured: false,
  },
  {
    id: 'evt-004',
    title: 'Siêu Hoàn Tiền 10% Nạp Ví Qua Chuyển Khoản',
    type: 'CASHBACK',
    status: 'UPCOMING',
    budgetTotal: 12000000,
    budgetSpent: 0,
    startDate: '2026-12-10',
    endDate: '2026-12-25',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=60',
    description: 'Chương trình tri ân cuối năm: Khách nạp ví từ 500.000đ được hoàn trực tiếp 10% vào ví LeoRank.',
    rules: 'Tối đa hoàn 200.000đ/giao dịch.',
    isFeatured: false,
  },
];

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [formData, setFormData] = useState<Partial<EventItem>>({
    title: '',
    type: 'DISCOUNT',
    status: 'ACTIVE',
    budgetTotal: 5000000,
    budgetSpent: 0,
    startDate: '',
    endDate: '',
    bannerUrl: '',
    description: '',
    rules: '',
  });

  // Calculate stats
  const totalAllocated = events.reduce((s, e) => s + e.budgetTotal, 0);
  const totalSpent = events.reduce((s, e) => s + e.budgetSpent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const activeCount = events.filter(e => e.status === 'ACTIVE').length;

  const filteredEvents = events.filter(e => {
    if (filterStatus !== 'ALL' && e.status !== filterStatus) return false;
    if (filterType !== 'ALL' && e.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!e.title.toLowerCase().includes(q) && !e.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      type: 'DISCOUNT',
      status: 'ACTIVE',
      budgetTotal: 5000000,
      budgetSpent: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60',
      description: '',
      rules: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (evt: EventItem) => {
    setEditingEvent(evt);
    setFormData(evt);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error("Vui lòng nhập tên sự kiện");
      return;
    }

    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...formData } as EventItem : e));
      toast.success("Cập nhật sự kiện thành công!");
    } else {
      const newEvt: EventItem = {
        id: `evt-${Date.now().toString().slice(-4)}`,
        title: formData.title || '',
        type: formData.type || 'DISCOUNT',
        status: formData.status || 'ACTIVE',
        budgetTotal: Number(formData.budgetTotal) || 0,
        budgetSpent: 0,
        startDate: formData.startDate || '',
        endDate: formData.endDate || '',
        bannerUrl: formData.bannerUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60',
        description: formData.description || '',
        rules: formData.rules || '',
      };
      setEvents(prev => [newEvt, ...prev]);
      toast.success("Thêm sự kiện mới thành công!");
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Đã xóa sự kiện");
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'CASHBACK': return { label: 'Hoàn Tiền Ví', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'LEADERBOARD': return { label: 'Đua Top BXH', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'DISCOUNT': return { label: 'Giảm Giá Đơn', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      case 'GIFTCODE': return { label: 'Voucher & Quà', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      default: return { label: type, color: 'text-zinc-400 bg-zinc-800 border-zinc-700' };
    }
  };

  return (
    <div className="p-3.5 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="text-amber-400 w-5 h-5 sm:w-6 sm:h-6" /> Quản Lý Sự Kiện & Ngân Sách Admin
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Điều phối các chương trình khuyến mãi, sự kiện kích cầu và ngân sách ưu đãi do Admin chi trả.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus size={16} /> Tạo Sự Kiện Mới
        </button>
      </div>

      {/* 4 Metric Cards for Admin Budget */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 shadow-sm">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-blue-400" /> Ngân Sách Phân Bổ
          </div>
          <div className="text-lg sm:text-2xl font-black text-white mt-1">
            {totalAllocated.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Tổng ngân sách Admin cấp</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 shadow-sm">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" /> Đã Chi Trả / Thưởng
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-400 mt-1">
            {totalSpent.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Tỉ lệ giải ngân: {((totalSpent / (totalAllocated || 1)) * 100).toFixed(1)}%</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-emerald-500/30 bg-emerald-950/20 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Ngân Sách Còn Khả Dụng
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-1">
            {totalRemaining.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Sẵn sàng tài trợ sự kiện</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 shadow-sm">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> Đang Hoạt Động
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-400 mt-1">
            {activeCount} <span className="text-xs text-zinc-500 font-normal">/ {events.length} sự kiện</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Thu hút người dùng mới</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {['ALL', 'ACTIVE', 'UPCOMING', 'ENDED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === st 
                  ? 'bg-amber-500/20 border border-amber-500 text-amber-300' 
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'Tất cả' : st === 'ACTIVE' ? 'Đang diễn ra' : st === 'UPCOMING' ? 'Sắp tới' : 'Đã kết thúc'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((evt) => {
          const typeMeta = getTypeText(evt.type);
          const percentSpent = Math.min(100, Math.round((evt.budgetSpent / (evt.budgetTotal || 1)) * 100));

          return (
            <div key={evt.id} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div>
                {/* Banner Thumbnail */}
                <div className="relative h-40 w-full bg-zinc-950 overflow-hidden">
                  <Image src={evt.bannerUrl} alt={evt.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${typeMeta.color}`}>
                      {typeMeta.label}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      evt.status === 'ACTIVE' ? 'bg-emerald-500 text-black' : evt.status === 'UPCOMING' ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {evt.status === 'ACTIVE' ? 'Đang chạy' : evt.status === 'UPCOMING' ? 'Sắp mở' : 'Đã kết thúc'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md">
                      {evt.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>

                  {/* Budget Progress Bar */}
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Ngân sách trích chi:</span>
                      <span className="font-mono font-bold text-white">
                        {evt.budgetSpent.toLocaleString('vi-VN')} đ / <b className="text-amber-400">{evt.budgetTotal.toLocaleString('vi-VN')} đ</b>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all rounded-full ${percentSpent > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${percentSpent}%` }} 
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500">
                      <span>Đã tiêu hao {percentSpent}%</span>
                      <span>Còn lại: {(evt.budgetTotal - evt.budgetSpent).toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar size={13} /> {evt.startDate} → {evt.endDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3.5 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setEvents(prev => prev.map(e => e.id === evt.id ? { ...e, status: e.status === 'ACTIVE' ? 'ENDED' : 'ACTIVE' } : e));
                    toast.success("Đã cập nhật trạng thái sự kiện!");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    evt.status === 'ACTIVE' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                  }`}
                >
                  {evt.status === 'ACTIVE' ? 'Tạm dừng sự kiện' : 'Kích hoạt lại'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(evt)}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(evt.id)}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors"
                    title="Xóa sự kiện"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="text-amber-400 w-5 h-5" />
                {editingEvent ? 'Chỉnh Sửa Sự Kiện' : 'Tạo Sự Kiện Mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-1 uppercase">Tên sự kiện *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giờ Vàng Hoàn Tiền 15%..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1 uppercase">Loại sự kiện</label>
                  <select
                    value={formData.type}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  >
                    <option value="DISCOUNT">Giảm giá đơn hàng</option>
                    <option value="CASHBACK">Hoàn tiền nạp ví</option>
                    <option value="LEADERBOARD">Đua top BXH nhận thưởng</option>
                    <option value="GIFTCODE">Phát mã Voucher / Quà</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1 uppercase">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  >
                    <option value="ACTIVE">Đang chạy</option>
                    <option value="UPCOMING">Sắp tới</option>
                    <option value="ENDED">Đã kết thúc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-1 uppercase">Ngân sách Admin chi trả (VND) *</label>
                <input
                  type="number"
                  required
                  min={100000}
                  step={100000}
                  value={formData.budgetTotal}
                  onChange={(e) => setFormData(prev => ({ ...prev, budgetTotal: Number(e.target.value) }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1 uppercase">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1 uppercase">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-1 uppercase">Đường dẫn Banner (URL)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.bannerUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, bannerUrl: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-1 uppercase">Mô tả sự kiện</label>
                <textarea
                  rows={3}
                  placeholder="Nêu rõ thể lệ, điều kiện nhận thưởng cho người chơi..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shadow-amber-500/20"
                >
                  Lưu Sự Kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}