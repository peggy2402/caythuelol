import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User, { IUser } from '@/models/User';
import Order from '@/models/Order';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const booster = await User.findById(id)
      .select('username profile.avatar booster_info role createdAt')
      .lean() as IUser | null;

    if (!booster || booster.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Booster not found' }, { status: 404 });
    }

    // Lấy 10 đánh giá gần nhất từ các đơn hàng đã hoàn thành
    const reviews = await Order.find({
      boosterId: id,
      status: 'COMPLETED',
      'rating.stars': { $exists: true }
    })
    .select('rating details.current_rank details.desired_rank serviceType createdAt customerId')
    .populate('customerId', 'username profile.avatar')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    return NextResponse.json({ booster, reviews });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}