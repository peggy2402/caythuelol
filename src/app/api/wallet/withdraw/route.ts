import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Withdrawal from '@/models/Withdrawal';
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

    if (user.wallet_balance < withdrawAmount) {
      return NextResponse.json({ error: 'Số dư không đủ' }, { status: 400 });
    }

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