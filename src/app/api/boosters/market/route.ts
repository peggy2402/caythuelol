// src/app/api/boosters/market/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const boosterId = new mongoose.Types.ObjectId(session.user.id);

    // 1. Đơn hàng chỉ định (Direct Hire): Đã thanh toán + Gán cho Booster này
    const directRequests = await Order.find({
      boosterId: boosterId,
      status: OrderStatus.PAID
    })
    .populate('customerId', 'username profile.avatar')
    .sort({ createdAt: -1 });

    // 2. Đơn hàng công khai (Public Jobs): Đã thanh toán + Chưa gán cho ai
    const publicJobs = await Order.find({
      boosterId: { $exists: false }, // Hoặc null
      status: OrderStatus.PAID
    })
    .populate('customerId', 'username profile.avatar')
    .sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      directRequests, 
      publicJobs 
    });

  } catch (error) {
    console.error('Fetch Market Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
