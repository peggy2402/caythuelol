'use client';
import BarLoader from '@/components/ui/BarLoader';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userString = searchParams.get('user');

    if (token) {
      try {
        let userData: any = null;

        // 1. Parse user nếu được truyền qua query params
        if (userString) {
          try {
            userData = JSON.parse(decodeURIComponent(userString));
          } catch (e) {
            console.error('Lỗi parse userString từ URL:', e);
          }
        }

        // 2. Fallback: Giải mã trực tiếp payload từ JWT Token nếu chưa có userData
        if (!userData) {
          try {
            const parts = token.split('.');
            if (parts.length >= 2) {
              const base64Url = parts[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const payload = JSON.parse(jsonPayload);
              userData = {
                _id: payload.userId,
                username: payload.username,
                email: payload.email,
                role: payload.role || 'CUSTOMER',
                isEmailVerified: payload.isEmailVerified ?? true,
                wallet_balance: 0,
                profile: {},
              };
            }
          } catch (jwtErr) {
            console.error('Lỗi giải mã token payload:', jwtErr);
          }
        }

        // 3. Lưu vào localStorage
        localStorage.setItem('token', token);
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }

        // 4. Lưu Cookie để Server/Middleware xác thực
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=lax`;

        // 5. Bắn event thông báo cập nhật session cho Navbar và toàn app
        window.dispatchEvent(new CustomEvent('user-updated'));

        // 6. Điều hướng người dùng tới trang phù hợp theo vai trò (mặc định vào trang Dịch vụ /services)
        let targetUrl = '/services';
        if (userData?.role === 'ADMIN') {
          targetUrl = '/admin';
        } else if (userData?.role === 'BOOSTER') {
          targetUrl = '/booster/jobs';
        }

        window.location.href = targetUrl;
      } catch (error) {
        console.error('Error processing Google login:', error);
        router.push('/login?error=GoogleLoginFailed');
      }
    } else {
      router.push('/login?error=NoToken');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<BarLoader fullScreen />}>
      <GoogleCallbackContent />
    </Suspense>
  );
}