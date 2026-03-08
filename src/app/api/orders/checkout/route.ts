import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Order, { OrderStatus } from '@/models/Order';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { serviceType, boosterId, details, options, pricing, queueType } = body;

    if (!serviceType || !pricing || !details) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    // 1. Check Balance
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Determine amount to deduct (Deposit or Full)
    const amountToDeduct = pricing.deposit_amount || pricing.total_amount;

    if (user.wallet_balance < amountToDeduct) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // 2. Create Order
    const newOrder = new Order({
      customerId: user._id,
      boosterId: boosterId || undefined, // If null/undefined, it's a public job
      serviceType,
      status: OrderStatus.PAID, // Paid deposit/full
      pricing: {
        ...pricing,
        settlement_status: 'PENDING'
      },
      payment: {
        is_locked: true,
        deposit_paid: true,
        final_paid: amountToDeduct >= pricing.total_amount // If full paid
      },
      details: {
        ...details,
        // Encrypt account info here if needed
      },
      options,
    });
    
    // Add queueType to details if not present in schema root
    if (queueType) {
        newOrder.details.queueType = queueType;
    }

    await newOrder.save();

    // 3. Deduct Balance & Create Transaction
    user.wallet_balance -= amountToDeduct;
    await user.save();

    await Transaction.create({
      userId: user._id,
      orderId: newOrder._id,
      type: TransactionType.PAYMENT_HOLD,
      amount: -amountToDeduct,
      balanceAfter: user.wallet_balance,
      status: TransactionStatus.SUCCESS,
      description: `Thanh toán đơn hàng #${newOrder._id.toString().slice(-6).toUpperCase()}`
    });

    // 4. Notify (Socket.io) - Optional here, usually handled by client or separate trigger

    return NextResponse.json({ success: true, orderId: newOrder._id });

  } catch (error: any) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
