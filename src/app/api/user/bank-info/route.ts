import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId;

    const { bankName, accountNumber, accountHolder } = await req.json();

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
    }

    // Lấy user cũ để so sánh hoặc lưu log (nếu cần)
    // Ở đây ta dùng findByIdAndUpdate để lấy bản ghi TRƯỚC khi update (mặc định)
    const oldUser = await User.findByIdAndUpdate(userId, {
      $set: {
        'profile.bank_info': {
          bankName,
          accountNumber,
          accountHolder: accountHolder.toUpperCase()
        }
      }
    });

    // Ghi Audit Log
    await AuditLog.create({
      actorId: userId,
      targetId: userId,
      action: 'UPDATE_BANK_INFO',
      description: `Cập nhật thông tin ngân hàng: ${bankName} - ${accountNumber}`,
      metadata: { old: oldUser?.profile?.bank_info, new: { bankName, accountNumber, accountHolder } },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true, message: 'Cập nhật thông tin ngân hàng thành công' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
