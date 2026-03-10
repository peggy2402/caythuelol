'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, X, Eye, Loader2, ShieldAlert, Calendar, User as UserIcon, 
  Search, Filter, ChevronLeft, ChevronRight, Star, Trophy, MoreHorizontal, FileText, Receipt, ExternalLink, Copy, Download, RefreshCw, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Image from 'next/image';

// --- Types ---
interface Application {
  _id: string;
  fullName: string;
  phoneNumber: string;
  facebookUrl: string;
  discordTag: string;
  currentRank: string;
  highestRank: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  opggLink: string;
  rankImageUrl: string;
  billImageUrl?: string;
  contractUrl?: string;
  depositStatus: 'unpaid' | 'paid' | 'refunded';
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  userId: { username: string; email: string; };
  note?: string;
}

interface Booster {
  _id: string;
  username: string;
  email: string;
  wallet_balance: number;
  profile?: { avatar?: string };
  booster_info?: {
    rating: number;
    completed_orders: number;
    ranks: string[];
  };
  createdAt: string;
}

export default function AdminBoostersPage() {
  const [activeTab, setActiveTab] = useState<'applications' | 'list'>('applications');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    toast.info("Đang làm mới dữ liệu...");
    router.refresh();
    // Reset a bit later to allow loading states in children to appear
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-yellow-500" /> Quản lý Boosters
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs Navigation */}
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'applications' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Đơn đăng ký
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'list' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Danh sách hoạt động
            </button>
          </div>
          {/* Refresh Button */}
          <button onClick={handleRefresh} disabled={isRefreshing} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'applications' ? <ApplicationsTab /> : <ActiveBoostersTab />}
    </div>
  );
}

