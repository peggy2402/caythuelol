import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.customerId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate remaining amount
    const total = order.pricing.final_amount || order.pricing.total_amount;
    const paid = order.pricing.deposit_amount;
    const remaining = total - paid;

    if (remaining <= 0) {
        return NextResponse.json({ error: 'No remaining balance to pay' }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (user.wallet_balance < remaining) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct
    user.wallet_balance -= remaining;
    await user.save();

    // Update Order
    order.pricing.deposit_amount += remaining;
    order.payment.final_paid = true;
    order.pricing.settlement_status = 'SETTLED';
    await order.save();

    // Transaction
    await Transaction.create({
        userId: user._id,
        orderId: order._id,
        type: TransactionType.PAYMENT_HOLD,
        amount: -remaining,
        balanceAfter: user.wallet_balance,
        status: TransactionStatus.SUCCESS,
        description: `Thanh toán phần còn lại đơn hàng #${order._id.toString().slice(-6).toUpperCase()}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
