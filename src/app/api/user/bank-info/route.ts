import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
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

    await User.findByIdAndUpdate(userId, {
      $set: {
        'profile.bank_info': {
          bankName,
          accountNumber,
          accountHolder: accountHolder.toUpperCase()
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Cập nhật thông tin ngân hàng thành công' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
