import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import Order from '@/models/Order';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    let order;
    // Kiểm tra xem `id` có phải là ObjectId hợp lệ hay không
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Nếu hợp lệ, tìm bằng _id
      order = await Order.findById(id)
        .populate('customerId', 'username profile.avatar')
        .populate('boosterId');
    } else {
      // Nếu không, giả sử đó là mã đơn hàng tùy chỉnh (ví dụ: BK-BB02SZ)
      // **Lưu ý:** Mình đang giả sử trường lưu mã này là `orderCode`. Bạn hãy thay đổi nếu tên trường của bạn khác.
      order = await Order.findOne({ orderCode: id })
        .populate('customerId', 'username profile.avatar')
        .populate('boosterId');
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Access Control
    const isCustomer = order.customerId._id.toString() === session.user.id;
    const isBooster = order.boosterId?._id.toString() === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isCustomer && !isBooster && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Get Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
