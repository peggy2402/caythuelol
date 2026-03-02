import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Rank from '@/models/Rank';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

async function getBoosterId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;
  // @ts-ignore
  if (payload.role !== 'BOOSTER') return null;
  // @ts-ignore
  return (payload.userId || payload.id) as string;
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = await getBoosterId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Dùng .lean() để lấy dữ liệu thô, tránh bị Mongoose Schema cache làm ẩn field mới
    const user = await User.findById(userId).select('booster_info').lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    // Kiểm tra xem Model Rank có hoạt động không
    if (!Rank) {
      throw new Error("Rank model is not initialized correctly");
    }

    // Lấy danh sách Rank từ DB, sắp xếp theo order
    const ranks = await Rank.find({ gameCode: 'LOL' }).sort({ order: 1 }).lean();

    return NextResponse.json({
      // @ts-ignore
      settings: user.booster_info?.service_settings || {},
      ranks: ranks
    });
  } catch (error) {
    console.error('🔴 Booster Services GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const userId = await getBoosterId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    
    console.log('Updating service settings for', userId);

    // FIX TRIỆT ĐỂ: Dùng trực tiếp MongoDB Driver (User.collection) để update
    // Bỏ qua hoàn toàn Mongoose Schema Validation để đảm bảo dữ liệu được ghi
    const result = await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { 'booster_info.service_settings': body } }
    );

    if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🔴 Booster Services POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}