'use client';
import BarLoader from '@/components/ui/BarLoader';

import { useState, useEffect } from 'react';
import {
  Lock,
  ExternalLink,
  Search,
  ShieldCheck,
  AlertTriangle,
  History,
  Layers,
  Sparkles,
  Gamepad2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getOrderStatusInfo } from '@/lib/orderStatus';

interface HeldOrder {
  _id: string;
  orderCode?: string;
  serviceType: string;
  customerId: { _id: string; username: string; email?: string };
  boosterId?: { _id: string; username: string; email?: string };
  status: string;
  pricing: {
    deposit_amount?: number;
    deposit_percent?: number;
    total_amount: number;
    platform_fee?: number;
  };
  snapshot?: {
    gameCode?: string;
    serviceSlug?: string;
  };
  details?: {
    game?: string;
    gameCode?: string;
  };
  createdAt: string;
}

export default function AdminDepositsPage() {
  const [orders, setOrders] = useState<HeldOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHeld, setTotalHeld] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [disputedCount, setDisputedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DISPUTED' | 'ALL'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHeldOrders = async (tab = activeTab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/deposits?tab=${tab}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        setTotalHeld(data.totalHeld || 0);
        setActiveCount(data.activeCount || 0);
        setDisputedCount(data.disputedCount || 0);
      } else {
        toast.error('Không thể tải dữ liệu tiền cọc');
      }
    } catch (error) {
      toast.error('Lỗi kết nối khi tải tiền cọc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeldOrders(activeTab);
  }, [activeTab]);

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const orderCode = (order.orderCode || order._id || '').toLowerCase();
    const customer = (order.customerId?.username || '').toLowerCase();
    const booster = (order.boosterId?.username || '').toLowerCase();
    const service = (order.serviceType || '').toLowerCase();
    return (
      orderCode.includes(query) ||
      customer.includes(query) ||
      booster.includes(query) ||
      service.includes(query)
    );
  });

  const getGameBadge = (order: HeldOrder) => {
    const rawGame = (
      order.snapshot?.gameCode ||
      order.details?.game ||
      order.details?.gameCode ||
      (order.serviceType.toLowerCase().includes('lienquan') ? 'LIENQUAN' : 'LOL')
    ).toUpperCase();

    if (rawGame.includes('LIENQUAN') || rawGame.includes('AOV')) {
      return { label: 'Liên Quân', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    }
    if (rawGame.includes('TOCCHIEN') || rawGame.includes('WR')) {
      return { label: 'Tốc Chiến', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    }
    if (rawGame.includes('VALORANT') || rawGame.includes('VAL')) {
      return { label: 'Valorant', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    }
    return { label: 'LMHT', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  };

  const formatCurrency = (val: number | null | undefined) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val) || 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
              <Lock className="w-6 h-6" />
            </span>
            Quản lý Tiền cọc (Escrow)
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Theo dõi dòng tiền ký quỹ của khách hàng đang được bảo chứng trên sàn, đảm bảo minh bạch tuyệt đối.
          </p>
        </div>
        <button
          onClick={() => fetchHeldOrders(activeTab)}
          className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/90 border border-yellow-500/30 rounded-2xl p-4.5 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-yellow-500 tracking-wider">
              Tổng tiền cọc đang giữ (Hold)
            </span>
            <Lock className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            {formatCurrency(totalHeld)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Bảo đảm an toàn trong ký quỹ hệ thống
          </p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-blue-400 tracking-wider">
              Đơn hàng đang ký quỹ
            </span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            {activeCount}{' '}
            <span className="text-sm font-normal text-zinc-400 font-sans">đơn</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5">
            Các đơn chưa hoàn thành hoặc đang chờ cày
          </p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-rose-400 tracking-wider">
              Tranh chấp / Lệch Rank
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            {disputedCount}{' '}
            <span className="text-sm font-normal text-zinc-400 font-sans">đơn</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5">
            Cần Admin xác minh & đối soát quyền lợi
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/70 p-3 rounded-2xl border border-zinc-800">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ACTIVE'
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Đang giữ cọc ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('DISPUTED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'DISPUTED'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Lệch rank / Tranh chấp ({disputedCount})
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-zinc-700 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tất cả lịch sử
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, khách, booster..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center">
            <BarLoader className="py-8" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">
              Không tìm thấy đơn hàng ký quỹ nào phù hợp
            </p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Hiện tại không có đơn hàng nào bị giam giữ tiền cọc trong danh mục này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Mã đơn & Ngày tạo</th>
                  <th className="px-5 py-3.5">Tựa Game & Dịch vụ</th>
                  <th className="px-5 py-3.5">Khách hàng / Booster</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Tiền Cọc (Ký quỹ)</th>
                  <th className="px-5 py-3.5 text-right">Tổng Đơn</th>
                  <th className="px-5 py-3.5 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredOrders.map((order) => {
                  const game = getGameBadge(order);
                  const statusInfo = getOrderStatusInfo(order.status);
                  const depositAmount =
                    order.pricing?.deposit_amount || order.pricing?.total_amount || 0;
                  const totalAmount = order.pricing?.total_amount || depositAmount;
                  const percent =
                    order.pricing?.deposit_percent ||
                    Math.round((depositAmount / totalAmount) * 100) ||
                    40;

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-zinc-800/40 transition-colors duration-150"
                    >
                      {/* Order Code */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/orders/${order._id}`}
                          className="text-blue-400 hover:text-blue-300 font-mono font-bold text-xs flex items-center gap-1.5"
                        >
                          #{order.orderCode || order._id.toString().slice(-6).toUpperCase()}
                          <ExternalLink size={12} className="opacity-70" />
                        </Link>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString('vi-VN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '---'}
                        </div>
                      </td>

                      {/* Game & Service */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${game.color}`}
                          >
                            {game.label}
                          </span>
                        </div>
                        <div className="text-white font-medium text-xs">
                          {(order.serviceType || 'CÀY THUÊ').toString().replace(/_/g, ' ')}
                        </div>
                      </td>

                      {/* Customer & Booster */}
                      <td className="px-5 py-4 text-xs">
                        <div className="text-zinc-200 font-medium flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] flex items-center justify-center font-bold">
                            C
                          </span>
                          <span className="truncate max-w-[140px]">
                            {order.customerId?.username || 'Khách hàng'}
                          </span>
                        </div>
                        <div className="text-zinc-400 text-[11px] mt-1 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 text-[10px] flex items-center justify-center font-bold">
                            B
                          </span>
                          <span className="truncate max-w-[140px]">
                            {order.boosterId?.username || 'Chưa nhận đơn'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusInfo.style}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Deposit Amount (Held) */}
                      <td className="px-5 py-4 text-right">
                        <div className="font-mono font-bold text-yellow-400 text-sm">
                          {formatCurrency(depositAmount)}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-medium">
                          Ký quỹ ({percent}%)
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-5 py-4 text-right font-mono text-zinc-300 text-xs font-semibold">
                        {formatCurrency(totalAmount)}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-center">
                        <Link
                          href={`/orders/${order._id}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                          title="Xem chi tiết đơn hàng & đối soát"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
