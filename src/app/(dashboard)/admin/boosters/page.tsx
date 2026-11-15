'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, X, Eye, Loader2, ShieldAlert, Calendar, User as UserIcon, 
  Search, Filter, ChevronLeft, ChevronRight, Star, Trophy, MoreHorizontal, FileText, Receipt, ExternalLink, Copy, Download, RefreshCw, Trash2,
  Plus, Edit, ShieldCheck, Ban, CheckCircle2, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Image from 'next/image';
import UserSelectDropdown, { AdminUserItem } from '@/components/admin/UserSelectDropdown';

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
  isBanned?: boolean;
  profile?: { avatar?: string; full_name?: string };
  boosterProfile?: {
    displayName?: string;
    bio?: string;
    rating?: number;
    completedOrders?: number;
    games?: Array<{
      gameCode: string;
      ranks: string[];
      servers: string[];
    }>;
  };
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

// --- TAB 2: ACTIVE BOOSTERS (Full CRUD: Thêm, Sửa, Xóa, Tìm kiếm) ---
function ActiveBoostersTab() {
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBooster, setEditingBooster] = useState<Booster | null>(null);
  const [demotingBooster, setDemotingBooster] = useState<Booster | null>(null);
  const [demoteReason, setDemoteReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states cho tạo mới
  const [createMode, setCreateMode] = useState<'promote' | 'new'>('promote');
  const [selectedPromoteUser, setSelectedPromoteUser] = useState<AdminUserItem | null>(null);
  const [promoteUserId, setPromoteUserId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newGameCode, setNewGameCode] = useState('LOL');
  const [newRank, setNewRank] = useState('CHALLENGER');

  // Form states cho chỉnh sửa
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editRating, setEditRating] = useState('5.0');
  const [editCompletedOrders, setEditCompletedOrders] = useState('0');
  const [editIsBanned, setEditIsBanned] = useState(false);

  // Helper lấy token
  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const loadBoosters = () => {
    setLoading(true);
    fetch(`/api/admin/boosters?tab=list&page=${page}&limit=10&search=${encodeURIComponent(debouncedSearch)}`, {
      headers: getHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        setBoosters(data.boosters || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => toast.error('Lỗi tải danh sách Booster'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBoosters();
  }, [page, debouncedSearch]);

  const handleOpenEdit = (b: Booster) => {
    setEditingBooster(b);
    setEditDisplayName(b.boosterProfile?.displayName || b.profile?.full_name || b.username);
    setEditBio(b.boosterProfile?.bio || '');
    setEditRating(String(b.boosterProfile?.rating ?? b.booster_info?.rating ?? 5.0));
    setEditCompletedOrders(String(b.boosterProfile?.completedOrders ?? b.booster_info?.completed_orders ?? 0));
    setEditIsBanned(Boolean(b.isBanned));
  };

  const handleSaveEdit = async () => {
    if (!editingBooster) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/boosters/${editingBooster._id}/profile`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          displayName: editDisplayName.trim(),
          bio: editBio.trim(),
          rating: parseFloat(editRating) || 5.0,
          completedOrders: parseInt(editCompletedOrders) || 0,
          isBanned: editIsBanned,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Cập nhật hồ sơ Booster thành công!');
        setEditingBooster(null);
        loadBoosters();
      } else {
        toast.error(data.message || 'Lỗi khi cập nhật hồ sơ');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBooster = async () => {
    if (createMode === 'promote' && !promoteUserId) {
      toast.error('Vui lòng chọn người dùng từ danh sách để thăng cấp');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = createMode === 'promote'
        ? {
            userId: promoteUserId.trim(),
            displayName: newDisplayName.trim(),
            bio: newBio.trim(),
            gameCode: newGameCode,
            ranks: [newRank],
          }
        : {
            username: newUsername.trim(),
            email: newEmail.trim(),
            password: newPassword,
            displayName: newDisplayName.trim() || newUsername.trim(),
            bio: newBio.trim(),
            gameCode: newGameCode,
            ranks: [newRank],
          };

      const res = await fetch('/api/admin/boosters/create', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(createMode === 'promote' ? 'Đã thăng cấp Booster thành công!' : 'Đã tạo tài khoản Booster mới!');
        setShowCreateModal(false);
        // Reset form
        setSelectedPromoteUser(null);
        setPromoteUserId('');
        setNewUsername('');
        setNewEmail('');
        setNewPassword('');
        setNewDisplayName('');
        setNewBio('');
        loadBoosters();
      } else {
        toast.error(data.message || 'Lỗi thao tác');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoteConfirm = async () => {
    if (!demotingBooster) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/boosters/demote', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId: demotingBooster._id, reason: demoteReason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Đã hủy tư cách Booster của ${demotingBooster.username}`);
        setDemotingBooster(null);
        setDemoteReason('');
        loadBoosters();
      } else {
        toast.error(data.message || 'Lỗi khi hủy tư cách Booster');
      }
    } catch {
      toast.error('Lỗi khi thực hiện thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header Bar: Search & Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm booster theo username, email, tên hiển thị..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Thêm Booster Mới
        </button>
      </div>

      {/* Table List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-zinc-400">Đang tải danh sách Tuyển thủ Booster...</p>
          </div>
        ) : boosters.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            Không tìm thấy Tuyển thủ Booster nào phù hợp.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900 text-zinc-400 uppercase text-xs font-bold border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Tuyển thủ / Hồ sơ</th>
                    <th className="px-6 py-4">Chuyên môn & Ranks</th>
                    <th className="px-6 py-4">Đánh giá & Hiệu suất</th>
                    <th className="px-6 py-4">Số dư ví</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {boosters.map((booster) => {
                    const dispName = booster.boosterProfile?.displayName || booster.profile?.full_name || booster.username;
                    const ratingVal = booster.boosterProfile?.rating ?? booster.booster_info?.rating ?? 5.0;
                    const ordersVal = booster.boosterProfile?.completedOrders ?? booster.booster_info?.completed_orders ?? 0;
                    const ranks = booster.boosterProfile?.games?.[0]?.ranks || booster.booster_info?.ranks || ['CHALLENGER'];

                    return (
                      <tr key={booster._id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative shrink-0 border border-zinc-700">
                              {booster.profile?.avatar ? (
                                <Image src={booster.profile.avatar} alt={booster.username} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                  <UserIcon size={20} />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {dispName}
                                {dispName !== booster.username && (
                                  <span className="text-xs text-zinc-500 font-normal">(@{booster.username})</span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-400">{booster.email}</div>
                              {booster.boosterProfile?.bio && (
                                <p className="text-xs text-zinc-500 mt-1 line-clamp-1 italic max-w-xs">
                                  "{booster.boosterProfile.bio}"
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {booster.boosterProfile?.games?.[0]?.gameCode || 'LOL'}
                            </span>
                            {ranks.map((r, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-xs">
                              <Star size={13} fill="currentColor" /> {Number(ratingVal).toFixed(1)} / 5.0
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                              <Trophy size={13} /> {ordersVal} đơn hoàn tất
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-emerald-400">
                          {booster.wallet_balance?.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-6 py-4">
                          {booster.isBanned ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              <Ban size={12} /> Tạm khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ShieldCheck size={12} /> Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(booster)}
                              className="p-2 rounded-lg bg-zinc-800 hover:bg-blue-600/20 text-zinc-300 hover:text-blue-400 border border-zinc-700 transition-colors"
                              title="Chỉnh sửa hồ sơ Booster"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setDemotingBooster(booster);
                                setDemoteReason('');
                              }}
                              className="p-2 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-700 transition-colors"
                              title="Hủy tư cách Booster"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-zinc-800">
              {boosters.map((booster) => {
                const dispName = booster.boosterProfile?.displayName || booster.profile?.full_name || booster.username;
                const ratingVal = booster.boosterProfile?.rating ?? booster.booster_info?.rating ?? 5.0;
                const ordersVal = booster.boosterProfile?.completedOrders ?? booster.booster_info?.completed_orders ?? 0;

                return (
                  <div key={booster._id} className="p-4 space-y-3 hover:bg-zinc-800/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative shrink-0 border border-zinc-700">
                          {booster.profile?.avatar ? (
                            <Image src={booster.profile.avatar} alt={booster.username} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <UserIcon size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{dispName}</div>
                          <div className="text-xs text-zinc-400">{booster.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(booster)}
                          className="p-2 bg-zinc-800 text-blue-400 rounded-lg border border-zinc-700"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setDemotingBooster(booster);
                            setDemoteReason('');
                          }}
                          className="p-2 bg-zinc-800 text-red-400 rounded-lg border border-zinc-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex justify-between items-center">
                        <span className="text-zinc-500">Đánh giá</span>
                        <span className="font-bold text-yellow-500">{Number(ratingVal).toFixed(1)} / 5.0</span>
                      </div>
                      <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex justify-between items-center">
                        <span className="text-zinc-500">Đơn xong</span>
                        <span className="font-bold text-zinc-300">{ordersVal} đơn</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-xs">
                      <span className="font-mono text-emerald-400 font-bold">
                        {booster.wallet_balance?.toLocaleString('vi-VN')} đ
                      </span>
                      {booster.isBanned ? (
                        <span className="text-red-400 font-medium">Bị khóa</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">Hoạt động</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && boosters.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/30">
            <span className="text-xs text-zinc-400 font-medium">
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 border border-zinc-700"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 border border-zinc-700"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL 1: THÊM BOOSTER MỚI --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="text-blue-500 w-5 h-5" /> Thêm Tuyển Thủ Booster
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800 text-sm">
              <button
                type="button"
                onClick={() => setCreateMode('promote')}
                className={`py-2 rounded-md font-medium transition-all ${
                  createMode === 'promote' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Thăng cấp User có sẵn
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('new')}
                className={`py-2 rounded-md font-medium transition-all ${
                  createMode === 'new' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tạo tài khoản mới
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {createMode === 'promote' ? (
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase">
                    Chọn người dùng từ hệ thống *
                  </label>
                  <UserSelectDropdown
                    selectedUser={selectedPromoteUser}
                    onSelect={(u) => {
                      setSelectedPromoteUser(u);
                      if (u) {
                        setPromoteUserId(u._id);
                        if (!newDisplayName) {
                          setNewDisplayName(u.profile?.full_name || u.username);
                        }
                      } else {
                        setPromoteUserId('');
                      }
                    }}
                    excludeRoles={['BOOSTER']}
                    placeholder="Tìm theo tên đăng nhập hoặc email khách hàng..."
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Chọn trực tiếp từ danh sách người dùng để thăng cấp thành Booster tức thì mà không cần nhập ID thủ công.
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
                        placeholder="booster_pro"
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
                      placeholder="booster@leorank.site"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                  Tên hiển thị (Display Name)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Faker LeoRank"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-zinc-200 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                    Tựa game chính
                  </label>
                  <select
                    value={newGameCode}
                    onChange={(e) => setNewGameCode(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 outline-none"
                  >
                    <option value="LOL">Liên Minh Huyền Thoại (LOL)</option>
                    <option value="VALORANT">Valorant</option>
                    <option value="TFT">Đấu Trường Chân Lý (TFT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                    Rank cao nhất
                  </label>
                  <select
                    value={newRank}
                    onChange={(e) => setNewRank(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 outline-none"
                  >
                    <option value="CHALLENGER">Thách Đấu (Challenger)</option>
                    <option value="GRANDMASTER">Đại Cao Thủ (Grandmaster)</option>
                    <option value="MASTER">Cao Thủ (Master)</option>
                    <option value="DIAMOND">Kim Cương (Diamond)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                  Mô tả / Tiểu sử ngắn
                </label>
                <textarea
                  rows={2}
                  placeholder="Top 1 Thách Đấu nhiều mùa, chuyên cày siêu tốc tỉ lệ thắng >85%..."
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white font-medium hover:bg-zinc-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreateBooster}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận tạo Booster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CHỈNH SỬA HỒ SƠ BOOSTER --- */}
      {editingBooster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit className="text-yellow-500 w-5 h-5" /> Chỉnh sửa hồ sơ Booster
              </h3>
              <button
                onClick={() => setEditingBooster(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                  Tài khoản
                </label>
                <div className="px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 font-mono text-xs">
                  {editingBooster.username} ({editingBooster.email})
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                  Tên hiển thị công khai (Display Name)
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-zinc-200 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                  Tiểu sử / Bio
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-zinc-200 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                    Đánh giá sao (1.0 - 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editRating}
                    onChange={(e) => setEditRating(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                    Số đơn hoàn thành
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editCompletedOrders}
                    onChange={(e) => setEditCompletedOrders(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editIsBanned}
                    onChange={(e) => setEditIsBanned(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-red-600 focus:ring-0"
                  />
                  <span className="text-zinc-300 font-medium">Tạm khóa tài khoản Booster này (Không nhận đơn mới)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingBooster(null)}
                className="px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white font-medium hover:bg-zinc-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: XÁC NHẬN HỦY TƯ CÁCH BOOSTER (DEMOTE) --- */}
      {demotingBooster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 border-b border-zinc-800 pb-3">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Hủy tư cách Booster</h3>
            </div>
            <p className="text-sm text-zinc-300">
              Bạn có chắc chắn muốn hủy tư cách Tuyển thủ của tài khoản{' '}
              <strong className="text-white">{demotingBooster.username}</strong>?
            </p>
            <p className="text-xs text-zinc-400">
              Tài khoản sẽ được chuyển về vai trò Khách hàng (CUSTOMER) và ngừng nhận đơn mới.
            </p>
            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1 uppercase">
                Lý do hủy (sẽ được ghi vào lịch sử)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Vi phạm quy tắc ứng xử / Không hoạt động..."
                value={demoteReason}
                onChange={(e) => setDemoteReason(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-red-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDemotingBooster(null)}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white font-medium hover:bg-zinc-800 transition-colors"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDemoteConfirm}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận hủy tư cách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}