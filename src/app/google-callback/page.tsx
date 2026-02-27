'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userString = searchParams.get('user');

    if (token && userString) {
      try {
        // 1. Lưu vào localStorage (để Client dùng)
        localStorage.setItem('token', token);
        localStorage.setItem('user', decodeURIComponent(userString));

        // 2. Set Cookie (để Middleware dùng)
        // Lưu ý: Tốt nhất là Server nên set cookie httpOnly ngay trong API route.
        // Nhưng nếu API Google Callback đang trả về URL redirect kèm token,
        // ta có thể set cookie tạm ở đây để đảm bảo (dù không bảo mật bằng httpOnly).
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=strict`;

        // 3. Chuyển hướng về Dashboard
        router.push('/dashboard');
        router.refresh(); // Refresh để cập nhật trạng thái login
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}