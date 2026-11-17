'use client';

import Link from 'next/link';
import { ShieldCheck, Zap, CreditCard, Wallet } from 'lucide-react';

interface DashboardHeaderProps {
  user: any;
  activeOrdersCount: number;
  vip: {
    name: string;
    discount: string;
    color: string;
    bg: string;
  };
  language?: string;
  setLanguage?: (lang: any) => void;
  onOpenDeposit: () => void;
}

export default function DashboardHeader({
  user,
  activeOrdersCount,
  vip,
  onOpenDeposit
}: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#070b14] via-[#091024] to-[#0d162e] border border-cyan-500/20 p-4 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 h-72 w-72 sm:h-80 sm:w-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 h-36 w-36 sm:h-40 sm:w-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
        
        {/* User Profile Info */}
        <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center overflow-hidden">
                {user?.avatar || user?.profile?.avatar ? (
                  <img src={user?.avatar || user?.profile?.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 p-0.5 sm:p-1 bg-zinc-950 rounded-full border border-cyan-500/40">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate max-w-[180px] xs:max-w-[240px] sm:max-w-none">
                {user?.username}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border shrink-0 ${vip.bg} ${vip.color}`}>
                {vip.name}
              </span>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Đã xác thực KYC
              </span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="text-zinc-400 text-[11px] sm:text-xs">
                Đang có <b className="text-white font-mono">{activeOrdersCount}</b> đơn cày
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
          {/* Primary CTA */}
          <Link
            href="/orders/create"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>+ Tạo Đơn Cày Mới</span>
          </Link>

          {/* Secondary buttons - 2 columns on mobile */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenDeposit}
              className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-cyan-500/50 text-white text-xs sm:text-sm font-bold transition-all hover:bg-zinc-800 backdrop-blur-md"
            >
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>Nạp VietQR</span>
            </button>

            <Link
              href="/wallet"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold hover:border-zinc-700 transition-colors"
            >
              <Wallet className="w-4 h-4 text-zinc-500" />
              <span>Ví Tiền</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
