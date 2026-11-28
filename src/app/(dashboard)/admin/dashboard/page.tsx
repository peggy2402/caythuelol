'use client';
import BarLoader from '@/components/ui/BarLoader';

import { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Activity,
  Loader2,
  ShieldAlert,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart,
  PieChart as PieChartIcon,
  Download,
  Trophy,
  Crown,
  Gamepad2,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import Link from 'next/link';
import UserBadge from '@/components/UserBadge';

const formatDateForAPI = (date: Date) => date.toISOString().split('T')[0];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: formatDateForAPI(new Date(new Date().setMonth(new Date().getMonth() - 6))),
    to: formatDateForAPI(new Date()),
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams({
          startDate: dateRange.from,
          endDate: dateRange.to,
        });
        const res = await fetch(`/api/admin/stats?${params.toString()}`);
        const data = await res.json();
        if (res.ok) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error(error);
        toast.error('Lỗi tải thống kê');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [dateRange]);

  const handleExport = async () => {
    toast.info('Đang tạo báo cáo...');
    try {
      const params = new URLSearchParams({
        startDate: dateRange.from,
        endDate: dateRange.to,
      });
      const res = await fetch(`/api/admin/export/financials?${params.toString()}`);
      if (!res.ok) throw new Error('Lỗi khi tạo file');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_report_${dateRange.from}_to_${dateRange.to}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Lỗi khi xuất báo cáo');
    }
  };

  if (loading) {
    return <BarLoader className="h-[50vh]" />;
  }

  if (!stats) return null;

  // Financial Health Calculation
  // Tiền mặt thực tế = Tổng Nạp - Tổng Rút
  const realCash = (stats.totalDeposits || 0) - (stats.totalWithdrawals || 0);

  // Tổng nợ phải trả = Ví User + Tiền cọc đang giữ (Escrow thực tế)
  const totalLiabilities = (stats.totalUserBalance || 0) + (stats.totalEscrow || 0);

  // Khả năng thanh khoản (Solvency) = Tiền mặt - Nợ
  const solvency = realCash - totalLiabilities;
  const isSolvent = solvency >= 0;

  const chartData = (stats.monthlyRevenue || []).map((item: any) => ({
    name: `T${item._id.month}/${item._id.year.toString().slice(-2)}`,
    DoanhThu: item.total,
  }));

  const formatCurrencyForChart = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}Tr`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const serviceChartData = (stats.ordersByService || []).map((item: any) => ({
    name: item.name || item._id || 'Dịch vụ khác',
    value: item.count,
    amount: item.totalAmount || 0,
    game: item.game || 'LMHT',
    service: item.service || 'Cày Rank',
  }));

  const PIE_COLORS = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#06b6d4',
    '#f97316',
    '#6366f1',
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Tổng quan hệ thống</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
          />
          <span className="text-zinc-500">-</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
          />
          <button
            onClick={handleExport}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            title="Xuất báo cáo tài chính"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* FINANCIAL HEALTH CHECK */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2.5">
          <ShieldAlert className={isSolvent ? 'text-green-500' : 'text-red-500'} />
          Kiểm soát dòng tiền (Financial Health)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">
              Tiền mặt thực tế (Net Cash)
            </p>
            <p className="text-xl font-mono font-bold text-white">
              {(realCash || 0).toLocaleString()} đ
            </p>
            <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1">
              <ArrowUpRight size={12} className="text-green-500" />{' '}
              {(stats.totalDeposits || 0).toLocaleString()} (Nạp)
              <span className="mx-1">|</span>
              <ArrowDownLeft size={12} className="text-red-500" />{' '}
              {(stats.totalWithdrawals || 0).toLocaleString()} (Rút)
            </p>
          </div>

          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">
              Nợ người dùng (User Wallets)
            </p>
            <p className="text-xl font-mono font-bold text-blue-400">
              {(stats.totalUserBalance || 0).toLocaleString()} đ
            </p>
            <p className="text-[10px] text-zinc-500 mt-1.5">Số dư khả dụng trong ví Users</p>
          </div>

          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-zinc-500 uppercase font-bold">
                Tiền cọc đang giữ (Escrow)
              </p>
              <Link href="/admin/deposits" className="text-[10px] text-yellow-500 hover:underline">
                Chi tiết →
              </Link>
            </div>
            <p className="text-xl font-mono font-bold text-yellow-500">
              {(stats.totalEscrow || 0).toLocaleString()} đ
            </p>
            <p className="text-[10px] text-zinc-500 mt-1.5">
              Đơn đang cày & tranh chấp (Active)
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isSolvent
                ? 'bg-green-900/10 border-green-500/20'
                : 'bg-red-900/10 border-red-500/20'
            }`}
          >
            <p
              className={`text-xs uppercase font-bold mb-1 ${
                isSolvent ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {isSolvent ? 'Khả năng thanh khoản (Solvent)' : 'CẢNH BÁO: THÂM HỤT'}
            </p>
            <p
              className={`text-xl font-mono font-bold ${
                isSolvent ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {(solvency || 0).toLocaleString()} đ
            </p>
            <p className="text-[10px] opacity-70 mt-1.5">= Tiền mặt - (Ví User + Cọc)</p>
          </div>
        </div>
      </div>

      {/* REVENUE BREAKDOWN & STATS CARDS */}
      <div>
        <h3 className="text-sm uppercase font-bold text-zinc-400 tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Các nguồn Doanh thu & Chỉ số Vận hành
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tổng Doanh thu Admin */}
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-all bg-gradient-to-br from-emerald-500/5 to-transparent shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Tổng Doanh thu Admin
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-mono font-black text-white">
                {(stats.adminRevenue || 0).toLocaleString()} đ
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>• Phí sàn:</span>
                <span className="text-white font-mono font-medium">
                  {(stats.totalPlatformFees || 0).toLocaleString()} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span>• Hội viên VIP:</span>
                <span className="text-amber-400 font-mono font-medium">
                  {(stats.totalVipRevenue || 0).toLocaleString()} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span>• Phí rút tiền:</span>
                <span className="text-blue-400 font-mono font-medium">
                  {(stats.totalWithdrawalFees || 0).toLocaleString()} đ
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Doanh thu Hội viên VIP */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Doanh thu Hội viên VIP
                </span>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Crown className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-mono font-black text-white">
                {(stats.totalVipRevenue || 0).toLocaleString()} đ
              </p>
            </div>
            <p className="mt-3 text-[11px] text-zinc-400 pt-3 border-t border-zinc-800/80">
              Gói VIP Đồng, Bạc, Vàng, Kim Cương
            </p>
          </div>

          {/* Card 3: Đơn Đang Chạy */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Đơn Đang Chạy (Active)
                </span>
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-mono font-black text-white">
                {stats.activeOrders}{' '}
                <span className="text-sm font-normal text-zinc-400 font-sans">đơn</span>
              </p>
            </div>
            <p className="mt-3 text-[11px] text-zinc-400 pt-3 border-t border-zinc-800/80">
              Đơn cày thuê đang trong tiến trình
            </p>
          </div>

          {/* Card 4: Tổng Người Dùng & Booster */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Tổng Người Dùng
                </span>
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-mono font-black text-white">
                {stats.totalUsers + stats.totalBoosters}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex justify-between">
              <span>Khách: {stats.totalUsers}</span>
              <span className="text-purple-400 font-medium">Boosters: {stats.totalBoosters}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
        {/* Top Boosters */}
        {stats.topBoosters && stats.topBoosters.length > 0 && (
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500 w-5 h-5 shrink-0" />
              <span>Top Boosters</span>
            </h3>
            <div className="space-y-2.5">
              {stats.topBoosters.map((booster: any, index: number) => (
                <div
                  key={booster._id}
                  className="flex items-center justify-between gap-3 p-3 bg-zinc-950/80 hover:bg-zinc-950 rounded-xl border border-zinc-800/70 hover:border-zinc-700/80 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <span
                      className={`w-6 text-center font-black text-sm shrink-0 ${
                        index === 0
                          ? 'text-amber-400'
                          : index === 1
                          ? 'text-zinc-300'
                          : index === 2
                          ? 'text-amber-600'
                          : 'text-zinc-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <img
                      src={booster.avatar || '/default-avatar.png'}
                      alt={booster.username}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 leading-snug">
                        <span className="truncate" title={booster.username}>
                          {booster.username}
                        </span>
                        <UserBadge role="BOOSTER" size="xs" />
                      </div>
                      <div className="text-[11px] text-zinc-400 font-medium">
                        {booster.orderCount} đơn hoàn thành
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <div className="font-bold text-emerald-400 text-xs sm:text-sm font-mono whitespace-nowrap">
                      {(booster.totalEarnings || 0).toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-zinc-500 font-medium whitespace-nowrap">
                      Thực nhận
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Spenders */}
        {stats.topSpenders && stats.topSpenders.length > 0 && (
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="text-green-500 w-5 h-5 shrink-0" />
              <span>Top Khách hàng chi tiêu</span>
            </h3>
            <div className="space-y-2.5">
              {stats.topSpenders.map((user: any, index: number) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between gap-3 p-3 bg-zinc-950/80 hover:bg-zinc-950 rounded-xl border border-zinc-800/70 hover:border-zinc-700/80 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <span
                      className={`w-6 text-center font-black text-sm shrink-0 ${
                        index === 0
                          ? 'text-amber-400'
                          : index === 1
                          ? 'text-zinc-300'
                          : index === 2
                          ? 'text-amber-600'
                          : 'text-zinc-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.username}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 leading-snug"
                        title={user.username}
                      >
                        <span className="truncate">{user.username}</span>
                        <UserBadge role="CUSTOMER" totalSpent={user.totalSpent} size="xs" />
                      </div>
                      <div className="text-[11px] text-zinc-400 font-medium">
                        {user.orderCount} đơn đã đặt
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <div className="font-bold text-blue-400 text-xs sm:text-sm font-mono whitespace-nowrap">
                      {(user.totalSpent || 0).toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-zinc-500 font-medium whitespace-nowrap">
                      Đã chi tiêu
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Depositors */}
        {stats.topDepositors && stats.topDepositors.length > 0 && (
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm md:col-span-2 xl:col-span-1">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ArrowUpRight className="text-emerald-500 w-5 h-5 shrink-0" />
              <span>Top Khách hàng nạp tiền</span>
            </h3>
            <div className="space-y-2.5">
              {stats.topDepositors.map((user: any, index: number) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between gap-3 p-3 bg-zinc-950/80 hover:bg-zinc-950 rounded-xl border border-zinc-800/70 hover:border-zinc-700/80 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <span
                      className={`w-6 text-center font-black text-sm shrink-0 ${
                        index === 0
                          ? 'text-amber-400'
                          : index === 1
                          ? 'text-zinc-300'
                          : index === 2
                          ? 'text-amber-600'
                          : 'text-zinc-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.username}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 leading-snug"
                        title={user.username}
                      >
                        <span className="truncate">{user.username}</span>
                        <UserBadge role="CUSTOMER" totalSpent={user.totalDeposited} size="xs" />
                      </div>
                      <div className="text-[11px] text-zinc-400 font-medium">Nạp vào ví</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <div className="font-bold text-emerald-400 text-xs sm:text-sm font-mono whitespace-nowrap">
                      {(user.totalDeposited || 0).toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-zinc-500 font-medium whitespace-nowrap">
                      Đã nạp
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart className="text-blue-500" />
            Doanh thu Phí sàn theo tháng
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            Đã trừ các đơn bị tranh chấp hoàn tiền thành công. Phản ánh thực tế lợi nhuận sàn thu được.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis
                  dataKey="name"
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCurrencyForChart}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '0.75rem',
                  }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value: any) => {
                    if (typeof value === 'number')
                      return [`${value.toLocaleString()} đ`, 'Doanh thu phí sàn'];
                    return [value, 'Doanh thu'];
                  }}
                />
                <Bar dataKey="DoanhThu" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Distribution Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <PieChartIcon className="text-purple-500" />
              Tỷ lệ Dịch vụ & Tựa Game
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Phân loại theo tựa game và mô hình cày
            </p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {serviceChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '0.75rem',
                    }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value} đơn (${(item.payload.amount || 0).toLocaleString()} đ)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2 max-h-40 overflow-y-auto pr-1">
            {serviceChartData.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-zinc-950/60"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="truncate text-zinc-300 font-medium">{item.name}</span>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="text-white font-mono font-bold">{item.value}</span>{' '}
                  <span className="text-[10px] text-zinc-500">đơn</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
