import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import Transaction from "@/models/Transaction";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Lấy dữ liệu 30 ngày gần nhất cho biểu đồ
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalCustomers,
      totalBoosters,
      activeOrders,
      revenueResult,
      volumeResult,
      revenueChartData
    ] = await Promise.all([
      User.countDocuments({ role: 'CUSTOMER' }),
      User.countDocuments({ role: 'BOOSTER' }),
      Order.countDocuments({ status: { $in: ['PAID', 'APPROVED', 'IN_PROGRESS'] } }),
      Transaction.aggregate([
        { $match: { type: 'COMMISSION', status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Order.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: "$pricing.total_amount" } } }
      ]),
      Transaction.aggregate([
        { 
          $match: { 
            type: 'COMMISSION', 
            status: 'SUCCESS',
            createdAt: { $gte: thirtyDaysAgo }
          } 
        },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$amount" } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    return NextResponse.json({
      totalUsers: totalCustomers + totalBoosters,
      breakdown: {
        customers: totalCustomers,
        boosters: totalBoosters
      },
      activeOrders,
      totalRevenue: revenueResult[0]?.total || 0,
      totalVolume: volumeResult[0]?.total || 0,
      revenueChart: revenueChartData.map(item => ({ date: item._id, value: item.revenue }))
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}