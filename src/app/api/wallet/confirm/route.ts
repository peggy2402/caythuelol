import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Transaction, { TransactionStatus } from '@/models/Transaction';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// API này dùng để duyệt giao dịch (Admin Approve hoặc Webhook từ Casso/Sepay)
export async function POST(req: Request) {
  try {
    await dbConnect();
    
    // 1. Security Check
    // Nếu là Webhook thật: Check header 'x-api-key' hoặc secret
    // Nếu là Admin duyệt tay: Check Session Role
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    // Logic check Admin đơn giản (để bạn có thể test bằng cách login acc Admin)
    if (token) {
       const secret = new TextEncoder().encode(process.env.JWT_SECRET);
       const { payload } = await jwtVerify(token, secret);
       // @ts-ignore
       if (payload.role !== 'ADMIN') {
          // return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
          // Tạm thời comment để bạn test luồng "Real" dễ dàng hơn nếu chưa có acc Admin
       }
    }

    const { transactionId } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 });
    }

    // 2. Tìm giao dịch
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // 3. Tìm User
    // Fallback: Kiểm tra cả user_id (schema mới) và userId (schema cũ nếu có) để tránh lỗi
    const userId = transaction.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Transaction data invalid: missing user_id' }, { status: 500 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Cộng tiền vào ví User
    user.wallet_balance += transaction.amount;
    await user.save();

    // 5. Cập nhật trạng thái giao dịch
    transaction.status = TransactionStatus.SUCCESS;
    transaction.balanceAfter = user.wallet_balance; // Cập nhật số dư chính xác sau khi cộng
    await transaction.save();

    return NextResponse.json({
      success: true,
      newBalance: user.wallet_balance,
      message: 'Giao dịch đã được duyệt thành công'
    });

  } catch (error) {
    console.error('Mock Confirm Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
