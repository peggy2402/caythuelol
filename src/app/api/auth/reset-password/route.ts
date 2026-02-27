import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });
    }

    // 1. Tìm mã OTP trong DB
    const record = await VerificationCode.findOne({
      email,
      type: 'PASSWORD_RESET', // Chỉ tìm loại này
    });

    if (!record) {
      return NextResponse.json({ error: 'verifyOtpInvalid' }, { status: 400 });
    }

    // 2. Kiểm tra số lần thử
    if (record.attempts >= 3) {
      await VerificationCode.deleteOne({ _id: record._id });
      return NextResponse.json({ error: 'verifyOtpTooManyAttempts' }, { status: 429 });
    }

    // 3. So sánh OTP
    if (record.code !== otp) {
      record.attempts += 1;
      await record.save();
      return NextResponse.json({ 
        error: 'otpIncorrect',
        data: { attemptsLeft: 3 - record.attempts }
      }, { status: 400 });
    }

    // 4. OTP đúng -> Đổi mật khẩu User
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'userNotFound' }, { status: 404 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.password_hash = passwordHash;
    await user.save();

    // 5. Xóa OTP
    await VerificationCode.deleteOne({ _id: record._id });

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' }, { status: 200 });

  } catch (error) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
