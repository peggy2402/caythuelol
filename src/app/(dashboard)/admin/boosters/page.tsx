'use client';
import BarLoader from '@/components/ui/BarLoader';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, X, Eye, Loader2, ShieldAlert, Calendar, User as UserIcon, 
  Search, Filter, ChevronLeft, ChevronRight, Star, Trophy, MoreHorizontal, FileText, Receipt, ExternalLink, Copy, Download, RefreshCw, Trash2,
  Plus, Edit, ShieldCheck, Ban, CheckCircle2, UserPlus, DollarSign, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Image from 'next/image';
import UserSelectDropdown, { AdminUserItem } from '@/components/admin/UserSelectDropdown';
import BoosterRecentForm from '@/components/BoosterRecentForm';
import { apiFetch } from '@/lib/api';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

// --- Types ---
interface Application {
  _id: string;
  fullName: string;
  phoneNumber: string;
  facebookUrl: string;
  discordTag: string;
  primaryGame?: string;
  customGameName?: string;
  currentRank: string;
  highestRank: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  opggLink: string;
  rankImageUrl: string;
  billImageUrl?: string;
  contractUrl?: string;
  depositStatus: 'unpaid' | 'paid' | 'refunded';
  depositAmount?: number;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  userId: { username: string; email: string; };
  note?: string;
  agreementSigned_name?: string;
  agreementSigned_at?: string;
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
  const [activeTab, setActiveTab] = useState<'applications' | 'list' | 'recent-form'>('applications');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [appsCount, setAppsCount] = useState<number>(0);
  const [boostersCount, setBoostersCount] = useState<number>(0);
  const router = useRouter();

