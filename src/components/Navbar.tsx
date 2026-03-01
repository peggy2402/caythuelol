'use client';

import { useState, useEffect } from 'react';
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
  Trophy
} from 'lucide-react';
import { useLanguage, Language } from '../lib/i18n';
import { useRouter, usePathname } from 'next/navigation';

function LanguageSwitcher({
  language,
  setLanguage,
  className = ''
}: {
  language: Language;
  setLanguage: (lang: Language) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`} suppressHydrationWarning>
      {(['vi', 'kr', 'jp', 'en'] as Language[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`text-xs font-bold uppercase transition ${
            language === lang
              ? 'text-blue-500'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
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
      className={`relative group transition ${
        pathname === href
          ? 'text-white'
          : 'text-zinc-400 hover:text-white'
      }`}
    >
      <span>
        {label}
        <span
          className={`absolute left-0 -bottom-1 h-[2px] bg-blue-500 transition-all ${
            pathname === href ? 'w-full' : 'w-0 group-hover:w-full'
          }`}
        />
      </span>
    </Link>
  );

  return (
    <>
    <header
      suppressHydrationWarning
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
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
            <Image src="/logo-ver3.png" alt="Logo" fill className="object-cover" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            CAYTHUE<span className="text-blue-500">LOL</span>
          </span>
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium" suppressHydrationWarning>
          <NavLink href="/services" label={t('services')} />
          <NavLink href="/boosters" label={t('boosters')} />
          <NavLink href="/blogs" label={t('blog')} />
          {user?.role === 'CUSTOMER' && (
            <Link href="/boosters/apply" className="text-yellow-500 hover:text-yellow-400 transition">
              {t('becomeBooster')}
            </Link>
          )}
          <div className="h-5 w-px bg-white/10" suppressHydrationWarning />

          <LanguageSwitcher
            language={language}
            setLanguage={setLanguage}
          />

          {user ? (
            <div className="relative ml-4" suppressHydrationWarning>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 hover:border-blue-500/40 transition"
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
                  className={`h-4 w-4 text-zinc-500 transition ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown */}
              <div
                suppressHydrationWarning
                className={`absolute right-0 mt-3 w-64 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl transition-all duration-200 ${
                  isDropdownOpen
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
                    href="/orders"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
                  >
                    <FileText className="h-4 w-4" />
                    {t('orders')}
                  </Link>

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
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                suppressHydrationWarning
                className="text-zinc-400 hover:text-white transition"
              >
                {t('login')}
              </Link>

              <Link
                href="/dashboard"
                suppressHydrationWarning
                className="rounded-lg bg-blue-600 px-5 py-2 text-white font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition"
              >
                {t('rentNow')}
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Button */}
        <button
          suppressHydrationWarning
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-zinc-400 hover:text-white"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>
    </header>

      {/* Mobile Menu Overlay */}
      <div 
        suppressHydrationWarning
        className={`fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileMenu}
      />

      {/* Mobile Menu Panel */}
      <div 
        suppressHydrationWarning
        className={`fixed inset-y-0 right-0 z-[60] flex flex-col w-3/4 max-w-xs transform border-l border-white/10 bg-zinc-750/80 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4" suppressHydrationWarning>
          <div className="relative h-10 w-10" suppressHydrationWarning>
              <Image src="/logo-ver3.png" alt="Logo" fill className="object-contain" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tighter">CAYTHUE<span className="text-blue-500">LOL</span></span>
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
              <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                <Link href="/dashboard" onClick={closeMobileMenu} className="block w-full text-center rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold">{t('rentNow')}</Link>
                <Link href="/wallet" onClick={closeMobileMenu} className="block w-full text-center rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-6 py-3 text-emerald-400 font-semibold">{t('depositNow')}</Link>
                <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="flex w-full items-center justify-center gap-3 rounded-lg py-3 text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="h-5 w-5" /> {t('logout')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-grow space-y-2">
                <Link href="/services" onClick={closeMobileMenu} suppressHydrationWarning className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">{t('services')}</Link>
                <Link href="/boosters" onClick={closeMobileMenu} suppressHydrationWarning className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">{t('boosters')}</Link>
                <Link href="/blogs" onClick={closeMobileMenu} suppressHydrationWarning className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">{t('blog')}</Link>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Link href="/login" onClick={closeMobileMenu} suppressHydrationWarning className="flex-1 text-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-6 py-3 font-semibold transition-colors hover:bg-zinc-700">{t('login')}</Link>
                  <Link href="/register" onClick={closeMobileMenu} suppressHydrationWarning className="flex-1 text-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-6 py-3 font-semibold transition-colors hover:bg-zinc-700">{t('registerNow')}</Link>
                </div>
                <Link href="/dashboard" onClick={closeMobileMenu} suppressHydrationWarning className="block text-center rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold">{t('rentNow')}</Link>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex items-center justify-center pt-8 border-t border-white/10">
            <LanguageSwitcher
              language={language}
              setLanguage={setLanguage}
              className="justify-center"
            />
          </div>
        </nav>
      </div>
    </>
  );
}