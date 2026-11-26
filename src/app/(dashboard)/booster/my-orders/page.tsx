'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BarLoader from '@/components/ui/BarLoader';
import {
  Briefcase,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  User,
  Calendar,
  Copy,
  Check,
  Flame,
  Coins,
  X,
  ArrowRight,
  Sparkles,
  Trophy,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getBoosterEarnings } from '@/lib/orderPricing';
import { formatServiceNameVi } from '@/lib/orderStatus';
import { formatRankDisplayVi } from '@/lib/riotRanks';
import { getGameById } from '@/lib/games';

export default function BoosterOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  // Pull to Refresh State
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/boosters/my-orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === 0 || window.scrollY > 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) setPullY(diff * 0.4);
  };

  const handleTouchEnd = async () => {
    if (pullY > 60) {
      setIsRefreshing(true);
      setPullY(60);
      await fetchOrders(false);
      setIsRefreshing(false);
    }
    setPullY(0);
    startY.current = 0;
  };

  // Thống kê đơn hàng và doanh thu
  const stats = useMemo(() => {
    const inProgress = orders.filter((o) => o.status === 'IN_PROGRESS').length;
    const pendingEarnings = orders
      .filter((o) => ['IN_PROGRESS', 'APPROVED', 'PAID'].includes(o.status))
      .reduce((acc, curr) => acc + getBoosterEarnings(curr.pricing), 0);

    const counts = {
      ALL: orders.length,
      IN_PROGRESS: inProgress,
      APPROVED: orders.filter((o) => ['APPROVED', 'PAID'].includes(o.status)).length,
      COMPLETED: orders.filter((o) => ['COMPLETED', 'SETTLED'].includes(o.status)).length,
      CANCELLED: orders.filter((o) =>
        ['CANCELLED', 'REJECTED', 'REFUNDED', 'DISPUTED'].includes(o.status)
      ).length,
    };

    return { inProgress, pendingEarnings, counts };
  }, [orders]);

  // Bộ lọc
  const filterOptions = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'IN_PROGRESS', label: 'Đang làm', dotColor: 'bg-blue-400' },
    { id: 'APPROVED', label: 'Đã nhận (Chờ cày)', dotColor: 'bg-purple-400' },
    { id: 'COMPLETED', label: 'Hoàn thành', dotColor: 'bg-emerald-400' },
    { id: 'CANCELLED', label: 'Đã hủy', dotColor: 'bg-rose-400' },
  ];

  // Logic lọc đơn hàng
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!order) return false;
      const status = order.status || '';

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'IN_PROGRESS'
          ? status === 'IN_PROGRESS'
          : statusFilter === 'APPROVED'
          ? ['APPROVED', 'PAID'].includes(status)
          : statusFilter === 'COMPLETED'
          ? ['COMPLETED', 'SETTLED'].includes(status)
          : statusFilter === 'CANCELLED'
          ? ['REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'].includes(status)
          : true;

      const q = search.trim().toLowerCase();
      const code = (order.orderCode || order._id || '').toLowerCase();
      const sType = (order.serviceType || order.service_type || '').toLowerCase();
      const customer = (
        order.customerId?.username ||
        order.customer_id?.username ||
        ''
      ).toLowerCase();

      const matchesSearch =
        !q ||
        code.includes(q) ||
        sType.includes(q) ||
        customer.includes(q) ||
        `#${code}`.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã đơn #${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleStartBoost = async (e: React.MouseEvent, orderId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setStartingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Đã chuyển trạng thái sang "Đang làm"! Bắt đầu cày nào.');
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: 'IN_PROGRESS' } : o))
        );
        router.push(`/orders/${orderId}`);
      } else {
        toast.error(data.message || data.error || 'Lỗi khi bắt đầu cày');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setStartingId(null);
    }
  };

  if (loading) {
    return <BarLoader className="py-24" />;
  }

  return (
    <div
      className="space-y-6 animate-fade-in max-w-6xl mx-auto min-h-[85vh] pb-12"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. HEADER SECTION (TIÊU ĐỀ + 2 STAT CARDS) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Danh sách đơn làm việc
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Quản lý tiến độ, cập nhật trạng thái và theo dõi thu nhập các đơn cày của bạn.
          </p>
        </div>

        {/* 2 Stat Cards bên góc phải */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {/* Card 1: Đang thực hiện */}
          <div className="flex-1 lg:flex-initial flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm shadow-md min-w-[130px]">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-medium block leading-tight">
                Đang thực hiện
              </span>
              <span className="text-sm sm:text-base font-black text-white font-mono leading-tight">
                {stats.inProgress} đơn
              </span>
            </div>
          </div>

          {/* Card 2: Thu nhập chờ duyệt */}
          <div className="flex-1 lg:flex-initial flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm shadow-md min-w-[160px]">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-medium block leading-tight">
                Thu nhập chờ duyệt
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-400 font-mono leading-tight">
                {new Intl.NumberFormat('vi-VN').format(stats.pendingEarnings)} đ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      <div
        className="flex justify-center overflow-hidden transition-all duration-300 ease-out"
        style={{
          height: pullY > 0 ? pullY : isRefreshing ? 60 : 0,
          opacity: pullY > 0 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 text-zinc-400 text-sm py-4">
          {isRefreshing ? (
            <Loader2 className="animate-spin w-5 h-5 text-blue-500" />
          ) : (
            <RefreshCw
              className={`w-5 h-5 ${
                pullY > 60 ? 'text-blue-500 rotate-180 transition-transform' : ''
              }`}
            />
          )}
          {isRefreshing ? 'Đang cập nhật...' : 'Kéo để làm mới'}
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR (CONTAINER BO TRÒN HIỆN ĐẠI) */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-lg">
        {/* Filter Pills with Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filterOptions.map((opt) => {
            const isActive = statusFilter === opt.id;
            const count = (stats.counts as any)[opt.id] ?? 0;
            return (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id)}
                type="button"
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                {opt.dotColor && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${opt.dotColor} ${
                      isActive ? 'ring-2 ring-white/30' : ''
                    }`}
                  />
                )}
                <span>{opt.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                    isActive ? 'bg-blue-500/40 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm mã đơn (#BK-...) hoặc tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 bg-zinc-950/80 border border-zinc-800 focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 rounded-xl pl-9 pr-8 text-xs text-white placeholder:text-zinc-500 outline-none transition-all font-medium"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. ORDER CARDS LIST */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/40 rounded-2xl border border-white/5">
          <Briefcase className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Không có đơn hàng nào</h3>
          <p className="text-zinc-400 text-xs mb-5 max-w-sm mx-auto">
            {statusFilter === 'ALL'
              ? 'Hiện bạn chưa có đơn hàng nào trong danh sách nhận cày.'
              : `Không tìm thấy đơn hàng nào ở trạng thái "${
                  filterOptions.find((o) => o.id === statusFilter)?.label
                }".`}
          </p>
          <Link
            href="/booster/jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all"
          >
            <span>Đến Sàn việc làm</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const rawStatus = order.status || '';
            const isApproved = ['APPROVED', 'PAID'].includes(rawStatus);
            const isInProgress = rawStatus === 'IN_PROGRESS';
            const isCompleted = ['COMPLETED', 'SETTLED'].includes(rawStatus);
            const isCancelled = ['CANCELLED', 'REJECTED', 'REFUNDED', 'DISPUTED'].includes(
              rawStatus
            );

            // Theme màu sắc theo trạng thái
            const theme = isInProgress
              ? {
                  leftBar: 'bg-gradient-to-b from-blue-500 to-cyan-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]',
                  iconBox: 'bg-blue-500/15 border-blue-500/30 text-blue-400 shadow-inner shadow-blue-500/10',
                  badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                  badgeDot: 'bg-blue-400 animate-ping',
                  label: 'ĐANG LÀM',
                  actionBtn:
                    'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold shadow-md shadow-blue-600/30',
                  actionText: 'Cập nhật',
                  Icon: Play,
                }
              : isApproved
              ? {
                  leftBar: 'bg-gradient-to-b from-purple-500 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]',
                  iconBox: 'bg-purple-500/15 border-purple-500/30 text-purple-300 shadow-inner shadow-purple-500/10',
                  badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
                  badgeDot: 'bg-purple-400',
                  label: 'ĐÃ NHẬN (CHỜ CÀY)',
                  actionBtn:
                    'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/80 font-bold hover:border-zinc-500',
                  actionText: 'Bắt đầu cày',
                  Icon: Briefcase,
                }
              : isCancelled
              ? {
                  leftBar: 'bg-gradient-to-b from-rose-500 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
                  iconBox: 'bg-red-500/15 border-red-500/30 text-red-400 shadow-inner shadow-red-500/10',
                  badge: 'bg-red-500/15 text-red-300 border-red-500/30',
                  badgeDot: 'bg-red-400',
                  label: 'ĐÃ HỦY',
                  actionBtn:
                    'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 font-semibold',
                  actionText: 'Xem lý do',
                  Icon: XCircle,
                }
              : {
                  leftBar: 'bg-gradient-to-b from-emerald-500 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]',
                  iconBox: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-inner shadow-emerald-500/10',
                  badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                  badgeDot: 'bg-emerald-400',
                  label: 'HOÀN THÀNH',
                  actionBtn:
                    'bg-zinc-900 hover:bg-zinc-800 text-emerald-300 hover:text-white border border-emerald-500/30 font-semibold',
                  actionText: 'Xem chi tiết',
                  Icon: CheckCircle2,
                };

            const orderCode =
              order.orderCode || order._id?.slice(-6).toUpperCase() || 'BK-ORDER';
            const customerName =
              order.customerId?.username || order.customer_id?.username || 'Khách hàng';
            const orderDate = new Date(order.createdAt || order.created_at).toLocaleDateString(
              'vi-VN'
            );
            const earnings = getBoosterEarnings(order.pricing);

            const gameCode = (
              order.snapshot?.gameCode ||
              order.details?.game ||
              order.game ||
              'LOL'
            ).toUpperCase();
            const gameMeta = getGameById(gameCode);

            // Trích xuất Addons/SLA nếu có
            const schedule =
              order.options?.scheduleDetails ||
              order.details?.scheduleDetails ||
              order.details?.addons?.scheduleDetails;
            const roles: string[] =
              order.options?.roles ||
              order.options?.selectedRoles ||
              order.details?.roles ||
              order.details?.selectedRoles ||
              [];
            const champs: string[] =
              order.options?.champions ||
              order.options?.selectedChampions ||
              order.details?.champions ||
              order.details?.selectedChampions ||
              [];

            return (
              <div
                key={order._id}
                onClick={() => router.push(`/orders/${order._id}`)}
                className="group relative rounded-2xl bg-zinc-950/90 border border-zinc-800/80 hover:border-zinc-700 transition-all p-4 sm:p-5 shadow-lg overflow-hidden cursor-pointer active:scale-[0.995]"
              >
                {/* Viền phát sáng bên trái */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 rounded-l-2xl ${theme.leftBar}`} />

                <div className="flex flex-col gap-3.5">
                  {/* HÀNG 1: HEADER CARD (ICON, TIÊU ĐỀ, MÃ ĐƠN, TÊN KHÁCH, NGÀY) */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Icon Squircle */}
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${theme.iconBox}`}
                      >
                        <theme.Icon className="w-5 h-5" />
                      </div>

                      {/* Tiêu đề & metadata */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-blue-400 transition-colors truncate">
                            {formatServiceNameVi(
                              order.serviceType || order.service_type,
                              order.details
                            )}
                          </h3>

                          {/* Game Tag */}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-zinc-300 shrink-0">
                            {gameMeta?.shortName || gameCode}
                          </span>

                          {/* Order Code Badge with Copy button */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(e, orderCode)}
                            title="Sao chép mã đơn hàng"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 text-[11px] font-mono transition-colors cursor-pointer"
                          >
                            <span>#{orderCode}</span>
                            {copiedCode === orderCode ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Sub metadata: Khách hàng + Ngày tạo */}
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                          <span className="flex items-center gap-1 truncate">
                            <User className="w-3 h-3 text-zinc-500" />
                            <span>
                              Khách: <strong className="text-zinc-300 font-medium">{customerName}</strong>
                            </span>
                          </span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700 shrink-0" />
                          <span className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            <span>{orderDate}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HÀNG 2: MỤC TIÊU & TÙY CHỌN BỔ TRỢ (ĐƯỜNG KẺ ĐỨT NGĂN CÁCH) */}
                  <div className="pt-2.5 pb-2 border-t border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-zinc-500 font-medium text-xs">Mục tiêu:</span>
                      {order.details?.is_point_boost ? (
                        <span className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700/80 font-mono font-bold text-white shadow-sm">
                          {order.details.start_lp ?? order.details.current_points ?? 0}{' '}
                          {order.details.unit || 'LP'}{' '}
                          <span className="text-cyan-400">➔</span>{' '}
                          {order.details.target_lp ?? order.details.desired_points ?? 100}{' '}
                          {order.details.unit || 'LP'}
                        </span>
                      ) : order.serviceType === 'MATCHES' || order.details?.is_matches ? (
                        <span className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700/80 font-bold text-blue-300 shadow-sm flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-blue-400" />
                          <span>
                            {order.details?.match_count || order.details?.matches || 1} trận (
                            {order.details?.queue_type === 'FLEX' ? 'Linh Hoạt' : 'Đơn / Đôi'})
                          </span>
                        </span>
                      ) : order.serviceType === 'PLACEMENTS' || order.details?.is_placements ? (
                        <span className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700/80 font-bold text-amber-300 shadow-sm flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {order.details?.placement_matches || order.details?.matches || 5} trận
                            phân hạng
                          </span>
                        </span>
                      ) : order.details?.current_rank && order.details?.desired_rank ? (
                        <span className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700/80 font-bold text-white shadow-sm flex items-center gap-1.5">
                          <span>{formatRankDisplayVi(order.details.current_rank)}</span>
                          <span className="text-cyan-400 font-bold">➔</span>
                          <span className="text-cyan-300">
                            {formatRankDisplayVi(order.details.desired_rank)}
                          </span>
                        </span>
                      ) : order.details?.current_level && order.details?.desired_level ? (
                        <span className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700/80 font-bold text-white shadow-sm flex items-center gap-1.5">
                          <span>Lv.{order.details.current_level}</span>
                          <span className="text-cyan-400">➔</span>
                          <span className="text-cyan-300">Lv.{order.details.desired_level}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-300 font-medium">Theo thỏa thuận</span>
                      )}
                    </div>

                    {/* Preview Addons/SLA nếu có (Lịch cày, lane, champions) */}
                    <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
                      {schedule && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[11px] font-medium">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span>{schedule.timeWindow || 'SLA cam kết'}</span>
                        </span>
                      )}
                      {roles.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[11px] font-medium">
                          <span>Lane: {roles.join(', ')}</span>
                        </span>
                      )}
                      {champs.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-medium">
                          <span>Tướng: {champs.slice(0, 2).join(', ')}{champs.length > 2 ? '...' : ''}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* HÀNG 3: FOOTER CARD (THU NHẬP & STATUS BADGE + ACTION BUTTON) */}
                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    {/* Cột trái: Thu nhập */}
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
                        THU NHẬP
                      </span>
                      <span
                        className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                          isCancelled
                            ? 'text-zinc-500 line-through'
                            : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                        }`}
                      >
                        {new Intl.NumberFormat('vi-VN').format(earnings)} đ
                      </span>
                    </div>

                    {/* Cột phải: Status Badge & Action Button */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border tracking-wide whitespace-nowrap shadow-sm ${theme.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.badgeDot} shrink-0`} />
                        <span>{theme.label}</span>
                      </span>

                      {/* Action Button */}
                      {isApproved ? (
                        <button
                          type="button"
                          disabled={startingId === order._id}
                          onClick={(e) => handleStartBoost(e, order._id)}
                          className={`px-4 py-1.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5 ${theme.actionBtn}`}
                        >
                          {startingId === order._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : null}
                          <span>{theme.actionText}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/orders/${order._id}`);
                          }}
                          className={`px-4 py-1.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm active:scale-95 ${theme.actionBtn}`}
                        >
                          <span>{theme.actionText}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
