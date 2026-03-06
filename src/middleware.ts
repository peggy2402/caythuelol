import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import path from 'path';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static files and APIs
  if (
    pathname.startsWith('/api') || // Allow auth API for login/logout
    pathname.startsWith('/api/auth') || // Allow auth API for login/logout
    pathname.startsWith('/api/public/system-config') || // Allow public config API
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/public') || // Allow public config API
    pathname.startsWith('/maintenance') ||
    pathname.includes('.') // images, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Check Maintenance Mode
  // Note: Fetching in middleware can add latency. 
  // In production, consider using Edge Config (Vercel) or Redis for better performance.
  try {
    // Use absolute URL for server-side fetch in middleware
    const url = request.nextUrl.clone();
    url.pathname = '/api/public/system-config';
    
    const res = await fetch(url.toString(), { next: { revalidate: 0 } }); // Disable cache for immediate updates
    if (res.ok) {
      const config = await res.json();
      
      if (config.maintenanceMode) {
        // Allow Admin login or specific bypass logic if needed
        // For now, block access to Dashboard and other sensitive routes
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/wallet')) {
           // Check if user is admin? 
           // Since we can't easily decode JWT with role in Edge without libraries, 
           // we simply redirect everyone to maintenance for now.
           // To allow Admins, you would need to decode the 'token' cookie here.
           return NextResponse.rewrite(new URL('/maintenance', request.url));
        }
      }
    }
  } catch (error) {
    // Fail open (allow access if config check fails)
    console.error('Middleware config check failed:', error);
  }

  return NextResponse.next();
}