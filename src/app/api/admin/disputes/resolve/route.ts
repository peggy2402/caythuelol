import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import { auth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const authSession = await auth();
    if (authSession?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { orderId, decision } = await req.json();
    await dbConnect();

    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error('Order not found');

    if (decision === 'REFUND_CUSTOMER') {
        // Refund deposit to Customer
        const customer = await User.findById(order.customerId).session(session);
        if (customer) {
            customer.wallet_balance += order.pricing.deposit_amount;
            await customer.save({ session });

            await Transaction.create([{
                userId: customer._id,
                orderId: order._id,
                type: TransactionType.REFUND,
                amount: order.pricing.deposit_amount,
                balanceAfter: customer.wallet_balance,
                status: TransactionStatus.SUCCESS,
                description: `Hoàn tiền khiếu nại đơn #${order._id.toString().slice(-6)}`,
            }], { session });
        }
        order.status = OrderStatus.REFUNDED;
        order.dispute!.status = 'RESOLVED';
        order.dispute!.adminNote = 'Admin hoàn tiền cho khách hàng';

    } else if (decision === 'PAY_BOOSTER') {
        // Release deposit to Booster
        const booster = await User.findById(order.boosterId).session(session);
        if (booster) {
            // Assuming booster gets full deposit in dispute favor (simplified)
            // Or calculate earnings based on work done. Let's assume full deposit release for now.
            const amount = order.pricing.deposit_amount; 
            booster.wallet_balance += amount;
            await booster.save({ session });

            await Transaction.create([{
                userId: booster._id,
                orderId: order._id,
                type: TransactionType.PAYMENT_RELEASE,
                amount: amount,
                balanceAfter: booster.wallet_balance,
                status: TransactionStatus.SUCCESS,
                description: `Thanh toán khiếu nại đơn #${order._id.toString().slice(-6)}`,
            }], { session });
        }
        order.status = OrderStatus.COMPLETED;
        order.dispute!.status = 'REJECTED'; // Dispute rejected, booster paid
        order.dispute!.adminNote = 'Admin quyết định thanh toán cho Booster';
    }

    await order.save({ session });
    await session.commitTransaction();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    await session.abortTransaction();
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    session.endSession();
  }
}
