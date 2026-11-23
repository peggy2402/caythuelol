'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gamepad2, ArrowUpRight, ArrowRight, ChevronRight } from 'lucide-react';
import { getOrderStatusInfo, formatServiceNameVi } from '@/lib/orderStatus';
import { GAMES_CATALOG, GameDefinition } from '@/lib/games';
import { formatRankDisplayVi } from '@/lib/riotRanks';

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

function resolveServiceName(order: Order): string {
  const rawCandidate = order.snapshot?.serviceName || order.serviceType || order.snapshot?.serviceSlug;
  const isRawEnum = /^(NET_WINS|RANK_BOOST|PLACEMENT|PLACEMENTS|PROMOTION|CHAMPION_RANK|MASTERY|CHAMPION_MASTERY|POINT_BOOST|COACHING|LEVELING|ONBET)$/i.test(
    (rawCandidate || '').trim()
  );

  if (order.snapshot?.serviceName && !isRawEnum) {
    return order.snapshot.serviceName;
  }
  return formatServiceNameVi(rawCandidate, order.details);
}

function resolveOrderObjective(order: Order): string | null {
  const current = order.snapshot?.initialState?.rankLabel || order.details?.current_rank;
  const desired = order.snapshot?.targetState?.rankLabel || order.details?.desired_rank;

  if (current && desired) {
    const formattedCurrent = formatRankDisplayVi(current);
    const formattedDesired = formatRankDisplayVi(desired);
    return `${formattedCurrent} → ${formattedDesired}`;
  }
  if (order.details?.net_wins) {
    return `Mục tiêu: +${order.details.net_wins} trận thắng ròng`;
  }
  if (order.details?.placement_matches) {
    return `Mục tiêu: ${order.details.placement_matches} trận phân hạng`;
  }
  if (desired) {
    return `Mục tiêu: ${formatRankDisplayVi(desired)}`;
  }
  return null;
}

export interface Order {
  _id: string;
  orderCode?: string;
  serviceType: string;
  status: string;
  details?: any;
  pricing: {
    total_amount: number;
    deposit_amount?: number;
  };
  snapshot?: {
    gameCode?: string;
    serviceSlug?: string;
    serviceName?: string;
    initialState?: {
      rankId?: string;
      rankLabel?: string;
      lp?: number;
    };
    targetState?: {
      rankId?: string;
      rankLabel?: string;
      lp?: number;
    };
  };
  createdAt: string;
}

interface RecentOrdersTableProps {
  orders: Order[];
}

