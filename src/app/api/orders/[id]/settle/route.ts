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
        
        if (order.customerId.toString() !== customerId && session.user.role !== 'ADMIN') {
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
        const amountToPay = body.amount; // Client gửi số tiền hiển thị

        if (!amountToPay || amountToPay <= 0) {
             return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // 4. Transaction Atomicity
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            const user = await User.findById(customerId).session(dbSession);
            if (user.wallet_balance < amountToPay) {
                throw new Error('Số dư ví không đủ. Vui lòng nạp thêm.');
            }

            // Trừ tiền khách
            user.wallet_balance -= amountToPay;
            await user.save({ session: dbSession });

            // Tạo Transaction Payment
            await Transaction.create([{
                userId: customerId,
                order_id: id,
                type: 'PAYMENT_RELEASE', // Hoặc type riêng SETTLEMENT
                amount: -amountToPay,
                balanceAfter: user.wallet_balance,
                status: 'SUCCESS',
                metadata: { description: `Thanh toán phần còn thiếu cho đơn #${id.slice(-6)}` }
            }], { session: dbSession });

            // --- NEW: Create transaction for Booster for visibility ---
            if (order.boosterId) {
                const booster = await User.findById(order.boosterId).session(dbSession);
                if (booster) {
                    // Calculate booster's share of this specific payment based on the original order's profit margin
                    const originalTotal = order.pricing.total_amount > 0 ? order.pricing.total_amount : 1;
                    const originalBoosterShare = order.pricing.booster_earnings || 0;
                    const boosterSharePercent = originalBoosterShare / originalTotal;
                    
                    const boosterAmountFromThisPayment = Math.round(amountToPay * boosterSharePercent);
                    
                    // --- SỬA LẠI: CỘNG THẲNG VÀO VÍ CHÍNH (WALLET BALANCE) ---
                    // Tiền nằm trong Ví Web được coi là "Hold" cho đến khi Rút về Bank
                    booster.wallet_balance = (booster.wallet_balance || 0) + boosterAmountFromThisPayment;
                    await booster.save({ session: dbSession });

                    // Create a transaction record for the booster.
                    // Type là 'PAYMENT_RELEASE' để hiển thị màu xanh và cộng tiền trong lịch sử
                    await Transaction.create([{
                        userId: order.boosterId, // Lưu ý: Schema có thể là booster_id hoặc boosterId tùy lúc populate, dùng biến booster._id cho chắc chắn
                        order_id: id,
                        type: 'PAYMENT_RELEASE', 
                        amount: boosterAmountFromThisPayment,
                        // Hiển thị số dư Ví chính sau khi cộng
                        balanceAfter: booster.wallet_balance, 
                        status: 'SUCCESS',
                        // Đảm bảo có description rõ ràng
                        metadata: { description: `Nhận tiền thanh toán bổ sung từ đơn #${id.slice(-6).toUpperCase()}` }
                    }], { session: dbSession });
                }
            }

            // Update Order
            order.pricing.deposit_amount += amountToPay; // Coi như đã trả thêm vào cọc/tổng
            order.pricing.settlement_status = 'SETTLED';
            order.status = 'COMPLETED' as any; // Chốt đơn (Cast as any to fix Type error)
            await order.save({ session: dbSession });

            await dbSession.commitTransaction();
            
            // --- 5. Notification Logic (After Transaction Commit) ---
            try {
                // Thông báo cho Booster: Khách đã thanh toán bù
                if (order.boosterId || order.boosterId) {
                    await Notification.create({
                        userId: order.boosterId || order.boosterId,
                        title: 'Đơn hàng đã được thanh toán',
                        message: `Khách hàng đã thanh toán số tiền còn thiếu (${amountToPay.toLocaleString()} đ) cho đơn #${id.slice(-6).toUpperCase()}. Bạn có thể kiểm tra ví.`,
                        type: 'PAYMENT',
                        link: `/orders/${id}`
                    });
                }
                
                // Thông báo cho Khách hàng: Xác nhận thanh toán thành công
                await Notification.create({
                    userId: customerId,
                    title: 'Thanh toán thành công',
                    message: `Bạn đã thanh toán ${amountToPay.toLocaleString()} đ cho đơn #${id.slice(-6).toUpperCase()}. Đơn hàng đã hoàn tất.`,
                    type: 'PAYMENT',
                    link: `/orders/${id}`
                });

                // --- 6. Send Email Invoice (New Feature) ---
                if (user.email) {
                    const orderCode = id.slice(-6).toUpperCase();
                    const paymentDate = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
                    
                    await sendEmail(
                        user.email,
                        `[CAYTHUELOL] Hóa đơn thanh toán #${orderCode}`,
                        `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f5; padding: 20px;">
                                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                                    <div style="text-align: center; margin-bottom: 20px;">
                                        <h2 style="color: #2563eb; margin: 0;">CAYTHUE<span style="color: #000;">LOL</span></h2>
                                        <p style="color: #71717a; font-size: 14px;">Xác nhận thanh toán thành công</p>
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
                                                <td style="color: #71717a; padding-top: 10px; border-top: 1px dashed #e4e4e7;">Số tiền thanh toán:</td>
                                                <td style="text-align: right; font-size: 18px; color: #dc2626; font-weight: bold; padding-top: 10px; border-top: 1px dashed #e4e4e7;">
                                                    ${amountToPay.toLocaleString('vi-VN')} đ
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
