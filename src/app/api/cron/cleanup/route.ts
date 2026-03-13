import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import Message from '@/models/Message';

export async function GET(req: Request) {
  try {
    // Verify secret if needed (e.g. CRON_SECRET)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await dbConnect();

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Find orders completed > 15 days ago
    const ordersToDelete = await Order.find({
      status: OrderStatus.COMPLETED,
      updatedAt: { $lt: fifteenDaysAgo }
    }).select('_id');

    const orderIds = ordersToDelete.map(o => o._id);

    // Delete Messages
    await Message.deleteMany({ order_id: { $in: orderIds } });

    // Delete Orders
    const result = await Order.deleteMany({ _id: { $in: orderIds } });

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}