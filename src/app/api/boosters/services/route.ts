import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Rank from '@/models/Rank';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Helper xác thực (giữ nguyên logic cũ nếu có)
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// GET: Lấy cấu hình (Giữ nguyên logic cũ của bạn, chỉ thêm phần lấy services)
export async function GET() {
  await dbConnect();
  const auth = await getAuthUser();
  if (!auth || auth.role !== 'BOOSTER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await User.findById(auth.userId).select('booster_info');
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Fetch Ranks từ DB để hiển thị bảng giá
  const ranks = await Rank.find({}).sort({ order: 1 }).lean();

  return NextResponse.json({
    settings: user.booster_info?.service_settings || {},
    services: user.booster_info?.services || [], // Trả về danh sách dịch vụ đang bật
    ranks: ranks || []
  });
}

// POST: Lưu toàn bộ cấu hình (Giữ nguyên logic cũ của bạn)
export async function POST(req: Request) {
  await dbConnect();
  const auth = await getAuthUser();
  if (!auth || auth.role !== 'BOOSTER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  // Logic save full settings...
  await User.findByIdAndUpdate(auth.userId, {
    $set: { 'booster_info.service_settings': body }
  });
  return NextResponse.json({ success: true });
}

// PATCH: Toggle Service ON/OFF (MỚI)
export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const auth = await getAuthUser();
    if (!auth || auth.role !== 'BOOSTER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { serviceKey, enabled } = await req.json();

    if (!serviceKey) return NextResponse.json({ error: 'Missing serviceKey' }, { status: 400 });

    const updateQuery = enabled
      ? { $addToSet: { 'booster_info.services': serviceKey } } // Thêm nếu chưa có (ON)
      : { $pull: { 'booster_info.services': serviceKey } };    // Xóa nếu đang có (OFF)

    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      updateQuery,
      { new: true }
    ).select('booster_info.services');

    return NextResponse.json({ 
      success: true, 
      services: updatedUser?.booster_info?.services || [] 
    });
  } catch (error) {
    console.error('Update Service Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Cập nhật danh sách dịch vụ đang bật (MỚI)
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const auth = await getAuthUser();
    if (!auth || auth.role !== 'BOOSTER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { services } = body;

    if (!Array.isArray(services)) {
        return NextResponse.json({ error: 'Invalid format. Services must be an array.' }, { status: 400 });
    }

    // Validate: Chỉ cho phép các Service Key hợp lệ của hệ thống
    const ALLOWED_SERVICES = ['RANK_BOOST', 'PROMOTION', 'PLACEMENTS', 'LEVELING', 'NET_WINS', 'MASTERY'];
    const isValid = services.every((s: string) => ALLOWED_SERVICES.includes(s));

    if (!isValid) {
        return NextResponse.json({ error: 'Invalid service types provided.' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      { $set: { 'booster_info.services': services } },
      { new: true }
    ).select('booster_info.services');

    return NextResponse.json({ success: true, services: updatedUser?.booster_info?.services || [] });
  } catch (error) {
    console.error('Update Services List Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}