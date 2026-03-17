import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Withdrawal from '@/models/Withdrawal';
import Order from '@/models/Order';
import Transaction from '@/models/Transaction';
import SystemSetting from '@/models/SystemSetting';

const MIN_WITHDRAW = 50000;
const DAILY_LIMIT = 1000000;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Fetch dynamic fee
    const feeSetting = await SystemSetting.findOne({ key: 'withdraw_fee' });
    const WITHDRAW_FEE = feeSetting ? Number(feeSetting.value) : 5000;

    const { amount } = await req.json();
    const withdrawAmount = parseInt(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAW) {
      return NextResponse.json(
        { error: `Số tiền rút tối thiểu là ${new Intl.NumberFormat('vi-VN').format(MIN_WITHDRAW)} đ` },
        { status: 400 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!user.profile?.bank_info?.accountNumber) {
      return NextResponse.json({ error: 'Vui lòng cập nhật thông tin ngân hàng trước' }, { status: 400 });
    }

    // --- LOGIC CHẶN RÚT TIỀN TRONG THỜI GIAN BẢO LÃNH (24H) ---
    const lockHoursSetting = await SystemSetting.findOne({ key: 'WITHDRAWAL_LOCK_HOURS' });
    const lockHours = lockHoursSetting ? Number(lockHoursSetting.value) : 24; // Mặc định 24h nếu chưa cấu hình

    const lockPeriodAgo = new Date(Date.now() - lockHours * 60 * 60 * 1000);
    const recentOrders = await Order.aggregate([
      { 
        $match: { 
          boosterId: user._id, 
          status: 'COMPLETED', 
          updatedAt: { $gte: lockPeriodAgo } 
        } 
      },
      { $group: { _id: null, lockedAmount: { $sum: '$pricing.booster_earnings' } } }
    ]);
    
    const lockedAmount = recentOrders[0]?.lockedAmount || 0;
    const availableBalance = user.wallet_balance - lockedAmount;

    if (withdrawAmount > availableBalance) {
      return NextResponse.json({ 
        error: `Số dư khả dụng để rút: ${new Intl.NumberFormat('vi-VN').format(availableBalance)} đ. (Có ${new Intl.NumberFormat('vi-VN').format(lockedAmount)} đ đang trong ${lockHours}h bảo lãnh chờ khách xác nhận)` 
      }, { status: 400 });
    }
    // ---------------------------------------------------------

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const withdrawalsToday = await Withdrawal.aggregate([
      { $match: { userId: user._id, createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalToday = withdrawalsToday[0]?.total || 0;
    
    if (totalToday + withdrawAmount > DAILY_LIMIT) {
      return NextResponse.json({ error: 'Vượt quá hạn mức rút tiền trong ngày (1.000.000 đ)' }, { status: 400 });
    }

    const netAmount = withdrawAmount - WITHDRAW_FEE;

    user.wallet_balance -= withdrawAmount;
    await user.save();

    const withdrawal = await Withdrawal.create({
      userId: user._id,
      amount: withdrawAmount,
      fee: WITHDRAW_FEE,
      netAmount: netAmount,
      bankInfo: user.profile.bank_info,
      status: 'PENDING'
    });

    await Transaction.create({
      userId: user._id,
      type: 'WITHDRAWAL',
      amount: -withdrawAmount,
      balanceAfter: user.wallet_balance,
      status: 'PENDING',
      description: `Rút tiền về ngân hàng #${withdrawal._id.toString().slice(-6)}`,
      metadata: { 
        withdrawalId: withdrawal._id,
        bankInfo: user.profile.bank_info, // Lưu snapshot thông tin ngân hàng lúc rút
        fee: WITHDRAW_FEE,
        netAmount: netAmount,
        requestAmount: withdrawAmount
      }
    });

    return NextResponse.json({ success: true, withdrawal });
  } catch (error: any) {
    console.error('Withdraw error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}