import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Chỉ áp dụng cho các route trong /dashboard
  if (pathname.startsWith('/dashboard')) {
    
    // 2. Lấy token từ Header hoặc Cookie
    // Giả sử client gửi token qua Header: Authorization: Bearer <token>
    // Hoặc nếu bạn lưu trong cookie (khuyên dùng cho Next.js): request.cookies.get('token')
    
    // Ở đây tôi demo lấy từ Header cho API, nhưng với Page Router thường dùng Cookie.
    // Để đơn giản cho flow hiện tại (thường lưu localStorage), ta sẽ check Header.
    // Tuy nhiên, Middleware hoạt động tốt nhất với Cookie.
    
    // GIẢ ĐỊNH: Bạn đã chuyển sang dùng Cookie để lưu token.
    // Nếu dùng localStorage, Middleware KHÔNG THỂ đọc được token (vì localStorage ở client).
    // => BẮT BUỘC PHẢI DÙNG COOKIE nếu muốn bảo vệ bằng Middleware.
    
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const cypto = await import('crypto');
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || cypto.randomBytes(512).toString('hex')
      );
      
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
