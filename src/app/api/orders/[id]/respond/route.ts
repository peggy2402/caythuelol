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
    const { action } = await req.json(); // 'approve' | 'reject'

    await dbConnect();
    const boosterId = session.user.id;

    const order = await Order.findOne({
      _id: id,
      boosterId: boosterId,
      status: OrderStatus.PAID
    });

    if (!order) {
      return NextResponse.json({ error: 'Đơn hàng không tồn tại hoặc không ở trạng thái chờ duyệt.' }, { status: 404 });
    }

    if (action === 'approve') {
      // --- LOGIC APPROVE ---
      
      // 1. Cập nhật trạng thái đơn hàng
      order.status = OrderStatus.APPROVED;
      await order.save();

      // 2. Cộng tiền vào pending_balance của Booster (Tiền bị khóa)
      const earnings = order.pricing.booster_earnings || 0;
      if (earnings > 0) {
        await User.findByIdAndUpdate(boosterId, {
          $inc: { pending_balance: earnings }
        });
        if (!order.payment) {
          order.payment = {
            is_locked: true,
            deposit_paid: true,
            final_paid: false,
            booster_received_pending: true
          };
        } else {
          order.payment.booster_received_pending = true; // Đánh dấu đã nhận tiền vào ví chờ
        }
      }

      return NextResponse.json({ success: true, message: 'Đã nhận đơn! Tiền đã được thêm vào số dư chờ.' });

    } else if (action === 'reject') {
      // --- LOGIC REJECT ---

      // 1. Cập nhật trạng thái đơn hàng
      order.status = OrderStatus.REJECTED;
      await order.save();

      // 2. Hoàn tiền cho Khách hàng (Vào wallet_balance)
      const refundAmount = order.pricing.deposit_amount; // Hoàn lại số tiền đã cọc
      
      if (refundAmount > 0) {
        const customer = await User.findByIdAndUpdate(order.customerId, {
          $inc: { wallet_balance: refundAmount }
        });

        // 3. Tạo giao dịch hoàn tiền
        await Transaction.create({
          userId: order.customerId,
          orderId: order._id,
          type: TransactionType.REFUND,
          amount: refundAmount,
          balanceAfter: (customer?.wallet_balance || 0) + refundAmount,
          status: TransactionStatus.SUCCESS,
          description: `Hoàn tiền đơn hàng #${order._id.toString().slice(-6).toUpperCase()} do Booster từ chối`
        });
      }

      return NextResponse.json({ success: true, message: 'Đã từ chối đơn. Tiền đã được hoàn lại cho khách.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Respond Order Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
