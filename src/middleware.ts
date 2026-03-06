import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static files and APIs
  // Lưu ý: Đã xóa '/maintenance' khỏi đây để xử lý logic redirect khi hết bảo trì
  if (
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // images, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Check Maintenance Mode
  try {
    // Use absolute URL for server-side fetch in middleware
    const url = request.nextUrl.clone();
    url.pathname = '/api/public/system-config';
    // Thêm timestamp để tránh cache tuyệt đối
    url.searchParams.set('ts', Date.now().toString());
    
    const res = await fetch(url.toString(), { next: { revalidate: 0 } }); // Disable cache for immediate updates
    if (res.ok) {
      const config = await res.json();
      
      if (config.maintenanceMode) {
        // Nếu đang BẬT bảo trì -> Chặn truy cập
        if (
          pathname.startsWith('/dashboard') || 
          pathname.startsWith('/profile') || 
          pathname.startsWith('/wallet') ||
          pathname.startsWith('/services') || // Chặn đặt đơn
          pathname.startsWith('/boosters') || // Chặn xem booster
          pathname.startsWith('/orders') ||      // Chặn xem đơn hàng
          pathname.startsWith('/blogs') ||         // Chặn admin panel
          pathname.startsWith('/booster/jobs') ||          // Chặn jobs panel
          pathname.startsWith('/booster/my-orders') || // Chặn my orders panel
          pathname.startsWith('/booster/services') || // Chặn services panel
          pathname.startsWith('/booster/dashboard')    // Chặn dashboard dashboard
        ) {
           return NextResponse.rewrite(new URL('/maintenance', request.url));
        }
      } else {
        // Nếu đang TẮT bảo trì mà user vẫn ở trang /maintenance -> Đẩy về trang chủ
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