'use client';
import BarLoader from '@/components/ui/BarLoader';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ActiveOrderSpotlight from '@/components/dashboard/ActiveOrderSpotlight';
import MetricsCards from '@/components/dashboard/MetricsCards';
import QuickServicesHub from '@/components/dashboard/QuickServicesHub';
import RecentOrdersTable, { Order } from '@/components/dashboard/RecentOrdersTable';
import DepositModal from '@/components/dashboard/DepositModal';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, setLanguage } = useLanguage();

  // --- MODAL STATES FOR VIETQR DEPOSIT ---
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [bankConfig, setBankConfig] = useState<any>(null);

  useEffect(() => {
    // Kiểm tra token và phiên đăng nhập
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Điều hướng theo Role
    if (parsedUser.role === 'BOOSTER') {
      router.replace('/booster/dashboard');
      return;
    }
    if (parsedUser.role === 'ADMIN') {
      router.replace('/admin/dashboard');
      return;
    }

    // Fetch dữ liệu đơn hàng và cấu hình ví
    const fetchData = async () => {
      try {
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }

        // Fetch fresh user profile để đồng bộ VIP tier, role, total_points_earned
        const profileRes = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData && (profileData._id || profileData.user)) {
            const fresh = profileData.user || profileData;
            setUser((prev: any) => {
              const updated = { ...prev, ...fresh };
              localStorage.setItem('user', JSON.stringify(updated));
              return updated;
            });
          }
        }

        const walletRes = await fetch('/api/wallet');
        const walletData = await walletRes.json();
        if (walletRes.ok) {
          setBankConfig(walletData.bankInfo);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);



  if (loading) {
    return (
      <BarLoader
        className="h-96"
        label="Đang tải Player Command Center..."
      />
    );
  }

  // Calculate metrics
  const totalSpent = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, order) => sum + (order.pricing?.total_amount || 0), 0);

  const activeOrders = orders.filter((o) =>
    ['IN_PROGRESS', 'APPROVED', 'PENDING_PAYMENT'].includes(o.status)
  );

  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const spotlightOrder = activeOrders[0] || null;

  // User VIP Tier calculation (Dựa trên VIP Pass, Tổng chi tiêu hoặc Tổng điểm tích luỹ lịch sử)
  // TUYỆT ĐỐI không bị hạ cấp khi khách dùng điểm khả dụng đổi quà
  const getVipTier = (spent: number) => {
    if (user?.vip_info?.is_vip && user?.vip_info?.package_type) {
      const pkg = user.vip_info.package_type.toUpperCase();
      if (pkg.includes('KIM CƯƠNG') || pkg.includes('DIAMOND')) {
        return { name: 'VIP Kim Cương', discount: '15%', color: 'text-cyan-300', bg: 'bg-cyan-950/50 border-cyan-500/40' };
      }
      if (pkg.includes('VÀNG') || pkg.includes('GOLD')) {
        return { name: 'VIP Vàng', discount: '10%', color: 'text-amber-300', bg: 'bg-amber-950/50 border-amber-500/40' };
      }
      if (pkg.includes('BẠC') || pkg.includes('SILVER')) {
        return { name: 'VIP Bạc', discount: '5%', color: 'text-slate-300', bg: 'bg-slate-900/60 border-slate-600/40' };
      }
      return { name: user.vip_info.package_type, discount: '5%', color: 'text-amber-300', bg: 'bg-amber-950/50 border-amber-500/40' };
    }

    const totalEarnedPoints = user?.total_points_earned || 0;
    const effectivePoints = Math.max(spent / 1000, totalEarnedPoints);

    if (effectivePoints >= 5000) return { name: 'VIP Kim Cương', discount: '15%', color: 'text-cyan-300', bg: 'bg-cyan-950/50 border-cyan-500/40' };
    if (effectivePoints >= 2000) return { name: 'VIP Vàng', discount: '10%', color: 'text-amber-300', bg: 'bg-amber-950/50 border-amber-500/40' };
    if (effectivePoints >= 500) return { name: 'VIP Bạc', discount: '5%', color: 'text-slate-300', bg: 'bg-slate-900/60 border-slate-600/40' };
    return { name: 'Thành Viên', discount: '0%', color: 'text-zinc-400', bg: 'bg-zinc-900 border-zinc-800' };
  };

  const vip = getVipTier(totalSpent);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Header Command Center */}
      <DashboardHeader
        user={user}
        activeOrdersCount={activeOrders.length}
        vip={vip}
        language={language}
        setLanguage={setLanguage}
        onOpenDeposit={() => setIsDepositModalOpen(true)}
      />

      {/* 2. Spotlight Active Order */}
      <ActiveOrderSpotlight spotlightOrder={spotlightOrder} />

      {/* 3. Core Metrics */}
      <MetricsCards
        walletBalance={user?.wallet_balance || 0}
        activeOrdersCount={activeOrders.length}
        completedOrdersCount={completedOrders.length}
        totalSpent={totalSpent}
        vipDiscount={vip.discount}
        onOpenDeposit={() => setIsDepositModalOpen(true)}
      />

      {/* 4. Quick Services Launchpad */}
      <QuickServicesHub />

      {/* 5. Recent Orders Table */}
      <RecentOrdersTable orders={orders} />

      {/* 6. Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        user={user}
        bankConfig={bankConfig}
        onSuccess={(newBalance) => {
          setUser((prev: any) => ({ ...prev, wallet_balance: newBalance }));
        }}
      />
    </div>
  );
}
