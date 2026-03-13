import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Security Check: Allow if CRON_SECRET matches OR if User is Admin
    const authHeader = req.headers.get('authorization');
    const session = await auth();
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isAdmin = session?.user?.role === 'ADMIN';

    if (!isCron && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Logic: 3 ngày quá hạn
    const EXPIRATION_DAYS = 3;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - EXPIRATION_DAYS);

    // Tìm các đơn hàng đã thanh toán (PAID) nhưng chưa được Booster nhận (chưa APPROVED/IN_PROGRESS)
    // và đã được tạo quá 3 ngày
    const expiredOrders = await Order.find({
      status: 'PAID',
      createdAt: { $lt: expirationDate }
    });

    const results = [];

    for (const order of expiredOrders) {
      try {
        const customerId = order.customerId;
        const refundAmount = order.pricing?.total_amount || 0;

        if (refundAmount > 0) {
            // 1. Hoàn tiền vào ví Customer
            await User.findByIdAndUpdate(customerId, {
                $inc: { wallet_balance: refundAmount }
            });

            // 2. Tạo Transaction REFUND
            await Transaction.create({
                userId: customerId,
                order_id: order._id,
                type: 'REFUND',
                amount: refundAmount,
                status: 'SUCCESS',
                metadata: { description: 'Hoàn tiền tự động do đơn hàng quá hạn (Booster không nhận đơn).' }
            });
        }

        // 3. Cập nhật trạng thái đơn hàng
        order.status = OrderStatus.CANCELLED;
        await order.save();

        // 4. Gửi thông báo cho Customer
        await Notification.create({
            userId: customerId,
            title: 'Đơn hàng đã hủy & Hoàn tiền',
            message: `Đơn hàng #${order._id.toString().slice(-6)} của bạn đã tự động hủy vì không có Booster nhận sau 3 ngày. Số tiền ${refundAmount.toLocaleString()}đ đã được hoàn về ví.`,
            type: 'ORDER_EXPIRED',
            link: `/orders/${order._id}`
        });

        results.push(order._id);
      } catch (err) {
        console.error(`Failed to process expired order ${order._id}`, err);
      }
    }

    return NextResponse.json({ 
        success: true, 
        processed_count: results.length, 
        expired_orders: results 
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}