import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: orderId } = await params;
    const userId = user.userId as string;

    // Cập nhật tất cả tin nhắn trong đơn hàng này mà:
    // 1. Không phải do mình gửi (sender_id != userId)
    // 2. Mình chưa xem (readBy không chứa userId)
    await Message.updateMany(
      { 
        order_id: orderId, 
        sender_id: { $ne: userId },
        readBy: { $ne: userId }
      },
      { $addToSet: { readBy: userId } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark Read Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
