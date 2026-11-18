import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MAINTENANCE_CACHE_TTL_MS = 15_000; // Cache trạng thái bảo trì 15s để tránh chặn mọi lần chuyển trang
const CONFIG_FETCH_TIMEOUT_MS = 1_500;   // Giới hạn timeout 1.5s (fail-open) nếu backend phản hồi chậm

let cachedMaintenance: { value: boolean; expiresAt: number } | null = null;

function parseJwtRole(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.role || null;
  } catch {
    return null;
  }
}

async function getMaintenanceMode(isPrefetch: boolean): Promise<boolean> {
  const now = Date.now();

  if (cachedMaintenance && now < cachedMaintenance.expiresAt) {
    return cachedMaintenance.value;
  }

  // Không gọi mạng chặn các request prefetch của Next.js <Link>
  if (isPrefetch) {
    return cachedMaintenance?.value ?? false;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://apil-lr.leorank.site';
    const res = await fetch(`${apiUrl}/api/public/system-config`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(CONFIG_FETCH_TIMEOUT_MS),
    });

    if (res.ok) {
      const config = await res.json();
      const isMaintenance = Boolean(
        config.maintenanceMode ?? config.maintenance ?? config.maintenance_mode ?? false
      );
      cachedMaintenance = {
        value: isMaintenance,
        expiresAt: now + MAINTENANCE_CACHE_TTL_MS,
      };
      return isMaintenance;
    }
  } catch (error) {
    // Fail open và cache ngắn để tránh lặp lại timeout liên tiếp khi backend tạm chậm
    console.error('Middleware config check failed:', error);
    cachedMaintenance = {
      value: cachedMaintenance?.value ?? false,
      expiresAt: now + 5_000,
    };
  }

  return cachedMaintenance?.value ?? false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static files, Next.js internal files, and APIs
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // images, favicon, css, etc.
  ) {
    return NextResponse.next();
  }

  const isPrefetch =
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.has('next-router-prefetch');

  // 2. Check Maintenance Mode (có cache TTL + timeout)
  const isMaintenance = await getMaintenanceMode(isPrefetch);

  const token = request.cookies.get('token')?.value;
  const userRole = token ? parseJwtRole(token) : null;
  const isAdminOrStaff = userRole === 'ADMIN' || userRole === 'STAFF';

  if (isMaintenance) {
    if (isAdminOrStaff) {
      return NextResponse.next();
    }

    const isWhitelisted =
      pathname === '/maintenance' ||
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/verify-otp' ||
      pathname.startsWith('/admin');

    if (!isWhitelisted) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  } else if (pathname === '/maintenance') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
