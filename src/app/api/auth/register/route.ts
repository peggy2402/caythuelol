import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import { sendVerificationEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { username, email, password, role, phoneNumber } = await req.json();

    // 1. Validate dữ liệu đầu vào
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
    }

    // Validate Username format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: 'Tên đăng nhập phải từ 3 đến 20 ký tự' }, { status: 400 });
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ error: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới' }, { status: 400 });
    }

    // Validate Password length
    if (password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });
    }

    // 2. Kiểm tra user đã tồn tại chưa
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json({ error: 'Email hoặc Tên đăng nhập đã tồn tại' }, { status: 400 });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Tạo User mới
    const newUser = new User({
      username,
      email,
      password_hash: passwordHash,
      role: role || 'CUSTOMER',
      phoneNumber: phoneNumber || '',
      isEmailVerified: false, // Mặc định chưa xác thực
      platform: 'EMAIL',
      wallet_balance: 0,
      pending_balance: 0,
      profile: {
        avatar: '',
      },
    });
    await newUser.save();

    // 5. Tạo và gửi OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 số ngẫu nhiên
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

    await VerificationCode.create({
      email,
      code: otp,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
    });

    // 6. Gửi Email
    await sendVerificationEmail(email, otp);

    // 7. Trả về kết quả & Set Cookie tạm để verify
    const response = NextResponse.json(
      { success: true, message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.' },
      { status: 201 }
    );

    // Cookie này chỉ tồn tại 10 phút, dùng để trang /verify-otp biết user nào đang verify
    response.cookies.set('verification_email', email, {
      httpOnly: true, // Client JS không đọc được (Bảo mật)
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 phút
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Register Error:', error);
    return NextResponse.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}