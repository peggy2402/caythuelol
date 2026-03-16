import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';

    await dbConnect();

    const query: any = { status: 'DISPUTED' };
    if (status !== 'ALL') {
        query['dispute.status'] = status;
    }

    const disputes = await Order.find(query)
    .populate('customerId', 'username email')
    .populate('boosterId', 'username email')
    .sort({ createdAt: -1 });

    return NextResponse.json({ disputes });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    await dbConnect();
    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.status === 'DISPUTED') {
       order.status = 'IN_PROGRESS' as any; // Ép kiểu as any để qua mặt lỗi Typescript
    }
    
    if (order.dispute) {
        order.dispute.status = 'RESOLVED';
    }

    await order.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
