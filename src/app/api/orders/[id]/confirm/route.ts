import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import Message from '@/models/Message';

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

    // Only Customer or Admin can confirm
    if (order.customerId.toString() !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status !== OrderStatus.COMPLETED) {
        return NextResponse.json({ error: 'Order is not in Completed state' }, { status: 400 });
    }

    // 1. Release Funds to Booster
    const boosterEarnings = order.pricing.booster_earnings;
    if (order.boosterId && boosterEarnings > 0) {
        await User.findByIdAndUpdate(order.boosterId, {
            $inc: { 
                pending_balance: -boosterEarnings,
                wallet_balance: boosterEarnings 
            }
        });

        await Transaction.create({
            userId: order.boosterId,
            orderId: order._id,
            type: TransactionType.PAYMENT_RELEASE,
            amount: boosterEarnings,
            balanceAfter: 0, // Placeholder
            status: TransactionStatus.SUCCESS,
            description: `Nhận tiền đơn hàng #${order._id.toString().slice(-6).toUpperCase()}`
        });
    }

    // Đánh dấu đã quyết toán xong để ẩn nút xác nhận
    order.pricing.settlement_status = 'SETTLED';
    await order.save();

    // TASK 3: Xóa chat messages sau khi hoàn thành đơn (Theo yêu cầu)
    // Giữ lại Order Info, chỉ xóa Messages
    try {
        await Message.deleteMany({ order_id: order._id });
        // Optional: Tạo 1 tin nhắn hệ thống báo đã xóa chat
        await Message.create({ order_id: order._id, sender_id: session.user.id, content: 'Đơn hàng đã hoàn tất. Lịch sử chat đã được xóa để bảo mật.', type: 'SYSTEM', readBy: [] });
    } catch (e) { console.error('Failed to clear chat', e); }

    // Update settlement status if needed, or just leave as COMPLETED
    return NextResponse.json({ success: true, message: 'Đã xác nhận hoàn thành. Cảm ơn bạn!' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
