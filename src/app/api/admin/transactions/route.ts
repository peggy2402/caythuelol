import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import User from '@/models/User'; // Import User model to ensure schema is registered

export async function GET(req: Request) {
  try {
    await dbConnect();

    // 1. Check Admin Auth
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // @ts-ignore
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Get Transactions (Populate User info)
    // Lấy tất cả giao dịch, sắp xếp mới nhất lên đầu
    const transactions = await Transaction.find({})
      .populate('userId', 'username email profile.avatar')
      .sort({ createdAt: -1 })
      .limit(100); // Giới hạn 100 giao dịch gần nhất

    return NextResponse.json({ transactions });

  } catch (error) {
    console.error('Admin Transactions Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