  // Fetch summary counts for tab badges
  useEffect(() => {
    fetch('/api/admin/boosters?tab=applications')
      .then(res => res.json())
      .then(data => {
        if (data.applications) setAppsCount(data.applications.filter((a: any) => a.status === 'pending').length);
        if (data.activeBoostersCount !== undefined) setBoostersCount(data.activeBoostersCount);
      })
      .catch(() => {});

    fetch('/api/admin/boosters?page=1&limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.total !== undefined && boostersCount === 0) setBoostersCount(data.total);
      })
      .catch(() => {});
  }, []);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    toast.info("Đang làm mới dữ liệu...");
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="p-3.5 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6" /> Quản lý Boosters
          </h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Tabs Navigation */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 overflow-x-auto scrollbar-none flex-1 sm:flex-initial">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'applications' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Đơn đăng ký</span>
              {appsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-black">
                  {appsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'list' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Danh sách hoạt động</span>
              {boostersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  {boostersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('recent-form')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'recent-form' ? 'bg-zinc-800 text-cyan-400 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Phong độ (30 ngày)
            </button>
          </div>
          {/* Refresh Button */}
          <button onClick={handleRefresh} disabled={isRefreshing} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'applications' ? (
        <ApplicationsTab />
      ) : activeTab === 'list' ? (
        <ActiveBoostersTab />
      ) : (
        <RecentFormOverviewTab />
      )}
    </div>
  );
}

// --- TAB 1: APPLICATIONS (Code tối ưu Mobile, Xóa Cọc, Đầy Đủ Thông Tin) ---
function ApplicationsTab() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalRegistrationRevenue, setTotalRegistrationRevenue] = useState<number>(0);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null); // State cho Modal chi tiết
  const [adminNote, setAdminNote] = useState(''); // State cho ghi chú nội bộ
  const [viewContract, setViewContract] = useState<string | null>(null); // State cho Modal xem hợp đồng
  const [confirmModal, setConfirmModal] = useState<{ id: string; status: 'approved' | 'rejected'; name: string } | null>(null);

  const handleDownloadContract = async (url: string, suggestedName?: string) => {
    try {
      toast.info("Đang xử lý tải xuống file PDF...");
      // Proxy qua /media/ trên cùng domain www.leorank.site để tránh chặn CORS từ Cloudinary
      const proxyUrl = url.replace('https://res.cloudinary.com/dgepbbgpb/', '/media/');
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Không thể tải file từ máy chủ");
      const blob = await res.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      let safeName = (suggestedName || 'Hop_Dong_Booster.pdf').trim().replace(/[/\\?%*:|"<>]/g, '_');
      if (!safeName.toLowerCase().endsWith('.pdf')) {
        safeName += '.pdf';
      }
      link.download = safeName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`Đã tải xuống: ${safeName}`);
    } catch (err: any) {
      console.warn("Direct blob download failed, falling back to window.open", err);
      window.open(url, '_blank');
    }
  };

  const getTrackerLabel = (gameCode?: string) => {
    switch (gameCode?.toUpperCase()) {
      case 'LOL': return 'OP.GG / Riot ID';
      case 'VALORANT': return 'Tracker.gg / Riot ID';
      case 'AOV': return 'Tên Ingame / OpenID';
      case 'TFT': return 'Tactics.tools / TFT';
      case 'CS2': return 'Steam / Faceit Profile';
      case 'DOTA2': return 'Dotabuff / Steam ID';
      case 'OVERWATCH2': return 'BattleTag Profile';
      default: return 'Link / ID Check Rank';
    }
  };

  const getGameDisplayName = (gameCode?: string, customName?: string) => {
    if (gameCode === 'OTHER') return customName || 'Tựa game khác';
    switch (gameCode?.toUpperCase()) {
      case 'LOL': return 'Liên Minh Huyền Thoại (LMHT)';
      case 'VALORANT': return 'VALORANT';
      case 'AOV': return 'Liên Quân Mobile';
      case 'TFT': return 'Đấu Trường Chân Lý (TFT)';
      case 'CS2': return 'Counter-Strike 2';
      case 'DOTA2': return 'Dota 2';
      case 'OVERWATCH2': return 'Overwatch 2';
      default: return gameCode || 'Chưa chọn';
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/boosters?tab=applications`)
      .then(res => res.json())
      .then(data => {
        const applications = data.applications || [];
        setApps(applications);
        if (data.totalRegistrationRevenue !== undefined) {
          setTotalRegistrationRevenue(data.totalRegistrationRevenue);
        } else {
          const rev = applications
            .filter((a: any) => a.depositStatus === 'paid')
            .reduce((sum: number, a: any) => sum + (Number(a.depositAmount) || 50000), 0);
          setTotalRegistrationRevenue(rev);
        }
      })
      .catch(() => toast.error("Lỗi tải danh sách đơn ứng tuyển"))
      .finally(() => setLoading(false));
  }, []);

  // Filter logic (Lọc theo trạng thái và tìm kiếm, không còn khái niệm tiền cọc)
  const filteredApps = apps.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = app.fullName?.toLowerCase().includes(q);
      const matchUser = app.userId?.username?.toLowerCase().includes(q);
      const matchPhone = app.phoneNumber?.includes(q);
      const matchGame = app.primaryGame?.toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchPhone && !matchGame) return false;
    }
    return true;
  });

  const executeStatusUpdate = async (id: string, status: 'approved' | 'rejected', note?: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/boosters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        toast.success(status === 'approved' ? "Đã duyệt đơn và cấp quyền Booster thành công!" : "Đã từ chối đơn ứng tuyển.");
        setApps(prev => prev.map(app => app._id === id ? { ...app, status, note } : app));
        if (selectedApp?._id === id) {
          setSelectedApp(prev => prev ? { ...prev, status, note } : null);
        }
      } else {
        const err = await res.json();
        throw new Error(err.message || "Lỗi cập nhật trạng thái");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật");
    } finally {
      setProcessingId(null);
      setConfirmModal(null);
    }
  };

  if (loading) return <BarLoader className="py-20" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      {/* 3 Metric Cards: Doanh Thu Đăng Ký Boosters, Đã Nộp Phí, Chờ Thẩm Định */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900/80 to-zinc-900/60 border border-emerald-500/30 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Doanh Thu Đăng Ký Boosters
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {totalRegistrationRevenue.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Phí kích hoạt từ các đơn đã thanh toán</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Đã Nộp Phí Kích Hoạt
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {apps.filter(a => a.depositStatus === 'paid').length} <span className="text-xs text-zinc-500 font-normal">/ {apps.length} hồ sơ</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Đủ điều kiện kích hoạt</div>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Hồ Sơ Chờ Phê Duyệt
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {apps.filter(a => a.status === 'pending').length} <span className="text-xs text-zinc-500 font-normal">đơn</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Cần đối soát thông tin</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center mb-4">
        {/* Status Filters */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap shrink-0 ${
              statusFilter === 'all' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Tất cả ({apps.length})
          </button>
          <button 
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap shrink-0 ${
              statusFilter === 'pending' ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Chờ duyệt ({apps.filter(a => a.status === 'pending').length})
          </button>
          <button 
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap shrink-0 ${
              statusFilter === 'approved' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Đã duyệt ({apps.filter(a => a.status === 'approved').length})
          </button>
          <button 
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap shrink-0 ${
              statusFilter === 'rejected' ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-sm' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Đã từ chối ({apps.filter(a => a.status === 'rejected').length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên, username, sđt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {filteredApps.length === 0 && (
        <div className="text-center text-zinc-500 py-12 bg-zinc-900/30 rounded-2xl border border-zinc-800/60">
          Không tìm thấy đơn đăng ký nào phù hợp.
        </div>
      )}
      
      {filteredApps.map((app) => (
        <div key={app._id} className="bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 sm:gap-6 items-start md:items-center hover:border-zinc-700/80 transition-colors shadow-sm">
          <div className="flex-1 space-y-2.5 w-full">
            {/* Top row badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                app.status === 'pending' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' :
                app.status === 'approved' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
              }`}>
                {app.status === 'pending' ? 'Chờ duyệt' : app.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
              </span>

              {/* Game Badge */}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                {app.primaryGame || 'LMHT'}
              </span>

              <span className="text-zinc-500 text-xs flex items-center gap-1 font-mono">
                <Calendar size={12} /> {app.createdAt ? format(new Date(app.createdAt), 'dd/MM/yyyy') : 'N/A'}
              </span>

              {/* Registration Fee Status */}
              {app.depositStatus === 'paid' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
                  ✓ Đã nộp phí: {(app.depositAmount || 50000).toLocaleString('vi-VN')} đ
                </span>
              ) : app.billImageUrl ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/50 border border-amber-500/30 text-amber-300">
                  Có Bill Phí (Chờ Duyệt)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Chưa nộp phí kích hoạt
                </span>
              )}
            </div>

            {/* Applicant Name */}
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex flex-wrap items-center gap-2">
                <span>{app.fullName}</span>
                <span className="text-zinc-500 font-normal text-xs sm:text-sm font-mono">(@{app.userId?.username})</span>
              </h3>
            </div>

            {/* Game & Rank Info Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400 pt-0.5">
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <Trophy size={13} className="text-cyan-400" /> Rank: {app.currentRank}
              </span>
              <span className="text-purple-400 font-bold">Peak: {app.highestRank}</span>
              
              {/* Dynamic Tracker Link */}
              <a 
                href={app.opggLink?.startsWith('http') ? app.opggLink : undefined} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-400 hover:underline flex items-center gap-1 font-mono"
              >
                {getTrackerLabel(app.primaryGame)} <ExternalLink size={12} />
              </a>

              {/* Rank Image */}
              <a href={app.rankImageUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline flex items-center gap-1 font-medium">
                <Eye size={12} /> Ảnh Rank
              </a>
              
              {/* Bill & Contract */}
              {app.billImageUrl && (
                <a href={app.billImageUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1 font-medium">
                  <Receipt size={12} /> Bill CK
                </a>
              )}
              {app.contractUrl && (
                <button 
                  onClick={() => { setSelectedApp(app); setViewContract(app.contractUrl!); }} 
                  className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <FileText size={12} /> Hợp đồng PDF
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons: Responsive 3-col on Mobile, Row on Desktop */}
          <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/80">
            <div className="grid grid-cols-3 md:flex gap-2 sm:gap-2.5">
              <button 
                onClick={() => setSelectedApp(app)} 
                className="h-10 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold"
              >
                <Eye size={15} /> <span className="truncate">Chi tiết</span>
              </button>

              {app.status === 'pending' && (
                <>
                  <button 
                    onClick={() => setConfirmModal({ id: app._id, status: 'rejected', name: app.fullName })} 
                    disabled={!!processingId} 
                    className="h-10 px-3.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center gap-1.5 text-xs font-bold border border-rose-500/20 disabled:opacity-50"
                  >
                    <X size={15} /> <span className="truncate">Từ chối</span>
                  </button>
                  <button 
                    onClick={() => setConfirmModal({ id: app._id, status: 'approved', name: app.fullName })} 
                    disabled={!!processingId} 
                    className="h-10 px-3.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-colors flex items-center justify-center gap-1.5 text-xs font-bold border border-emerald-500/30 disabled:opacity-50"
                  >
                    <Check size={15} /> <span className="truncate">Duyệt</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* DETAIL MODAL (Đầy đủ tựa game, rank, link tra cứu, hợp đồng, ngân hàng) */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 p-4 sm:p-5 flex justify-between items-center z-10">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">Hồ Sơ: {selectedApp.fullName}</h2>
                <div className="text-xs text-zinc-400 font-mono">@{selectedApp.userId?.username} • Ngày gửi: {selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</div>
              </div>
              <button onClick={() => { setSelectedApp(null); setAdminNote(''); }} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-6">
              {/* 1. Game & Rank Section (Được bổ sung đầy đủ theo yêu cầu) */}
              <div>
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> 1. Kỹ Năng & Tựa Game Đăng Ký
                </h3>
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-xs text-zinc-500 mb-0.5">Tựa game cày chính</span>
                    <span className="font-bold text-cyan-300 text-sm">{getGameDisplayName(selectedApp.primaryGame, selectedApp.customGameName)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-500 mb-0.5">Rank hiện tại</span>
                    <span className="font-bold text-white text-sm">{selectedApp.currentRank}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-500 mb-0.5">Rank cao nhất (Peak)</span>
                    <span className="font-bold text-purple-400 text-sm">{selectedApp.highestRank}</span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="block text-xs text-zinc-500 mb-1">{getTrackerLabel(selectedApp.primaryGame)}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm text-zinc-200 bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800 truncate flex-1">
                        {selectedApp.opggLink}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedApp.opggLink);
                          toast.success("Đã sao chép link / ID tra cứu!");
                        }}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        title="Sao chép"
                      >
                        <Copy size={16} />
                      </button>
                      {selectedApp.opggLink?.startsWith('http') && (
                        <a
                          href={selectedApp.opggLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-400"
                          title="Mở link đối soát"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                  {selectedApp.agreementSigned_at && (
                    <div className="sm:col-span-2 md:col-span-3 text-xs text-zinc-500 pt-2 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2">
                      <span>Ký điện tử bởi: <b className="text-zinc-200">{selectedApp.agreementSigned_name || selectedApp.fullName}</b></span>
                      <span>Thời điểm ký: {new Date(selectedApp.agreementSigned_at).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Personal Info */}
              <div>
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-cyan-400" /> 2. Thông Tin Định Danh
                </h3>
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500">Email đăng ký</label>
                    <p className="text-white font-medium text-sm">{selectedApp.userId?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Số điện thoại</label>
                    <p className="text-white font-mono font-medium text-sm">{selectedApp.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Facebook</label>
                    <a href={selectedApp.facebookUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate block text-sm">
                      {selectedApp.facebookUrl}
                    </a>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Discord Tag</label>
                    <p className="text-cyan-300 font-mono font-medium text-sm">{selectedApp.discordTag}</p>
                  </div>
                </div>
              </div>

              {/* 3. Bank Info */}
              <div>
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-cyan-400" /> 3. Ngân Hàng Nhận Thu Nhập
                </h3>
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-xs text-zinc-500">Ngân hàng</span>
                    <span className="font-bold text-white text-sm">{selectedApp.bankName}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-500">Số tài khoản</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{selectedApp.bankAccountNumber}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-500">Chủ tài khoản</span>
                    <span className="font-bold text-white uppercase text-sm">{selectedApp.bankAccountName}</span>
                  </div>
                </div>
              </div>

              {/* 4. Booster Registration Fee (Doanh Thu Đăng Ký Booster) */}
              <div>
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> 4. Phí Kích Hoạt Quyền Booster (Booster Registration Fee)
                </h3>
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-xs text-zinc-500 mb-0.5">Số tiền đăng ký</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {(selectedApp.depositAmount || 50000).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-500 mb-0.5">Trạng thái thanh toán</span>
                    <span className={`inline-flex items-center gap-1 font-bold text-sm ${selectedApp.depositStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {selectedApp.depositStatus === 'paid' ? '✓ ĐÃ NỘP PHÍ KÍCH HOẠT' : selectedApp.billImageUrl ? 'Có Bill (Chờ Duyệt)' : 'Chưa Thanh Toán'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-500 mb-0.5">Phương thức ghi nhận</span>
                    <span className="text-zinc-300 text-xs">
                      {selectedApp.depositStatus === 'paid' ? 'Hệ thống tự động đối soát' : selectedApp.billImageUrl ? 'Tải ảnh bill chuyển khoản' : 'Chưa có giao dịch'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Proofs & Contract */}
              <div>
                <h3 className="text-xs font-black text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" /> 5. Bằng Chứng & Hợp Đồng Điện Tử
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <a href={selectedApp.rankImageUrl} target="_blank" rel="noreferrer" className="block group relative aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 hover:border-cyan-500/50 transition-colors">
                    <Image src={selectedApp.rankImageUrl} alt="Rank" fill className="object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold flex items-center gap-1"><Eye size={14} /> Ảnh Rank</span>
                    </div>
                  </a>

                  {selectedApp.billImageUrl && (
                    <a href={selectedApp.billImageUrl} target="_blank" rel="noreferrer" className="block group relative aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-500/50 transition-colors">
                      <Image src={selectedApp.billImageUrl} alt="Bill" fill className="object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><Receipt size={14} /> Bill Phí CK</span>
                      </div>
                    </a>
                  )}

                  {selectedApp.contractUrl && (
                    <div className="grid grid-cols-2 gap-2 w-full col-span-2">
                      <button 
                        type="button" 
                        onClick={() => setViewContract(selectedApp.contractUrl!)} 
                        className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 hover:border-amber-500 transition-colors flex flex-col items-center justify-center gap-1.5 text-center w-full"
                      >
                        <FileText className="w-6 h-6 text-amber-400" />
                        <span className="text-xs font-bold text-zinc-200">Xem Hợp Đồng PDF</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDownloadContract(selectedApp.contractUrl!, `Hop_Dong_Booster_${selectedApp.fullName || selectedApp.agreementSigned_name || 'LEORANK'}.pdf`)} 
                        className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 hover:border-cyan-500 transition-colors flex flex-col items-center justify-center gap-1.5 text-center w-full"
                      >
                        <Download className="w-6 h-6 text-cyan-400" />
                        <span className="text-xs font-bold text-zinc-200">Tải File PDF (.pdf)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Admin Note */}
              <div>
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">Ghi chú nội bộ (Admin Note)</h3>
                <textarea 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-cyan-500 outline-none min-h-[75px]"
                  placeholder="Ghi chú về ứng viên này (chỉ admin thấy)..."
                  value={adminNote || selectedApp.note || ''}
                  onChange={(e) => setAdminNote(e.target.value)}
                  disabled={selectedApp.status !== 'pending'}
                />
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/80 flex flex-wrap justify-end gap-2.5 rounded-b-3xl">
              <button onClick={() => { setSelectedApp(null); setAdminNote(''); }} className="px-4 py-2 rounded-xl hover:bg-zinc-800 text-zinc-400 text-xs font-bold">
                Đóng
              </button>
              {selectedApp.status === 'pending' && (
                <>
                  <button 
                    onClick={() => setConfirmModal({ id: selectedApp._id, status: 'rejected', name: selectedApp.fullName })} 
                    className="px-4 py-2 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-xs border border-rose-500/30"
                  >
                    Từ chối
                  </button>
                  <button 
                    onClick={() => setConfirmModal({ id: selectedApp._id, status: 'approved', name: selectedApp.fullName })} 
                    className="px-5 py-2 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 font-black text-xs shadow-lg shadow-emerald-500/20"
                  >
                    Duyệt Đơn & Kích Hoạt Booster
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTRACT VIEW MODAL (Google Docs Viewer + Direct Tab + Download) */}
      {viewContract && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex flex-wrap justify-between items-center p-3.5 sm:p-4 border-b border-zinc-800 bg-zinc-900/90 gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <FileText className="text-amber-400" size={18} /> Bản Khai Hợp Đồng Hợp Tác Booster
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(viewContract, '_blank')}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={14} /> Mở Tab Mới
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadContract(viewContract, `Hop_Dong_Booster_${selectedApp?.fullName || selectedApp?.agreementSigned_name || 'LEORANK'}.pdf`)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={14} /> Tải PDF
                </button>
                <button onClick={() => setViewContract(null)} className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-zinc-950 relative overflow-hidden flex flex-col">
              <object
                data={viewContract.replace('https://res.cloudinary.com/dgepbbgpb/', '/media/')}
                type="application/pdf"
                className="w-full h-full flex-1"
              >
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewContract)}&embedded=true`}
                  className="w-full h-full border-0 flex-1"
                  title="Bản Khai Hợp Đồng PDF"
                />
              </object>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL (Thay thế hoàn toàn window.confirm) */}
      {confirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${confirmModal.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                {confirmModal.status === 'approved' ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {confirmModal.status === 'approved' ? 'Xác Nhận Duyệt Booster' : 'Xác Nhận Từ Chối'}
                </h3>
                <p className="text-xs text-zinc-400">Ứng viên: <b className="text-zinc-200">{confirmModal.name}</b></p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {confirmModal.status === 'approved' 
                ? 'Tài khoản này sẽ được nâng cấp lên chức danh Booster, được phép truy cập Bàn làm việc Booster và bắt đầu nhận các đơn cày rank trên sàn.' 
                : 'Đơn đăng ký sẽ bị từ chối. Ứng viên vẫn có thể nộp lại hồ sơ mới nếu có nhu cầu.'}
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => executeStatusUpdate(confirmModal.id, confirmModal.status, adminNote)}
                disabled={!!processingId}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  confirmModal.status === 'approved'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                }`}
              >
                {processingId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {confirmModal.status === 'approved' ? 'Xác Nhận Duyệt' : 'Xác Nhận Từ Chối'}
              </button>
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
            <p className="text-sm text-zinc-400">Đang tải danh sách Booster...</p>
          </div>
        ) : boosters.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            Không tìm thấy Booster nào phù hợp.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900 text-zinc-400 uppercase text-xs font-bold border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Booster / Hồ sơ</th>
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
                                setDemotingBooster;
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
                            setDemotingBooster;
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
                <UserPlus className="text-blue-500 w-5 h-5" /> Thêm Booster
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
              Bạn có chắc chắn muốn hủy tư cách Booster của tài khoản{' '}
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

// --- TAB 3: PHONG ĐỘ GẦN ĐÂY (ADMIN OVERVIEW) ---
function RecentFormOverviewTab() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [trendFilter, setTrendFilter] = useState<'ALL' | 'IMPROVING' | 'STABLE' | 'DECLINING'>('ALL');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, improving: 0, stable: 0, declining: 0 });
  const [selectedBoosterId, setSelectedBoosterId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/ranking/admin/recent-form-overview?days=${days}`)
      .then((res) => {
        setItems(res.items || []);
        setSummary(res.summary || { total: 0, improving: 0, stable: 0, declining: 0 });
      })
      .catch((err) => toast.error(err.message || 'Không thể tải dữ liệu phong độ Booster'))
      .finally(() => setLoading(false));
  }, [days]);

  const filtered = items.filter((item) => trendFilter === 'ALL' || item.trend === trendFilter);

  const trendBadge = (trend: string, label: string) => {
    if (trend === 'IMPROVING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <TrendingUp className="w-3 h-3" /> {label}
        </span>
      );
    }
    if (trend === 'DECLINING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <TrendingDown className="w-3 h-3" /> {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
        <Minus className="w-3 h-3" /> {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'ALL', label: `Tất cả (${summary.total})` },
            { key: 'IMPROVING', label: `Cải thiện (${summary.improving})` },
            { key: 'STABLE', label: `Ổn định (${summary.stable})` },
            { key: 'DECLINING', label: `Suy giảm (${summary.declining})` },
          ] as const).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTrendFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                trendFilter === f.key
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1 self-start">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                days === d ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-400 text-xs uppercase border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Booster</th>
                <th className="px-4 py-3">Xu hướng</th>
                <th className="px-4 py-3 text-right">Đơn ({days}N / Kỳ trước)</th>
                <th className="px-4 py-3 text-right">Thành công</th>
                <th className="px-4 py-3 text-right">Rating</th>
                <th className="px-4 py-3 text-right">Đúng hạn</th>
                <th className="px-4 py-3 text-right">Khiếu nại</th>
                <th className="px-4 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs">
              {filtered.map((item) => (
                <tr key={item.boosterId} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-white">{item.displayName || item.username}</td>
                  <td className="px-4 py-3">{trendBadge(item.trend, item.trendLabel)}</td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-200">
                    {item.completedOrders} / <span className="text-zinc-500">{item.prevCompletedOrders}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-200">
                    {item.successRate !== null && item.successRate !== undefined ? `${item.successRate}%` : '--'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-amber-400">
                    {item.customerRating !== null && item.customerRating !== undefined ? `${item.customerRating}★` : '--'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-200">
                    {item.onTimeRate !== null && item.onTimeRate !== undefined ? `${item.onTimeRate}%` : '--'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-400">
                    {item.complaintRate !== null && item.complaintRate !== undefined ? `${item.complaintRate}%` : '--'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedBoosterId(item.boosterId)}
                      className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-bold"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                    Không có Booster nào khớp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedBoosterId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-950 border border-white/10 p-4 sm:p-6 space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBoosterId(null)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <BoosterRecentForm boosterId={selectedBoosterId} />
          </div>
        </div>
      )}
    </div>
  );
}