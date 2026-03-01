import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import BoosterApplication from "@/models/BoosterApplication";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'list';

    await dbConnect();

    // --- CASE 1: Lấy danh sách đơn đăng ký (Applications) ---
    if (tab === 'applications') {
      const applications = await BoosterApplication.find()
        .sort({ createdAt: -1 })
        .populate('userId', 'username email profile.avatar');
      return NextResponse.json({ applications });
    }

    // --- CASE 2: Lấy danh sách Booster hoạt động (Active List) ---
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'newest';

    // Query cơ bản: Lấy user có role BOOSTER
    const query: any = { role: 'BOOSTER' };

    // Tìm kiếm thông minh
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        { 'booster_info.ingame_name': searchRegex }
      ];
    }

    // Sắp xếp
    let sortOption: any = { createdAt: -1 };
    if (sort === 'rating') sortOption = { 'booster_info.rating': -1 };
    if (sort === 'orders') sortOption = { 'booster_info.completed_orders': -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    // Thực thi query với Pagination
    const skip = (page - 1) * limit;
    
    const [boosters, total] = await Promise.all([
      User.find(query)
        .select('-password_hash')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ boosters, total, totalPages, currentPage: page });

  } catch (error) {
    console.error("Admin Fetch Boosters Error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
