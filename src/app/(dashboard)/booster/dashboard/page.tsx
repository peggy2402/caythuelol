'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { 
  Wallet, 
  Trophy, 
  Clock, 
  Loader2,
  Gamepad2,
  User
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function BoosterDashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetch('/api/boosters/stats')
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.error(`Fetch stats failed: ${res.status} ${res.statusText}`, text);
          throw new Error(`Failed to fetch stats: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setData(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;
  if (!data) return <div className="text-center p-10 text-zinc-500">Không thể tải dữ liệu.</div>;

  const { stats, activeOrdersList } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('hello')}, {user?.username}! 🏆</h1>
          <p className="text-zinc-400">Chào mừng trở lại. Bạn đang có <span className="text-yellow-500 font-bold">{stats.activeOrders}</span> đơn hàng đang thực hiện.</p>
        </div>
        <Link href="/booster/jobs" className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-yellow-500/20">
          {t('jobMarket')}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Tổng Thu Nhập" 
          value={`${stats.totalIncome.toLocaleString()} đ`} 
          icon={Wallet} 
          color="text-emerald-400" 
          bg="bg-emerald-500/10" 
        />
        <StatCard 
          title="Đơn Hoàn Thành" 
          value={stats.completedOrders} 
          icon={Trophy} 
          color="text-yellow-400" 
          bg="bg-yellow-500/10" 
        />
        <StatCard 
          title="Đang Thực Hiện" 
          value={stats.activeOrders} 
          icon={Clock} 
          color="text-blue-400" 
          bg="bg-blue-500/10" 
        />
      </div>

      {/* Active Orders List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Gamepad2 className="text-blue-500" /> {t('myActiveJobs')}
          </h3>
          <Link href="/booster/my-orders" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
            {t('viewAll')}
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-900 text-zinc-400 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Dịch vụ</th>
                <th className="px-6 py-4">Giá trị</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {activeOrdersList.length > 0 ? (
                activeOrdersList.map((order: any) => (
                  <tr key={order._id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                          {order.customerId?.profile?.avatar ? (
                            <img src={order.customerId.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} className="text-zinc-500" />
                          )}
                        </div>
                        <span className="font-medium text-white">{order.customerId?.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {order.serviceType}
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-400">
                      {order.pricing?.total_amount?.toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {order.updatedAt ? format(new Date(order.updatedAt), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    Bạn chưa nhận đơn hàng nào. <Link href="/booster/jobs" className="text-yellow-500 hover:underline">Tìm việc ngay</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
