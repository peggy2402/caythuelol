import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import User from '@/models/User';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { reason } = await req.json();
    await dbConnect();

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.customerId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status === OrderStatus.DISPUTED) {
        return NextResponse.json({ error: 'Đơn hàng đang trong quá trình khiếu nại' }, { status: 400 });
    }

    const previousStatus = order.status;
    order.status = OrderStatus.DISPUTED;
    order.dispute = {
        reason,
        status: 'PENDING',
        fundsDeducted: false
    };

    // Thu hồi tiền từ pending_balance của Booster (Đóng băng quỹ)
    if (order.boosterId && order.pricing.booster_earnings > 0) {
        // Check if booster actually received pending funds
        // FIX: Kiểm tra lỏng hơn để bắt được cả các đơn cũ.
        // Nếu trạng thái trước đó là APPROVED, IN_PROGRESS hoặc COMPLETED thì tức là Booster đã nhận đơn và được cộng pending -> Trừ tiền.
        const hasBoosterReceivedFunds = order.payment?.booster_received_pending || 
                                      ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(previousStatus);
        
        if (hasBoosterReceivedFunds) {
             await User.findByIdAndUpdate(order.boosterId, {
                $inc: { pending_balance: -order.pricing.booster_earnings }
            });
            order.dispute.fundsDeducted = true;
        }
    }

    await order.save();

    return NextResponse.json({ success: true, message: 'Đã gửi khiếu nại. Admin sẽ xem xét sớm nhất.' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
