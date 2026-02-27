import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { newEmail, otp } = await req.json();

    // Lấy user hiện tại
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId;

    // Xác thực OTP
    const record = await VerificationCode.findOne({
      email: newEmail,
      type: 'CHANGE_EMAIL',
    });

    if (!record) {
      return NextResponse.json({ error: 'verifyOtpInvalid' }, { status: 400 });
    }

    if (record.attempts >= 3) {
      await VerificationCode.deleteOne({ _id: record._id });
      return NextResponse.json({ error: 'verifyOtpTooManyAttempts' }, { status: 429 });
    }

    if (record.code !== otp) {
      record.attempts += 1;
      await record.save();
      return NextResponse.json({ 
        error: 'otpIncorrect',
        data: { attemptsLeft: 3 - record.attempts }
      }, { status: 400 });
    }

    // OTP đúng -> Cập nhật Email cho User
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.email = newEmail;
    // Nếu đổi từ Google sang Email khác, có thể cân nhắc đổi platform thành EMAIL hoặc giữ nguyên
    // Ở đây ta giữ nguyên platform nhưng update email.
    await user.save();

    await VerificationCode.deleteOne({ _id: record._id });

    return NextResponse.json({ success: true, user: user.toObject() });

  } catch (error) {
    console.error('Verify Change Email Error:', error);
    return NextResponse.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
