import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import { auth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const authSession = await auth();
    if (!authSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: orderId } = await params;

    await dbConnect();
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error('Order not found');

    if (order.customerId.toString() !== authSession.user.id) {
      throw new Error('Forbidden');
    }

    if (order.pricing.settlement_status !== 'CUSTOMER_OWES') {
      throw new Error('No remaining balance to pay');
    }

    const remainingAmount = (order.pricing.final_amount || 0) - order.pricing.deposit_amount;
    if (remainingAmount <= 0) throw new Error('Invalid remaining amount');

    const customer = await User.findById(authSession.user.id).session(session);
    if (customer.wallet_balance < remainingAmount) {
      throw new Error('Insufficient balance');
    }

    // Deduct balance
    customer.wallet_balance -= remainingAmount;
    await customer.save({ session });

    // Create Transaction
    await Transaction.create([{
      userId: customer._id,
      orderId: order._id,
      type: TransactionType.PAYMENT_HOLD, // Still hold until fully settled/released
      amount: -remainingAmount,
      balanceAfter: customer.wallet_balance,
      status: TransactionStatus.SUCCESS,
      description: `Thanh toán phần còn thiếu đơn hàng #${order._id.toString().slice(-6)}`,
    }], { session });

    // Update Order
    order.pricing.settlement_status = 'SETTLED';
    
    // Release Funds to Booster
    const booster = await User.findById(order.boosterId).session(session);
    if (booster) {
        const amount = order.pricing.booster_earnings;
        booster.wallet_balance += amount;
        await booster.save({ session });

        await Transaction.create([{
            userId: booster._id,
            orderId: order._id,
            type: TransactionType.PAYMENT_RELEASE,
            amount: amount,
            balanceAfter: booster.wallet_balance,
            status: TransactionStatus.SUCCESS,
            description: `Thanh toán thu nhập đơn hàng #${order._id.toString().slice(-6)}`,
        }], { session });
    }

    // Update total paid tracking if you have it
    // order.payment.final_paid = true;

    await order.save({ session });
    await session.commitTransaction();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    await session.abortTransaction();
    return NextResponse.json({ error: error.message || 'Payment failed' }, { status: 500 });
  } finally {
    session.endSession();
  }
}
