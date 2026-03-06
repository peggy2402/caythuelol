// src/app/api/admin/withdrawals/action/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Withdrawal from '@/models/Withdrawal';
import Transaction from '@/models/Transaction';

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Add Admin check

    await dbConnect();
    const { withdrawalId, action, reason } = await req.json();

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (withdrawal.status !== 'PENDING') return NextResponse.json({ error: 'Request already processed' }, { status: 400 });

    if (action === 'APPROVE') {
      // Mark as completed
      withdrawal.status = 'COMPLETED'; // Or 'APPROVED' if you have a manual transfer step
      withdrawal.note = 'Đã chuyển khoản thành công';
      await withdrawal.save();

      // Update the Transaction status to SUCCESS
      await Transaction.findOneAndUpdate(
        { 'metadata.withdrawalId': withdrawal._id },
        { status: 'SUCCESS' }
      );

    } else if (action === 'REJECT') {
      // Refund logic
      withdrawal.status = 'REJECTED';
      withdrawal.note = reason || 'Từ chối bởi Admin';
      await withdrawal.save();

      // Refund User Wallet
      const user = await User.findById(withdrawal.userId);
      if (user) {
        user.wallet_balance += withdrawal.amount;
        await user.save();

        // Create Refund Transaction
        await Transaction.create({
          userId: user._id,
          type: 'REFUND',
          amount: withdrawal.amount,
          balanceAfter: user.wallet_balance,
          status: 'SUCCESS',
          description: `Hoàn tiền rút #${withdrawal._id.toString().slice(-6)}: `,
        });
        
        // Mark original transaction as FAILED
        await Transaction.findOneAndUpdate(
            { 'metadata.withdrawalId': withdrawal._id },
            { status: 'FAILED' }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
