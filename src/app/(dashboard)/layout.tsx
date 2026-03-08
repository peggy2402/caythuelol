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
import { socket } from '@/lib/socket';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();
  
  useEffect(() => {
    const updateUserData = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };

    const userData = localStorage.getItem('user');
    if (userData) {
      const token = localStorage.getItem('token');
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Socket: Lắng nghe thay đổi số dư toàn cục để cập nhật Header
      if (!socket.connected) socket.connect();
      
      // FIX: Luôn join room user để đảm bảo nhận event wallet
      // ChatContext có thể chưa mount hoặc bị unmount, layout luôn tồn tại
      socket.emit('join_user_room', parsedUser._id);

      const handleWalletUpdate = (data: { balance: number }) => {
        console.log('💰 Socket Wallet Update:', data);
        // Hiệu ứng âm thanh tiền về (ting ting)
        // Chỉ phát ở Layout nếu KHÔNG PHẢI trang Wallet (vì trang Wallet đã tự xử lý phát âm thanh rồi)
        if (pathname !== '/wallet') {
          try {
            const audio = new Audio('/sounds/coins.mp3');
            audio.volume = 0.8;
            audio.play().catch((err) => console.log('Audio play failed:', err));
          } catch (e) {}
        }

        const newBalance = data.balance;
        setUser((prev: any) => ({ ...prev, wallet_balance: newBalance }));
        
        // Cập nhật localStorage để đồng bộ dữ liệu mới nhất
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.wallet_balance = newBalance;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Dispatch event for other components (like Navbar)
        window.dispatchEvent(new CustomEvent('user-updated'));
      };

      socket.on('wallet_update', handleWalletUpdate);
      window.addEventListener('user-updated', updateUserData);

      return () => { 
        socket.off('wallet_update', handleWalletUpdate);
        window.removeEventListener('user-updated', updateUserData);
      };

      // Fetch notifications
      if (token) {
        fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            })
            .catch(err => console.error("Failed to fetch notifications", err));
      }
    }
  }, []);

  const handleReadNoti = async () => {
    setIsNotiOpen(!isNotiOpen);
    if (unreadCount > 0) {
        await fetch('/api/notifications', { method: 'PATCH' });
        setUnreadCount(0);
    }
  };

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
    { href: '/admin/transactions', label: t('manageTransactions') },
    { href: '/admin/blogs', label: t('manageBlogs') },
    { href: '/admin/settings', label: t('systemSettings') },
    { href: '/admin/withdrawals', label: 'Quản lý Rút tiền' },
    { href: '/admin/audit-logs', label: t('auditLogs') },
    { href: '/admin/disputes', label: 'Quản lý Tranh chấp' },
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

            <div className="relative">
              <button 
                onClick={handleReadNoti}
                className="relative rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-zinc-950 animate-pulse" />
                )}
              </button>

              {isNotiOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotiOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-white/10 bg-zinc-900 shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="p-3 border-b border-white/5 font-bold text-white text-sm">Thông báo</div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-zinc-500 text-xs">Không có thông báo mới</div>
                      ) : (
                        notifications.map((noti, idx) => (
                          <Link 
                            href={noti.link || '#'} 
                            key={idx} 
                            onClick={() => setIsNotiOpen(false)}
                            className="block p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                          >
                            <div className="text-sm font-bold text-white mb-1">{noti.title}</div>
                            <div className="text-xs text-zinc-400 line-clamp-2">{noti.message}</div>
                            <div className="text-[10px] text-zinc-600 mt-1">{new Date(noti.createdAt).toLocaleDateString()}</div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-8 w-[1px] bg-white/10" />

            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-white">{user?.username || 'User'}</div>
                  <div className="text-xs text-blue-400 font-medium">
                    {user?.wallet_balance?.toLocaleString('vi-VN') || 0} đ
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[1px]">
                  <div className="h-full w-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                     {user?.profile?.avatar ? (
                        <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                        <User className="h-5 w-5 text-white" />
                     )}
                  </div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-sm font-bold text-white">{user?.username}</p>
                      <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                    </div>
                    
                    <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                      <User className="w-4 h-4" />
                      {t('profile')}
                    </Link>
                    <Link href="/wallet" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                      <Wallet className="w-4 h-4" />
                      {t('wallet')}
                    </Link>
                    
                    <div className="border-t border-white/5 my-1" />
                    
                    <button 
                      onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                </>
              )}
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
