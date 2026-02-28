import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import User, { UserRole } from '@/models/User';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// GET: Lấy danh sách đơn hàng (Available & My Jobs)
export async function GET() {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    
    // 1. Check Auth & Role
    if (!payload || payload.role !== UserRole.BOOSTER) {
      return NextResponse.json({ error: 'Unauthorized: Boosters only' }, { status: 403 });
    }

    const boosterId = payload.userId as string;

    // 2. Lấy đơn chưa ai nhận (PAID)
    const availableOrders = await Order.find({
      status: OrderStatus.PAID,
      booster_id: { $exists: false } // Hoặc null
    }).sort({ created_at: -1 });

    // 3. Lấy đơn Booster đang làm
    const myOrders = await Order.find({
      booster_id: boosterId,
      status: { $in: [OrderStatus.APPROVED, OrderStatus.IN_PROGRESS] }
    }).sort({ updated_at: -1 });

    return NextResponse.json({ availableOrders, myOrders });
  } catch (error) {
    console.error('Fetch Jobs Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Nhận đơn (Claim Order)
export async function POST(req: Request) {
  try {
    await dbConnect();
    const payload = await getAuthUser();

    if (!payload || payload.role !== UserRole.BOOSTER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { orderId } = await req.json();
    const boosterId = payload.userId as string;

    // 1. Tìm đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Kiểm tra trạng thái (Phải là PAID và chưa có Booster)
    if (order.status !== OrderStatus.PAID || order.booster_id) {
      return NextResponse.json({ error: 'Order is no longer available' }, { status: 400 });
    }

    // 3. Cập nhật đơn hàng
    order.booster_id = boosterId as any;
    order.status = OrderStatus.APPROVED; // Chuyển sang đã duyệt/đã nhận
    await order.save();

    // TODO: Gửi thông báo cho khách hàng (Socket.io / Email)

    return NextResponse.json({ 
      success: true, 
      message: 'Accept job successfully',
      order 
    });

  } catch (error) {
    console.error('Accept Job Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
