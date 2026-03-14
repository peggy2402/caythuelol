import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { rating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    await dbConnect();

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Chỉ khách hàng của đơn này mới được đánh giá
    if (order.customerId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status !== 'COMPLETED') {
        return NextResponse.json({ error: 'Đơn hàng phải hoàn thành mới được đánh giá' }, { status: 400 });
    }
    
    if (order.rating) {
        return NextResponse.json({ error: 'Đơn hàng này đã được đánh giá' }, { status: 400 });
    }

    // Giới hạn thời gian đánh giá: Tối đa 7 ngày sau khi hoàn thành
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    if (new Date().getTime() - new Date(order.updatedAt).getTime() > SEVEN_DAYS_MS) {
        return NextResponse.json({ error: 'Đã quá 7 ngày kể từ khi đơn hàng hoàn thành. Bạn không thể đánh giá nữa.' }, { status: 400 });
    }

    // 1. Cập nhật Order (Lưu đúng cấu trúc Object)
    order.rating = { stars: rating, comment: comment, createdAt: new Date() } as any;
    (order as any).review = comment; // Giữ lại field review ở root để tương thích ngược với code cũ
    await order.save();

    // 2. Cập nhật Rating trung bình của Booster
    if (order.boosterId) {
        const booster = await User.findById(order.boosterId);
        if (booster) {
            // FIX: Correct aggregation pipeline syntax
            const stats = await Order.aggregate([
                { $match: { boosterId: order.boosterId, rating: { $exists: true, $ne: null } } },
                { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
            ]);
            
            // Cập nhật vào thông tin Booster
            if (!booster.booster_info) booster.booster_info = {};
            
            if (stats.length > 0) {
                booster.booster_info.rating = Math.round(stats[0].avgRating * 10) / 10; // Làm tròn 1 chữ số thập phân
                booster.booster_info.completed_orders = stats[0].count; // Cập nhật luôn số đơn (nếu cần)
            } else {
                booster.booster_info.rating = rating;
            }
            
            await booster.save();
        }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rating Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
