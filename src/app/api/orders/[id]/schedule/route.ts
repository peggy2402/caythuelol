import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { schedule } = await request.json();

    await dbConnect();
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check permissions: Booster assigned to order or Admin
    if (order.boosterId?.toString() !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update details.schedule
    if (!order.details) order.details = {};
    order.details.schedule = schedule;
    order.markModified('details');
    await order.save();

    return NextResponse.json({ success: true, schedule: order.details.schedule });
  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
