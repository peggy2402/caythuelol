import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const { bankName, accountNumber, accountHolder } = await req.json();

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
    }

    // 1. Lấy dữ liệu cũ để ghi log
    const oldUser = await User.findById(userId).lean();
    if (!oldUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 2. Update trực tiếp bằng MongoDB Driver để đảm bảo nhất quán
    await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { 
        $set: { 
          'profile.bank_info': { bankName, accountNumber, accountHolder: accountHolder.toUpperCase() } 
        } 
      }
    );

    // Ghi Audit Log
    await AuditLog.create({
      actorId: userId,
      targetId: userId,
      action: 'UPDATE_BANK_INFO',
      description: `Cập nhật thông tin ngân hàng: ${bankName} - ${accountNumber}`,
      // @ts-ignore
      metadata: { old: oldUser.profile?.bank_info, new: { bankName, accountNumber, accountHolder } },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true, message: 'Cập nhật thông tin ngân hàng thành công' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
