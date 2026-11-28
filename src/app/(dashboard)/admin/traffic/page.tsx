'use client';
import BarLoader from '@/components/ui/BarLoader';

import { useState, useEffect } from 'react';
import {
  Globe,
  TrendingUp,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Zap,
  Activity,
  Calendar,
  Sparkles,
  Tag,
  AlertCircle,
  X,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';

interface TrafficProject {
  pid: string;
  title: string;
  type: 'direct' | 'serp' | string;
  status: string;
  domain: string;
  createdAt: string;
  serp?: {
    keywords?: Array<{
      pid: string;
      keyword: string;
      dailyClicks: number;
      countryCode: string;
    }>;
  };
}

export default function AdminTrafficPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    account?: any;
    balance?: any;
    projects: TrafficProject[];
    totalProjects: number;
  }>({
    projects: [],
    totalProjects: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    title: 'Chiến dịch SEO LeoRank ' + new Date().toLocaleDateString('vi-VN'),
    type: 'serp' as 'direct' | 'serp',
    domain: 'leorank.site',
    visitorsPerDay: 500,
    keywords: 'cày thuê liên quân, cày thuê liên minh, cày rank lol, cày thuê uy tín',
    countryCode: 'VN',
  });

  const fetchTrafficData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/traffic/summary');
      const json = await res.json();
      if (res.ok && json.success) {
        setData({
          account: json.account,
          balance: json.balance,
          projects: json.projects || [],
          totalProjects: json.totalProjects || 0,
        });
      } else {
        toast.error(json.message || 'Không thể kết nối TrafficPeak API');
      }
    } catch {
      toast.error('Lỗi mạng khi tải dữ liệu TrafficPeak');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const kwList = newProject.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/traffic/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProject.title,
          type: newProject.type,
          domain: newProject.domain,
          visitorsPerDay: Number(newProject.visitorsPerDay),
          keywords: kwList,
          countryCodes: [newProject.countryCode],
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        toast.success('Đã khởi chạy chiến dịch traffic thành công!');
        setIsModalOpen(false);
        fetchTrafficData();
      } else {
        toast.error(resJson.data?.message || 'Lỗi khi tạo chiến dịch');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setCreating(false);
    }
  };

  const trafficCredits = data.balance?.traffic?.amount || 0;
  const expiredDate = data.balance?.traffic?.expiredAt
    ? new Date(data.balance.traffic.expiredAt).toLocaleDateString('vi-VN')
    : 'Chưa xác định';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Globe className="w-6 h-6" />
              </span>
              Lưu Lượng & SEO Traffic (TrafficPeak)
            </h1>
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Điều phối lưu lượng truy cập thực tế, tăng hạng từ khóa SEO Google và giám sát chiến dịch tự động.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTrafficData}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            Tạo Chiến Dịch Mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Credits Card */}
        <div className="bg-zinc-900/90 border border-purple-500/30 rounded-2xl p-5 bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-purple-400 tracking-wider">
              Số Dư Traffic Credits
            </span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            {trafficCredits.toLocaleString()}{' '}
            <span className="text-sm font-normal text-zinc-400 font-sans">credits</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            Hạn dùng đến: <span className="text-zinc-200 font-medium">{expiredDate}</span>
          </p>
        </div>

        {/* Active Projects */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-cyan-400 tracking-wider">
              Chiến Dịch Đang Chạy
            </span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            {data.totalProjects}{' '}
            <span className="text-sm font-normal text-zinc-400 font-sans">chiến dịch</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Domain đích:{' '}
            <span className="text-white font-mono font-bold">leorank.site</span>
          </p>
        </div>

        {/* API Connection Info */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">
              Trạng Thái Kết Nối API
            </span>
            <Key className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Đã đồng bộ Live
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono truncate">
            Key: {data.account?.keyPrefix || 'tp_live_GKMs...'} • Org: {data.account?.keyName || 'LEORANK'}
          </p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Danh Sách Chiến Dịch Lưu Lượng
          </h3>
          <span className="text-xs text-zinc-500">
            Tự động kích hoạt qua TrafficPeak Network
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <BarLoader className="py-8" />
          </div>
        ) : data.projects.length === 0 ? (
          <div className="p-16 text-center text-zinc-500 space-y-2">
            <Globe className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
            <p className="text-sm font-medium text-zinc-300">Chưa có chiến dịch nào được tạo</p>
            <p className="text-xs text-zinc-500">Bấm nút "Tạo Chiến Dịch Mới" ở trên để khởi chạy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Chiến dịch / Mã PID</th>
                  <th className="px-5 py-3.5">Mô hình phân phối</th>
                  <th className="px-5 py-3.5">Domain mục tiêu</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Ngày khởi tạo</th>
                  <th className="px-5 py-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {data.projects.map((proj) => {
                  const isSerp = proj.type === 'serp';
                  return (
                    <tr key={proj.pid} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-xs sm:text-sm">
                          {proj.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          PID: {proj.pid}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isSerp
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {isSerp ? <Search className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          {isSerp ? 'Google SERP SEO' : 'Direct Traffic'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs font-mono text-zinc-300">
                        https://{proj.domain}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {proj.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-zinc-400">
                        {new Date(proj.createdAt).toLocaleString('vi-VN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <a
                          href="https://panel.trafficpeak.io/traffic/dashboard"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                        >
                          TrafficPeak <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-purple-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Khởi chạy chiến dịch Traffic</h3>
                  <p className="text-xs text-zinc-400">Bơm lưu lượng truy cập qua TrafficPeak API</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Tên chiến dịch:
                </label>
                <input
                  type="text"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Mô hình traffic:
                  </label>
                  <select
                    value={newProject.type}
                    onChange={(e) =>
                      setNewProject({ ...newProject, type: e.target.value as any })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="serp">Google SERP SEO (Từ khóa)</option>
                    <option value="direct">Direct Traffic (Trực tiếp)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Lượt khách / ngày:
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={10000}
                    required
                    value={newProject.visitorsPerDay}
                    onChange={(e) =>
                      setNewProject({ ...newProject, visitorsPerDay: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Domain mục tiêu:
                </label>
                <input
                  type="text"
                  required
                  value={newProject.domain}
                  onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {newProject.type === 'serp' && (
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center justify-between">
                    <span>Danh sách từ khóa SEO (Cách nhau dấu phẩy):</span>
                    <span className="text-[10px] text-amber-400 font-normal">SERP Keywords</span>
                  </label>
                  <textarea
                    rows={3}
                    value={newProject.keywords}
                    onChange={(e) => setNewProject({ ...newProject, keywords: e.target.value })}
                    placeholder="cày thuê liên quân, cày rank lol, cày thuê uy tín..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
              )}

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
                <span>
                  Chiến dịch sẽ tự động trừ credits trong tài khoản TrafficPeak của anh và bắt đầu phân phối lượt truy cập ngay sau khi tạo.
                </span>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {creating ? 'Đang tạo...' : 'Khởi Chạy Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
