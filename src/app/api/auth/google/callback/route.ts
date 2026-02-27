import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User, { UserRole } from '@/models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=GoogleAuthFailed`);
  }

  try {
    // 1. Trao đổi code lấy Access Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${appUrl}/api/auth/google/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Failed to get tokens');

    // 2. Lấy thông tin User từ Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userResponse.json();

    await dbConnect();

    // 3. Tìm hoặc tạo User trong MongoDB
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Tạo mật khẩu ngẫu nhiên vì user login bằng Google
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      // Tạo username từ email nếu chưa có (cắt bỏ phần @gmail.com và thêm số ngẫu nhiên)
      let baseUsername = googleUser.email.split('@')[0];
      const existingUsername = await User.findOne({ username: baseUsername });
      if (existingUsername) {
        baseUsername += Math.floor(Math.random() * 10000);
      }

      user = new User({
        username: baseUsername,
        email: googleUser.email,
        password_hash: passwordHash,
        role: UserRole.CUSTOMER,
        wallet_balance: 0,
        profile: {
          avatar: googleUser.picture,
        },
      });
      await user.save();
    }

    const cypto = await import('crypto');
    // 4. Tạo JWT Token (Giống logic login thường)
    const JWT_SECRET = process.env.JWT_SECRET || cypto.randomBytes(512).toString('hex');
    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Chuyển hướng về trang trung gian để lưu token vào localStorage
    // Chúng ta truyền token qua URL (Lưu ý: Trong production nên dùng Cookie httpOnly để bảo mật hơn, 
    // nhưng để đồng bộ với code hiện tại dùng localStorage, ta dùng cách này)
    const userString = encodeURIComponent(JSON.stringify({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      wallet_balance: user.wallet_balance,
      profile: user.profile
    }));
    
    return NextResponse.redirect(`${appUrl}/google-callback?token=${token}&user=${userString}`);

  } catch (error) {
    console.error('Google Auth Error:', error);
    return NextResponse.redirect(`${appUrl}/login?error=GoogleAuthError`);
  }
}
