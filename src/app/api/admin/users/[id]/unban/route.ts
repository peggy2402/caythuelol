import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    // CHỈ ADMIN MỚI ĐƯỢC QUYỀN MỞ KHÓA
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Mở khóa tài khoản
    user.isBanned = false;
    
    // QUAN TRỌNG: Nếu bị ban do nợ, gia hạn deadline thêm 3 ngày
    // Nếu không gia hạn, vừa mở khóa xong 00:00 CronJob chạy lại bị ban tiếp
    if (user.debt_info && user.debt_info.is_in_debt) {
       user.debt_info.ban_deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }
    
    await user.save();

    return NextResponse.json({ success: true, message: 'Đã mở khóa tài khoản thành công.' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}