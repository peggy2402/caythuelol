import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const userId = new mongoose.Types.ObjectId(id);

    await dbConnect();

    // 1. Lấy tất cả giao dịch của user
    const transactions = await Transaction.find({ userId, status: 'SUCCESS' }).sort({ createdAt: -1 });

    // 2. Lấy 5 đơn hàng gần nhất (nếu là Booster)
    const recentOrders = await Order.find({ boosterId: userId, status: { $in: ['COMPLETED', 'SETTLED'] } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('pricing.booster_earnings serviceType createdAt');

    // 3. Tính toán các chỉ số
    let totalDeposit = 0;
    let totalWithdrawal = 0;
    let totalSpent = 0;
    let totalEarned = 0;

    transactions.forEach(tx => {
      if (tx.type === 'DEPOSIT') totalDeposit += tx.amount;
      if (tx.type === 'WITHDRAWAL') totalWithdrawal += Math.abs(tx.amount);
      if (tx.type === 'PAYMENT_HOLD') totalSpent += Math.abs(tx.amount);
      if (tx.type === 'PAYMENT_RELEASE') totalEarned += tx.amount;
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalDeposit,
        totalWithdrawal,
        totalSpent,
        totalEarned,
      },
      recentTransactions: transactions.slice(0, 20), // Trả về 20 giao dịch gần nhất
      recentOrders,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}