// --- TAB 1: APPLICATIONS (Code cũ đã tối ưu) ---
function ApplicationsTab() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [depositFilter, setDepositFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null); // State cho Modal chi tiết
  const [adminNote, setAdminNote] = useState(''); // State cho ghi chú nội bộ
  const [viewContract, setViewContract] = useState<string | null>(null); // State cho Modal xem hợp đồng

  useEffect(() => {
    setLoading(true);
    // Giả sử API hỗ trợ filter, hoặc ta filter client-side tạm thời
    fetch(`/api/admin/boosters?tab=applications`)
      .then(res => res.json())
      .then(data => setApps(data.applications || []))
      .catch(() => toast.error("Lỗi tải danh sách đơn"))
      .finally(() => setLoading(false));
  }, []);

  // Filter Client-side logic
  const filteredApps = apps.filter(app => {
    if (depositFilter === 'all') return true;
    return app.depositStatus === depositFilter;
  });

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected', note?: string) => {
    if (!confirm(`Xác nhận ${status === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'}?`)) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/boosters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        toast.success("Cập nhật thành công!");
        setApps(apps.map(app => app._id === id ? { ...app, status, note } : app));
      } else throw new Error();
    } catch {
      toast.error("Lỗi cập nhật");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      {/* Filter Bar */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setDepositFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border ${depositFilter === 'all' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
        >
          Tất cả
        </button>
        <button 
          onClick={() => setDepositFilter('paid')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border ${depositFilter === 'paid' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
        >
          Đã đóng cọc
        </button>
        <button 
          onClick={() => setDepositFilter('unpaid')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border ${depositFilter === 'unpaid' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
        >
          Chưa cọc
        </button>
      </div>

      {filteredApps.length === 0 && <div className="text-center text-zinc-500 py-10">Không tìm thấy đơn đăng ký nào.</div>}
      
      {filteredApps.map((app) => (
        <div key={app._id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-zinc-700 transition-colors">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                app.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>{app.status}</span>
              <span className="text-zinc-500 text-xs flex items-center gap-1">
                <Calendar size={12} /> {app.createdAt ? format(new Date(app.createdAt), 'dd/MM/yyyy') : 'N/A'}
              </span>
              {/* Deposit Badge */}
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                app.depositStatus === 'paid' ? 'bg-green-900/30 border-green-500/30 text-green-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}>
                {app.depositStatus === 'paid' ? 'Đã cọc' : 'Chưa cọc'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">{app.fullName} <span className="text-zinc-500 font-normal text-sm">(@{app.userId?.username})</span></h3>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
              <span className="text-blue-400">Rank: {app.currentRank}</span>
              <span className="text-purple-400">Peak: {app.highestRank}</span>
              <a href={app.opggLink} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">OP.GG <Eye size={12} /></a>
              <a href={app.rankImageUrl} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">Ảnh Rank <Eye size={12} /></a>
              
              {/* Hiển thị Bill & Hợp đồng */}
              {app.billImageUrl && (
                <a href={app.billImageUrl} target="_blank" className="text-green-400 hover:underline flex items-center gap-1 font-medium">
                  <Receipt size={12} /> Xem Bill
                </a>
              )}
              {app.contractUrl && (
                <button onClick={() => setViewContract(app.contractUrl!)} className="text-orange-400 hover:underline flex items-center gap-1 font-medium">
                  <FileText size={12} /> Hợp đồng
                </button>
              )}
            </div>
          </div>
          {app.status === 'pending' && (
            <div className="flex gap-3">
              <button onClick={() => setSelectedApp(app)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2">
                <Eye size={16} /> Chi tiết
              </button>
              <button onClick={() => handleStatusUpdate(app._id, 'rejected')} disabled={!!processingId} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2">
                <X size={16} /> Từ chối
              </button>
              <button onClick={() => handleStatusUpdate(app._id, 'approved')} disabled={!!processingId} className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors flex items-center gap-2">
                <Check size={16} /> Duyệt
              </button>
            </div>
          )}
        </div>
      ))}

      {/* DETAIL MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-white">Hồ sơ: {selectedApp.fullName}</h2>
              <button onClick={() => { setSelectedApp(null); setAdminNote(''); }} className="p-2 hover:bg-zinc-800 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* 1. Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase">Email</label>
                  <p className="text-white font-medium">{selectedApp.userId.email}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase">Số điện thoại</label>
                  <p className="text-white font-medium">{selectedApp.phoneNumber}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase">Facebook</label>
                  <a href={selectedApp.facebookUrl} target="_blank" className="text-blue-400 hover:underline truncate block">{selectedApp.facebookUrl}</a>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase">Discord</label>
                  <p className="text-white font-medium">{selectedApp.discordTag}</p>
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              {/* 2. Bank Info */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4">Thông tin ngân hàng (Của Booster)</h3>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-xs text-zinc-500">Ngân hàng</span>
                    <span className="font-bold text-white">{selectedApp.bankName}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-500">Số tài khoản</span>
                    <span className="font-mono font-bold text-white">{selectedApp.bankAccountNumber}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-500">Chủ tài khoản</span>
                    <span className="font-bold text-white uppercase">{selectedApp.bankAccountName}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              {/* 3. Proofs */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4">Bằng chứng & Tài liệu</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   <a href={selectedApp.rankImageUrl} target="_blank" className="block group relative aspect-video bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                      <Image src={selectedApp.rankImageUrl} alt="Rank" fill className="object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold flex items-center gap-1"><Eye size={14} /> Ảnh Rank</span>
                      </div>
                   </a>
                   {selectedApp.billImageUrl && (
                     <a href={selectedApp.billImageUrl} target="_blank" className="block group relative aspect-video bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                        <Image src={selectedApp.billImageUrl} alt="Bill" fill className="object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-green-400 text-xs font-bold flex items-center gap-1"><Receipt size={14} /> Bill CK</span>
                        </div>
                     </a>
                   )}
                   {selectedApp.contractUrl && (
                     <button onClick={() => setViewContract(selectedApp.contractUrl!)} className="block p-4 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-orange-500 transition-colors flex flex-col items-center justify-center gap-2 text-center w-full h-full">
                        <FileText className="w-8 h-8 text-orange-500" />
                        <span className="text-xs font-bold text-zinc-300">Hợp đồng PDF</span>
                     </button>
                   )}
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              {/* 4. Admin Note */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase mb-2">Ghi chú nội bộ (Admin Note)</h3>
                <textarea 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none min-h-[80px]"
                  placeholder="Nhập lý do duyệt/từ chối hoặc ghi chú về ứng viên này..."
                  value={adminNote || selectedApp.note || ''}
                  onChange={(e) => setAdminNote(e.target.value)}
                  disabled={selectedApp.status !== 'pending'}
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => { setSelectedApp(null); setAdminNote(''); }} className="px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400">Đóng</button>
              {selectedApp.status === 'pending' && (
                <>
                  <button onClick={() => { handleStatusUpdate(selectedApp._id, 'rejected', adminNote); setSelectedApp(null); setAdminNote(''); }} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold">Từ chối</button>
                  <button onClick={() => { handleStatusUpdate(selectedApp._id, 'approved', adminNote); setSelectedApp(null); setAdminNote(''); }} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 font-bold shadow-lg shadow-green-600/20">Duyệt đơn</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTRACT VIEW MODAL */}
      {viewContract && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900 rounded-t-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="text-orange-500" size={20} /> Xem Hợp đồng</h3>
              <button onClick={() => setViewContract(null)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 bg-zinc-950 relative overflow-hidden">
               {/* Thêm object-fit và type để browser render tốt hơn */}
               <iframe src={viewContract} className="w-full h-full border-0" title="Contract PDF">
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                    <p>Trình duyệt không hỗ trợ xem trước file này.</p>
                    <a href={viewContract} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                      Mở trong tab mới
                    </a>
                  </div>
               </iframe>
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setViewContract(null)} className="px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400 font-medium transition-colors">Đóng</button>
              <a href={viewContract} download target="_blank" rel="noopener noreferrer" className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-105">
                <Download size={18} /> Tải xuống
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- TAB 2: ACTIVE BOOSTERS (New Feature) ---
function ActiveBoostersTab() {
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openActionId, setOpenActionId] = useState<string | null>(null); // State cho dropdown

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/boosters?tab=list&page=${page}&limit=10&search=${debouncedSearch}`)
      .then(res => res.json())
      .then(data => {
        setBoosters(data.boosters || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => toast.error("Lỗi tải danh sách Booster"))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  const handleDemote = async (userId: string, username: string) => {
    const reason = prompt(`Nhập lý do hủy tư cách Booster của ${username} (Để trống nếu không có):`);
    if (reason === null) return; // Người dùng bấm Cancel
    
    try {
      const res = await fetch('/api/admin/boosters/demote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason }),
      });
      if (res.ok) {
        toast.success(`Đã hủy tư cách Booster: ${username}`);
        setBoosters(boosters.filter(b => b._id !== userId)); // Xóa khỏi danh sách hiển thị
      } else throw new Error();
    } catch {
      toast.error("Lỗi khi thực hiện thao tác");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, email..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
          <Filter size={16} /> Bộ lọc
        </button>
      </div>

      {/* Table List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : (
          <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Booster</th>
                  <th className="px-6 py-4">Thống kê</th>
                  <th className="px-6 py-4">Ví tiền</th>
                  <th className="px-6 py-4">Ngày tham gia</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {boosters.map((booster) => (
                  <tr key={booster._id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative">
                          {booster.profile?.avatar ? (
                            <Image src={booster.profile.avatar} alt={booster.username} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500"><UserIcon size={20} /></div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white">{booster.username}</div>
                          <div className="text-xs text-zinc-500">{booster.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-yellow-500 font-bold">
                          <Star size={12} fill="currentColor" /> {booster.booster_info?.rating?.toFixed(1) || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1 text-zinc-400 text-xs">
                          <Trophy size={12} /> {booster.booster_info?.completed_orders || 0} đơn
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-400">
                      {booster.wallet_balance?.toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {booster.createdAt ? format(new Date(booster.createdAt), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button 
                          onClick={() => setOpenActionId(openActionId === booster._id ? null : booster._id)}
                          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openActionId === booster._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenActionId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              <button 
                                onClick={() => handleDemote(booster._id, booster.username)}
                                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 size={14} /> Hủy tư cách Booster
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden">
            {boosters.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">Không tìm thấy Booster nào.</div>
            ) : (
              boosters.map((booster) => (
                <div key={booster._id} className="p-4 border-b border-zinc-800 last:border-0 space-y-3 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative shrink-0">
                          {booster.profile?.avatar ? (
                            <Image src={booster.profile.avatar} alt={booster.username} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500"><UserIcon size={20} /></div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white">{booster.username}</div>
                          <div className="text-xs text-zinc-500">{booster.email}</div>
                        </div>
                    </div>
                    <button className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Đánh giá</span>
                      <div className="flex items-center gap-1 text-yellow-500 font-bold text-xs">
                        <Star size={12} fill="currentColor" /> {booster.booster_info?.rating?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Đơn xong</span>
                      <div className="flex items-center gap-1 text-zinc-300 font-bold text-xs">
                        <Trophy size={12} /> {booster.booster_info?.completed_orders || 0}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                     <span className="text-xs text-zinc-500">Tham gia: {booster.createdAt ? format(new Date(booster.createdAt), 'dd/MM/yyyy') : 'N/A'}</span>
                     <span className="font-mono text-emerald-400 font-bold">{booster.wallet_balance?.toLocaleString()} đ</span>
                  </div>
                </div>
              ))
            )}
          </div>
          </>
        )}
        
        {/* Pagination */}
        {!loading && boosters.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">Trang {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}