import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Vui lòng nhập email' }, { status: 400 });
    }

    // 1. Kiểm tra User
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Email chưa được đăng ký' }, { status: 404 });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ error: 'Tài khoản này đã được xác thực rồi' }, { status: 400 });
    }

    // 2. Rate Limit đơn giản (Kiểm tra xem có OTP nào vừa tạo trong 60s không)
    // Tuy nhiên, logic đơn giản nhất là xóa cũ tạo mới.
    // Để tránh spam, frontend nên disable nút Resend trong 60s.
    
    // Xóa OTP cũ nếu có
    await VerificationCode.deleteMany({ email, type: 'EMAIL_VERIFICATION' });

    // 3. Tạo OTP mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60s

    await VerificationCode.create({
      email,
      code: otp,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
    });

    // 4. Gửi Email
    await sendVerificationEmail(email, otp);

    const response = NextResponse.json(
      { success: true, message: 'Đã gửi lại mã OTP' },
      { status: 200 }
    );
    
    return response;
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return NextResponse.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
