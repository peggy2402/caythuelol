import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = {};
    
    // Filter by role
    if (session.user.role === 'CUSTOMER') {
      query.customerId = session.user.id;
    } else if (session.user.role === 'BOOSTER') {
      query.boosterId = session.user.id;
    } else if (session.user.role === 'ADMIN') {
      // Admin sees all
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('customerId', 'username profile.avatar')
      .populate('boosterId', 'username profile.avatar');

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
