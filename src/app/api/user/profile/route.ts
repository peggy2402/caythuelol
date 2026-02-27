import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { username, avatar } = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId;

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'userNotFound' }, { status: 404 });

    // Kiểm tra username trùng
    if (username !== user.username) {
        const existing = await User.findOne({ username });
        if (existing) return NextResponse.json({ error: 'usernameTaken' }, { status: 400 });
        user.username = username;
    }

    if (avatar) user.profile.avatar = avatar;
    await user.save();

    return NextResponse.json({ success: true, user: user.toObject() });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return NextResponse.json({ error: 'serverError' }, { status: 500 });
  }
}
