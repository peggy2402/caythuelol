import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    await dbConnect();

    const query: any = { role: 'CUSTOMER' };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(query)
      .select('-password_hash') // Không trả về mật khẩu
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Tính toán thống kê cho từng user (Aggregation)
    const usersWithStats = await Promise.all(users.map(async (user: any) => {
        const totalOrders = await Order.countDocuments({ customerId: user._id });
        const completedOrders = await Order.countDocuments({ customerId: user._id, status: 'COMPLETED' });
        
        // Tính tổng tiền đã chi tiêu (Chỉ tính đơn đã hoàn thành/quyết toán)
        const totalSpentAgg = await Order.aggregate([
            { $match: { customerId: user._id, status: { $in: ['COMPLETED', 'SETTLED'] } } },
            { $group: { _id: null, total: { $sum: '$pricing.total_amount' } } }
        ]);

        return {
            ...user,
            stats: {
                totalOrders,
                completedOrders,
                totalSpent: totalSpentAgg[0]?.total || 0
            }
        };
    }));

    return NextResponse.json({
      success: true,
      users: usersWithStats,
      pagination: { page, totalPages, totalUsers },
    });

  } catch (error) {
    console.error('Get Users Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}