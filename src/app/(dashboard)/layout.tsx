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
  X
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/orders', label: t('orders'), icon: Gamepad2 },
    { href: '/dashboard/wallet', label: t('wallet'), icon: Wallet },
    { href: '/dashboard/profile', label: t('profile'), icon: User },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/5 bg-zinc-900/80 backdrop-blur-xl transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center gap-3 px-6 border-b border-white/5">
           <div className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image src="/logo-ver3.png" alt="Logo" fill className="object-cover" />
           </div>
           <span className="text-lg font-bold tracking-tight text-white">
             CAYTHUE<span className="text-blue-500">LOL</span>
           </span>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.1)] ring-1 ring-blue-500/20'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-white'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-4">
          <button
            onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-5 w-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

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
              Dashboard &gt; <span className="text-white">{t('dashboard')}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
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
