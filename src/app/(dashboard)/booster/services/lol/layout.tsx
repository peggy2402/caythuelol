// src/app/(dashboard)/booster/services/lol/layout.tsx
'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ServiceProvider, useServiceContext } from '@/components/ServiceContext';
import { Save, History, RotateCcw, Trophy, TrendingUp, Medal, Zap, Target, Swords, Settings, ArrowLeft, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

// Đưa tabs ra ngoài để tránh khởi tạo lại khi render
const TABS_CONFIG = [
  { href: '/booster/services/lol', label: 'Cài đặt chung', icon: Settings, exact: true },
  { href: '/booster/services/lol/rank-boost', label: 'Cày Rank/Elo', icon: Trophy },
  { href: '/booster/services/lol/net-wins', label: 'Cày Điểm Cao Thủ, Thách Đấu', icon: Target },
  { href: '/booster/services/lol/placements', label: 'Phân hạng đầu mùa', icon: Swords },
  { href: '/booster/services/lol/promotion', label: 'Chuỗi thăng hạng', icon: TrendingUp },
  { href: '/booster/services/lol/leveling', label: 'Cày Level', icon: Zap },
  { href: '/booster/services/lol/mastery', label: 'Cày Thông thạo', icon: Medal },
];

function ServiceTabs() {
  const pathname = usePathname();

  return (
    <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-zinc-800">
      {TABS_CONFIG.map((tab) => {
        const isActive = tab.exact 
          ? pathname === tab.href 
          : pathname.startsWith(tab.href) && tab.href !== '/booster/services/lol';

        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={true} // Bật prefetch để tải trước code trang sau
            scroll={false}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-medium transition-all whitespace-nowrap border-b-2 text-sm ${
              isActive
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

function LOLLayoutContent({ children }: { children: ReactNode }) {
  // Đảm bảo các hàm này được memoize trong ServiceContext
  const { saving, handleSave, handleDiscardChanges, hasDraft, handleRestoreDraft } = useServiceContext();

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <Link href="/booster/services" className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-white">
                    <span className="text-blue-500">LOL</span> Service Config
                </h1>
                <p className="text-zinc-400 text-sm">Thiết lập giá và tùy chọn.</p>
            </div>
        </div>
        
        {/* Actions - Giữ nguyên logic nhưng tối ưu hiển thị */}
        <div className="flex gap-3 w-full md:w-auto">
          {hasDraft && (
            <button
              onClick={handleRestoreDraft}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition text-sm"
            >
              <History className="w-4 h-4" />
              Khôi phục
            </button>
          )}

          <button
            onClick={handleDiscardChanges}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Hủy
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition text-sm font-medium"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu
          </button>
        </div>
      </div>

      <ServiceTabs />

      {/* CỰC KỲ QUAN TRỌNG: Dùng Suspense để tách biệt luồng render của Page con */}
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </Suspense>
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