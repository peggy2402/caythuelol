import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction, { TransactionStatus } from '@/models/Transaction';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Auth Check (Admin)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      // @ts-ignore
      if (payload.role !== 'ADMIN') {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }

    const { transactionId, reason } = await req.json();

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      return NextResponse.json({ error: 'Chỉ có thể từ chối giao dịch đang chờ (PENDING)' }, { status: 400 });
    }

    // Cập nhật trạng thái FAILED
    transaction.status = TransactionStatus.FAILED;
    transaction.description = `${transaction.description} - Từ chối bởi Admin: ${reason || 'Không có lý do'}`;
    await transaction.save();

    return NextResponse.json({ success: true, message: 'Đã từ chối giao dịch' });

  } catch (error) {
    console.error('Reject Transaction Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
