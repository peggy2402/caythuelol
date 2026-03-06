import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import { auth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const authSession = await auth();
    if (!authSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: orderId } = await params;
    const { status } = await req.json(); // 'IN_PROGRESS' or 'REJECTED'

    await dbConnect();
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error('Order not found');

    // Check permission (Only assigned booster or Admin)
    if (order.boosterId?.toString() !== authSession.user.id && authSession.user.role !== 'ADMIN') {
        throw new Error('Forbidden');
    }

    if (status === 'IN_PROGRESS') {
        // Booster accepts job
        order.status = OrderStatus.IN_PROGRESS;
        await order.save({ session });
    } else if (status === 'REJECTED') {
        // Booster rejects job -> Refund Customer
        order.status = OrderStatus.REJECTED;
        await order.save({ session });

        // Refund Logic
        const customer = await User.findById(order.customerId).session(session);
        if (customer) {
            const refundAmount = order.pricing.deposit_amount; // Refund deposit
            customer.wallet_balance += refundAmount;
            await customer.save({ session });

            // Create Refund Transaction
            await Transaction.create([{
                userId: customer._id,
                orderId: order._id,
                type: TransactionType.REFUND,
                amount: refundAmount,
                balanceAfter: customer.wallet_balance,
                status: TransactionStatus.SUCCESS,
                description: `Hoàn tiền cọc đơn hàng #${order._id.toString().slice(-6)} (Booster từ chối)`,
            }], { session });
        }
        
        // Mark original HOLD transaction as FAILED or REFUNDED (Optional, for tracking)
        await Transaction.findOneAndUpdate(
            { orderId: order._id, type: TransactionType.PAYMENT_HOLD },
            { status: TransactionStatus.FAILED },
            { session }
        );
    } else {
        throw new Error('Invalid status update');
    }

    await session.commitTransaction();
    return NextResponse.json({ success: true, order });

  } catch (error: any) {
    await session.abortTransaction();
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  } finally {
    session.endSession();
  }
}