export const statusStyles: { [key: string]: { bg: string; text: string; dot: string; label: string } } = {
  COMPLETED: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Hoàn thành' },
  IN_PROGRESS: { bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-400 animate-pulse', label: 'Đang cày...' },
  APPROVED: { bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400', label: 'Đã nhận đơn' },
  PENDING_PAYMENT: { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Chờ thanh toán' },
  PAID: { bg: 'bg-indigo-500/15 border-indigo-500/30', text: 'text-indigo-400', dot: 'bg-indigo-400', label: 'Đang chờ tuyển thủ' },
  REJECTED: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', dot: 'bg-red-400', label: 'Bị từ chối' },
  REFUNDED: { bg: 'bg-zinc-500/15 border-zinc-500/30', text: 'text-zinc-400', dot: 'bg-zinc-400', label: 'Đã hoàn tiền' },
  DISPUTED: { bg: 'bg-rose-500/15 border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-400', label: 'Khiếu nại' },
  CANCELLED: { bg: 'bg-zinc-700/15 border-zinc-700/30', text: 'text-zinc-500', dot: 'bg-zinc-500', label: 'Đã hủy' }
};

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between border-b border-zinc-800 p-4 sm:p-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            Lịch Sử Đơn Hàng Gần Đây
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Tiền cọc bảo đảm an toàn qua hệ thống Escrow.</p>
        </div>
        <Link href="/orders" className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors shrink-0">
          Xem tất cả <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-inner">
              <Gamepad2 className="h-10 w-10 text-zinc-600" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Bạn chưa có đơn cày nào</h3>
            <p className="text-xs text-zinc-500 max-w-sm mb-6">
              Bắt đầu hành trình bứt phá xếp hạng với tuyển thủ Thách Đấu ngay hôm nay.
            </p>
            <Link
              href="/services/lol/rank-boost"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
            >
              Đặt Đơn Cày Đầu Tiên
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile View: High-tech Card List */}
            <div className="grid gap-3 p-4 md:hidden">
              {orders.slice(0, 5).map((order) => {
                const s = statusStyles[order.status] || { 
                  bg: `${getOrderStatusInfo(order.status).badgeBg} ${getOrderStatusInfo(order.status).borderColor}`, 
                  text: getOrderStatusInfo(order.status).textColor, 
                  dot: 'bg-zinc-400', 
                  label: getOrderStatusInfo(order.status).label 
                };
                return (
                  <div
                    key={order._id}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 active:scale-[0.98] transition-transform cursor-pointer"
                    onClick={() => router.push(`/orders/${order._id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-sm">
                        #{order.orderCode || order._id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${s.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        <span className={s.text}>{s.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Dịch vụ</span>
                      {(() => {
                        const gameCode = order.snapshot?.gameCode || order.details?.game || 'LOL';
                        const gameMeta = getGameMeta(gameCode);
                        const serviceName = resolveServiceName(order);
                        const objective = resolveOrderObjective(order);
                        return (
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shadow-sm"
                                style={{
                                  backgroundColor: `${gameMeta.accentColor}15`,
                                  color: gameMeta.accentColor,
                                  borderColor: `${gameMeta.accentColor}40`,
                                }}
                              >
                                {gameMeta.shortName}
                              </span>
                              <span className="font-semibold text-zinc-200">
                                {serviceName}
                              </span>
                            </div>
                            {objective && (
                              <div className="text-[11px] text-cyan-400 font-medium mt-0.5">
                                {objective}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Tổng thanh toán</span>
                      <span className="font-mono font-black text-cyan-400 text-sm">
                        {formatCurrency(order.pricing?.total_amount || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-zinc-900 mt-1">
                      <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span className="flex items-center gap-1 text-cyan-400 font-semibold">Xem chi tiết <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Styled Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/80 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">Mã Đơn</th>
                    <th className="px-6 py-4 font-bold">Dịch Vụ Cày</th>
                    <th className="px-6 py-4 font-bold">Trạng Thái Đơn Hàng</th>
                    <th className="px-6 py-4 font-bold">Tổng Chi Phí</th>
                    <th className="px-6 py-4 font-bold">Ngày Khởi Tạo</th>
                    <th className="px-6 py-4 text-right"><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs">
                  {orders.slice(0, 6).map((order) => {
                    const s = statusStyles[order.status] || { 
                      bg: `${getOrderStatusInfo(order.status).badgeBg} ${getOrderStatusInfo(order.status).borderColor}`, 
                      text: getOrderStatusInfo(order.status).textColor, 
                      dot: 'bg-zinc-400', 
                      label: getOrderStatusInfo(order.status).label 
                    };
                    return (
                      <tr
                        key={order._id}
                        className="group cursor-pointer transition-colors hover:bg-zinc-800/40"
                        onClick={() => router.push(`/orders/${order._id}`)}
                      >
                        <td className="px-6 py-4 font-mono font-bold text-white">
                          #{order.orderCode || order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const gameCode = order.snapshot?.gameCode || order.details?.game || 'LOL';
                            const gameMeta = getGameMeta(gameCode);
                            const serviceName = resolveServiceName(order);
                            const objective = resolveOrderObjective(order);
                            return (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm"
                                    style={{
                                      backgroundColor: `${gameMeta.accentColor}15`,
                                      color: gameMeta.accentColor,
                                      borderColor: `${gameMeta.accentColor}40`,
                                    }}
                                  >
                                    {gameMeta.shortName}
                                  </span>
                                  <span className="font-bold text-zinc-100 text-xs sm:text-sm">
                                    {serviceName}
                                  </span>
                                </div>
                                {objective && (
                                  <div className="text-[11px] text-cyan-400 font-medium pl-0.5">
                                    {objective}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${s.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                            <span className={s.text}>{s.label}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-white text-sm">
                          {formatCurrency(order.pricing?.total_amount || 0)}
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 group-hover:border-cyan-500/40 text-cyan-400 font-bold text-xs flex items-center gap-1 ml-auto transition-colors">
                            Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
