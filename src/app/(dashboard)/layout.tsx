'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Settings2,
  AlertTriangle,
  DoorOpen,
  Power,
  Zap
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import Sidebar from '@/components/Sidebar';
import { socket } from '@/lib/socket';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import UserBadge from '@/components/UserBadge';
import { AnimatePresence, motion } from 'framer-motion';
import ServerFlag from '@/components/ServerFlag';

const DROPDOWN_MOTION = {
  initial: { opacity: 0, y: -8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.96 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
};

const DASHBOARD_LANGS = [
  { code: 'vi' as const, label: 'Tiếng Việt', flagCode: 'VN' },
  { code: 'en' as const, label: 'English', flagCode: 'NA' },
  { code: 'kr' as const, label: '한국어', flagCode: 'KR' },
  { code: 'jp' as const, label: '日本語', flagCode: 'JP' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [boosterJobsCount, setBoosterJobsCount] = useState<number>(0);
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const langMenuRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Tự động đóng menu Ngôn ngữ / Thông báo / User khi click ra ngoài, nhấn ESC hoặc chuyển trang
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setIsLangMenuOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(target)) {
        setIsNotiOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLangMenuOpen(false);
        setIsNotiOpen(false);
        setIsUserMenuOpen(false);
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setIsLangMenuOpen(false);
    setIsNotiOpen(false);
    setIsUserMenuOpen(false);
    setIsSidebarOpen(false);
  }, [pathname]);

  // Khóa cuộn nền khi mở Mobile Sidebar
  useEffect(() => {
    if (!isSidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isSidebarOpen]);
  
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const token = localStorage.getItem('token');
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Hàm lấy dữ liệu mới nhất (Số dư + Thông báo) để đồng bộ
      const fetchFreshData = () => {
        if (!token) return;

        // 1. Notifications
        fetch(`/api/notifications?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            })
            .catch(err => console.error("Failed to fetch notifications", err));

        // 2. Wallet Balance (Đồng bộ số dư thực tế không cần reload)
        fetch(`/api/wallet?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data.isBanned) {
                    toast.error("Tài khoản của bạn đã bị khóa do vi phạm hoặc nợ cước.");
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/banned';
                    return;
                }
                if (data.balance !== undefined) {
                    setUser((prev: any) => {
                        const currentUserState = prev || parsedUser;
                        const updated = { ...currentUserState, wallet_balance: data.balance };
                        localStorage.setItem('user', JSON.stringify(updated));
                        return updated;
                    });
                }
            })
            .catch(() => {});

        // 3. User Profile (Đồng bộ role, VIP tier, điểm số mới nhất)
        fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data && (data._id || data.user)) {
                    const fresh = data.user || data;
                    setUser((prev: any) => {
                        const currentUserState = prev || parsedUser;
                        const updated = { ...currentUserState, ...fresh };
                        localStorage.setItem('user', JSON.stringify(updated));
                        return updated;
                    });
                }
            })
            .catch(() => {});
      };

      const updateUserData = () => {
        const stored = localStorage.getItem('user');
        if (stored) {
          setUser(JSON.parse(stored));
        }
        fetchFreshData();
      };

      const handleCustomWalletUpdate = (e: any) => {
        if (e.detail?.balance !== undefined) {
          setUser((prev: any) => ({ ...prev, wallet_balance: e.detail.balance }));
        }
        fetchFreshData();
      };

      // Socket: Lắng nghe thay đổi số dư toàn cục để cập nhật Header
      if (!socket.connected) socket.connect();
      
      // FIX: Định nghĩa hàm join room để dùng lại khi reconnect
      const joinRoom = () => {
        if (parsedUser._id) socket.emit('join_user_room', parsedUser._id);
      };

      joinRoom(); // Join ngay lập tức
      socket.on('connect', joinRoom); // Join lại khi kết nối lại (fix lỗi rớt mạng/F5)

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

      // Xử lý thông báo Realtime (Order, Match, Message, System)
      const handleNotification = (data: any) => {
        console.log('🔔 Notification:', data);
        // Hiển thị Toast
        toast(data.title, { description: data.message });
        
        // Cập nhật danh sách thông báo
        setNotifications((prev) => [data, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };

      const handleBoosterJobsSocket = () => {
        window.dispatchEvent(new CustomEvent('booster-jobs-updated'));
      };

      socket.on('wallet_update', handleWalletUpdate);
      socket.on('notification', handleNotification);
      socket.on('booster_jobs_updated', handleBoosterJobsSocket);

      window.addEventListener('user-updated', updateUserData);
      window.addEventListener('wallet_update', handleCustomWalletUpdate);

      // Gọi ngay khi mount và khi focus lại tab
      fetchFreshData();
      window.addEventListener('focus', fetchFreshData);

      // POLLING: Tự động cập nhật mỗi 10 giây (Fallback cho Socket)
      const intervalId = setInterval(fetchFreshData, 10000);
      
      // *** FIX: Gộp tất cả cleanup vào một return duy nhất ***
      return () => { 
        socket.off('connect', joinRoom);
        socket.off('wallet_update', handleWalletUpdate);
        socket.off('notification', handleNotification);
        socket.off('booster_jobs_updated', handleBoosterJobsSocket);
        window.removeEventListener('user-updated', updateUserData);
        window.removeEventListener('wallet_update', handleCustomWalletUpdate);
        window.removeEventListener('focus', fetchFreshData);
        clearInterval(intervalId);
      };
    }
  }, []);

  const handleReadNoti = async () => {
    const nextOpen = !isNotiOpen;
    setIsNotiOpen(nextOpen);
    if (nextOpen) {
      setIsLangMenuOpen(false);
      setIsUserMenuOpen(false);
    }
    if (nextOpen && unreadCount > 0) {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setUnreadCount(0);
    }
  };

  const handleResign = async () => {
    try {
      const res = await fetch('/api/boosters/resign', { method: 'POST' });
      if (res.ok) {
        toast.success("Đã hủy tư cách Booster thành công.");
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.role = 'CUSTOMER';
          localStorage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new Event('user-updated'));
        }
        router.push('/dashboard');
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Lỗi khi thực hiện yêu cầu.");
    }
    setShowResignModal(false);
  };

  // Đồng bộ số lượng việc làm trên Sàn việc làm cho mobile bottom navigation
  useEffect(() => {
    if (user?.role !== 'BOOSTER') return;
    let isMounted = true;
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/boosters/market', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            const direct = Array.isArray(data.directRequests) ? data.directRequests.length : 0;
            const pub = Array.isArray(data.publicJobs) ? data.publicJobs.length : 0;
            setBoosterJobsCount(direct + pub);
          }
        }
      } catch (e) {}
    };

    fetchJobs();
    const handleUpdate = (e: any) => {
      if (e.detail?.count !== undefined) setBoosterJobsCount(e.detail.count);
      else fetchJobs();
    };

    window.addEventListener('booster-jobs-updated', handleUpdate);
    const interval = setInterval(fetchJobs, 15000);
    return () => {
      isMounted = false;
      window.removeEventListener('booster-jobs-updated', handleUpdate);
      clearInterval(interval);
    };
  }, [user?.role]);

  const toggleAvailability = async () => {
    if (!user || user.role !== 'BOOSTER') return;
    
    // Default to true if undefined
    const currentStatus = user.booster_info?.isReady ?? true;
    const newStatus = !currentStatus;

    // Optimistic update
    const updatedUser = { ...user, booster_info: { ...user.booster_info, isReady: newStatus } };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    try {
        await apiFetch('/boosters/availability', {
            method: 'PATCH',
            body: JSON.stringify({ isReady: newStatus })
        });
        toast.success(newStatus ? 'Đã bật trạng thái Sẵn sàng nhận đơn' : 'Đã chuyển sang trạng thái Tạm nghỉ');
    } catch (e) {
        toast.error('Lỗi cập nhật trạng thái');
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
    { href: '/admin/cron', label: 'System Cron' },
  ];

  // Tìm item khớp với URL hiện tại (ưu tiên khớp chính xác hoặc khớp phần đầu)
  const activeNavItem = allNavItems.find(item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Mobile & Tablet Sidebar Overlay (có đủ fade-in & hậu animation fade-out) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="dashboard-sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile & Tablet Sidebar (slide-in & hậu animation slide-out mượt) */}
      <Sidebar 
        className={`lg:hidden transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
          isSidebarOpen ? 'translate-x-0 pointer-events-auto shadow-2xl' : '-translate-x-full pointer-events-none'
        }`} 
        onLinkClick={() => setIsSidebarOpen(false)} 
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-zinc-950/80 px-4 sm:px-6 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Mở menu điều hướng"
            aria-expanded={isSidebarOpen}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden transition-colors cursor-pointer"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-zinc-400">
              Dashboard &gt; <span className="text-white">{activeNavItem?.label || t('dashboard')}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher Icon */}
            <div ref={langMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  const nextOpen = !isLangMenuOpen;
                  setIsLangMenuOpen(nextOpen);
                  if (nextOpen) {
                    setIsNotiOpen(false);
                    setIsUserMenuOpen(false);
                  }
                }}
                aria-expanded={isLangMenuOpen}
                className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-white/5 cursor-pointer"
              >
                <Image 
                  src="/language.svg" 
                  alt="Change Language" 
                  width={24} 
                  height={24} 
                  className="invert opacity-70 hover:opacity-100 transition-opacity"
                />
              </button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    {...DROPDOWN_MOTION}
                    className="absolute right-0 top-full mt-2 z-50 w-40 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl p-1.5 shadow-2xl origin-top-right"
                  >
                    {DASHBOARD_LANGS.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                          language === lang.code
                            ? 'bg-blue-600/15 text-blue-400'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <ServerFlag code={lang.flagCode} size="sm" className="w-5 h-5" />
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div ref={notiRef} className="relative">
              <button 
                type="button"
                onClick={handleReadNoti}
                aria-expanded={isNotiOpen}
                className="relative rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
              >
                <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-white' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center ring-2 ring-zinc-950 shadow-md shadow-red-500/40 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotiOpen && (
                  <motion.div
                    {...DROPDOWN_MOTION}
                    className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                      <span className="font-bold text-white text-sm">Thông báo</span>
                      <span className="text-[11px] text-zinc-400">
                        {notifications.length > 0 ? `${notifications.length} gần nhất` : 'Trống'}
                      </span>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-dark-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-xs">Không có thông báo mới</div>
                      ) : (
                        notifications.map((noti, idx) => (
                          <Link 
                            href={noti.link || '#'} 
                            key={noti._id || idx} 
                            onClick={() => setIsNotiOpen(false)}
                            className={`block p-3.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                              noti.isRead === false ? 'bg-blue-500/[0.06]' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="text-xs sm:text-sm font-bold text-white leading-snug">{noti.title}</div>
                              {noti.isRead === false && (
                                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{noti.message}</div>
                            <div className="text-[10px] text-zinc-500 mt-1.5">
                              {noti.createdAt
                                ? new Date(noti.createdAt).toLocaleString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit',
                                  })
                                : 'Vừa xong'}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-[1px] bg-white/10" />

            <div ref={userMenuRef} className="relative">
              <button 
                type="button"
                onClick={() => {
                  const nextOpen = !isUserMenuOpen;
                  setIsUserMenuOpen(nextOpen);
                  if (nextOpen) {
                    setIsLangMenuOpen(false);
                    setIsNotiOpen(false);
                  }
                }}
                aria-expanded={isUserMenuOpen}
                className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 justify-end">
                    <span>{user?.username || 'User'}</span>
                    <UserBadge
                      role={user?.role}
                      vipTier={user?.vip_info?.package_type || user?.vip_tier}
                      totalSpent={user?.total_spent || (user?.total_points_earned ? user.total_points_earned * 1000 : 0)}
                      size="sm"
                      tooltipPosition="bottom"
                    />
                  </div>
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
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    {...DROPDOWN_MOTION}
                    className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl p-2 shadow-2xl origin-top-right"
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-bold text-white">{user?.username}</p>
                        <UserBadge
                          role={user?.role}
                          vipTier={user?.vip_info?.package_type || user?.vip_tier}
                          totalSpent={user?.total_spent || (user?.total_points_earned ? user.total_points_earned * 1000 : 0)}
                          size="sm"
                        />
                      </div>
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

                    {user?.role === 'BOOSTER' && (
                      <button 
                        onClick={() => { toggleAvailability(); setIsUserMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                          (user.booster_info?.isReady ?? true) ? 'text-green-400 hover:bg-white/5' : 'text-zinc-500 hover:bg-white/5'
                        }`}
                      >
                        <Power className="w-4 h-4" /> 
                        {(user.booster_info?.isReady ?? true) ? 'Đang Sẵn Sàng' : 'Đang Tạm Nghỉ'}
                      </button>
                    )}
                    {user?.role === 'BOOSTER' && (
                      <button 
                        onClick={() => { setShowResignModal(true); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <DoorOpen className="w-4 h-4" /> Gỡ Quyền Booster
                      </button>
                    )}
                    
                    <div className="border-t border-white/5 my-1" />
                    
                    <button 
                      onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-zinc-950">
          {children}
        </main>
      </div>

      {/* Mobile & Tablet Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center justify-around lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        {user?.role === 'BOOSTER' ? (
          <>
            <Link
              href="/booster/dashboard"
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                pathname === '/booster/dashboard' ? 'text-cyan-400 scale-105' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Tổng quan</span>
            </Link>
            <Link
              href="/booster/jobs"
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all relative ${
                pathname === '/booster/jobs' ? 'text-cyan-400 scale-105' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Briefcase className="w-5 h-5" />
                {boosterJobsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 bg-cyan-400 text-black text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                    {boosterJobsCount > 9 ? '9+' : boosterJobsCount}
                  </span>
                )}
              </div>
              <span>Sàn việc</span>
            </Link>
            <Link
              href="/booster/my-orders"
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                pathname === '/booster/my-orders' ? 'text-cyan-400 scale-105' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-5 h-5" />
              <span>Đơn cày</span>
            </Link>
            <Link
              href="/booster/services"
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                pathname === '/booster/services' ? 'text-cyan-400 scale-105' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span>Dịch vụ</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
              <span>Menu</span>
            </button>
          </>
        ) : (
          <>
            <Link
              href="/dashboard"
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                pathname === '/dashboard' ? 'text-cyan-400 scale-105' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Tổng quan</span>
            </Link>
            <Link
              href="/services"
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                pathname === '/services' || pathname.startsWith('/services/') ? 'text-cyan-400 scale-105' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span>Thuê ngay</span>
            </Link>
            <Link
              href="/orders"
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                pathname.startsWith('/orders') ? 'text-cyan-400 scale-105' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-5 h-5" />
              <span>Đơn hàng</span>
            </Link>
            <Link
              href="/wallet"
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                pathname === '/wallet' ? 'text-cyan-400 scale-105' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span>Ví tiền</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
              <span>Menu</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
