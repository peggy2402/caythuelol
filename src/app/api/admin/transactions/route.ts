import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User'; // Import User để populate hoạt động
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET() {
  try {
    await dbConnect();

    // 1. Auth Check (Admin)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      // @ts-ignore
      if (payload.role !== 'ADMIN') {
         // Uncomment dòng dưới nếu muốn bắt buộc quyền Admin
         // return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }

    // 2. Fetch Transactions
    // Lấy tất cả giao dịch, populate thông tin user để hiển thị tên/email
    const transactions = await Transaction.find({})
      .populate('userId', 'username email profile.avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Admin Transactions Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}