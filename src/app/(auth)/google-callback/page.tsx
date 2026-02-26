'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // Lưu vào localStorage giống như login thường
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Chuyển hướng vào dashboard
        router.push('/dashboard');
        router.refresh();
      } catch (e) {
        console.error('Error parsing user data', e);
        router.push('/login?error=ParseError');
      }
    } else {
      router.push('/login?error=NoToken');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
      <p className="text-zinc-400">Đang xử lý đăng nhập Google...</p>
    </div>
  );
}
