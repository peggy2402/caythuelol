import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch { return null; }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount } = await req.json();

    // Validate
    if (!amount || amount < 50000) {
      return NextResponse.json({ error: 'Số tiền rút tối thiểu là 50,000 VNĐ' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Kiểm tra số dư
    if (user.wallet_balance < amount) {
      return NextResponse.json({ error: 'Số dư không đủ để thực hiện giao dịch' }, { status: 400 });
    }

    // Kiểm tra thông tin ngân hàng
    if (!user.profile?.bank_info?.accountNumber) {
      return NextResponse.json({ error: 'Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền' }, { status: 400 });
    }

    // Trừ tiền user (Atomic)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { wallet_balance: -amount } },
      { new: true }
    );

    // Tạo giao dịch Rút tiền (PENDING)
    const transaction = await Transaction.create({
      userId,
      type: TransactionType.WITHDRAWAL,
      amount: amount, // Số tiền rút (dương, nhưng logic hiển thị sẽ là trừ)
      balanceAfter: updatedUser.wallet_balance,
      status: TransactionStatus.PENDING,
      description: `Rút tiền về ${user.profile.bank_info.bankName} - ${user.profile.bank_info.accountNumber}`,
      metadata: {
        bank_info: user.profile.bank_info
      }
    });

    return NextResponse.json({ success: true, newBalance: updatedUser.wallet_balance });
  } catch (error) {
    console.error('Withdraw Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
