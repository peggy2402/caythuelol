import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Chỉ áp dụng cho các route trong /dashboard
  if (pathname.startsWith('/dashboard')) {
    
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      if(!secret) {
        throw new Error('JWT_SECRET is not defined');
      }
      const { payload } = await jwtVerify(token, secret);

      // 3. Check isEmailVerified
      if (!payload.isEmailVerified) {
        // Nếu chưa verify -> Redirect về trang OTP
        // Lấy email từ payload token
        const email = payload.email as string;

        // Tạo URL redirect đến trang verify-otp (không cần query param)
        const verifyUrl = new URL('/verify-otp', request.url);
        const response = NextResponse.redirect(verifyUrl);

        // Set cookie tạm thời để trang verify-otp biết email cần xác thực
        // Cookie này sẽ được xóa sau khi xác thực thành công
        response.cookies.set('verification_email', email, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 10, // 10 phút
          path: '/',
        });

        return response;
      }

      // Token hợp lệ và đã verify -> Cho qua
      return NextResponse.next();

    } catch (error) {
      // Token lỗi hoặc hết hạn
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Config để middleware chỉ chạy trên các path cần thiết (tối ưu hiệu năng)
export const config = {
  matcher: ['/dashboard/:path*'],
};
