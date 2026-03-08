import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

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
    const { mode, champion, result, lp_change, reason } = await req.json();
    await dbConnect();

    const order = await Order.findOne({ _id: id, boosterId: session.user.id });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (!order.match_history) order.match_history = [];
    
    order.match_history.push({
        mode,
        champion,
        result,
        lp_change: Number(lp_change),
        reason,
        timestamp: new Date()
    });
    await order.save();

    return NextResponse.json({ success: true, match_history: order.match_history });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}