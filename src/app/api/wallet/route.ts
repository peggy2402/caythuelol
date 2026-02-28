import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Helper để lấy User ID từ token
async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

// GET: Lấy thông tin ví và lịch sử giao dịch
export async function GET() {
  try {
    await dbConnect();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(userId).select('wallet_balance pending_balance');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const transactions = await Transaction.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({
      balance: user.wallet_balance,
      pending: user.pending_balance,
      transactions,
    });
  } catch (error) {
    console.error('Wallet GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Tạo yêu cầu nạp tiền (Deposit)
export async function POST(req: Request) {
  try {
    await dbConnect();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();

    // Validate số tiền
    if (!amount || amount < 10000) {
      return NextResponse.json({ error: 'Số tiền nạp tối thiểu là 10,000 VNĐ' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Tạo giao dịch PENDING
    // Lưu ý: balance_after ở đây tạm thời là balance hiện tại vì chưa cộng tiền thật
    const transaction = await Transaction.create({
      user_id: userId,
      type: TransactionType.DEPOSIT,
      amount,
      balance_after: user.wallet_balance, 
      status: TransactionStatus.PENDING,
      description: `Nạp tiền vào ví #${Date.now().toString().slice(-6)}`,
    });

    // Trong thực tế, ở đây bạn sẽ trả về URL thanh toán (Momo/VNPay)
    // Hoặc thông tin chuyển khoản ngân hàng (QR Code)

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Tạo yêu cầu nạp tiền thành công',
      // Trả về thông tin giả lập để hiển thị QR (Demo)
      paymentInfo: {
        bankName: 'MB Bank',
        accountNumber: '9999999999',
        accountName: 'CAYTHUELOL SYSTEM',
        content: `NAP ${user.username} ${transaction._id}`,
        amount: amount
      }
    });

  } catch (error) {
    console.error('Wallet Deposit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
