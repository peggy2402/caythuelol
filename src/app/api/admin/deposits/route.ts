import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    // Find orders where money is held (Locked)
    // Usually PAID, APPROVED, IN_PROGRESS, or COMPLETED but not yet SETTLED
    const orders = await Order.find({
      'payment.is_locked': true,
      status: { $in: ['PAID', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'] }
    })
    .populate('customerId', 'username')
    .populate('boosterId', 'username')
    .sort({ createdAt: -1 });

    const totalHeld = orders.reduce((sum, order) => sum + (order.pricing.deposit_amount || 0), 0);

    return NextResponse.json({ 
        success: true, 
        orders,
        totalHeld
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}