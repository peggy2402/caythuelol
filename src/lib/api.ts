// src/lib/api.ts

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://apil-lr.leorank.site';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  [key: string]: any;
}

/**
 * Universal API fetch helper
 * Tự động gắn credentials (cookie) và tiền tố API_BASE_URL khi cần thiết
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Nếu ở trình duyệt (client-side), ưu tiên gọi qua Next.js rewrite (/api/...) để tránh CORS
  // Nếu ở server-side (SSR / Server Component), gọi trực tiếp tới backend URL
  const normalizedPath = cleanEndpoint.startsWith('/api')
    ? cleanEndpoint
    : `/api${cleanEndpoint}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: options.credentials || 'include',
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}
