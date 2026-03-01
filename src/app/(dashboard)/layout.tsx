'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Gamepad2,
  Wallet,
  User,
  LogOut,
  Menu,
  Bell,
  Briefcase,
  X,
  Settings2
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Danh sách tất cả các trang để hiển thị tiêu đề (Breadcrumb)
  const allNavItems = [
    // Common
    { href: '/dashboard', label: t('dashboard') },
    { href: '/admin/dashboard', label: t('dashboard') },
    { href: '/booster/dashboard', label: t('dashboard') },
    { href: '/orders', label: t('orders') },
    { href: '/wallet', label: t('wallet') },
    { href: '/profile', label: t('profile') },
    
    // Booster Routes
    { href: '/booster/jobs', label: t('jobMarket') },
    { href: '/booster/my-orders', label: t('myActiveJobs') },
    { href: '/booster/services', label: t('manageServices') },

    // Admin Routes
    { href: '/admin/boosters', label: t('manageBoosters') },
    { href: '/admin/users', label: t('manageCustomers') },
    { href: '/admin/orders', label: t('manageOrders') },
    { href: '/admin/blogs', label: t('manageBlogs') },
    { href: '/admin/settings', label: t('systemSettings') },
  ];

  // Tìm item khớp với URL hiện tại (ưu tiên khớp chính xác hoặc khớp phần đầu)
  const activeNavItem = allNavItems.find(item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile Sidebar */}
      <Sidebar 
        className={`md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} 
        onLinkClick={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex min-h-screen flex-col md:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-zinc-950/80 px-6 backdrop-blur-md">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden md:block">
            <h2 className="text-sm font-medium text-zinc-400">
              Dashboard &gt; <span className="text-white">{activeNavItem?.label || t('dashboard')}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher Icon */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-white/5"
              >
                <Image 
                  src="/language.svg" 
                  alt="Change Language" 
                  width={24} 
                  height={24} 
                  className="invert opacity-70 hover:opacity-100 transition-opacity"
                />
              </button>

              {isLangMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-32 rounded-xl border border-white/10 bg-zinc-900 p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    {(['vi', 'en', 'kr', 'jp'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setIsLangMenuOpen(false);
                        }}
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          language === lang
                            ? 'bg-blue-600/10 text-blue-400'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {lang === 'vi' ? 'Tiếng Việt' : lang === 'en' ? 'English' : lang === 'kr' ? '한국어' : '日本語'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="relative rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-zinc-950" />
            </button>

            <div className="h-8 w-[1px] bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-white">{user?.username || 'User'}</div>
                <div className="text-xs text-blue-400 font-medium">
                  {user?.wallet_balance?.toLocaleString('vi-VN') || 0} đ
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[1px]">
                <div className="h-full w-full rounded-full bg-zinc-900 flex items-center justify-center">
                   <User className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
