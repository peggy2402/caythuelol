import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const disputes = await Order.find({ 
        status: 'DISPUTED',
        'dispute.status': 'PENDING' 
    })
    .populate('customerId', 'username email')
    .populate('boosterId', 'username email')
    .sort({ createdAt: -1 });

    return NextResponse.json({ disputes });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
