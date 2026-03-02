import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User'; // Import User để populate hoạt động
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET(req: Request) {
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
         return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }

    // 2. Parse Query Params (Bộ lọc thông minh)
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search'); // Tìm theo username hoặc nội dung

    const query: any = {};

    if (status && status !== 'ALL') query.status = status;
    if (type && type !== 'ALL') query.type = type;

    // Nếu có search, ta cần tìm user trước hoặc tìm trong description/metadata
    if (search) {
        // Tìm user có username chứa từ khóa
        const users = await User.find({ username: { $regex: search, $options: 'i' } }).select('_id');
        const userIds = users.map(u => u._id);

        query.$or = [
            { userId: { $in: userIds } }, // Tìm theo User
            { description: { $regex: search, $options: 'i' } }, // Tìm theo mô tả
            { 'metadata.content': { $regex: search, $options: 'i' } } // Tìm theo nội dung gốc SePay
        ];
    }

    // 3. Fetch Transactions
    // Lấy tất cả giao dịch, populate thông tin user để hiển thị tên/email
    const transactions = await Transaction.find(query)
      .populate('userId', 'username email profile.avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Admin Transactions Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}