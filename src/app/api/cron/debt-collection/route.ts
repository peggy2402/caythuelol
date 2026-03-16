import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
  // Protect cron route using CRON_SECRET from .env
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  await dbConnect();
  const now = new Date();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

  // 1. Xử lý nhắc nợ (Tối đa 5 lần, mỗi lần cách nhau 30p)
  const debtorsToRemind = await User.find({
    'debt_info.is_in_debt': true,
    'debt_info.reminder_count': { $lt: 5 },
    $or: [
      { 'debt_info.last_reminded_at': { $exists: false } },
      { 'debt_info.last_reminded_at': { $lte: thirtyMinsAgo } }
    ]
  });

  for (const user of debtorsToRemind) {
    // TODO: Tích hợp logic gửi Email/Socket thông báo nhắc nợ ở đây
    console.log(`[DEBT] Nhắc nợ User ${user.username}. Lần: ${user.debt_info!.reminder_count + 1}`);
    
    user.debt_info!.reminder_count += 1;
    user.debt_info!.last_reminded_at = now;
    await user.save();
  }

  // 2. Xử lý Ban tài khoản nếu không trả nợ (Khóa 1 tuần)
  const debtorsToBan = await User.find({
    'debt_info.is_in_debt': true,
    'debt_info.ban_deadline': { $lte: now },
    isBanned: false
  });

  for (const user of debtorsToBan) {
    console.log(`[DEBT] BAN User ${user.username} 1 tuần do trốn nợ.`);
    user.isBanned = true;
    // Gia hạn deadline thêm 1 tuần để nếu mở ban lại mà vẫn nợ thì ban tiếp
    user.debt_info!.ban_deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); 
    await user.save();
  }

  return NextResponse.json({ success: true, reminded: debtorsToRemind.length, banned: debtorsToBan.length });
}
