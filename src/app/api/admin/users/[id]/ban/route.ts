import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    // Chỉ ADMIN mới có quyền này
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await dbConnect();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Đảo ngược trạng thái isBanned
    user.isBanned = !user.isBanned;

    // QUAN TRỌNG: Nếu là MỞ KHÓA cho người dùng đang nợ, gia hạn thêm 3 ngày
    // Nếu không, Cron Job chạy lúc 00:00 sẽ khóa lại tài khoản ngay lập tức
    if (user.isBanned === false && user.debt_info?.is_in_debt) {
      user.debt_info.ban_deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }

    await user.save();

    return NextResponse.json({ success: true, isBanned: user.isBanned });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}