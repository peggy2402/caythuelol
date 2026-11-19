'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FileText, Loader2, Plus, Clock, CheckCircle2, 
  AlertCircle, PlayCircle, XCircle, Filter, 
  Gamepad2, User, ChevronRight, Sparkles, Shield
} from 'lucide-react';
import { GAMES_CATALOG, GameDefinition } from '@/lib/games';

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
function formatServiceName(serviceType?: string) {
  if (!serviceType) return 'Dịch vụ Cày Thuê';
  const slug = serviceType.toLowerCase().replace(/_/g, '-');
  switch (slug) {
    case 'rank-boost':
      return 'Cày Rank / Elo';
    case 'net-wins':
      return 'Cày Rank Cao Cấp';
    case 'placements':
      return 'Phân Hạng Đầu Mùa';
    case 'champion-mastery':
      return 'Thông Thạo Tướng';
    case 'leveling':
      return 'Cày Cấp Độ';
    case 'coaching':
      return 'Huấn Luyện Coaching 1-1';
    default:
      return serviceType.replace(/_/g, ' ');
  }
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
        label: 'Tuyển thủ đã nhận',
        className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
        icon: CheckCircle2,
        isSpinning: false,
      };
    case 'PAID':
      return {
        label: hasBooster ? 'Đang chờ Booster' : 'Đang chờ tuyển thủ',
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

export default function OrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  // Logic lọc đơn hàng
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PROCESSING') return ['PENDING_PAYMENT', 'PAID', 'APPROVED', 'IN_PROGRESS'].includes(order.status);
    if (statusFilter === 'COMPLETED') return order.status === 'COMPLETED';
    if (statusFilter === 'CANCELLED') return ['REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'].includes(order.status);
    return true;
  });

  const filterOptions = [
    { id: 'ALL', label: t('catAll') },
    { id: 'PROCESSING', label: t('processing') },
    { id: 'COMPLETED', label: t('completedOrders') },
    { id: 'CANCELLED', label: t('statusCancelled') },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
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

      {/* Filter Tabs */}
      {orders.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {filterOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setStatusFilter(option.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                statusFilter === option.id
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
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
        <div className="text-center py-12 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
          <Filter className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">Không tìm thấy đơn hàng nào với trạng thái này.</p>
          <button onClick={() => setStatusFilter('ALL')} className="text-blue-500 hover:underline text-sm mt-2">Xóa bộ lọc</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const gameCode = order.snapshot?.gameCode || order.details?.game || 'LOL';
            const gameMeta = getGameMeta(gameCode);
            const serviceName = formatServiceName(order.serviceType || order.snapshot?.serviceSlug);
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
                        {order.details?.current_rank && order.details?.desired_rank ? (
                          <span className="flex items-center gap-1.5 font-medium text-zinc-200">
                            <span>{order.details.current_rank}</span>
                            <span className="text-blue-400 font-bold">&rarr;</span>
                            <span className="text-cyan-300 font-semibold">{order.details.desired_rank}</span>
                          </span>
                        ) : order.details?.rank ? (
                          <span className="text-zinc-200">{order.details.rank}</span>
                        ) : null}

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
                        <span className="text-zinc-500">Tuyển thủ:</span>
                        {order.boosterId ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                            <User className="w-3 h-3" />
                            <span>@{order.boosterId.username || 'Tuyển thủ'}</span>
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
                      <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-0.5">Tổng thanh toán</p>
                      <p className="text-lg font-bold text-emerald-400 font-mono">
                        {(order.pricing?.total_amount || 0).toLocaleString()} đ
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