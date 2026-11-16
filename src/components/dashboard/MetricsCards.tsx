'use client';

import Link from 'next/link';
import { Wallet, Clock, Trophy, Crown, ArrowUpRight } from 'lucide-react';

interface MetricsCardsProps {
  walletBalance: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  totalSpent: number;
  vipDiscount: string;
  onOpenDeposit: () => void;
}

export default function MetricsCards({
  walletBalance,
  activeOrdersCount,
  completedOrdersCount,
  totalSpent,
  vipDiscount,
  onOpenDeposit
}: MetricsCardsProps) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
      
      {/* Tile 1: Wallet Balance */}
      <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Số Dư Ví Khả Dụng</span>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tracking-tight mb-2">
          {walletBalance?.toLocaleString('vi-VN') || 0} đ
        </div>
        <button
          onClick={onOpenDeposit}
          className="text-xs font-bold text-zinc-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          <span>+ Nạp thêm tiền tức thì</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tile 2: Active Orders */}
      <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-sm transition-all hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Đơn Đang Thực Hiện</span>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight mb-2">
          {activeOrdersCount}
        </div>
        <Link
          href="/orders"
          className="text-xs font-bold text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
        >
          <span>Xem hàng đợi trận đấu</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tile 3: Completed Orders */}
      <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Đơn Hoàn Thành</span>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Trophy className="h-5 w-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight mb-2">
          {completedOrdersCount}
        </div>
        <div className="text-xs text-zinc-500">
          Tỷ lệ thành công: <b className="text-emerald-400">100%</b>
        </div>
      </div>

      {/* Tile 4: Total Spent & VIP */}
      <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-sm transition-all hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tổng Chi Tiêu & VIP</span>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Crown className="h-5 w-5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono tracking-tight mb-2">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalSpent)}
        </div>
        <div className="text-xs text-zinc-400 flex items-center justify-between">
          <span>Chiết khấu hiện tại:</span>
          <span className="text-amber-400 font-bold">-{vipDiscount}</span>
        </div>
      </div>

    </div>
  );
}
