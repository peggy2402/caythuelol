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
    // CHỈ ADMIN MỚI ĐƯỢC QUYỀN NÀY
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { decision, refundAmount } = await req.json(); // decision: 'REFUND_CUSTOMER' | 'PAY_BOOSTER'

    await dbConnect();

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Logic Hoàn tiền cho khách
    if (decision === 'REFUND_CUSTOMER') {
        const amountToRefund = refundAmount || order.pricing.deposit_amount || order.pricing.total_amount;

        if (amountToRefund > 0) {
            // 1. Cộng tiền lại cho Khách
            const customer = await User.findByIdAndUpdate(order.customerId, {
                $inc: { wallet_balance: amountToRefund }
            });

            // 2. Tạo giao dịch hoàn tiền
            await Transaction.create({
                userId: order.customerId,
                orderId: order._id,
                type: TransactionType.REFUND,
                amount: amountToRefund,
                balanceAfter: (customer?.wallet_balance || 0) + amountToRefund,
                status: TransactionStatus.SUCCESS,
                description: `Hoàn tiền khiếu nại đơn #${order._id.toString().slice(-6).toUpperCase()}`
            });
        }
        
        // FORCE DEDUCT: Nếu lúc Dispute chưa trừ tiền Booster (do lỗi nào đó), thì trừ ngay bây giờ
        // FIX: Bỏ check order.payment?.booster_received_pending để xử lý cả các đơn cũ bị lỗi.
        // Lưu ý: Code này trừ vào pending_balance. Nếu đơn hàng cũ đã lỡ cộng vào wallet_balance do lỗi ở bước complete, bạn cần trừ thủ công hoặc chấp nhận lệch pending.
        // Chỉ cần có boosterId + có thu nhập + chưa bị trừ tiền là TRỪ LUÔN.
        if (order.boosterId && order.pricing.booster_earnings > 0 && !order.dispute?.fundsDeducted) {
             await User.findByIdAndUpdate(order.boosterId, {
                $inc: { pending_balance: -order.pricing.booster_earnings }
            });
            
            if (!order.dispute) {
                order.dispute = {
                    reason: 'Admin Intervention',
                    status: 'PENDING',
                    fundsDeducted: true
                };
            } else {
                order.dispute.fundsDeducted = true;
            }
        }
        
        order.status = OrderStatus.REFUNDED;
        if (!order.dispute) {
            order.dispute = {
                reason: 'Admin Intervention',
                status: 'RESOLVED'
            };
        }
        order.dispute.status = 'RESOLVED'; // Ensure status is updated if it existed
        order.dispute.adminNote = 'Admin resolved: Refunded to customer';

    } else if (decision === 'PAY_BOOSTER') {
        // Logic Trả tiền cho Booster (Booster thắng kiện)
        const earnings = order.pricing.booster_earnings;
        if (order.boosterId && earnings > 0) {
             // Cộng tiền vào ví chính (wallet_balance) vì pending đã bị trừ lúc dispute
             const booster = await User.findByIdAndUpdate(order.boosterId, {
                $inc: { wallet_balance: earnings }
            });

            await Transaction.create({
                userId: order.boosterId,
                orderId: order._id,
                type: TransactionType.PAYMENT_RELEASE,
                amount: earnings,
                balanceAfter: (booster?.wallet_balance || 0) + earnings,
                status: TransactionStatus.SUCCESS,
                description: `Thanh toán khiếu nại đơn #${order._id.toString().slice(-6).toUpperCase()}`
            });
        }
        order.status = OrderStatus.COMPLETED;
        if (!order.dispute) {
            order.dispute = {
                reason: 'Admin Intervention',
                status: 'RESOLVED'
            };
        }
        order.dispute.status = 'RESOLVED'; // Ensure status is updated if it existed
        order.dispute.adminNote = 'Admin resolved: Paid to booster';
    }

    await order.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resolve Dispute Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}