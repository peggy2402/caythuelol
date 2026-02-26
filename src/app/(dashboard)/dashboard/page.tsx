'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  Clock, 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  MoreHorizontal,
  Gamepad2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface Order {
  _id: string;
  service_type: string;
  status: string;
  pricing: {
    total_amount: number;
  };
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    // Kiểm tra đăng nhập từ localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    setUser(JSON.parse(userData));

    // Fetch orders
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders);
        }
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  if (loading) return <div className="flex h-96 items-center justify-center text-blue-500">Loading...</div>;

  const stats = [
    {
      label: t('totalOrders'),
      value: orders.length,
      icon: Gamepad2,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
    },
    {
      label: t('processing'),
      value: orders.filter(o =>
        ['PENDING_PAYMENT', 'IN_PROGRESS', 'APPROVED'].includes(o.status)
      ).length,
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
    },
    {
      label: t('balance'),
      value: `${user?.wallet_balance?.toLocaleString('vi-VN') || 0} đ`,
      icon: Wallet,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20',
    },
    {
      label: t('totalSpent'),
      value: '0 đ',
      icon: CreditCard,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/20',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 shadow-lg">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white">Xin chào, {user?.username}! 👋</h1>
          <p className="mt-2 text-blue-100">Chào mừng bạn quay trở lại. Bạn đang có <span className="font-bold text-white">{stats[1].value}</span> đơn hàng đang xử lý.</p>
          <p className="mt-2 text-blue-100">{t('welcomeDash')} <span className="font-bold text-white">{stats[1].value}</span> {t('ordersProcessing')}</p>
          <div className="mt-6 flex gap-3">
             <button className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-blue-600 shadow-lg transition-transform hover:scale-105 hover:bg-blue-50">
               + Tạo đơn mới
               + {t('createOrder')}
             </button>
             <button className="rounded-lg bg-blue-700/50 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-blue-700">
               Nạp tiền ngay
               {t('depositNow')}
             </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className={`group relative overflow-hidden rounded-xl border ${stat.border} bg-zinc-900/50 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
                <p className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`rounded-lg p-3 ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <h3 className="text-lg font-bold text-white">Đơn hàng gần đây</h3>
          <h3 className="text-lg font-bold text-white">{t('recentOrders')}</h3>
          <button className="flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300">
            Xem tất cả <ArrowUpRight className="h-4 w-4" />
            {t('viewAll')} <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-zinc-800 p-4">
                <Gamepad2 className="h-8 w-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-medium text-white">Chưa có đơn hàng nào</h3>
              <p className="mt-1 text-sm text-zinc-500">Hãy tạo đơn hàng đầu tiên để bắt đầu leo rank!</p>
              <h3 className="text-lg font-medium text-white">{t('noOrders')}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t('startRank')}</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Mã đơn</th>
                  <th className="px-6 py-4 font-medium">Dịch vụ</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 font-medium">Giá trị</th>
                  <th className="px-6 py-4 font-medium">Ngày tạo</th>
                  <th className="px-6 py-4 font-medium">{t('colId')}</th>
                  <th className="px-6 py-4 font-medium">{t('colService')}</th>
                  <th className="px-6 py-4 font-medium">{t('colStatus')}</th>
                  <th className="px-6 py-4 font-medium">{t('colPrice')}</th>
                  <th className="px-6 py-4 font-medium">{t('colDate')}</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order._id} className="group transition-colors hover:bg-white/5">
                    <td className="px-6 py-4 font-medium text-white">#{order._id.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4 text-zinc-300">{order.service_type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                        order.status === 'PENDING_PAYMENT' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          order.status === 'COMPLETED' ? 'bg-green-400' :
                          order.status === 'PENDING_PAYMENT' ? 'bg-yellow-400' :
                          'bg-blue-400'
                        }`} />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.pricing.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded p-1 text-zinc-500 hover:bg-white/10 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
