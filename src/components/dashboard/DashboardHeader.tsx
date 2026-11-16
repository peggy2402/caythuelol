'use client';

import Link from 'next/link';
import { ShieldCheck, Zap, CreditCard, Wallet, Globe } from 'lucide-react';

interface DashboardHeaderProps {
  user: any;
  activeOrdersCount: number;
  vip: {
    name: string;
    discount: string;
    color: string;
    bg: string;
  };
  language: string;
  setLanguage: (lang: any) => void;
  onOpenDeposit: () => void;
}

export default function DashboardHeader({
  user,
  activeOrdersCount,
  vip,
  language,
  setLanguage,
  onOpenDeposit
}: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#070b14] via-[#091024] to-[#0d162e] border border-cyan-500/20 p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        
        {/* User Profile Info */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-cyan-400 font-mono">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 p-1 bg-zinc-950 rounded-full border border-cyan-500/40">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user?.username}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${vip.bg} ${vip.color}`}>
                {vip.name}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 flex items-center gap-2">
              <span>Trạng thái:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Đã xác thực KYC
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Đang có <b className="text-white">{activeOrdersCount}</b> đơn cày chạy</span>
            </p>
          </div>
        </div>

        {/* Quick Actions & Language */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/orders/create"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>+ Tạo Đơn Cày Mới</span>
          </Link>

          <button
            onClick={onOpenDeposit}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-cyan-500/50 text-white text-xs sm:text-sm font-bold transition-all hover:bg-zinc-800 backdrop-blur-md"
          >
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <span>Nạp Tiền VietQR</span>
          </button>

          <Link
            href="/wallet"
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-white text-xs sm:text-sm font-semibold hover:border-zinc-700 transition-colors"
          >
            <Wallet className="w-4 h-4 text-zinc-500" />
            <span>Ví Tiền</span>
          </Link>

          {/* Language selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none rounded-xl bg-zinc-950/60 border border-zinc-800 py-3 pl-3.5 pr-8 text-xs font-bold text-zinc-300 hover:border-zinc-700 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="vi">VI (Tiếng Việt)</option>
              <option value="en">EN (English)</option>
              <option value="kr">KR (한국어)</option>
              <option value="jp">JP (日本語)</option>
            </select>
            <Globe className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>

      </div>
    </div>
  );
}
