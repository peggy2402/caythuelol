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
      return NextResponse.json({ error: 'emailIsRequired' }, { status: 400 });
    }

    // 1. Kiểm tra User
    const user = await User.findOne({ email });
    if (!user) {
      // Trả về lỗi chung để tránh dò email
      return NextResponse.json({ error: 'userNotFound' }, { status: 404 });
    }

    // Kiểm tra platform (nếu là Google/Facebook thì không cho reset pass kiểu này)
    if (user.platform === 'GOOGLE' || user.platform === 'FACEBOOK') {
      return NextResponse.json({ 
        error: 'socialAccountResetError',
        data: { platform: user.platform }
      }, { status: 400 });
    }

    // 2. Xóa OTP cũ (nếu có)
    await VerificationCode.deleteMany({ email, type: 'PASSWORD_RESET' });

    // 3. Tạo OTP mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await VerificationCode.create({
      email,
      code: otp,
      type: 'PASSWORD_RESET', // Quan trọng: Loại OTP khác
      expiresAt,
    });

    // 4. Gửi Email
    await sendVerificationEmail(email, otp);

    return NextResponse.json({ success: true, message: 'otpSentSuccess' }, { status: 200 });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ error: 'serverError' }, { status: 500 });
  }
}