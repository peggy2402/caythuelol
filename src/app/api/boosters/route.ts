import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User, { UserRole } from '@/models/User';

export async function GET() {
  try {
    await dbConnect();

    // Lấy danh sách user có role là BOOSTER
    const boosters = await User.find({ role: UserRole.BOOSTER })
      .select('username profile booster_info createdAt')
      .sort({ 'booster_info.rating': -1, 'booster_info.completed_orders': -1 })
      .limit(50);

    return NextResponse.json({ boosters });
  } catch (error) {
    console.error('Fetch Boosters Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
