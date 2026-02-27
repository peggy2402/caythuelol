import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ message: 'Identifier and password are required' }, { status: 400 });
    }

    // Find user by email or username (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: new RegExp(`^${identifier}$`, 'i') },
        { username: new RegExp(`^${identifier}$`, 'i') }
      ]
    }).select('+password_hash'); // Explicitly include password_hash if it's excluded by default

    if (!user || !user.password_hash) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT Payload
    const payload = {
      userId: user._id,
      username: user.username,
      email: user.email, // Thêm email vào payload để Middleware sử dụng
      role: user.role,
      isEmailVerified: user.isEmailVerified, // Quan trọng: Thêm trạng thái xác thực
    };

    // Sign token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' } // Token expires in 7 days
    );
    
    // Prepare user object to return to client (without sensitive data)
    const userResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified, // Trả về cho frontend
        wallet_balance: user.wallet_balance,
        profile: user.profile,
    };
    
    const response = NextResponse.json(
      { success: true, message: 'Đăng nhập thành công', token, user: userResponse },
      { status: 200 }
    );

    // Set Cookie để Middleware hoạt động
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
