// src/app/api/orders/[id]/refund/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import { auth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    
    try {
        await dbConnect();
        
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const order = await Order.findById(id);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // Logic tính toán lại (Replicate logic from NetWinsOrderView/Pricing Engine)
        // Để đảm bảo bảo mật, luôn tính lại trên server thay vì tin client
        const { details, pricing, match_history } = order;
        
        // 1. Tính giá trị thực tế
        let actualBasePrice = 0;
        if (details.calc_mode === 'BY_GAMES') {
            const wins = match_history?.filter((m: any) => m.result === 'WIN').length || 0;
            const losses = match_history?.filter((m: any) => m.result === 'LOSS').length || 0;
            const netWins = Math.max(0, wins - losses);
            actualBasePrice = netWins * (details.unit_price_per_lp || 0);
        } else {
            // BY_LP
             const start = parseInt(details.start_lp || '0');
             const current = parseInt(details.current_lp || start || '0');
             const gained = Math.max(0, current - start);
             actualBasePrice = gained * (details.unit_price_per_lp || 0);
        }

        // Tính phí
        const platformFeePercent = pricing.base_price > 0 ? (pricing.platform_fee / pricing.base_price) : 0;
        // Phí Elo/Option (Đơn giản hóa: Lấy tỉ lệ cũ hoặc tính lại chi tiết nếu cần chính xác tuyệt đối)
        // Ở đây ta giả sử pricing.total_amount scale theo base_price
        // Cách an toàn nhất: actualTotal = actualBase * (total / base)
        const ratio = pricing.base_price > 0 ? (pricing.total_amount / pricing.base_price) : 1;
        const actualTotal = Math.round(actualBasePrice * ratio);

        const paidDeposit = pricing.deposit_amount || 0;
        const remaining = actualTotal - paidDeposit;

        // 2. Validate Refund Condition
        // Remaining phải < 0 (Tức là Cọc > Thực tế)
        if (remaining >= 0) {
            return NextResponse.json({ error: 'Order is not eligible for refund (Owes money or Settled)' }, { status: 400 });
        }

        const refundAmount = Math.abs(remaining);

        // 3. Execute Transaction
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            const customer = await User.findById(order.customerId || order.customerId).session(dbSession);
            
            // Hoàn tiền vào ví khách
            customer.wallet_balance += refundAmount;
            await customer.save({ session: dbSession });

            // Tạo Transaction Record
            await Transaction.create([{
                userId: customer._id,
                order_id: id,
                type: 'REFUND',
                amount: refundAmount,
                balanceAfter: customer.wallet_balance,
                status: 'SUCCESS',
                metadata: { description: `Hoàn tiền thừa từ đơn hàng Net Wins #${id.slice(-6)}` }
            }], { session: dbSession });

            // Cập nhật Order
            order.pricing.deposit_amount -= refundAmount; // Điều chỉnh lại cọc cho khớp thực tế (hoặc giữ nguyên và log refund)
            // Cách tốt hơn: Giữ nguyên deposit history, chỉ update status
            order.pricing.settlement_status = 'SETTLED';
            order.status = 'COMPLETED' as any;
            await order.save({ session: dbSession });

            await dbSession.commitTransaction();

            // 4. Notifications
            try {
                // Notify Customer
                await Notification.create({
                    userId: customer._id,
                    title: 'Nhận tiền hoàn lại',
                    message: `Bạn đã nhận được ${refundAmount.toLocaleString()} đ tiền hoàn lại từ đơn hàng #${id.slice(-6).toUpperCase()}.`,
                    type: 'PAYMENT',
                    link: `/orders/`
                });

                // Notify Booster
                if (order.boosterId || order.boosterId) {
                    await Notification.create({
                        userId: order.boosterId || order.boosterId,
                        title: 'Đơn hàng đã quyết toán',
                        message: `Đơn hàng #${id.slice(-6).toUpperCase()} đã hoàn tất quy trình hoàn tiền cho khách.`,
                        type: 'SYSTEM',
                        link: `/orders/`
                    });
                }
            } catch (e) { console.error(e); }

        } catch (err: any) {
            await dbSession.abortTransaction();
            throw err;
        } finally {
            dbSession.endSession();
        }

        return NextResponse.json({ success: true, refundAmount });

    } catch (error: any) {
        console.error('Refund Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
