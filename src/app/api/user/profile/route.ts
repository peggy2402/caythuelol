import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import BoosterProfile from '@/models/BoosterProfile';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { username, avatar, booster_info } = await req.json();

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

    if (avatar !== undefined) user.profile.avatar = avatar;
    await user.save();

    // 2. Update BoosterProfile (bio) nếu user là booster
    if (user.role === 'BOOSTER' && booster_info?.bio !== undefined) {
      await BoosterProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: { bio: booster_info.bio } },
        { upsert: true, new: true }
      );
    }

    // 3. Chuẩn bị dữ liệu trả về cho Frontend (Gắn bio vào để UI cập nhật ngay)
    const responseUser = user.toObject();
    if (user.role === 'BOOSTER') {
        const profile = await BoosterProfile.findOne({ userId: user._id });
        if (profile) {
             if (!responseUser.profile) responseUser.profile = {};
             // Gán bio vào đúng chỗ frontend mong đợi (user.profile.booster_info.bio)
             responseUser.profile.booster_info = { bio: profile.bio };
        }
    }

    return NextResponse.json({ success: true, user: responseUser });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return NextResponse.json({ error: 'serverError' }, { status: 500 });
  }
}
