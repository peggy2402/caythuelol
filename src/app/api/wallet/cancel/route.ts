import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction, { TransactionStatus } from '@/models/Transaction';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { transactionId } = await req.json();

    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId: userId,
      status: TransactionStatus.PENDING
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Giao dịch không tồn tại hoặc không thể hủy' }, { status: 404 });
    }

    transaction.status = TransactionStatus.FAILED;
    transaction.description = transaction.description + " (Đã hủy bởi khách)";
    await transaction.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
