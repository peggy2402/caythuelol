import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Chỉ cho phép user đã đăng nhập tạo đơn test
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    // Tìm một user đóng vai trò khách hàng (Ưu tiên role CUSTOMER, fallback về chính user hiện tại)
    const customer = await User.findOne({ role: 'CUSTOMER' }) || await User.findById(session.user.id);

    if (!customer) {
        return NextResponse.json({ error: 'Không tìm thấy user nào để gán đơn hàng' }, { status: 404 });
    }

    const dummyOrder = await Order.create({
        customerId: customer._id,
        serviceType: 'RANK_BOOST',
        status: 'PAID', // Quan trọng: Phải là PAID mới hiện lên sàn
        boosterId: null, // Quan trọng: Null nghĩa là chưa ai nhận (Public)
        details: {
            current_rank: 'SILVER IV',
            desired_rank: 'GOLD IV',
            server: 'VN',
            account_info: { username: 'testuser', password: 'testpassword' },
            current_lp: 50
        },
        pricing: {
            base_price: 400000,
            total_amount: 500000,
            booster_earnings: 400000,
            platform_fee: 100000
        }
    });

    return NextResponse.json({ success: true, order: dummyOrder });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo đơn test' }, { status: 500 });
  }
}