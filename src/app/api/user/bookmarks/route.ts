import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import BoosterProfile from '@/models/BoosterProfile';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Helper xác thực
async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.userId;
  } catch {
    return null;
  }
}

// GET: Lấy danh sách bookmarks của user
export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ bookmarks: [] });
    }

    const { searchParams } = new URL(req.url);
    const shouldPopulate = searchParams.get('populate') === 'true';

    const user = await User.findById(userId).select('bookmarks');
    const bookmarkIds = user?.bookmarks || [];

    if (!shouldPopulate) {
      return NextResponse.json({ bookmarks: bookmarkIds });
    }

    // Nếu cần populate, dùng Aggregation để lấy thông tin từ BoosterProfile và User
    const pipeline = [
      { $match: { userId: { $in: bookmarkIds } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: '$userInfo._id',
          username: '$userInfo.username',
          avatar: '$userInfo.profile.avatar',
          displayName: 1, bio: 1, games: 1, services: 1, rating: 1, completedOrders: 1
        }
      }
    ];

    const bookmarks = await BoosterProfile.aggregate(pipeline);
    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error('Get Bookmarks Error:', error);
    return NextResponse.json({ bookmarks: [] });
  }
}

// POST: Toggle bookmark (Thêm/Xóa)
export async function POST(req: Request) {
  try {
    await dbConnect();
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { boosterId } = await req.json();
    if (!boosterId) return NextResponse.json({ error: 'Missing boosterId' }, { status: 400 });

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Đảm bảo mảng bookmarks tồn tại
    if (!user.bookmarks) user.bookmarks = [];

    const index = user.bookmarks.indexOf(boosterId);
    if (index > -1) {
      user.bookmarks.splice(index, 1); // Xóa nếu đã có
    } else {
      user.bookmarks.push(boosterId); // Thêm nếu chưa có
    }

    await user.save();
    return NextResponse.json({ success: true, bookmarks: user.bookmarks });
  } catch (error) {
    console.error('Bookmark Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}