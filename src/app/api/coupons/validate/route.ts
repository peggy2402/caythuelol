import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BoosterProfile from '@/models/BoosterProfile';

export async function POST(req: Request) {
  try {
    const { code, boosterId } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Vui lòng nhập mã giảm giá' }, { status: 400 });
    }

    if (!boosterId) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin Booster để áp dụng mã' }, { status: 400 });
    }

    await dbConnect();

    // Tìm BoosterProfile thay vì User
    const profile = await BoosterProfile.findOne({ userId: boosterId }).lean();
    
    if (!profile) {
      return NextResponse.json({ error: 'Booster chưa cấu hình dịch vụ' }, { status: 404 });
    }

    const lolProfile = profile.games?.find(g => g.gameCode === 'LOL');
    const coupons = lolProfile?.metadata?.coupons || [];
    const coupon = coupons.find((c: any) => c.code === code.toUpperCase() && c.isActive);

    if (!coupon) {
      return NextResponse.json({ error: 'Mã giảm giá không hợp lệ hoặc không tồn tại' }, { status: 400 });
    }

    // Trả về thông tin coupon (chỉ trả về các trường cần thiết)
    return NextResponse.json({ success: true, coupon: { code: coupon.code, value: coupon.value, type: coupon.type } });

  } catch (error) {
    return NextResponse.json({ error: 'Lỗi kiểm tra mã giảm giá' }, { status: 500 });
  }
}