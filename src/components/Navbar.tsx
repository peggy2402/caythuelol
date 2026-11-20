'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  User,
  Wallet,
  LogOut,
  LayoutDashboard,
  FileText,
  ChevronDown,
  X,
  ShieldAlert,
  Users,
  Newspaper,
  Settings,
  Briefcase,
  ListTodo,
  Zap,
  Trophy,
  Bell,
  Heart,
  Crown,
  AlertTriangle,
  DoorOpen,
  Power,
  Check,
} from 'lucide-react';
import { useLanguage, Language } from '../lib/i18n';
import { useRouter, usePathname } from 'next/navigation';
import { socket } from '@/lib/socket';
import { logout } from '@/lib/logout';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

const LANGUAGES_LIST: { code: Language; label: string; nativeName: string; flag: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'kr', label: 'Hàn Quốc', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'jp', label: 'Nhật Bản', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇺🇸' },
];

function LanguageIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.58 19.37L17.59 11.01C17.38 10.46 16.91 10.12 16.37 10.12C15.83 10.12 15.37 10.46 15.14 11.03L12.16 19.37C12.02 19.76 12.22 20.19 12.61 20.33C13 20.47 13.43 20.27 13.57 19.88L14.19 18.15H18.54L19.16 19.88C19.27 20.19 19.56 20.38 19.87 20.38C19.95 20.38 20.04 20.37 20.12 20.34C20.51 20.2 20.71 19.77 20.57 19.38L20.58 19.37ZM14.74 16.64L16.38 12.05L18.02 16.64H14.74ZM12.19 7.85C9.92999 11.42 7.89 13.58 5.41 15.02C5.29 15.09 5.16 15.12 5.04 15.12C4.78 15.12 4.53 14.99 4.39 14.75C4.18 14.39 4.3 13.93 4.66 13.73C6.75999 12.51 8.48 10.76 10.41 7.86H4.12C3.71 7.86 3.37 7.52 3.37 7.11C3.37 6.7 3.71 6.36 4.12 6.36H7.87V4.38C7.87 3.97 8.21 3.63 8.62 3.63C9.02999 3.63 9.37 3.97 9.37 4.38V6.36H13.12C13.53 6.36 13.87 6.7 13.87 7.11C13.87 7.52 13.53 7.86 13.12 7.86H12.18L12.19 7.85ZM12.23 15.12C12.1 15.12 11.97 15.09 11.85 15.02C11.2 14.64 10.57 14.22 9.97999 13.78C9.64999 13.53 9.58 13.06 9.83 12.73C10.08 12.4 10.55 12.33 10.88 12.58C11.42 12.99 12.01 13.37 12.61 13.72C12.97 13.93 13.09 14.39 12.88 14.75C12.74 14.99 12.49 15.12 12.23 15.12Z" />
    </svg>
  );
}

