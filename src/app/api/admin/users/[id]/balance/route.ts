// src/app/api/admin/users/[id]/balance/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { amount, type, reason } = await req.json();

    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    await dbConnect();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Calculate new balance
    if (type === 'ADD') {
      user.wallet_balance += amount;
    } else {
      user.wallet_balance -= amount;
    }

    await user.save();

    // Create Transaction Record
    await Transaction.create({
      userId: user._id,
      type: type === 'ADD' ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
      amount: type === 'ADD' ? amount : -amount,
      balanceAfter: user.wallet_balance,
      status: TransactionStatus.SUCCESS,
      description: `Admin Adjustment: ${reason || 'No reason provided'}`,
      metadata: { adminId: session.user.id }
    });

    return NextResponse.json({ success: true, newBalance: user.wallet_balance });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
