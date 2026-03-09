// src/app/(dashboard)/booster/services/lol/layout.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ServiceProvider, useServiceContext } from '@/components/ServiceContext'; // Ensure this path is correct
import { Save, History, RotateCcw, Trophy, TrendingUp, Medal, Zap, Target, Swords, Settings, ArrowLeft, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

// Đưa tabs ra ngoài để tránh khởi tạo lại khi render
const TABS_CONFIG = [
  { href: '/booster/services/lol', label: 'Cài đặt chung', icon: Settings, exact: true },
  { href: '/booster/services/lol/rank-boost', label: 'Cày Rank/Elo', icon: Trophy },
  { href: '/booster/services/lol/net-wins', label: 'Cày Điểm Cao Thủ, Thách Đấu', icon: Target },
  { href: '/booster/services/lol/placements', label: 'Phân hạng', icon: Swords },
  { href: '/booster/services/lol/promotion', label: 'Chuỗi thăng hạng', icon: TrendingUp },
  { href: '/booster/services/lol/leveling', label: 'Cày Level', icon: Zap },
  { href: '/booster/services/lol/mastery', label: 'Cày Thông thạo', icon: Medal },
  { href: '/booster/services/lol/coaching', label: 'Coaching 1-1', icon: Medal },
];

function ServiceTabs() {
  const pathname = usePathname();

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-0 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex min-w-max gap-4 md:gap-8 px-1">
        {TABS_CONFIG.map((tab) => {
          const isActive = tab.exact 
            ? pathname === tab.href 
            : pathname.startsWith(tab.href) && tab.href !== '/booster/services/lol';

          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              scroll={false}
              className={`
                group relative flex items-center gap-2 py-3 text-sm font-medium transition-colors duration-200
                ${isActive ? 'text-blue-400' : 'text-zinc-400 hover:text-zinc-200'}
              `}
            >
              <tab.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {tab.label}
              {/* Active Indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full shadow-[0_-2px_8px_rgba(59,130,246,0.5)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function LOLLayoutContent({ children }: { children: ReactNode }) {
  const { saving, handleSave, handleDiscardChanges, hasDraft, handleRestoreDraft } = useServiceContext();

  return (
    <div className="min-h-screen pb-20">
      {/* 
        Sticky Header Block 
        - Uses negative margins (-mx) to break out of parent padding and span full width
        - top-16 accounts for the main Navbar height when scrolled
      */}
      <div className="sticky top-20 z-20 w-full bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800 transition-all duration-200">
        <div className="px-4 md:px-8 pt-4 md:pt-6 bg-zinc-650">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-4">
            
            {/* Title Section */}
            <div className="flex items-center gap-3 md:gap-4">
              <Link 
                href="/booster/services" 
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                aria-label="Quay lại"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </Link>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-blue-500">LOL</span> Service Config
                </h1>
                <p className="text-zinc-400 text-xs md:text-sm font-medium">Thiết lập bảng giá và tùy chọn dịch vụ</p>
              </div>
            </div>
            
            {/* Actions Section */}
            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1 md:pb-0 w-full md:w-auto -mx-4 px-4 md:mx-0 md:px-0">
              {hasDraft && (
                <button
                  onClick={handleRestoreDraft}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all text-sm font-medium whitespace-nowrap"
                >
                  <History className="w-4 h-4" />
                  Khôi phục
                </button>
              )}

              <button
                onClick={handleDiscardChanges}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-sm font-medium whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                Hủy
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all text-sm font-bold whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px] justify-center"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>

          <ServiceTabs />
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-8 max-w-7xl mx-auto px-4 sm:px-6">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-zinc-500 text-sm animate-pulse">Đang tải cấu hình...</p>
          </div>
        }>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {children}
          </div>
        </Suspense>
      </div>
    </div>
  );
}

export default function LOLLayout({ children }: { children: ReactNode }) {
  return (
    <ServiceProvider>
      <LOLLayoutContent>{children}</LOLLayoutContent>
    </ServiceProvider>
  );
}