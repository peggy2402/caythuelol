'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  DollarSign, 
  ShoppingBag, 
  Activity, 
  Loader2,
  TrendingUp,
  CreditCard,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;
  if (!user) return null;

  if (user.role === 'ADMIN') return <AdminDashboard />;
  if (user.role === 'BOOSTER') return <BoosterDashboard user={user} />;
  return <CustomerDashboard user={user} />;
}

// --- ADMIN DASHBOARD ---
function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => setStats(data))
      .catch(err => {
        console.error(err);
        setError(true);
      });
  }, []);

  if (error) return <div className="flex justify-center p-20 text-red-500">Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.</div>;
  if (!stats) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

  const pieData = [
    { name: 'Customers', value: stats.breakdown.customers },
    { name: 'Boosters', value: stats.breakdown.boosters },
  ];
  const COLORS = ['#3b82f6', '#eab308'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Tổng quan hệ thống</h1>
        <div className="text-sm text-zinc-400">Cập nhật lần cuối: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng Doanh Thu" 
          value={`${stats.totalRevenue.toLocaleString()} đ`} 
          icon={DollarSign} 
          color="text-green-500" 
          bg="bg-green-500/10" 
        />
        <StatCard 
          title="Tổng Người Dùng" 
          value={stats.totalUsers} 
          icon={Users} 
          color="text-blue-500" 
          bg="bg-blue-500/10" 
        />
        <StatCard 
          title="Đơn Đang Chạy" 
          value={stats.activeOrders} 
          icon={Activity} 
          color="text-purple-500" 
          bg="bg-purple-500/10" 
        />
        <StatCard 
          title="Tổng Giá Trị GD" 
          value={`${stats.totalVolume.toLocaleString()} đ`} 
          icon={ShoppingBag} 
          color="text-yellow-500" 
          bg="bg-yellow-500/10" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" /> Biểu đồ doanh thu (30 ngày)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueChart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickFormatter={(str) => str.slice(5)} />
                <YAxis stroke="#71717a" fontSize={12} tickFormatter={(num) => `${num/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                  formatter={(value?: number) => [
                    value ? value.toLocaleString("vi-VN") + "đ" : "0đ",
                    "Doanh thu",
                  ]}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Phân bố người dùng
          </h3>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{stats.totalUsers}</span>
              <span className="text-xs text-zinc-500">Users</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-zinc-400">Customers ({stats.breakdown.customers})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-zinc-400">Boosters ({stats.breakdown.boosters})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CUSTOMER DASHBOARD ---
function CustomerDashboard({ user }: { user: any }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/20 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('hello')}, {user.username}! 👋</h1>
        <p className="text-zinc-300">{t('welcomeDash')} <span className="text-blue-400 font-bold">0</span> {t('ordersProcessing')}</p>
        <div className="flex gap-4 mt-6">
          <Link href="/services" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">
            {t('createOrder')}
          </Link>
          <Link href="/wallet" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
            {t('depositNow')}
          </Link>
        </div>
      </div>
      {/* Add more customer widgets here */}
    </div>
  );
}

// --- BOOSTER DASHBOARD ---
function BoosterDashboard({ user }: { user: any }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-500/20 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('hello')}, {user.username}! 🏆</h1>
        <p className="text-zinc-300">Sẵn sàng nhận đơn? Kiểm tra <Link href="/booster/jobs" className="text-yellow-400 hover:underline">Sàn việc làm</Link> ngay.</p>
        <div className="flex gap-4 mt-6">
          <Link href="/booster/jobs" className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold transition-colors">
            {t('jobMarket')}
          </Link>
          <Link href="/booster/my-orders" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
            {t('myActiveJobs')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center gap-4 hover:border-zinc-700 transition-colors">
      <div className={`p-3 rounded-lg ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-zinc-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
