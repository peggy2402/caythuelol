import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const order = await Order.findById(id)
      .populate('customerId', 'username profile.avatar')
      .populate('boosterId', 'username profile.avatar');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Access Control
    const isCustomer = order.customerId._id.toString() === session.user.id;
    const isBooster = order.boosterId?._id.toString() === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isCustomer && !isBooster && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Get Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
