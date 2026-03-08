import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const order = await Order.findOne({ _id: id, boosterId: session.user.id });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.status !== OrderStatus.IN_PROGRESS && order.status !== OrderStatus.APPROVED) {
        return NextResponse.json({ error: 'Order cannot be completed in current status' }, { status: 400 });
    }

    // 1. Update Status
    order.status = OrderStatus.COMPLETED;
    
    // 2. Release Funds
    const boosterEarnings = order.pricing.booster_earnings;

    // Move pending_balance to wallet_balance for Booster
    await User.findByIdAndUpdate(session.user.id, {
        $inc: { 
            pending_balance: -boosterEarnings,
            wallet_balance: boosterEarnings 
        }
    });

    // Create Transaction for Booster
    await Transaction.create({
        userId: session.user.id,
        orderId: order._id,
        type: TransactionType.PAYMENT_RELEASE,
        amount: boosterEarnings,
        balanceAfter: 0, // Should fetch actual balance if needed
        status: TransactionStatus.SUCCESS,
        description: `Nhận tiền đơn hàng #${order._id.toString().slice(-6).toUpperCase()}`
    });

    await order.save();

    return NextResponse.json({ success: true, message: 'Order completed successfully' });
  } catch (error) {
    console.error('Complete Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
