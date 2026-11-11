import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // 2. Check Maintenance Mode
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://apil-lr.leorank.site';
    const configUrl = `${apiUrl}/api/public/system-config?ts=${Date.now()}`;
    const res = await fetch(configUrl, { cache: 'no-store' });
    
    if (res.ok) {
      const config = await res.json();
      const isMaintenance = Boolean(
        config.maintenanceMode ?? config.maintenance ?? config.maintenance_mode ?? false
      );

      // Check if user is ADMIN to allow bypass
      const token = request.cookies.get('token')?.value;
      const userRole = token ? parseJwtRole(token) : null;
      const isAdmin = userRole === 'ADMIN';

      if (isMaintenance) {
        // Admin is allowed to browse or access admin panel to manage system
        if (isAdmin) {
          return NextResponse.next();
        }

        // Whitelist routes during maintenance:
        // - /maintenance (the maintenance notification itself)
        // - /login (to let administrators log in)
        // - /admin (admin control panel)
        const isWhitelisted =
          pathname === '/maintenance' ||
          pathname === '/login' ||
          pathname.startsWith('/admin');

        if (!isWhitelisted) {
          return NextResponse.redirect(new URL('/maintenance', request.url));
        }
      } else {
        // If maintenance is OFF and user visits /maintenance, redirect to home
        if (pathname === '/maintenance') {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
  } catch (error) {
    // Fail open (allow access if config check fails)
    console.error('Middleware config check failed:', error);
  }

  return NextResponse.next();
}
