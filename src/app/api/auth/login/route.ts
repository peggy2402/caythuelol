import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    // 1. Kết nối Database
    await dbConnect();

    // 2. Lấy dữ liệu từ request body
    const { email, password } = await req.json();

    // 3. Validate dữ liệu đầu vào
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ email và mật khẩu' },
        { status: 400 }
      );
    }

    // 4. Tìm user theo email
    // Sử dụng select('+password_hash') nếu field này bị ẩn mặc định trong schema (tùy cấu hình)
    // Ở schema hiện tại không ẩn, nên findOne là đủ.
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // 5. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // 6. Tạo JWT Token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('Missing JWT_SECRET in environment variables');
      return NextResponse.json(
        { error: 'Lỗi cấu hình server' },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        username: user.username,
      },
      jwtSecret,
      { expiresIn: '7d' } // Token có hiệu lực 7 ngày
    );

    // 7. Trả về response thành công (không trả về password_hash)
    const { password_hash, ...userInfo } = user.toObject();

    return NextResponse.json({ success: true, token, user: userInfo });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}