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
  DoorOpen,
  UserCheck,
  Gamepad2,
  Crown,
  Gift,
  X
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { logout } from '@/lib/logout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
  onClose?: () => void;
}

export default function Sidebar({ className = '', onLinkClick, onClose }: SidebarProps) {
  const [user, setUser] = useState<any>(null);
  const [showResignModal, setShowResignModal] = useState(false);
  const [jobsCount, setJobsCount] = useState<number>(0);
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

  // Lấy và cập nhật số lượng việc làm trên Sàn việc làm cho Booster (Đơn chỉ định + Đơn công khai)
  useEffect(() => {
    if (user?.role !== 'BOOSTER') return;

    let isMounted = true;
    const fetchJobsCount = async () => {
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
            setJobsCount(direct + pub);
          }
        }
      } catch (e) {}
    };

    fetchJobsCount();

    const handleJobsUpdated = (e: any) => {
      if (e.detail?.count !== undefined) {
        setJobsCount(e.detail.count);
      } else {
        fetchJobsCount();
      }
    };

    window.addEventListener('booster-jobs-updated', handleJobsUpdated);
    window.addEventListener('focus', fetchJobsCount);

    const interval = setInterval(fetchJobsCount, 15000);

    return () => {
      isMounted = false;
      window.removeEventListener('booster-jobs-updated', handleJobsUpdated);
      window.removeEventListener('focus', fetchJobsCount);
      clearInterval(interval);
    };
  }, [user?.role]);

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

  const NavItem = ({ href, icon: Icon, label, badge }: any) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        onClick={onLinkClick}
        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
          : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
          <span className="font-medium truncate">{label}</span>
        </div>
        {badge !== undefined && badge !== null && Number(badge) > 0 && (
          <span className={`px-2 py-0.5 text-[11px] font-black rounded-full transition-all shrink-0 shadow-sm ${
            isActive 
              ? 'bg-white text-blue-600 shadow-white/20' 
              : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse group-hover:bg-red-500 group-hover:text-white'
          }`}>
            {Number(badge) > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className={`w-64 bg-zinc-900/80 backdrop-blur-xl border-r border-white/5 h-screen fixed top-0 left-0 flex flex-col overflow-y-auto transition-transform duration-300 z-50 ${className}`}>
      {/* Logo Area */}
      <div className="flex h-20 items-center justify-between px-6 border-b border-white/5 shrink-0">
        <Link href="/" className="flex items-center gap-3" suppressHydrationWarning>
          <div className="relative h-8 w-8 overflow-hidden rounded-lg shrink-0">
            <Image
              fill
              src="/logo.png"
              alt="Logo"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            LEO<span className="text-cyan-400">RANK</span>
          </span>
        </Link>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Đóng Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
            <NavItem href="/loyalty" icon={Gift} label="Tích điểm đổi quà" />
            <NavItem href="/favorites" icon={Heart} label="Yêu thích" />
            <NavItem href="/profile" icon={UserCircle} label={t('profile')} />
          </>
        )}

        {/* --- BOOSTER MENU --- */}
        {user.role === 'BOOSTER' && (
          <>
            <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('boosterZone')}</div>
            <NavItem href="/booster/dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItem href="/booster/jobs" icon={Briefcase} label={t('jobMarket')} badge={jobsCount} />
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

        {/* --- STAFF MENU (HIỂN THỊ THEO PHÂN QUYỀN ĐỘNG) --- */}
        {user.role === 'STAFF' && (() => {
          const staffPerms: string[] = Array.isArray(user.staff_permissions) && user.staff_permissions.length > 0
            ? user.staff_permissions
            : ['users', 'disputes', 'deposits', 'cron', 'settings', 'blogs'];

          return (
            <>
              <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 text-blue-400">
                Nhân Viên Vận Hành
              </div>
              {staffPerms.includes('users') && <NavItem href="/admin/users" icon={Users} label={t('manageCustomers')} />}
              {staffPerms.includes('boosters') && <NavItem href="/admin/boosters" icon={ShieldAlert} label={t('manageBoosters')} />}
              {staffPerms.includes('orders') && <NavItem href="/admin/orders" icon={ClipboardList} label={t('manageOrders')} />}
              {staffPerms.includes('disputes') && <NavItem href="/admin/disputes" icon={AlertTriangle} label="Quản lý Tranh chấp" />}
              {staffPerms.includes('deposits') && <NavItem href="/admin/deposits" icon={DollarSign} label="Quản lý Tiền cọc" />}
              {staffPerms.includes('withdrawals') && <NavItem href="/admin/withdrawals" icon={Wallet} label="Quản lý Rút tiền" />}
              {staffPerms.includes('transactions') && <NavItem href="/admin/transactions" icon={CreditCard} label={t('manageTransactions')} />}
              {staffPerms.includes('blogs') && <NavItem href="/admin/blogs" icon={Newspaper} label={t('manageBlogs')} />}
              {staffPerms.includes('cron') && <NavItem href="/admin/cron" icon={ListTodo} label="Quản Lý Cron" />}
              {staffPerms.includes('games') && <NavItem href="/admin/games" icon={Gamepad2} label="Cấu hình Tựa Game" />}
              {staffPerms.includes('vip') && <NavItem href="/admin/vip" icon={Crown} label="Hội Viên VIP" />}
              {staffPerms.includes('settings') && <NavItem href="/admin/settings" icon={Settings} label={t('systemSettings')} />}
            </>
          );
        })()}

        {/* --- ADMIN MENU --- */}
        {user.role === 'ADMIN' && (
          <>
            <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 text-yellow-500">
              {t('admin')}
            </div>
            <NavItem href="/admin/dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItem href="/admin/staffs" icon={UserCheck} label="Quản lý Nhân Viên" />
            <NavItem href="/admin/boosters" icon={ShieldAlert} label={t('manageBoosters')} />
            <NavItem href="/admin/users" icon={Users} label={t('manageCustomers')} />
            <NavItem href="/admin/transactions" icon={CreditCard} label={t('manageTransactions')} />
            <NavItem href="/admin/orders" icon={ClipboardList} label={t('manageOrders')} />
            <NavItem href="/admin/blogs" icon={Newspaper} label={t('manageBlogs')} />
            <NavItem href="/admin/withdrawals" icon={Wallet} label="Quản lý Rút tiền" />
            <NavItem href="/admin/deposits" icon={DollarSign} label="Quản lý Tiền cọc" />
            <NavItem href="/admin/disputes" icon={AlertTriangle} label="Quản lý Tranh chấp" />
            <NavItem href="/admin/cron" icon={ListTodo} label="Quản Lý Cron" />
            <NavItem href="/admin/games" icon={Gamepad2} label="Cấu hình Tựa Game" />
            <NavItem href="/admin/vip" icon={Crown} label="Hội Viên VIP" />
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
