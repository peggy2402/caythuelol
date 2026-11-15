'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

// Các phân hệ được phép cho STAFF theo đúng nghiệp vụ
const STAFF_ALLOWED_PREFIXES = [
  '/admin/users',
  '/admin/disputes',
  '/admin/deposits',
  '/admin/cron',
  '/admin/settings',
  '/admin/blogs',
];

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
        // Kiểm tra xem trang hiện tại có nằm trong 6 quyền hạn của STAFF không
        const isStaffAllowed = STAFF_ALLOWED_PREFIXES.some(
          (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
        );

        if (isStaffAllowed) {
          setIsAuthorized(true);
        } else {
          toast.warning('Tài khoản Nhân viên (STAFF) không có quyền truy cập trang này');
          router.replace('/admin/users');
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
