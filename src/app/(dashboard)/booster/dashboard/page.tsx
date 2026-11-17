'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import {
  Wallet,
  Trophy,
  Clock,
  Loader2,
  Gamepad2,
  User,
  ShieldCheck,
  Zap,
  ArrowRight,
  Briefcase,
  Power,
  ChevronRight,
  ArrowUpRight,
  Star,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export default function BoosterDashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setIsReady(parsed.booster_info?.isReady ?? true);
    }

    fetch('/api/boosters/stats')
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error(`Fetch stats failed: ${res.status} ${res.statusText}`, text);
          throw new Error(`Failed to fetch stats: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const toggleAvailability = async () => {
    const newStatus = !isReady;
    setIsReady(newStatus);

    if (user) {
      const updatedUser = {
        ...user,
        booster_info: { ...(user.booster_info || {}), isReady: newStatus },
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
    }

    try {
      await apiFetch('/boosters/availability', {
        method: 'PATCH',
        body: JSON.stringify({ isReady: newStatus }),
      });
      toast.success(newStatus ? 'Đã bật trạng thái Sẵn sàng nhận đơn' : 'Đã chuyển sang trạng thái Tạm nghỉ');
    } catch {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-cyan-400">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
          Đang tải Booster Operations Center...
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-12 text-zinc-500 bg-zinc-900/40 rounded-3xl border border-zinc-800">
        Không thể tải dữ liệu bảng điều khiển.
      </div>
    );
  }

  const { stats, activeOrdersList = [] } = data;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* ========================================================================= */}
      {/* 1. BOOSTER COMMAND CENTER HEADER                                          */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#070b14] via-[#091024] to-[#0d162e] border border-cyan-500/20 p-4 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-72 w-72 sm:h-80 sm:w-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 h-36 w-36 sm:h-40 sm:w-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
          {/* Booster Profile Info */}
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-cyan-500 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.35)]">
                <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center overflow-hidden">
                  {user?.profile?.avatar || user?.avatar ? (
                    <img
                      src={user?.profile?.avatar || user?.avatar}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                      {user?.username?.charAt(0)?.toUpperCase() || 'B'}
                    </span>
                  )}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 p-0.5 sm:p-1 bg-zinc-950 rounded-full border border-amber-500/40">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate max-w-[180px] xs:max-w-[240px] sm:max-w-none">
                  {user?.username}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border bg-amber-950/50 border-amber-500/40 text-amber-300 shrink-0">
                  Tuyển Thủ Thách Đấu
                </span>
              </div>

              {/* Status and Toggle */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                <button
                  onClick={toggleAvailability}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-bold transition-all ${
                    isReady
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isReady ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                    }`}
                  />
                  <span>{isReady ? 'Đang Sẵn Sàng Nhận Đơn' : 'Đang Tạm Nghỉ'}</span>
                </button>
                <span className="text-zinc-600 hidden sm:inline">•</span>
                <span className="text-zinc-400">
                  Đang nhận <b className="text-white font-mono">{stats.activeOrders}</b> đơn cày
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
            <Link
              href="/booster/jobs"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Briefcase className="w-4 h-4" />
              <span>Sàn Việc Làm Đang Chờ</span>
            </Link>

            <Link
              href="/booster/services"
              className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-cyan-500/50 text-white text-xs sm:text-sm font-bold transition-all hover:bg-zinc-800 backdrop-blur-md"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Studio Dịch Vụ & Giá</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CORE PERFORMANCE TILES                                                 */}
      {/* ========================================================================= */}
      <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        {/* Tile 1: Total Income */}
        <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 sm:p-6 backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 truncate">
                Tổng Thu Nhập
              </span>
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-black text-emerald-400 font-mono tracking-tight mb-2 truncate">
              {(stats.totalIncome || 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
          <Link
            href="/wallet"
            className="text-[11px] sm:text-xs font-bold text-zinc-400 hover:text-emerald-300 flex items-center gap-1 transition-colors mt-auto pt-1"
          >
            <span>Rút tiền về ATM</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tile 2: Active Orders */}
        <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 sm:p-6 backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 truncate">
                Đơn Đang Thực Hiện
              </span>
              <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-black text-cyan-400 font-mono tracking-tight mb-2">
              {stats.activeOrders}
            </div>
          </div>
          <Link
            href="/booster/my-orders"
            className="text-[11px] sm:text-xs font-bold text-zinc-400 hover:text-cyan-300 flex items-center gap-1 transition-colors mt-auto pt-1"
          >
            <span>Quản lý đơn cày</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tile 3: Completed Orders */}
        <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 sm:p-6 backdrop-blur-sm transition-all hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 truncate">
                Đơn Đã Hoàn Thành
              </span>
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight mb-2">
              {stats.completedOrders}
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-zinc-500 mt-auto pt-1 truncate">
            Tỷ lệ thành công: <b className="text-emerald-400">{stats.completedOrders > 0 ? '100%' : 'Chưa có'}</b>
          </div>
        </div>

        {/* Tile 4: Rating & Trust */}
        <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 sm:p-6 backdrop-blur-sm transition-all hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 truncate">
                Đánh Giá & Uy Tín
              </span>
              <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <Star className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-black text-purple-300 font-mono tracking-tight mb-2">
              {stats.rating > 0 ? `${stats.rating.toFixed(1)} / 5.0 ★` : '0/0 ★'}
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-zinc-400 flex items-center justify-between mt-auto pt-1">
            <span>Cơ chế bảo vệ:</span>
            <span className="text-emerald-400 font-bold">Ký quỹ Escrow</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE JOBS (ĐƠN ĐANG THỰC HIỆN)                                       */}
      {/* ========================================================================= */}
      <div className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4 sm:p-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              {t('myActiveJobs')}
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              Các đơn hàng khách giao phó. Hãy bật VPN riêng và cập nhật tiến độ đều đặn.
            </p>
          </div>
          <Link
            href="/booster/my-orders"
            className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors shrink-0"
          >
            <span>{t('viewAll')}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div>
          {activeOrdersList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-inner">
                <Gamepad2 className="h-10 w-10 text-zinc-600" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Hiện bạn chưa nhận đơn cày nào</h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-6">
                Hàng chục đơn hàng mới đang chờ tuyển thủ nhận tại Sàn việc làm.
              </p>
              <Link
                href="/booster/jobs"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs shadow-md hover:scale-105 transition-all"
              >
                Khám Phá Sàn Việc Làm
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile View: High-tech Job Cards */}
              <div className="grid gap-3 p-4 md:hidden">
                {activeOrdersList.map((order: any) => (
                  <div
                    key={order._id}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 active:scale-[0.98] transition-transform cursor-pointer"
                    onClick={() => router.push(`/orders/${order._id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                          {order.customerId?.profile?.avatar ? (
                            <img
                              src={order.customerId.profile.avatar}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={14} className="text-zinc-500" />
                          )}
                        </div>
                        <span className="font-bold text-white text-xs">
                          {order.customerId?.username || 'Khách ẩn danh'}
                        </span>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Dịch vụ</span>
                      <span className="font-semibold text-zinc-200">{order.serviceType}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Tiền công Booster</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {order.pricing?.total_amount?.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-zinc-900 mt-1">
                      <span>{order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}</span>
                      <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                        Vào phòng đấu <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Data Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-950/80 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">Khách Hàng</th>
                      <th className="px-6 py-4 font-bold">Dịch Vụ Cày</th>
                      <th className="px-6 py-4 font-bold">Tiền Công (VND)</th>
                      <th className="px-6 py-4 font-bold">Trạng Thái</th>
                      <th className="px-6 py-4 font-bold">Ngày Nhận</th>
                      <th className="px-6 py-4 text-right">
                        <span className="sr-only">Thao tác</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs">
                    {activeOrdersList.map((order: any) => (
                      <tr
                        key={order._id}
                        className="group cursor-pointer transition-colors hover:bg-zinc-800/40"
                        onClick={() => router.push(`/orders/${order._id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                              {order.customerId?.profile?.avatar ? (
                                <img
                                  src={order.customerId.profile.avatar}
                                  alt="Avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={16} className="text-zinc-500" />
                              )}
                            </div>
                            <span className="font-bold text-white">
                              {order.customerId?.username || 'Khách ẩn danh'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-300">
                          {order.serviceType}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-400 text-sm">
                          {order.pricing?.total_amount?.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border bg-cyan-500/15 border-cyan-500/30 text-cyan-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 group-hover:border-cyan-500/40 text-cyan-400 font-bold text-xs flex items-center gap-1 ml-auto transition-colors">
                            Vào đơn <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
