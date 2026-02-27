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

    // Kiểm tra platform (nếu là Google/Facebook thì không cho reset pass kiểu này)
    if (user.platform === 'GOOGLE' || user.platform === 'FACEBOOK') {
      return NextResponse.json({ 
        error: `Tài khoản này được đăng ký bằng ${user.platform}. Vui lòng đăng nhập bằng ${user.platform}.` 
      }, { status: 400 });
    }

    // 2. Xóa OTP cũ (nếu có)
    await VerificationCode.deleteMany({ email, type: 'PASSWORD_RESET' });

    // 3. Tạo OTP mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60s

    await VerificationCode.create({
      email,
      code: otp,
      type: 'PASSWORD_RESET', // Quan trọng: Loại OTP khác
      expiresAt,
    });

    // 4. Gửi Email
    await sendVerificationEmail(email, otp);

    return NextResponse.json({ success: true, message: 'Mã xác thực đã được gửi đến email.' }, { status: 200 });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}