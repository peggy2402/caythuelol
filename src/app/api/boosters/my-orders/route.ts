import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const boosterId = new mongoose.Types.ObjectId(session.user.id);
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'active', 'completed', 'all'

    const query: any = { boosterId };

    if (filter === 'active') {
      query.status = { $in: ['APPROVED', 'IN_PROGRESS'] };
    } else if (filter === 'completed') {
      query.status = { $in: ['COMPLETED', 'SETTLED', 'DISPUTED', 'REFUNDED', 'REJECTED', 'CANCELLED'] };
    }
    // Mặc định (không có filter): Trả về tất cả đơn hàng của Booster để Frontend tự lọc

    const orders = await Order.find(query).populate('customerId', 'username profile.avatar').sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Get My Orders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}