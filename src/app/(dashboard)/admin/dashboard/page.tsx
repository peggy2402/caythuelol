'use client';

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
  Trophy
} from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';
import Link from 'next/link';

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
    } catch (e) { toast.error('Lỗi khi xuất báo cáo'); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!stats) return null;

  // Financial Health Calculation
  // Tiền mặt thực tế = Tổng Nạp - Tổng Rút
  const realCash = (stats.totalDeposits || 0) - (stats.totalWithdrawals || 0);
  
  // Tổng nợ phải trả = Ví User + Tiền cọc đang giữ
  const totalLiabilities = (stats.totalUserBalance || 0) + (stats.totalEscrow || 0);
  
  // Khả năng thanh khoản (Solvency) = Tiền mặt - Nợ
  // Nếu dương: Admin đang có lãi/dư tiền. Nếu âm: Admin đang tiêu lạm vào tiền của User.
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
    name: (item._id || 'Unknown').replace('_', ' '),
    value: item.count,
  }));
  const PIE_COLORS = ['#3b82f6', '#10b981', '#eab308', '#f97316', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tổng quan hệ thống</h1>
          <p className="text-sm text-zinc-400">Cập nhật lần cuối: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
            <input 
              type="date" 
              value={dateRange.from} 
              onChange={e => setDateRange(prev => ({...prev, from: e.target.value}))}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <span className="text-zinc-500">-</span>
            <input 
              type="date" 
              value={dateRange.to} 
              onChange={e => setDateRange(prev => ({...prev, to: e.target.value}))}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <button onClick={handleExport} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg" title="Xuất báo cáo tài chính"><Download size={16} /></button>
        </div>
      </div>

      {/* FINANCIAL HEALTH CHECK */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ShieldAlert className={isSolvent ? "text-green-500" : "text-red-500"} /> 
            Kiểm soát dòng tiền (Financial Health)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Tiền mặt thực tế (Net Cash)</p>
                <p className="text-xl font-mono font-bold text-white">
                    {realCash.toLocaleString()} đ
                </p>
                <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                   <ArrowUpRight size={10} className="text-green-500"/> {stats.totalDeposits.toLocaleString()} (Nạp)
                   <span className="mx-1">|</span>
                   <ArrowDownLeft size={10} className="text-red-500"/> {stats.totalWithdrawals.toLocaleString()} (Rút)
                </p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Nợ người dùng (User Wallets)</p>
                <p className="text-xl font-mono font-bold text-blue-400">
                    {(stats.totalUserBalance || 0).toLocaleString()} đ
                </p>
                <p className="text-[10px] text-zinc-600 mt-1">Số dư khả dụng của Users</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Tiền cọc đang giữ (Escrow)</p>
                <p className="text-xl font-mono font-bold text-yellow-500">
                    {(stats.totalEscrow || 0).toLocaleString()} đ
                </p>
                <p className="text-[10px] text-zinc-600 mt-1">Đơn đang chạy (Locked)</p>
            </div>
            <div className={`p-4 rounded-lg border ${isSolvent ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                <p className={`text-xs uppercase font-bold mb-1 ${isSolvent ? 'text-green-500' : 'text-red-500'}`}>
                    {isSolvent ? 'Lợi nhuận ròng (Admin Profit)' : 'CẢNH BÁO: THÂM HỤT'}
                </p>
                <p className={`text-xl font-mono font-bold ${isSolvent ? 'text-green-400' : 'text-red-400'}`}>
                    {solvency.toLocaleString()} đ
                </p>
                <p className="text-[10px] opacity-70 mt-1">
                    = Tiền mặt - (Ví User + Cọc)
                </p>
            </div>
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Boosters */}
        {stats.topBoosters && stats.topBoosters.length > 0 && (
          <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="text-yellow-500" /> Top Boosters
              </h3>
              <div className="space-y-3">
                  {stats.topBoosters.map((booster: any, index: number) => (
                      <div key={booster._id} className="flex items-center gap-4 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                          <span className="font-bold text-lg text-zinc-500 w-6 text-center">{index + 1}</span>
                          <img src={booster.avatar || '/default-avatar.png'} alt={booster.username} className="w-10 h-10 rounded-full object-cover" />
                          <div className="flex-1">
                              <div className="font-bold text-white">{booster.username}</div>
                              <div className="text-xs text-zinc-400">{booster.orderCount} đơn</div>
                          </div>
                          <div className="text-right font-mono">
                              <div className="font-bold text-green-400 text-base">{booster.totalEarnings.toLocaleString()} đ</div>
                              <div className="text-xs text-zinc-500">Thực nhận</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        )}
        {/* Top Spenders */}
        {stats.topSpenders && stats.topSpenders.length > 0 && (
          <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="text-green-500" /> Top Khách hàng chi tiêu
              </h3>
              <div className="space-y-3">
                  {stats.topSpenders.map((user: any, index: number) => (
                      <div key={user._id} className="flex items-center gap-4 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                          <span className="font-bold text-lg text-zinc-500 w-6 text-center">{index + 1}</span>
                          <img src={user.avatar || '/default-avatar.png'} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                          <div className="flex-1">
                              <div className="font-bold text-white">{user.username}</div>
                              <div className="text-xs text-zinc-400">{user.orderCount} đơn</div>
                          </div>
                          <div className="font-bold text-blue-400 text-base font-mono">{user.totalSpent.toLocaleString()} đ</div>
                      </div>
                  ))}
              </div>
          </div>
        )}
        {/* Top Depositors */}
        {stats.topDepositors && stats.topDepositors.length > 0 && (
          <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <ArrowUpRight className="text-emerald-500" /> Top Khách hàng nạp tiền
              </h3>
              <div className="space-y-3">
                  {stats.topDepositors.map((user: any, index: number) => (
                      <div key={user._id} className="flex items-center gap-4 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                          <span className="font-bold text-lg text-zinc-500 w-6 text-center">{index + 1}</span>
                          <img src={user.avatar || '/default-avatar.png'} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                          <div className="font-bold text-white flex-1">{user.username}</div>
                          <div className="font-bold text-emerald-400 text-base font-mono">{user.totalDeposited.toLocaleString()} đ</div>
                      </div>
                  ))}
              </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Doanh thu Admin (Fees)" 
          value={`${stats.adminRevenue.toLocaleString()} đ`} 
          icon={DollarSign} 
          color="text-green-500" 
          bg="bg-green-500/10" 
          desc={`Sàn: ${(stats.totalPlatformFees || 0).toLocaleString()} | Rút: ${(stats.totalWithdrawalFees || 0).toLocaleString()}`}
        />
        <StatCard 
          title="Tổng Người Dùng" 
          value={stats.totalUsers} 
          icon={Users} 
          color="text-blue-500" 
          bg="bg-blue-500/10" 
          desc={`${stats.totalBoosters} Boosters`}
        />
        <StatCard 
          title="Đơn Đang Chạy (Active)" 
          value={stats.activeOrders} 
          icon={Activity} 
          color="text-purple-500" 
          bg="bg-purple-500/10" 
        />
        <StatCard 
          title="Tổng Tiền Cọc (Hold)" 
          value={`${(stats.totalEscrow || 0).toLocaleString()} đ`} 
          icon={Lock} 
          color="text-yellow-500" 
          bg="bg-yellow-500/10" 
          desc="Tiền đang nằm trong các đơn hàng"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart className="text-blue-500" />
            Doanh thu Phí sàn theo tháng
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrencyForChart} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value: any) => {
                    if (typeof value === 'number') return [`${value.toLocaleString()} đ`, 'Doanh thu'];
                    return [value, 'Doanh thu'];
                  }}
                />
                <Bar dataKey="DoanhThu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Distribution Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <PieChartIcon className="text-purple-500" />
            Tỷ lệ Dịch vụ
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg, desc }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center gap-4 hover:border-zinc-700 transition-colors">
      <div className={`p-3 rounded-lg ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-zinc-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {desc && <p className="text-[10px] text-zinc-600 mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}