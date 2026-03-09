import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import Transaction from '@/models/Transaction';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Bao gồm cả ngày kết thúc
      dateFilter.$lt = end;
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // 1. Tổng Nợ Người Dùng (Liabilities - User Wallets)
    // Là tổng số tiền đang nằm trong ví của tất cả user (Admin đang giữ hộ)
    const users = await User.aggregate([
      { $group: { _id: null, totalWallet: { $sum: "$wallet_balance" }, totalPending: { $sum: "$pending_balance" } } }
    ]);
    const totalUserBalance = (users[0]?.totalWallet || 0) + (users[0]?.totalPending || 0);

    // 2. Tổng Tiền Cọc (Liabilities - Escrow)
    // Là tiền đã trừ khỏi ví user nhưng chưa trả cho Booster (đang treo trong đơn hàng)
    const escrow = await Order.aggregate([
      { $match: { 'payment.is_locked': true } },
      { $group: { _id: null, total: { $sum: "$pricing.deposit_amount" } } }
    ]);
    const totalEscrow = escrow[0]?.total || 0;

    // 3. Dòng tiền thực tế (Cash Flow)
    const transactions = await Transaction.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: {
          _id: "$type",
          total: { $sum: "$amount" }
      }}
    ]);

    const depositTx = transactions.find(t => t._id === 'DEPOSIT');
    const totalDeposits = depositTx ? depositTx.total : 0;

    const withdrawTx = transactions.find(t => t._id === 'WITHDRAWAL');
    const totalWithdrawals = withdrawTx ? Math.abs(withdrawTx.total) : 0;

    // 4. Doanh thu Admin (Revenue)
    // Tính tổng phí sàn từ các đơn đã hoàn thành
    const completedOrdersMatch: any = { status: { $in: ['COMPLETED', 'SETTLED'] } };
    if (hasDateFilter) {
      completedOrdersMatch.createdAt = dateFilter;
    }

    const completedOrders = await Order.aggregate([
        { $match: completedOrdersMatch },
        { $group: { _id: null, totalFee: { $sum: "$pricing.platform_fee" } } }
    ]);
    const totalPlatformFees = completedOrders[0]?.totalFee || 0;

    // Tính tổng phí rút tiền (từ Transaction metadata.fee)
    const withdrawalFees = await Transaction.aggregate([
      { $match: { type: 'WITHDRAWAL', status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: "$metadata.fee" } } }
    ]);
    const totalWithdrawalFees = withdrawalFees[0]?.total || 0;

    const adminRevenue = totalPlatformFees + totalWithdrawalFees;
    
    // 5. Doanh thu theo tháng (Monthly Revenue)
    const monthlyRevenueMatch: any = { status: { $in: ['COMPLETED', 'SETTLED'] } };
    if (hasDateFilter) {
      monthlyRevenueMatch.createdAt = dateFilter;
    }

    const monthlyRevenue = await Order.aggregate([
        { $match: monthlyRevenueMatch },
        { $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            total: { $sum: "$pricing.platform_fee" }
        }},
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 6. Thống kê theo loại dịch vụ (Service Distribution)
    const ordersByServiceMatch: any = {};
    if (hasDateFilter) {
      ordersByServiceMatch.createdAt = dateFilter;
    }
    const ordersByService = await Order.aggregate([
        { $match: ordersByServiceMatch },
        { $group: { _id: "$serviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    // 7. Top Boosters by Earnings
    const topBoostersMatch: any = { 
        status: { $in: ['COMPLETED', 'SETTLED'] }, 
        boosterId: { $exists: true, $ne: null } 
    };
    if (hasDateFilter) {
      topBoostersMatch.createdAt = dateFilter;
    }
    const topBoosters = await Order.aggregate([
        { $match: topBoostersMatch },
        { $group: {
            _id: "$boosterId",
            totalEarnings: { $sum: "$pricing.booster_earnings" },
            orderCount: { $sum: 1 }
        }},
        { $sort: { totalEarnings: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'boosterInfo' }},
        { $unwind: '$boosterInfo' },
        { $project: { _id: 1, totalEarnings: 1, orderCount: 1, username: '$boosterInfo.username', avatar: '$boosterInfo.profile.avatar' }}
    ]);

    // 8. Top Users by Deposit
    const topDepositorsMatch: any = { type: 'DEPOSIT', status: 'SUCCESS' };
    if (hasDateFilter) {
      topDepositorsMatch.createdAt = dateFilter;
    }
    const topDepositors = await Transaction.aggregate([
      { $match: topDepositorsMatch },
      { $group: { _id: '$userId', totalDeposited: { $sum: '$amount' } } },
      { $sort: { totalDeposited: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' }},
      { $unwind: '$userInfo' },
      { $project: { _id: 1, totalDeposited: 1, username: '$userInfo.username', avatar: '$userInfo.profile.avatar' }}
    ]);

    // 9. Top Users by Spending
    const topSpendersMatch: any = { status: { $in: ['COMPLETED', 'SETTLED'] } };
     if (hasDateFilter) {
      topSpendersMatch.createdAt = dateFilter;
    }
    const topSpenders = await Order.aggregate([
      { $match: topSpendersMatch },
      { $group: {
          _id: '$customerId',
          totalSpent: { $sum: '$pricing.total_amount' },
          orderCount: { $sum: 1 }
      }},
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' }},
      { $unwind: '$userInfo' },
      { $project: { _id: 1, totalSpent: 1, orderCount: 1, username: '$userInfo.username', avatar: '$userInfo.profile.avatar' }}
    ]);


    // 10. Các chỉ số khác
    const activeOrders = await Order.countDocuments({ status: { $in: ['PAID', 'APPROVED', 'IN_PROGRESS'] } });
    const totalUsers = await User.countDocuments({ role: 'CUSTOMER' });
    const totalBoosters = await User.countDocuments({ role: 'BOOSTER' });

    return NextResponse.json({
      stats: {
        totalUserBalance, totalEscrow, totalDeposits, totalWithdrawals,
        adminRevenue, totalPlatformFees, totalWithdrawalFees, // Trả về chi tiết
        activeOrders, totalUsers, totalBoosters,
        monthlyRevenue, ordersByService, topBoosters,
        topDepositors, topSpenders
      }
    });

  } catch (error) {
    console.error('Admin Stats Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}