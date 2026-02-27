import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import jwt from 'jsonwebtoken';
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Thiếu thông tin xác thực' }, { status: 400 });
    }

    // 1. Tìm mã OTP trong DB
    const record = await VerificationCode.findOne({
      email,
      type: 'EMAIL_VERIFICATION',
    });
    if (!record) {
      return NextResponse.json(
        { error: 'verifyOtpInvalid' },
        { status: 400 }
      );
    }

    // 2. Kiểm tra số lần thử (Chống Brute Force)
    if (record.attempts >= 3) {
      await VerificationCode.deleteOne({ _id: record._id });
      return NextResponse.json(
        { error: 'verifyOtpTooManyAttempts' },
        { status: 429 }
      );
    }

    // 3. So sánh OTP
    if (record.code !== otp) {
      // Tăng số lần sai
      record.attempts += 1;
      await record.save();
      return NextResponse.json(
        { 
          error: 'otpIncorrect', // Key cho thông báo chính
          data: { attemptsLeft: 3 - record.attempts } // Dữ liệu động
        },
        { status: 400 }
      );
    }

    // 4. OTP đúng -> Xác thực User
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'userNotFound' }, { status: 404 });
    }

    user.isEmailVerified = true;
    await user.save();

    // 5. Xóa OTP sau khi dùng xong
    await VerificationCode.deleteOne({ _id: record._id });

    const cypto = await import('crypto');
    // 6. Tạo JWT Token (Login luôn cho user)
    const JWT_SECRET = process.env.JWT_SECRET || cypto.randomBytes(512).toString('hex');
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role, 
        username: user.username,
        isEmailVerified: true // Quan trọng cho Middleware
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json(
        { success: true, message: 'verifySuccess', token, user: {
            ...user.toObject(),
            password_hash: undefined, // Không trả về hash
        } },
        { status: 200 }
    );

    // Set Cookie để Middleware hoạt động
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
      path: '/',
    });

    // Xóa cookie verification_email vì đã xác thực xong
    response.cookies.delete('verification_email');

    return response;

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
