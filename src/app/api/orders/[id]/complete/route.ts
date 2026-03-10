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
    await dbConnect();

    const order = await Order.findOne({ _id: id, boosterId: session.user.id });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.status !== OrderStatus.IN_PROGRESS && order.status !== OrderStatus.APPROVED) {
        return NextResponse.json({ error: 'Order cannot be completed in current status' }, { status: 400 });
    }

    // --- NET WINS SETTLEMENT LOGIC ---
    if (order.serviceType === 'NET_WINS') {
        const { start_lp, current_lp, unit_price_per_lp, modifier_pct, calc_mode, num_games } = order.details;
        
        // 1. Tính giá gốc thực tế (Actual Base Price)
        let actualBasePrice = 0;
        
        if (calc_mode === 'BY_LP') {
            // Tính theo chênh lệch LP thực tế
            // current_lp được cập nhật trong quá trình cày (qua API update details)
            const start = parseInt(start_lp) || 0;
            const current = parseInt(current_lp) || 0;
            const gained = Math.max(0, current - start);
            actualBasePrice = gained * (unit_price_per_lp || 0);
        } else {
            // BY_GAMES: Mặc định tính đủ số trận đã thuê (hoặc có thể đếm từ match_history nếu muốn chính xác từng trận)
            // Ở đây ta giả định Booster hoàn thành đúng số trận cam kết
            // Giá = Số trận * (Giá mỗi LP * LP trung bình mỗi trận) -> Logic này phụ thuộc vào cách tính ở Frontend
            // Để đơn giản và an toàn, ta dùng tỷ lệ: (Giá trị đơn gốc)
            // Nếu muốn chính xác hơn, cần lưu price_per_game vào details.
            // Tạm thời giữ nguyên giá trị gốc cho BY_GAMES nếu hoàn thành đủ.
            actualBasePrice = order.pricing.base_price; 
        }

        // 2. Tính lại tổng tiền thực tế (Actual Total)
        // Công thức: ActualTotal = ActualBase * (OriginalTotal / OriginalBase)
        // Cách này giúp giữ nguyên tỷ lệ các loại phí (Platform fee, Options fee...)
        const originalBase = order.pricing.base_price;
        const originalTotal = order.pricing.total_amount;
        
        let actualTotal = originalTotal;
        if (originalBase > 0) {
            actualTotal = Math.round((actualBasePrice / originalBase) * originalTotal);
        }

        // 3. Cập nhật vào Order
        order.pricing.final_amount = actualTotal;
        
        const paid = order.pricing.deposit_amount;
        const diff = actualTotal - paid;

        if (diff > 0) {
            // Khách còn nợ -> Cần thanh toán thêm
            order.pricing.settlement_status = 'CUSTOMER_OWES';
            order.payment.final_paid = false;
        } else if (diff < 0) {
            // Khách trả thừa -> Cần hoàn tiền
            order.pricing.settlement_status = 'REFUND_NEEDED';
            // (Có thể thực hiện hoàn tiền tự động ở đây nếu muốn, hoặc để Admin/Booster xác nhận)
        } else {
            // Vừa đủ
            order.pricing.settlement_status = 'SETTLED';
            order.payment.final_paid = true;
        }
    }

    // 1. Update Status
    order.status = OrderStatus.COMPLETED;
    
    await order.save();

    return NextResponse.json({ success: true, message: 'Đã báo cáo hoàn thành. Vui lòng chờ khách hàng xác nhận.' });
  } catch (error) {
    console.error('Complete Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
