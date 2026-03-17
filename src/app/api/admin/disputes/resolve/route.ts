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

    // KIỂM TRA BOOSTER ĐÃ NHẬN TIỀN VÀO VÍ CHƯA
    // (Trường hợp đơn đã COMPLETED rồi khách mới khiếu nại)
    const wasBoosterPaid = await Transaction.findOne({
        orderId: order._id,
        type: TransactionType.PAYMENT_RELEASE,
        userId: order.boosterId
    }).session(session);

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

        // TRUY THU TIỀN TỪ VÍ BOOSTER NẾU HỌ ĐÃ NHẬN
        if (wasBoosterPaid && order.boosterId && order.pricing.booster_earnings > 0) {
            const booster = await User.findById(order.boosterId).session(session);
            if (booster) {
                booster.wallet_balance -= order.pricing.booster_earnings;
                
                // Hệ thống phạt ví âm (Debt System)
                if (booster.wallet_balance < 0) {
                    booster.debt_info = booster.debt_info || {};
                    booster.debt_info.is_in_debt = true;
                    booster.debt_info.reminder_count = 0;
                    booster.debt_info.ban_deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Hạn nạp bù 7 ngày
                }
                await booster.save({ session });

                await Transaction.create([{
                    userId: booster._id,
                    orderId: order._id,
                    type: 'DISPUTE_PENALTY' as any,
                    amount: -order.pricing.booster_earnings,
                    balanceAfter: booster.wallet_balance,
                    status: TransactionStatus.SUCCESS,
                    description: `Truy thu tiền khiếu nại đơn #${order._id.toString().slice(-6)}`,
                }], { session });
            }
        }

    } else if (decision === 'PAY_BOOSTER') {
        // CHỈ THANH TOÁN CHO BOOSTER NẾU HỌ CHƯA ĐƯỢC NHẬN TIỀN
        if (!wasBoosterPaid && order.boosterId) {
            const booster = await User.findById(order.boosterId).session(session);
            if (booster) {
                const amount = order.pricing.booster_earnings || order.pricing.deposit_amount; 
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
        }
        order.status = OrderStatus.COMPLETED;
        order.dispute!.status = 'REJECTED'; // Dispute rejected, booster paid
        order.dispute!.adminNote = 'Admin quyết định thanh toán cho Booster';
    } else if (decision === 'RESUME') {
        order.status = OrderStatus.IN_PROGRESS; // Sử dụng đúng Enum để fix lỗi Typescript
        order.dispute!.status = 'REJECTED';
        order.dispute!.adminNote = 'Admin bác bỏ khiếu nại, yêu cầu tiếp tục cày';
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
