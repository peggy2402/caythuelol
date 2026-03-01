'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Zap, 
  FileText, 
  Settings, 
  ShieldAlert, 
  Briefcase, 
  ListTodo, 
  Wallet, 
  UserCircle,
  Newspaper,
  LogOut
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

export default function Sidebar({ className = '', onLinkClick }: SidebarProps) {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const { t } = useLanguage();

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

  if (!user) return null;

  const NavItem = ({ href, icon: Icon, label }: any) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        onClick={onLinkClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <aside className={`w-64 bg-zinc-900/80 backdrop-blur-xl border-r border-white/5 h-screen fixed top-0 left-0 flex flex-col overflow-y-auto transition-transform duration-300 z-50 ${className}`}>
      {/* Logo Area */}
      <div className="flex h-20 items-center gap-3 px-6 border-b border-white/5 shrink-0">
        <div className="relative h-8 w-8 overflow-hidden rounded-lg">
          <Image src="/logo-ver3.png" alt="Logo" fill className="object-cover" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          CAYTHUE<span className="text-blue-500">LOL</span>
        </span>
      </div>

      <div className="space-y-1 p-4 flex-1">
        
        {/* --- CUSTOMER MENU --- */}
        {user.role === 'CUSTOMER' && (
          <>
            <NavItem href="/dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItem href="/services" icon={Zap} label={t('rentNow')} />
            <NavItem href="/orders" icon={FileText} label={t('orders')} />
            <NavItem href="/wallet" icon={Wallet} label={t('wallet')} />
            <NavItem href="/profile" icon={UserCircle} label={t('profile')} />
          </>
        )}

        {/* --- BOOSTER MENU --- */}
        {user.role === 'BOOSTER' && (
          <>
            <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Booster Zone</div>
            <NavItem href="/booster/dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItem href="/booster/jobs" icon={Briefcase} label={t('jobMarket')} />
            <NavItem href="/booster/my-orders" icon={ListTodo} label={t('myActiveJobs')} />
            <NavItem href="/booster/services" icon={Zap} label={t('manageServices')} />
            <div className="my-2 border-t border-white/5" />
            <NavItem href="/wallet" icon={Wallet} label={t('wallet')} />
            <NavItem href="/profile" icon={UserCircle} label={t('profile')} />
          </>
        )}

        {/* --- ADMIN MENU --- */}
        {user.role === 'ADMIN' && (
          <>
            <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 text-yellow-500">
              {t('admin')}
            </div>
            <NavItem href="/admin/dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItem href="/admin/boosters" icon={ShieldAlert} label={t('manageBoosters')} />
            <NavItem href="/admin/users" icon={Users} label={t('manageCustomers')} />
            <NavItem href="/admin/orders" icon={FileText} label={t('manageOrders')} />
            <NavItem href="/admin/blogs" icon={Newspaper} label={t('manageBlogs')} />
            <NavItem href="/admin/settings" icon={Settings} label={t('systemSettings')} />
          </>
        )}
      </div>
    </aside>
  );
}
