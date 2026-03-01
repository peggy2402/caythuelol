import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Order from '@/models/Order';
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

// GET: Lấy danh sách tin nhắn của đơn hàng
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: orderId } = await params;

    // 1. Kiểm tra quyền truy cập đơn hàng
    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const userId = user.userId as string;
    const isCustomer = order.customerId.toString() === userId;
    const isBooster = order.boosterId?.toString() === userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isCustomer && !isBooster && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Lấy tin nhắn (populate thông tin người gửi)
    const messages = await Message.find({ order_id: orderId })
      .sort({ created_at: 1 })
      .populate('sender_id', 'username profile.avatar role');

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get Messages Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Gửi tin nhắn mới
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: orderId } = await params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // 1. Kiểm tra quyền
    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const userId = user.userId as string;
    const isCustomer = order.customerId.toString() === userId;
    const isBooster = order.boosterId?.toString() === userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isCustomer && !isBooster && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Tạo tin nhắn
    const newMessage = await Message.create({
      order_id: orderId,
      sender_id: userId,
      content: content.trim(),
      is_system_message: false,
    });

    // Populate để trả về ngay cho frontend hiển thị
    await newMessage.populate('sender_id', 'username profile.avatar role');

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Send Message Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
