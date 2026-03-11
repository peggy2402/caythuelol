import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    let query: any = {};

    // 1. Filter theo Order ID nếu có
    if (orderId) {
        query.order_id = orderId;
    }

    // 2. Phân quyền: Nếu không phải Admin, chỉ xem được transaction của chính mình
    // Điều này đảm bảo khi filter theo orderId, khách chỉ thấy tiền mình trả, 
    // Booster chỉ thấy tiền mình nhận (nếu có logic split transaction)
    if (session.user.role !== 'ADMIN') {
        query.userId = session.user.id;
    }

    // 3. Query
    const transactions = await Transaction.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}