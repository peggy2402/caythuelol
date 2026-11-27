'use client';
import BarLoader from '@/components/ui/BarLoader';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';
import Link from 'next/link';
import {
  FileText, Loader2, Plus, Clock, CheckCircle2,
  AlertCircle, PlayCircle, XCircle, Filter,
  Gamepad2, User, ChevronRight, Search, Calendar, X, RotateCcw
} from 'lucide-react';
import { GAMES_CATALOG, GameDefinition } from '@/lib/games';
import { getBoosterOrderValue } from '@/lib/orderPricing';
import { formatRankDisplayVi } from '@/lib/riotRanks';
import { formatServiceNameVi } from '@/lib/orderStatus';

// Chuẩn hóa chuỗi để tìm kiếm không dấu, không phân biệt hoa thường
function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

// Helper lấy metadata tựa game
function getGameMeta(gameCode?: string) {
  const code = (gameCode || 'LOL').toUpperCase();
  const game = GAMES_CATALOG.find((g: GameDefinition) => g.id.toUpperCase() === code);
  if (game) {
    return {
      name: game.name,
      shortName: game.shortName,
      accentColor: game.accentColor || '#06b6d4',
    };
  }
  return {
    name: code,
    shortName: code,
    accentColor: '#3b82f6',
  };
}

// Helper format tên dịch vụ thân thiện
function formatServiceName(serviceType?: string, details?: any) {
  return formatServiceNameVi(serviceType, details);
}

// Helper status tiếng Việt và style
function getStatusBadge(status: string, hasBooster?: boolean) {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        icon: CheckCircle2,
        isSpinning: false,
      };
    case 'IN_PROGRESS':
      return {
        label: 'Đang cày',
        className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse',
        icon: PlayCircle,
        isSpinning: false,
      };
    case 'APPROVED':
      return {
        label: 'Booster đã nhận',
        className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
        icon: CheckCircle2,
        isSpinning: false,
      };
    case 'PAID':
      return {
        label: hasBooster ? 'Đang chờ Booster' : 'Đang chờ Booster',
        className: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        icon: Loader2,
        isSpinning: true,
      };
    case 'PENDING_PAYMENT':
      return {
        label: 'Chờ thanh toán',
        className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
        icon: Clock,
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        className: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
        icon: XCircle,
      };
    case 'REFUNDED':
      return {
        label: 'Đã hoàn tiền',
        className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        icon: CheckCircle2,
      };
    case 'DISPUTED':
      return {
        label: 'Đang khiếu nại',
        className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        icon: AlertCircle,
      };
    case 'REJECTED':
      return {
        label: 'Bị từ chối',
        className: 'bg-red-500/10 text-red-400 border border-red-500/20',
        icon: XCircle,
      };
    default:
      return {
        label: status,
        className: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
        icon: Clock,
      };
  }
}

type DatePreset = 'ALL' | 'TODAY' | '7D' | '30D' | 'CUSTOM';

