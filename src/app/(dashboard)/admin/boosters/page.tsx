'use client';

import { useState, useEffect } from 'react';
import { 
  Check, X, Eye, Loader2, ShieldAlert, Calendar, User as UserIcon, 
  Search, Filter, ChevronLeft, ChevronRight, Star, Trophy, MoreHorizontal 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Image from 'next/image';

// --- Types ---
interface Application {
  _id: string;
  fullName: string;
  currentRank: string;
  highestRank: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  opggLink: string;
  rankImageUrl: string;
  userId: { username: string; email: string; };
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="text-yellow-500" /> Quản lý Boosters
        </h1>
        
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

  useEffect(() => {
    fetch('/api/admin/boosters?tab=applications')
      .then(res => res.json())
      .then(data => setApps(data.applications || []))
      .catch(() => toast.error("Lỗi tải danh sách đơn"))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    if (!confirm(`Xác nhận ${status === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'}?`)) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/boosters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("Cập nhật thành công!");
        setApps(apps.map(app => app._id === id ? { ...app, status } : app));
      } else throw new Error();
    } catch {
      toast.error("Lỗi cập nhật");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4">
      {apps.length === 0 && <div className="text-center text-zinc-500 py-10">Không có đơn đăng ký nào.</div>}
      {apps.map((app) => (
        <div key={app._id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                app.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>{app.status}</span>
              <span className="text-zinc-500 text-xs flex items-center gap-1">
                <Calendar size={12} /> {app.createdAt ? format(new Date(app.createdAt), 'dd/MM/yyyy') : 'N/A'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">{app.fullName} <span className="text-zinc-500 font-normal text-sm">(@{app.userId?.username})</span></h3>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
              <span className="text-blue-400">Rank: {app.currentRank}</span>
              <span className="text-purple-400">Peak: {app.highestRank}</span>
              <a href={app.opggLink} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">OP.GG <Eye size={12} /></a>
              <a href={app.rankImageUrl} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">Ảnh Rank <Eye size={12} /></a>
            </div>
          </div>
          {app.status === 'pending' && (
            <div className="flex gap-3">
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
          <div className="overflow-x-auto">
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
                      <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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