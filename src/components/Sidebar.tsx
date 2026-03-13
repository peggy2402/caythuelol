'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  LogOut,
  Home,
  CreditCard,
  AlertTriangle,
  Heart,
  DollarSign, 
  ClipboardList, 
  UserMinus,
  DoorOpen
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { logout } from '@/lib/logout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

export default function Sidebar({ className = '', onLinkClick }: SidebarProps) {
  const [user, setUser] = useState<any>(null);
  const [showResignModal, setShowResignModal] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const loadUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error("Failed to parse user data", e);
        }
      }
    };

    loadUser();

    // Lắng nghe sự kiện cập nhật user từ các component khác (Login, Profile, Admin approve...)
    window.addEventListener('user-updated', loadUser);
    
    return () => {
      window.removeEventListener('user-updated', loadUser);
    };
  }, []);

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
        <Link href="/" className="flex items-center gap-3" suppressHydrationWarning>
            <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <Image
              fill
              src="/logo-ver3.png"
              alt="Logo"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
            CAYTHUE<span className="text-blue-500">LOL</span>
            </span>
        </Link>
      </div>

      <div className="space-y-1 p-4 flex-1">
        <NavItem href="/" icon={Home} label={t('backToHome')} />
        
        {/* --- CUSTOMER MENU --- */}
        {(user.role === 'CUSTOMER' || !user.role) && (
          <>
            <NavItem href="/dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItem href="/services" icon={Zap} label={t('rentNow')} />
            <NavItem href="/orders" icon={FileText} label={t('orders')} />
            <NavItem href="/wallet" icon={Wallet} label={t('wallet')} />
            <NavItem href="/favorites" icon={Heart} label="Yêu thích" />
            <NavItem href="/profile" icon={UserCircle} label={t('profile')} />
          </>
        )}

        {/* --- BOOSTER MENU --- */}
        {user.role === 'BOOSTER' && (
          <>
            <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('boosterZone')}</div>
            <NavItem href="/booster/dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItem href="/booster/jobs" icon={Briefcase} label={t('jobMarket')} />
            <NavItem href="/booster/my-orders" icon={ListTodo} label={t('myActiveJobs')} />
            <NavItem href="/booster/services" icon={Zap} label={t('manageServices')} />
            <div className="my-2 border-t border-white/5" />
            <NavItem href="/wallet" icon={Wallet} label={t('wallet')} />
            <NavItem href="/profile" icon={UserCircle} label={t('profile')} />
            <button
              onClick={() => setShowResignModal(true)}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
            >
              <DoorOpen className="w-5 h-5" />
              <span className="font-medium">Gỡ Quyền Booster</span>
            </button>
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
            <NavItem href="/admin/transactions" icon={CreditCard} label={t('manageTransactions')} />
            <NavItem href="/admin/orders" icon={ClipboardList} label={t('manageOrders')} />
            <NavItem href="/admin/blogs" icon={Newspaper} label={t('manageBlogs')} />
            <NavItem href="/admin/withdrawals" icon={Wallet} label="Quản lý Rút tiền" />
            <NavItem href="/admin/deposits" icon={DollarSign} label="Quản lý Tiền cọc" />
            <NavItem href="/admin/disputes" icon={AlertTriangle} label="Quản lý Tranh chấp" />
            <NavItem href="/admin/cron" icon={ListTodo} label="Quản Lý Cron" />
            <NavItem href="/admin/settings" icon={Settings} label={t('systemSettings')} />
            <NavItem href="/admin/audit-logs" icon={ListTodo} label={t('auditLogs')} />

          </>
        )}
      </div>

      <div className="p-4 border-t border-white/5 space-y-1">
        <button
          onClick={() => { logout(); }}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('logout')}</span>
        </button>
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
    </aside>
  );
}