function parseLocalDateStart(ymd: string): Date | null {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

function parseLocalDateEnd(ymd: string): Date | null {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
}

export default function OrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (!token || !stored) {
      window.location.href = '/login?redirect=/orders';
      return;
    }

    try {
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch (e) {}

    fetch('/api/orders')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/login?redirect=/orders';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.orders) setOrders(data.orders);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    searchQuery.trim() !== '' ||
    datePreset !== 'ALL' ||
    dateFrom !== '' ||
    dateTo !== '';

  const resetAllFilters = () => {
    setStatusFilter('ALL');
    setSearchQuery('');
    setDatePreset('ALL');
    setDateFrom('');
    setDateTo('');
  };

  // Logic lọc đơn hàng kết hợp: trạng thái + từ khóa (mã đơn, tên đơn/game, tên booster) + khoảng ngày
  const filteredOrders = useMemo(() => {
    const rawQuery = searchQuery.trim();
    const cleanQuery = normalizeText(rawQuery.replace(/^[#@]+/, ''));

    // Tính mốc thời gian theo preset
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;

    if (datePreset === 'TODAY') {
      rangeStart = startOfToday;
    } else if (datePreset === '7D') {
      rangeStart = new Date(startOfToday);
      rangeStart.setDate(rangeStart.getDate() - 6);
    } else if (datePreset === '30D') {
      rangeStart = new Date(startOfToday);
      rangeStart.setDate(rangeStart.getDate() - 29);
    } else if (datePreset === 'CUSTOM') {
      rangeStart = dateFrom ? parseLocalDateStart(dateFrom) : null;
      rangeEnd = dateTo ? parseLocalDateEnd(dateTo) : null;
    }

    return orders.filter((order) => {
      // 1. Lọc theo trạng thái
      if (statusFilter === 'PROCESSING' && !['PENDING_PAYMENT', 'PAID', 'APPROVED', 'IN_PROGRESS'].includes(order.status)) {
        return false;
      }
      if (statusFilter === 'COMPLETED' && order.status !== 'COMPLETED') {
        return false;
      }
      if (statusFilter === 'CANCELLED' && !['REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'].includes(order.status)) {
        return false;
      }

      // 2. Lọc theo ngày tạo đơn
      if (rangeStart || rangeEnd) {
        const createdDate = new Date(order.createdAt);
        if (isNaN(createdDate.getTime())) return false;
        if (rangeStart && createdDate < rangeStart) return false;
        if (rangeEnd && createdDate > rangeEnd) return false;
      }

      // 3. Lọc theo từ khóa: mã đơn hàng, tên đơn/dịch vụ, tên game, hoặc tên/username Booster
      if (cleanQuery) {
        const gameCode = order.snapshot?.gameCode || order.details?.game || 'LOL';
        const gameMeta = getGameMeta(gameCode);
        const serviceName =
          order.snapshot?.serviceName ||
          formatServiceName(order.serviceType || order.snapshot?.serviceSlug, order.details);

        const orderCode = order.orderCode || '';
        const shortId = order._id ? String(order._id).slice(-6) : '';
        const fullId = order._id ? String(order._id) : '';
        const boosterUsername = order.boosterId?.username || '';
        const boosterFullName = order.boosterId?.profile?.full_name || '';

        const searchableFields = [
          orderCode,
          `#${orderCode}`,
          shortId,
          fullId,
          serviceName,
          order.serviceType || '',
          order.snapshot?.serviceSlug || '',
          gameMeta.name,
          gameMeta.shortName,
          gameCode,
          boosterUsername,
          `@${boosterUsername}`,
          boosterFullName,
        ];

        const matched = searchableFields.some((field) =>
          normalizeText(String(field)).includes(cleanQuery)
        );
        if (!matched) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery, datePreset, dateFrom, dateTo]);

  // Đếm số lượng đơn theo trạng thái
  const statusCounts = useMemo(() => {
    return {
      ALL: orders.length,
      PROCESSING: orders.filter((o) =>
        ['PENDING_PAYMENT', 'PAID', 'APPROVED', 'IN_PROGRESS'].includes(o.status)
      ).length,
      COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
      CANCELLED: orders.filter((o) =>
        ['REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'].includes(o.status)
      ).length,
    };
  }, [orders]);

  if (loading) {
    return <BarLoader className="py-24" />;
  }

  const filterOptions = [
    { id: 'ALL', label: t('catAll'), count: statusCounts.ALL },
    { id: 'PROCESSING', label: t('processing'), count: statusCounts.PROCESSING },
    { id: 'COMPLETED', label: t('completedOrders'), count: statusCounts.COMPLETED },
    { id: 'CANCELLED', label: t('statusCancelled'), count: statusCounts.CANCELLED },
  ];

  const datePresetOptions: { id: DatePreset; label: string }[] = [
    { id: 'ALL', label: 'Mọi ngày' },
    { id: 'TODAY', label: 'Hôm nay' },
    { id: '7D', label: '7 ngày qua' },
    { id: '30D', label: '30 ngày qua' },
  ];

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('orders')}</h1>
          <p className="text-zinc-400 text-sm">Quản lý và theo dõi tiến độ các đơn hàng của bạn.</p>
        </div>
        <Link
          href="/orders/create"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {t('createOrder')}
        </Link>
      </div>

      {/* Bộ lọc & Tìm kiếm đơn hàng */}
      {orders.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3.5">
          {/* Hàng 1: Tabs trạng thái + Ô tìm kiếm */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStatusFilter(option.id)}
                  className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === option.id
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                      : 'bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full tabular-nums ${
                      statusFilter === option.id
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {option.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã đơn, tên đơn, tên booster..."
                className="w-full h-10 bg-zinc-950/90 border border-zinc-800 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-10 pr-9 text-sm text-white placeholder:text-zinc-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Hàng 2: Lọc theo ngày (Preset nhanh + Từ ngày / Đến ngày) */}
          <div className="pt-3 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mr-0.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Lọc ngày:</span>
              </span>

              {datePresetOptions.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setDatePreset(preset.id);
                    if (preset.id !== 'CUSTOM') {
                      setDateFrom('');
                      setDateTo('');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                    datePreset === preset.id
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                      : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Chọn khoảng ngày cụ thể */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                <span className="text-[11px] text-zinc-500 font-medium">Từ</span>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDateFrom(val);
                    setDatePreset(val || dateTo ? 'CUSTOM' : 'ALL');
                  }}
                  aria-label="Từ ngày"
                  className="bg-transparent text-xs text-zinc-200 outline-none [color-scheme:dark] cursor-pointer"
                />
              </div>

              <span className="text-zinc-600 text-xs">&rarr;</span>

              <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                <span className="text-[11px] text-zinc-500 font-medium">Đến</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDateTo(val);
                    setDatePreset(val || dateFrom ? 'CUSTOM' : 'ALL');
                  }}
                  aria-label="Đến ngày"
                  className="bg-transparent text-xs text-zinc-200 outline-none [color-scheme:dark] cursor-pointer"
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>
          </div>

          {/* Tóm tắt kết quả lọc khi đang tìm kiếm / lọc */}
          {hasActiveFilters && (
            <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
              <span>
                Tìm thấy <strong className="text-white tabular-nums">{filteredOrders.length}</strong> / {orders.length} đơn hàng
              </span>
            </div>
          )}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-white/5">
          <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">{t('noOrders')}</h3>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">{t('startRank')}</p>
          <Link
            href="/orders/create"
            className="text-blue-400 hover:text-blue-300 font-medium hover:underline inline-flex items-center gap-1"
          >
            {t('createOrder')} &rarr;
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 px-4 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
          <Filter className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-300 font-medium text-sm">
            Không tìm thấy đơn hàng nào khớp với bộ lọc hiện tại.
          </p>
          <p className="text-zinc-500 text-xs mt-1">
            Thử đổi từ khóa tìm kiếm, khoảng ngày hoặc trạng thái đơn hàng.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa tất cả bộ lọc</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const gameCode = order.snapshot?.gameCode || order.details?.game || 'LOL';
            const gameMeta = getGameMeta(gameCode);
            const serviceName = order.snapshot?.serviceName || formatServiceName(order.serviceType || order.snapshot?.serviceSlug, order.details);
            const statusBadge = getStatusBadge(order.status, !!order.boosterId);
            const StatusIcon = statusBadge.icon;
            const orderIdentifier = order.orderCode || order._id;

            return (
              <Link
                key={order._id}
                href={`/orders/${orderIdentifier}`}
                className="group relative block bg-zinc-900/90 hover:bg-zinc-800/80 border border-zinc-800 hover:border-blue-500/50 rounded-2xl p-5 transition-all shadow-lg hover:shadow-blue-500/10"
              >
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5">
                  {/* Left: Info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Gamepad2 className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Title & Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border shadow-sm"
                          style={{
                            backgroundColor: `${gameMeta.accentColor}15`,
                            color: gameMeta.accentColor,
                            borderColor: `${gameMeta.accentColor}40`,
                          }}
                        >
                          {gameMeta.shortName}
                        </span>

                        <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-blue-400 transition-colors truncate">
                          {serviceName}
                        </h3>

                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                          #{order.orderCode || order._id.slice(-6).toUpperCase()}
                        </span>
                      </div>

                      {/* Rank & details */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                        {(() => {
                          if (order.serviceType === 'MATCHES' || order.details?.is_matches) {
                            const count = order.details?.match_count || order.details?.matches || 1;
                            const queue = order.details?.queue_type === 'FLEX' ? 'Linh Hoạt' : 'Đơn / Đôi';
                            return (
                              <span className="font-semibold text-blue-400">
                                Cày {count} trận ({queue})
                              </span>
                            );
                          }
                          if (order.serviceType === 'PLACEMENTS' || order.details?.is_placements) {
                            const count = order.details?.placement_matches || order.details?.matches || 5;
                            const prev = order.details?.previous_rank_label || order.details?.previous_season_rank;
                            return (
                              <span className="font-semibold text-amber-400">
                                Cày {count} trận phân hạng{prev ? ` (${formatRankDisplayVi(prev)})` : ''}
                              </span>
                            );
                          }
                          if (order.details?.is_odd_star && order.details?.current_rank && order.details?.desired_rank) {
                            return (
                              <span className="font-semibold text-cyan-300">
                                {order.details.current_rank} &rarr; {order.details.desired_rank}
                              </span>
                            );
                          }
                          if (order.details?.is_point_boost || order.details?.calc_mode === 'BY_LP' || order.details?.segment) {
                            const unit = order.details?.unit || 'LP';
                            const start = order.details?.start_lp ?? order.details?.current_points ?? 0;
                            const target = order.details?.target_lp ?? order.details?.desired_points ?? 100;
                            return (
                              <span className="font-semibold text-cyan-300">
                                {start} {unit} &rarr; {target} {unit}
                              </span>
                            );
                          }
                          if (order.serviceType === 'NET_WINS') {
                            return (
                              <span className="font-semibold text-blue-400">
                                +{order.details?.num_games || 0} Trận thắng
                              </span>
                            );
                          }
                          if (order.details?.current_rank && order.details?.desired_rank) {
                            return (
                              <span className="flex items-center gap-1.5 font-medium text-zinc-200">
                                <span>{formatRankDisplayVi(order.details.current_rank)}</span>
                                <span className="text-blue-400 font-bold">&rarr;</span>
                                <span className="text-cyan-300 font-semibold">{formatRankDisplayVi(order.details.desired_rank)}</span>
                              </span>
                            );
                          }
                          if (order.details?.current_level && order.details?.desired_level) {
                            return (
                              <span className="font-medium text-zinc-200">
                                Cấp {order.details.current_level} &rarr; Cấp {order.details.desired_level}
                              </span>
                            );
                          }
                          if (order.details?.rank) {
                            return <span className="text-zinc-200">{formatRankDisplayVi(order.details.rank)}</span>;
                          }
                          return null;
                        })()}

                        {order.details?.server && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-zinc-700 self-center hidden sm:inline-block"></span>
                            <span className="text-xs text-zinc-400">Máy chủ: {order.details.server}</span>
                          </>
                        )}

                        <span className="w-1 h-1 rounded-full bg-zinc-700 self-center hidden sm:inline-block"></span>
                        <span className="text-xs text-zinc-500">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Booster Info Snippet */}
                      <div className="pt-1 flex items-center gap-2 text-xs">
                        <span className="text-zinc-500">Booster:</span>
                        {order.boosterId ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                            <User className="w-3 h-3" />
                            <span>@{order.boosterId.username || 'Booster'}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                            <span>Đang tìm kiếm...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Status */}
                  <div className="flex items-center justify-between lg:justify-end gap-5 border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0">
                    <div className="text-left lg:text-right">
                      <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-0.5">
                        {currentUser?.role === 'BOOSTER' ? 'Giá trị đơn hàng nhận được' : 'Tổng thanh toán'}
                      </p>
                      <p className="text-lg font-bold text-emerald-400 font-mono">
                        {(currentUser?.role === 'BOOSTER'
                          ? getBoosterOrderValue(order.pricing)
                          : (order.pricing?.total_amount || 0)
                        ).toLocaleString()} đ
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 ${statusBadge.className}`}>
                        <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusBadge.isSpinning ? 'animate-spin' : ''}`} />
                        <span>{statusBadge.label}</span>
                      </div>

                      <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