function LanguageDropdown({
  language,
  setLanguage,
  className = '',
}: {
  language: Language;
  setLanguage: (lang: Language) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
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

  return (
    <div ref={dropdownRef} className={`relative ${className}`} suppressHydrationWarning>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors group cursor-pointer flex items-center justify-center"
        aria-label="Chọn ngôn ngữ"
        title="Chọn ngôn ngữ (Language)"
      >
        <LanguageIcon className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-white/5 mb-1">
            Chọn Ngôn Ngữ (Language)
          </div>
          {LANGUAGES_LIST.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/20'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <div className="text-left">
                    <div className="leading-tight">{lang.nativeName}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">{lang.code}</div>
                  </div>
                </div>
                {isSelected && <Check size={14} className="text-blue-400 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const notiRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  // Tự động đóng menu Thông báo / Tài khoản khi bấm ra ngoài, nhấn ESC hoặc chuyển trang
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (notiRef.current && !notiRef.current.contains(target)) {
        setIsNotiOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotiOpen(false);
        setIsDropdownOpen(false);
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
    setIsNotiOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  const fetchUserData = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data && data.balance !== undefined) {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = {
              ...currentUser,
              wallet_balance: data.balance,
              pending_balance: data.pending,
              role: data.role || currentUser.role // Cập nhật Role mới nhất từ server
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Bắn sự kiện để Sidebar cập nhật lại menu ngay lập tức
            window.dispatchEvent(new Event('user-updated'));
          }
        }).catch(() => { });
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // --- SOCKET INTEGRATION FOR NAVBAR ---
        if (!socket.connected) socket.connect();

        const joinRoom = () => {
          if (parsedUser._id) socket.emit('join_user_room', parsedUser._id);
        };
        joinRoom();
        socket.on('connect', joinRoom);

        // 1. Wallet Update
        const handleWalletUpdate = (data: { balance: number }) => {
          const newBalance = data.balance;
          setUser((prev: any) => ({ ...prev, wallet_balance: newBalance }));

          // Sync localStorage
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          currentUser.wallet_balance = newBalance;
          localStorage.setItem('user', JSON.stringify(currentUser));
        };

        // 2. Notification Update
        const handleNotification = (data: any) => {
          toast(data.title, { description: data.message });
          setNotifications((prev) => [data, ...prev]);
          setUnreadCount((prev) => prev + 1);
        };

        socket.on('wallet_update', handleWalletUpdate);
        socket.on('notification', handleNotification);

        // Fetch notifications
        if (token) {
          fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
              if (res.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                return null;
              }
              if (!res.ok) return null;
              return res.json();
            })
            .then(data => {
              if (data) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
              }
            })
            .catch(() => {});
        }

        // Fetch fresh balance on mount to fix 0đ issue
        fetchUserData();

        return () => {
          socket.off('connect', joinRoom);
          socket.off('wallet_update', handleWalletUpdate);
          socket.off('notification', handleNotification);
        };
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    // Listen for balance updates from other components
    const handleUserUpdate = () => {
      const updated = localStorage.getItem('user');
      if (updated) setUser(JSON.parse(updated));
    };

    window.addEventListener('user-updated', handleUserUpdate);
    window.addEventListener('focus', fetchUserData); // Auto refresh khi quay lại tab
    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
      window.removeEventListener('focus', fetchUserData);
    };
  }, []);

  const handleReadNoti = async () => {
    const nextOpen = !isNotiOpen;
    setIsNotiOpen(nextOpen);
    if (nextOpen) {
      setIsDropdownOpen(false);
    }
    if (nextOpen && unreadCount > 0) {
      await fetch('/api/notifications', { method: 'PATCH' });
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // const handleLogout = () => {
  //   localStorage.removeItem('token');
  //   localStorage.removeItem('user');
  //   setUser(null);
  //   router.push('/');
  // };

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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const dashboardHref = user?.role === 'ADMIN'
    ? '/admin/dashboard'
    : user?.role === 'BOOSTER'
      ? '/booster/dashboard'
      : '/dashboard';

  const NavLink = ({
    href,
    label
  }: {
    href: string;
    label: string;
  }) => (
    <Link
      href={href}
      suppressHydrationWarning
      className={`relative group transition ${pathname === href
        ? 'text-white'
        : 'text-zinc-400 hover:text-white'
        }`}
    >
      <span>
        {label}
        <span
          className={`absolute left-0 -bottom-1 h-[2px] bg-blue-500 transition-all ${pathname === href ? 'w-full' : 'w-0 group-hover:w-full'
            }`}
        />
      </span>
    </Link>
  );

  return (
    <>
      <header
        suppressHydrationWarning
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300 ${isScrolled || isMobileMenuOpen
          ? 'h-16 bg-zinc-650 shadow-lg'
          : 'h-20 bg-zinc-650/80'
          }`}
      >
        {/* Gradient Border */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" suppressHydrationWarning />

        <div className="container mx-auto flex h-full items-center justify-between px-6" suppressHydrationWarning>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" suppressHydrationWarning>
            <div className="relative h-9 w-9 overflow-hidden group-hover:ring-blue-500/50 transition" suppressHydrationWarning>
              <Image src="/logo.png" alt="Logo" fill sizes="36px" className="object-cover" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              LEO<span className="text-blue-500">RANK</span>
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden xl:flex items-center gap-5" suppressHydrationWarning>
            {/* Nav Links */}
            <nav className="flex items-center gap-7 text-sm font-medium" suppressHydrationWarning>
              <NavLink href="/services" label={t('services')} />
              <NavLink href="/boosters" label={t('boosters')} />
              <NavLink href="/vip" label="Hội Viên VIP" />
              <NavLink href="/blogs" label={t('blog')} />
              {user?.role === 'BOOSTER' && (
                <NavLink href="/booster/jobs" label={t('jobMarket')} />
              )}
              {user?.role === 'CUSTOMER' && (
                <Link href="/boosters/apply" className="text-yellow-500 hover:text-yellow-400 transition">
                  {t('becomeBooster')}
                </Link>
              )}
            </nav>

            <div className="h-5 w-px bg-white/10" suppressHydrationWarning />

            {/* Right Tools & Actions (Language, Bell, User) */}
            <div className="flex items-center gap-1.5" suppressHydrationWarning>
              <LanguageDropdown
                language={language}
                setLanguage={setLanguage}
              />

              {/* Notification Bell */}
              {user && (
                <div ref={notiRef} className="relative">
                  <button
                    type="button"
                    onClick={handleReadNoti}
                    className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Thông báo"
                    aria-expanded={isNotiOpen}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </button>

                  {isNotiOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="p-3 border-b border-zinc-800 font-bold text-white text-sm">Thông báo</div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-zinc-500 text-xs">Không có thông báo mới</div>
                        ) : (
                          notifications.map((noti, idx) => (
                            <Link href={noti.link || '#'} key={idx} onClick={() => setIsNotiOpen(false)} className="block p-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0">
                              <div className="text-sm font-bold text-white mb-1">{noti.title}</div>
                              <div className="text-xs text-zinc-400 line-clamp-2">{noti.message}</div>
                              <div className="text-[10px] text-zinc-600 mt-1">{new Date(noti.createdAt).toLocaleDateString()}</div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user ? (
                <div ref={userMenuRef} className="relative ml-1" suppressHydrationWarning>
                  <button
                    type="button"
                    onClick={() => {
                      const nextOpen = !isDropdownOpen;
                      setIsDropdownOpen(nextOpen);
                      if (nextOpen) setIsNotiOpen(false);
                    }}
                    aria-expanded={isDropdownOpen}
                    className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 hover:border-blue-500/40 transition cursor-pointer"
                  >
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-[1px]">
                      <div className="h-full w-full bg-zinc-950 rounded-full flex items-center justify-center">
                        {user.profile?.avatar ? (
                          <img
                            src={user.profile.avatar}
                            alt="Avatar"
                            className="rounded-full h-8 w-8 object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-xs font-semibold text-white">
                        {user.username}
                      </div>
                      <div className="text-[11px] font-medium text-emerald-400">
                        {user.wallet_balance?.toLocaleString('vi-VN')}đ
                      </div>
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 text-zinc-500 transition ${isDropdownOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {/* Dropdown */}
                  <div
                    suppressHydrationWarning
                    className={`absolute right-0 mt-3 w-64 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl transition-all duration-200 ${isDropdownOpen
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 -translate-y-2 pointer-events-none'
                      }`}
                  >
                    <div className="p-2 space-y-1 text-sm">
                      <Link
                        href={dashboardHref}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {t('dashboard')}
                      </Link>

                      <Link
                        href="/wallet"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
                      >
                        <Wallet className="h-4 w-4" />
                        {t('wallet')}
                      </Link>

                      <Link
                        href="/vip"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-emerald-400 font-semibold"
                      >
                        <Crown className="h-4 w-4 text-emerald-400" />
                        Hội Viên VIP Pass
                      </Link>

                      {user.role === 'CUSTOMER' && (
                        <>
                          <Link
                            href="/orders"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
                          >
                            <FileText className="h-4 w-4" />
                            {t('orders')}
                          </Link>
                          <Link
                            href="/favorites"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
                          >
                            <Heart className="h-4 w-4" />
                            Yêu thích
                          </Link>
                        </>
                      )}

                      {user.role === 'BOOSTER' && (
                        <>
                          <Link
                            href="/booster/jobs"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
                          >
                            <Briefcase className="h-4 w-4" />
                            {t('jobMarket')}
                          </Link>
                          <Link
                            href="/booster/my-orders"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
                          >
                            <ListTodo className="h-4 w-4" />
                            {t('myActiveJobs')}
                          </Link>
                          <button
                            onClick={() => { toggleAvailability(); setIsDropdownOpen(false); }}
                            className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors ${(user.booster_info?.isReady ?? true) ? 'text-green-400' : 'text-zinc-500'
                              }`}
                          >
                            <Power className="h-4 w-4" />
                            {(user.booster_info?.isReady ?? true) ? 'Đang Sẵn Sàng' : 'Đang Tạm Nghỉ'}
                          </button>
                          <button
                            onClick={() => setShowResignModal(true)}
                            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-red-400"
                          >
                            <DoorOpen className="h-4 w-4" /> Gỡ Quyền Booster
                          </button>
                        </>
                      )}

                      {/* Admin Link - Chỉ hiện khi role là ADMIN */}
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin/boosters"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-yellow-500"
                        >
                          <ShieldAlert className="h-4 w-4" />
                          Duyệt Đơn Booster
                        </Link>
                      )}

                      <div className="border-t border-white/10 my-1" />

                      <button
                        onClick={() => { logout(); }}
                        className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 ml-2" suppressHydrationWarning>
                  <Link
                    href="/login"
                    suppressHydrationWarning
                    className="text-zinc-400 hover:text-white transition text-sm font-medium"
                  >
                    {t('login')}
                  </Link>

                  <Link
                    href="/dashboard"
                    suppressHydrationWarning
                    className="rounded-lg bg-blue-600 px-5 py-2 text-white font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition text-sm"
                  >
                    {t('rentNow')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile & Tablet Hamburger Button */}
          <div className="flex xl:hidden items-center gap-2" suppressHydrationWarning>
            {user && (
              <Link href="/profile" className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition">
                <div className="h-8 w-8 rounded-full overflow-hidden border border-white/20 bg-zinc-800 flex items-center justify-center">
                  {user.profile?.avatar ? (
                    <img src={user.profile.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">
                      {user.username.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </Link>
            )}

            <button
              suppressHydrationWarning
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Menu Overlay */}
      <div
        suppressHydrationWarning
        className={`fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={closeMobileMenu}
      />

      {/* Mobile & Tablet Menu Panel */}
      <div
        suppressHydrationWarning
        className={`fixed inset-y-0 right-0 z-[60] flex flex-col w-3/4 max-w-xs sm:max-w-sm border-l border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-in-out xl:hidden ${isMobileMenuOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none hidden'
          }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4" suppressHydrationWarning>
          <div className="relative h-10 w-10" suppressHydrationWarning>
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tighter">LEO<span className="text-blue-500">RANK</span></span>
          <button onClick={closeMobileMenu} className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 flex flex-col overflow-y-auto p-6 text-base font-medium" suppressHydrationWarning>
          {user ? (
            <div className="flex flex-col h-full">
              {/* User Info */}
              <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-6">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                  <div className="h-full w-full rounded-full bg-zinc-900 flex items-center justify-center">
                    {user.profile?.avatar ? (
                      <img src={user.profile.avatar} alt="Avatar" className="rounded-full h-12 w-12 object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold text-white leading-tight">{user.username}</div>
                  <div className="text-sm font-medium text-emerald-400">
                    {user.wallet_balance?.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex-grow space-y-2">
                {/* Common Links */}
                <Link href={dashboardHref} onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><LayoutDashboard className="h-5 w-5 text-zinc-400" />{t('dashboard')}</Link>

                {/* Customer Links */}
                {user.role === 'CUSTOMER' && (
                  <>
                    <Link href="/orders" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><FileText className="h-5 w-5 text-zinc-400" />{t('orders')}</Link>
                    <Link href="/wallet" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><Wallet className="h-5 w-5 text-zinc-400" />{t('wallet')}</Link>
                    <Link href="/vip" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-emerald-400 font-bold"><Crown className="h-5 w-5 text-emerald-400" />Hội Viên VIP</Link>
                    <Link href="/favorites" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><Heart className="h-5 w-5 text-zinc-400" />Yêu thích</Link>
                    <Link href="/boosters/apply" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-yellow-500"><Trophy className="h-5 w-5" />{t('becomeBooster')}</Link>
                  </>
                )}

                {/* Booster Links */}
                {user.role === 'BOOSTER' && (
                  <>
                    <Link href="/booster/jobs" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><Briefcase className="h-5 w-5 text-zinc-400" />{t('jobMarket')}</Link>
                    <Link href="/booster/my-orders" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><ListTodo className="h-5 w-5 text-zinc-400" />{t('myActiveJobs')}</Link>
                    <Link href="/booster/services" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><Zap className="h-5 w-5 text-zinc-400" />{t('manageServices')}</Link>
                    <Link href="/wallet" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><Wallet className="h-5 w-5 text-zinc-400" />{t('wallet')}</Link>
                    <button
                      onClick={() => { toggleAvailability(); closeMobileMenu(); }}
                      className={`flex w-full items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors ${(user.booster_info?.isReady ?? true) ? 'text-green-400' : 'text-zinc-500'
                        }`}
                    >
                      <Power className="h-5 w-5" />
                      {(user.booster_info?.isReady ?? true) ? 'Đang Sẵn Sàng' : 'Đang Tạm Nghỉ'}
                    </button>
                    <button onClick={() => { setShowResignModal(true); closeMobileMenu(); }} className="flex w-full items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-red-400"><DoorOpen className="h-5 w-5" /> Gỡ Quyền Booster</button>
                  </>
                )}

                {/* Admin Links */}
                {user.role === 'ADMIN' && (
                  <>
                    <Link href="/admin/boosters" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-yellow-500"><ShieldAlert className="h-5 w-5" />{t('manageBoosters')}</Link>
                    <Link href="/admin/users" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><Users className="h-5 w-5 text-zinc-400" />{t('manageCustomers')}</Link>
                    <Link href="/admin/orders" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><FileText className="h-5 w-5 text-zinc-400" />{t('manageOrders')}</Link>
                    <Link href="/admin/blogs" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><Newspaper className="h-5 w-5 text-zinc-400" />{t('manageBlogs')}</Link>
                    <Link href="/admin/settings" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"><Settings className="h-5 w-5 text-zinc-400" />{t('systemSettings')}</Link>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-white/10 space-y-3" suppressHydrationWarning>
                <Link href="/dashboard" onClick={closeMobileMenu} className="block w-full text-center rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold">{t('rentNow')}</Link>
                <Link href="/wallet" onClick={closeMobileMenu} className="block w-full text-center rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-6 py-3 text-emerald-400 font-semibold">{t('depositNow')}</Link>
                <button onClick={() => { logout(); closeMobileMenu(); }} className="flex w-full items-center justify-center gap-3 rounded-lg py-3 text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="h-5 w-5" /> {t('logout')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full" suppressHydrationWarning>
              <div className="flex-grow space-y-2" suppressHydrationWarning>
                <Link href="/services" onClick={closeMobileMenu} suppressHydrationWarning className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">{t('services')}</Link>
                <Link href="/boosters" onClick={closeMobileMenu} suppressHydrationWarning className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">{t('boosters')}</Link>
                <Link href="/vip" onClick={closeMobileMenu} suppressHydrationWarning className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-emerald-400 font-bold">Hội Viên VIP</Link>
                <Link href="/blogs" onClick={closeMobileMenu} suppressHydrationWarning className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">{t('blog')}</Link>
              </div>

              <div className="space-y-3" suppressHydrationWarning>
                <div className="flex gap-3" suppressHydrationWarning>
                  <Link href="/login" onClick={closeMobileMenu} suppressHydrationWarning className="flex-1 text-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-6 py-3 font-semibold transition-colors hover:bg-zinc-700">{t('login')}</Link>
                  <Link href="/register" onClick={closeMobileMenu} suppressHydrationWarning className="flex-1 text-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-6 py-3 font-semibold transition-colors hover:bg-zinc-700">{t('registerNow')}</Link>
                </div>
                <Link href="/dashboard" onClick={closeMobileMenu} suppressHydrationWarning className="block text-center rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold">{t('rentNow')}</Link>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col items-center justify-center pt-6 border-t border-white/10 gap-2" suppressHydrationWarning>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <LanguageIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ngôn ngữ hiển thị</span>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
              {LANGUAGES_LIST.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    language === lang.code
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{lang.flag}</span>
                  <span className="uppercase text-[11px]">{lang.code}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* Resign Confirmation Modal */}
      <Dialog open={showResignModal} onOpenChange={setShowResignModal}>
        <DialogContent className="bg-zinc-900 border-red-500/20 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-500 flex items-center gap-2">
              <AlertTriangle /> Gỡ quyền Booster
            </DialogTitle>
            <DialogDescription className="text-zinc-300 pt-4 text-base font-medium">
              Bạn có chắc muốn ngừng làm Booster?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-zinc-950/50 p-4 rounded-lg border border-white/5 text-sm text-zinc-400 space-y-2">
            <p className="font-semibold text-zinc-300">Sau khi xác nhận:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bạn sẽ được hoàn lại tiền cọc</li>
              <li>Bạn sẽ không nhận được đơn mới</li>
              <li>Các đơn đang làm vẫn phải hoàn thành</li>
              <li>Bạn sẽ trở lại tài khoản Khách hàng</li>
            </ul>
          </div>

          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setShowResignModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white">Hủy</Button>
            <Button onClick={handleResign} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold">Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}