'use client';

import { useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://apil-lr.leorank.site';

export default function ApiInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Ghi đè window.fetch để mọi request /api/... từ trình duyệt gọi trực tiếp tới Backend NestJS
    const originalFetch = window.fetch;
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      let targetUrl = input;

      if (typeof input === 'string') {
        if (input.startsWith('/api/')) {
          targetUrl = `${API_BASE_URL}${input}`;
        } else if (input.startsWith('http://localhost:3000/api/')) {
          targetUrl = input.replace('http://localhost:3000/api/', `${API_BASE_URL}/api/`);
        } else if (input.startsWith('https://leorank.site/api/')) {
          targetUrl = input.replace('https://leorank.site/api/', `${API_BASE_URL}/api/`);
        } else if (input.startsWith('https://www.leorank.site/api/')) {
          targetUrl = input.replace('https://www.leorank.site/api/', `${API_BASE_URL}/api/`);
        }
      }

      const headers = new Headers(init?.headers || {});

      // Tự động đính kèm token từ localStorage nếu chưa có
      try {
        const token = localStorage.getItem('token');
        if (token && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      } catch (e) {
        // Safe check nếu trình duyệt chặn localStorage
      }

      return originalFetch(targetUrl, {
        ...init,
        headers,
        credentials: init?.credentials || 'include',
      });
    };
  }, []);

  return null;
}

