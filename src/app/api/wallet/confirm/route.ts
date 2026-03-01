import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Transaction, { TransactionStatus } from '@/models/Transaction';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// API này chỉ dùng cho mục đích TEST/DEV để giả lập Webhook từ ngân hàng
export async function POST(req: Request) {
  try {
    await dbConnect();
    
    // Check Auth (Optional cho webhook thật, nhưng cần cho dev endpoint này)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { transactionId } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 });
    }

    // 1. Tìm giao dịch
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // 2. Tìm User
    // Fallback: Kiểm tra cả user_id (schema mới) và userId (schema cũ nếu có) để tránh lỗi
    const userId = transaction.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Transaction data invalid: missing user_id' }, { status: 500 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Cộng tiền vào ví User
    user.wallet_balance += transaction.amount;
    await user.save();

    // 4. Cập nhật trạng thái giao dịch
    transaction.status = TransactionStatus.SUCCESS;
    transaction.balanceAfter = user.wallet_balance; // Cập nhật số dư chính xác sau khi cộng
    await transaction.save();

    return NextResponse.json({
      success: true,
      newBalance: user.wallet_balance,
      message: 'Giao dịch thành công (Mock)'
    });

  } catch (error) {
    console.error('Mock Confirm Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
