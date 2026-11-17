'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

// Map giữa permission key và route prefix tương ứng
const PERMISSION_TO_ROUTE: Record<string, string> = {
  users: '/admin/users',
  disputes: '/admin/disputes',
  deposits: '/admin/deposits',
  cron: '/admin/cron',
  settings: '/admin/settings',
  blogs: '/admin/blogs',
  orders: '/admin/orders',
  boosters: '/admin/boosters',
  withdrawals: '/admin/withdrawals',
  transactions: '/admin/transactions',
  games: '/admin/games',
};

const DEFAULT_STAFF_PERMS = ['users', 'disputes', 'deposits', 'cron', 'settings', 'blogs', 'games'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      toast.error('Vui lòng đăng nhập để truy cập trang quản trị');
      router.replace('/login?redirect=' + encodeURIComponent(pathname));
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const role = user.role;

      if (role === 'ADMIN') {
        setIsAuthorized(true);
        return;
      }

      if (role === 'STAFF') {
        // Trang Quản lý Nhân viên & Thống kê doanh thu tối cao chỉ dành riêng cho Admin
        if (pathname.startsWith('/admin/staffs') || pathname.startsWith('/admin/analytics')) {
          toast.warning('Chức năng này chỉ dành riêng cho Quản trị viên tối cao');
          router.replace('/admin/users');
          return;
        }

        const userPerms: string[] = Array.isArray(user.staff_permissions) && user.staff_permissions.length > 0
          ? user.staff_permissions
          : DEFAULT_STAFF_PERMS;

        const allowedPrefixes = userPerms
          .map((perm) => PERMISSION_TO_ROUTE[perm])
          .filter(Boolean);

        const isStaffAllowed = allowedPrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
        );

        if (isStaffAllowed) {
          setIsAuthorized(true);
        } else {
          toast.warning('Tài khoản của bạn chưa được cấp quyền truy cập chức năng này');
          const firstAllowed = allowedPrefixes[0] || '/admin/users';
          router.replace(firstAllowed);
        }
        return;
      }

      // Khách hàng hoặc Booster không được vào admin
      toast.error('Bạn không có quyền truy cập khu vực quản trị');
      router.replace(role === 'BOOSTER' ? '/booster/dashboard' : '/dashboard');
    } catch {
      router.replace('/login');
    }
  }, [pathname, router]);

  if (isAuthorized === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-zinc-400 text-sm">Đang xác thực quyền truy cập...</p>
      </div>
    );
  }

  return <>{children}</>;
}
