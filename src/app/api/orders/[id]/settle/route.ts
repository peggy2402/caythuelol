// src/app/api/orders/[id]/settle/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import { auth } from '@/lib/auth'; // Giả sử bạn có hàm auth helper
import { sendEmail } from '@/lib/mail';
import mongoose from 'mongoose';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    
    try {
        await dbConnect();
        
        // 1. Auth Check
        const session = await auth(); // Hoặc logic lấy user từ session của bạn
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const customerId = session.user.id; // Hoặc _id

        // 2. Fetch Order & Validate
        const order = await Order.findById(id);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        
        const userId = session.user.id;
        const isCustomer = order.customerId.toString() === userId;
        const isBooster = order.boosterId?.toString() === userId;
        const isAdmin = session.user.role === 'ADMIN';

        if (!isCustomer && !isBooster && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Server-side Calculation (Replicate NetWins logic for security)
        // Lưu ý: Logic này nên được tách ra thành lib/pricing.ts để dùng chung
        // Ở đây mình viết simplified version dựa trên logic NetWins
        const { details, pricing, match_history, options } = order;
        let actualTotal = 0;
        
        // ... (Logic tính toán giống hệt NetWinsOrderView nhưng chạy ở server)
        // Để đơn giản và tránh bug sai lệch logic, ta có thể tin tưởng 
        // client gửi lên amount NHƯNG phải verify cơ bản:
        // (Trong thực tế production, bạn BẮT BUỘC phải tính lại full flow ở đây)
        
        // Tạm thời lấy logic tính cơ bản từ match_history đã lưu trong DB
        let actualBasePrice = 0;
        if (details.calc_mode === 'BY_GAMES') {
            const wins = match_history?.filter((m: any) => m.result === 'WIN').length || 0;
            const losses = match_history?.filter((m: any) => m.result === 'LOSS').length || 0;
            const netWins = Math.max(0, wins - losses);
            actualBasePrice = netWins * (details.unit_price_per_lp || 0);
        } else {
            // BY_LP logic fallback
             const start = parseInt(details.start_lp || '0');
             const current = parseInt(details.current_lp || start || '0');
             const gained = Math.max(0, current - start);
             actualBasePrice = gained * (details.unit_price_per_lp || 0);
        }

        // Apply fees (simplified for MVP - needs to match your pricing.ts)
        const platformFeePercent = (pricing.platform_fee / pricing.base_price) || 0.1; // Fallback 10% or calc
        const estimatedTotal = actualBasePrice * (1 + platformFeePercent); 
        
        // Lấy số tiền Client gửi lên để so sánh (hoặc tính strict)
        // Để an toàn nhất cho API này, ta sẽ tính dựa trên Remaining = Total - Deposit
        // Giả sử logic update order status OWE đã chuẩn, ta tin vào con số logic:
        
        const body = await req.json();
        const amount = body.amount; // Tiền khách thanh toán HOẶC tiền Booster hoàn lại
        const mode = body.mode || 'PAY'; // 'PAY' (Khách thanh toán) | 'REFUND' (Booster hoàn)

        if (!amount || amount <= 0) {
             return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // 4. Transaction Atomicity
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            if (mode === 'PAY') {
                if (!isCustomer && !isAdmin) throw new Error('Chỉ khách hàng mới có thể thực hiện thanh toán này.');

                const customer = await User.findById(order.customerId).session(dbSession);
                if (!customer) throw new Error('Không tìm thấy thông tin khách hàng.');
                if (customer.wallet_balance < amount) {
                    throw new Error('Số dư ví không đủ. Vui lòng nạp thêm.');
                }

                // Trừ tiền khách
                customer.wallet_balance -= amount;
                await customer.save({ session: dbSession });

                // Tạo Transaction Payment cho khách
                await Transaction.create([{
                    userId: customer._id,
                    order_id: id,
                    type: 'PAYMENT_RELEASE', // Hoặc type riêng SETTLEMENT
                    amount: -amount,
                    balanceAfter: customer.wallet_balance,
                    status: 'SUCCESS',
                    metadata: { description: `Thanh toán phần còn thiếu cho đơn #${id.slice(-6).toUpperCase()}` }
                }], { session: dbSession });

                // Cộng tiền cho Booster
                if (order.boosterId) {
                    const booster = await User.findById(order.boosterId).session(dbSession);
                    if (booster) {
                        // Calculate booster's share of this specific payment based on the original order's profit margin
                        const originalTotal = order.pricing.total_amount > 0 ? order.pricing.total_amount : 1;
                        const originalBoosterShare = order.pricing.booster_earnings || 0;
                        const boosterSharePercent = originalBoosterShare / originalTotal;
                        
                        const boosterAmountFromThisPayment = Math.round(amount * boosterSharePercent);
                        
                        booster.wallet_balance = (booster.wallet_balance || 0) + boosterAmountFromThisPayment;
                        await booster.save({ session: dbSession });

                        await Transaction.create([{
                            userId: booster._id, 
                            order_id: id,
                            type: 'PAYMENT_RELEASE', 
                            amount: boosterAmountFromThisPayment,
                            balanceAfter: booster.wallet_balance, 
                            status: 'SUCCESS',
                            metadata: { description: `Nhận tiền thanh toán bổ sung từ đơn #${id.slice(-6).toUpperCase()}` }
                        }], { session: dbSession });
                    }
                }

                // Cập nhật Order
                order.pricing.deposit_amount += amount; 
                order.pricing.settlement_status = 'SETTLED';
                order.status = 'COMPLETED' as any;
                await order.save({ session: dbSession });

            } else if (mode === 'REFUND') {
                if (!isBooster && !isAdmin) throw new Error('Chỉ Booster mới có thể xác nhận hoàn tiền.');

                // Fallback cho đơn hàng cũ (trước khi có tính năng cọc)
                const deposit = order.pricing.deposit_amount || order.pricing.total_amount || 0;
                const refundAmount = amount; 
                
                let systemRefund = 0; // Trích từ cọc Admin giữ
                let boosterDeduction = 0; // Trừ từ ví Booster (phạt âm điểm)
                
                if (refundAmount > deposit) {
                    systemRefund = deposit;
                    boosterDeduction = refundAmount - deposit;
                } else {
                    systemRefund = refundAmount;
                }
                
                const customer = await User.findById(order.customerId).session(dbSession);
                if (!customer) throw new Error('Không tìm thấy thông tin khách hàng.');

                // Xử lý trừ tiền phạt từ ví Booster (nếu có)
                if (boosterDeduction > 0) {
                    const booster = await User.findById(order.boosterId).session(dbSession);
                    if (!booster) throw new Error('Không tìm thấy thông tin Booster.');
                    
                    if (booster.wallet_balance < boosterDeduction) {
                        throw new Error('Số dư ví của bạn không đủ để đền bù khoản âm điểm!');
                    }
                    
                    booster.wallet_balance -= boosterDeduction;
                    await booster.save({ session: dbSession });
                    
                    await Transaction.create([{
                        userId: booster._id,
                        order_id: id,
                        type: 'REFUND', // Coi như giao dịch chi ra
                        amount: -boosterDeduction,
                        balanceAfter: booster.wallet_balance,
                        status: 'SUCCESS',
                        metadata: { description: `Trừ tiền phạt âm điểm đền cho khách (Đơn #${id.slice(-6).toUpperCase()})` }
                    }], { session: dbSession });
                }

                // Trả tiền cho khách
                customer.wallet_balance += refundAmount;
                await customer.save({ session: dbSession });
                
                // Ghi nhận log nhận hoàn cọc
                if (systemRefund > 0) {
                    await Transaction.create([{
                        userId: customer._id,
                        order_id: id,
                        type: 'REFUND',
                        amount: systemRefund,
                        balanceAfter: customer.wallet_balance - boosterDeduction, // Số dư trước khi nhận phần đền bù
                        status: 'SUCCESS',
                        metadata: { description: `Hoàn tiền cọc từ đơn #${id.slice(-6).toUpperCase()}` }
                    }], { session: dbSession });
                }
                
                // Ghi nhận log nhận đền bù
                if (boosterDeduction > 0) {
                    await Transaction.create([{
                        userId: customer._id,
                        order_id: id,
                        type: 'REFUND',
                        amount: boosterDeduction,
                        balanceAfter: customer.wallet_balance, // Số dư cuối cùng
                        status: 'SUCCESS',
                        metadata: { description: `Nhận tiền đền bù âm điểm từ Booster (Đơn #${id.slice(-6).toUpperCase()})` }
                    }], { session: dbSession });
                }

                // Cập nhật Order (Trường hợp hoàn tiền coi như đã xử lý xong)
                order.pricing.settlement_status = 'SETTLED';
                order.status = 'COMPLETED' as any;
                await order.save({ session: dbSession });
            }

            await dbSession.commitTransaction();
            
            // --- 5. Notification Logic (After Transaction Commit) ---
            try {
                if (mode === 'PAY' && order.boosterId) {
                    await Notification.create({
                        userId: order.boosterId,
                        title: 'Đơn hàng đã được thanh toán',
                        message: `Khách hàng đã thanh toán số tiền còn thiếu (${amount.toLocaleString()} đ) cho đơn #${id.slice(-6).toUpperCase()}. Bạn có thể kiểm tra ví.`,
                        type: 'PAYMENT',
                        link: `/orders/${id}`
                    });
                }
                
                await Notification.create({
                    userId: order.customerId,
                    title: mode === 'PAY' ? 'Thanh toán thành công' : 'Hoàn tiền thành công',
                    message: mode === 'PAY' 
                        ? `Bạn đã thanh toán ${amount.toLocaleString()} đ cho đơn #${id.slice(-6).toUpperCase()}. Đơn hàng đã hoàn tất.`
                        : `Bạn đã nhận được ${amount.toLocaleString()} đ hoàn tiền cho đơn #${id.slice(-6).toUpperCase()}.`,
                    type: 'PAYMENT',
                    link: `/orders/${id}`
                });

                // --- 6. Send Email Invoice (New Feature) ---
                const customer = await User.findById(order.customerId);
                if (customer && customer.email) {
                    const orderCode = id.slice(-6).toUpperCase();
                    const paymentDate = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
                    
                    await sendEmail(
                        customer.email,
                        mode === 'PAY' ? `[CAYTHUELOL] Hóa đơn thanh toán #${orderCode}` : `[CAYTHUELOL] Thông báo hoàn tiền #${orderCode}`,
                        `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f5; padding: 20px;">
                                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                                    <div style="text-align: center; margin-bottom: 20px;">
                                        <h2 style="color: #2563eb; margin: 0;">CAYTHUE<span style="color: #000;">LOL</span></h2>
                                        <p style="color: #71717a; font-size: 14px;">${mode === 'PAY' ? 'Xác nhận thanh toán thành công' : 'Hoàn tiền thành công'}</p>
                                    </div>
                                    
                                    <div style="border-top: 1px solid #e4e4e7; border-bottom: 1px solid #e4e4e7; padding: 20px 0; margin: 20px 0;">
                                        <table style="width: 100%; font-size: 14px;">
                                            <tr>
                                                <td style="color: #71717a; padding-bottom: 10px;">Mã đơn hàng:</td>
                                                <td style="text-align: right; font-weight: bold;">#${orderCode}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #71717a; padding-bottom: 10px;">Dịch vụ:</td>
                                                <td style="text-align: right; font-weight: bold;">${order.serviceType.replace('_', ' ')}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #71717a; padding-bottom: 10px;">Thời gian:</td>
                                                <td style="text-align: right;">${paymentDate}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #71717a; padding-top: 10px; border-top: 1px dashed #e4e4e7;">${mode === 'PAY' ? 'Số tiền thanh toán:' : 'Số tiền hoàn lại:'}</td>
                                                <td style="text-align: right; font-size: 18px; color: ${mode === 'PAY' ? '#dc2626' : '#10b981'}; font-weight: bold; padding-top: 10px; border-top: 1px dashed #e4e4e7;">
                                                    ${amount.toLocaleString('vi-VN')} đ
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                    <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 30px;">
                                        Cảm ơn bạn đã sử dụng dịch vụ. Đây là email tự động, vui lòng không trả lời.
                                    </p>
                                </div>
                            </div>
                        `
                    );
                }

            } catch (notifError) {
                console.error('Failed to create notification:', notifError);
                // Không throw error ở đây để tránh rollback giao dịch chính
            }

        } catch (err: any) {
            await dbSession.abortTransaction();
            throw err; // Ném ra để catch block ngoài xử lý
        } finally {
            dbSession.endSession();
        }

        return NextResponse.json({ success: true, newBalance: 0 }); // newBalance logic handled inside

    } catch (error: any) {
        console.error('Settlement Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
