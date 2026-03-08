import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { ingame_name } = await req.json();
    
    await dbConnect();

    const order = await Order.findOne({ _id: id, boosterId: session.user.id });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (ingame_name !== undefined) order.details.ingame_name = ingame_name;

    order.markModified('details');
    await order.save();

    return NextResponse.json({ success: true, details: order.details });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}