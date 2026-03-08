import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const order = await Order.findOne({ _id: id, boosterId: session.user.id });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.status !== OrderStatus.IN_PROGRESS && order.status !== OrderStatus.APPROVED) {
        return NextResponse.json({ error: 'Order cannot be completed in current status' }, { status: 400 });
    }

    // 1. Update Status
    order.status = OrderStatus.COMPLETED;
    
    await order.save();

    return NextResponse.json({ success: true, message: 'Đã báo cáo hoàn thành. Vui lòng chờ khách hàng xác nhận.' });
  } catch (error) {
    console.error('Complete Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
