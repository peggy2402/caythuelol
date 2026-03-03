'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ServiceProvider, useServiceContext } from './ServiceContext';
import { Save, Download, History, RotateCcw, Trophy, TrendingUp, Medal, Zap, Target, Swords, Settings, Award, AwardIcon } from 'lucide-react';

// Component con để dùng hook useServiceContext (vì Layout chính phải bọc Provider trước)
function ServiceLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { saving, handleSave, handleDiscardChanges, hasDraft, handleRestoreDraft } = useServiceContext();

  const tabs = [
    { href: '/booster/services', label: 'Cài đặt chung', icon: Settings, exact: true },
    { href: '/booster/services/rank-boost', label: 'Cày Rank/Elo', icon: Trophy },
    { href: '/booster/services/net-wins', label: 'Cày điểm Cao thủ, Thách đấu', icon: Target },
    { href: '/booster/services/placements', label: 'Phân hạng đầu mùa', icon: Swords },
    { href: '/booster/services/promotion', label: 'Chuỗi thăng hạng', icon: TrendingUp },
    { href: '/booster/services/leveling', label: 'Cày Level 30', icon: Zap },
    { href: '/booster/services/mastery', label: 'Thông thạo tướng', icon: Medal },
  ];

  const isActive = (path: string, exact = false) => {
    return exact ? pathname === path : pathname.startsWith(path);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cấu hình Dịch vụ</h1>
          <p className="text-zinc-400">Thiết lập giá và tùy chọn cho các dịch vụ bạn cung cấp.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {hasDraft && (
            <button
              onClick={handleRestoreDraft}
              className="flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-4 py-2 rounded-xl font-medium transition-all border border-yellow-600/30"
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">Khôi phục nháp</span>
            </button>
          )}
          
          <button
            onClick={handleDiscardChanges}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl font-medium transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">Hủy</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
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
            className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-medium transition-colors whitespace-nowrap border-b-2 ${
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

export default function BoosterServicesLayout({ children }: { children: ReactNode }) {
  return (
    <ServiceProvider>
      <ServiceLayoutContent>{children}</ServiceLayoutContent>
    </ServiceProvider>
  );
}
