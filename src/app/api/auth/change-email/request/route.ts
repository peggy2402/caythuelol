import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { newEmail } = await req.json();

    if (!newEmail) {
      return NextResponse.json({ error: 'Vui lòng nhập email mới' }, { status: 400 });
    }

    // Kiểm tra xem email mới đã tồn tại chưa
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'Email này đã được sử dụng bởi tài khoản khác' }, { status: 400 });
    }

    // Xóa OTP cũ
    await VerificationCode.deleteMany({ email: newEmail, type: 'CHANGE_EMAIL' });

    // Tạo OTP mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60s

    await VerificationCode.create({
      email: newEmail, // Lưu OTP gắn với email MỚI
      code: otp,
      type: 'CHANGE_EMAIL',
      expiresAt,
    });

    // Gửi Email
    await sendVerificationEmail(newEmail, otp);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Request Change Email Error:', error);
    return NextResponse.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
