// src/app/(dashboard)/booster/services/lol/layout.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ServiceProvider, useServiceContext } from '@/components/ServiceContext'; // Đảm bảo đường dẫn import đúng
import { Save, History, RotateCcw, Trophy, TrendingUp, Medal, Zap, Target, Swords, Settings, ArrowLeft } from 'lucide-react';

// Component nội dung để dùng hook useServiceContext
function LOLLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { saving, handleSave, handleDiscardChanges, hasDraft, handleRestoreDraft } = useServiceContext();

  const tabs = [
    { href: '/booster/services/lol', label: 'Cài đặt chung', icon: Settings, exact: true },
    { href: '/booster/services/lol/rank-boost', label: 'Cày Rank/Elo', icon: Trophy },
    { href: '/booster/services/lol/net-wins', label: 'Net Wins', icon: Target },
    { href: '/booster/services/lol/placements', label: 'Phân hạng', icon: Swords },
    { href: '/booster/services/lol/promotion', label: 'Chuỗi thăng hạng', icon: TrendingUp },
    { href: '/booster/services/lol/leveling', label: 'Cày Level', icon: Zap },
    { href: '/booster/services/lol/mastery', label: 'Thông thạo', icon: Medal },
  ];

  const isActive = (path: string, exact = false) => {
    return exact ? pathname === path : pathname.startsWith(path) && path !== '/booster/services/lol';
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <Link href="/booster/services" className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                    <span className="text-blue-500">LOL</span> Service Config
                </h1>
                <p className="text-zinc-400 text-sm">Thiết lập giá và tùy chọn cho Liên Minh Huyền Thoại.</p>
            </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {hasDraft && (
            <button
              onClick={handleRestoreDraft}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-4 py-2 rounded-xl font-medium transition-all border border-yellow-600/30 text-sm"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Khôi phục</span>
            </button>
          )}
          
          <button
            onClick={handleDiscardChanges}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl font-medium transition-all text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Hủy</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-zinc-800">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            scroll={false}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-medium transition-colors whitespace-nowrap border-b-2 text-sm ${
              isActive(tab.href, tab.exact)
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Page Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {children}
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
