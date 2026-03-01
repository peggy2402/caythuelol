// src/app/api/webhooks/sepay/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Transaction, { TransactionStatus, TransactionType } from '@/models/Transaction';

// SePay Webhook Data Structure
interface SePayWebhookData {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  transferType: 'in' | 'out';
  transferAmount: number;
  transferContent: string;
  referenceCode: string;
  description: string;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Xác thực SePay (Optional nhưng Recommended)
    // Kiểm tra API Key trong Header nếu bạn đã cấu hình trong SePay Dashboard
    const apiKey = req.headers.get('Authorization');
    const SEPAY_API_KEY = process.env.SEPAY_API_KEY;
    if (SEPAY_API_KEY && apiKey !== `Bearer ${SEPAY_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: SePayWebhookData = await req.json();

    // Chỉ xử lý giao dịch nhận tiền (transferType = 'in')
    if (data.transferType !== 'in') {
      return NextResponse.json({ success: true, message: 'Ignored outgoing transaction' });
    }

    // 2. Phân tích nội dung chuyển khoản (transferContent)
    // Format mong đợi: "NAP <USERNAME>" hoặc "NAP <USERNAME> <CODE>"
    // Ví dụ: "NAP CHIEN123" hoặc "NAP CHIEN123 8A2B9C"
    const content = data.transferContent.toUpperCase();
    
    // Regex để tìm Username sau chữ NAP
    // Tìm từ bắt đầu bằng NAP, có thể có hoặc không có khoảng trắng (\s*), sau đó là Username (A-Z, 0-9, _, -, .)
    const match = content.match(/NAP\s*([A-Z0-9_\-\.]+)/);
    
    if (!match) {
      console.log('Webhook: Cannot parse username from content', content);
      return NextResponse.json({ success: true, message: 'Cannot parse content' });
    }

    const username = match[1];

    // 3. Tìm User
    const user = await User.findOne({ 
      username: new RegExp(`^${username}$`, 'i') 
    });

    if (!user) {
      console.log('Webhook: User not found', username);
      return NextResponse.json({ success: true, message: 'User not found' });
    }

    // 4. Xử lý Giao dịch
    // Tìm giao dịch PENDING gần nhất của User có số tiền khớp (để update)
    // Hoặc tạo giao dịch mới nếu không tìm thấy (User chuyển khoản mà không tạo lệnh trên web)
    let transaction = await Transaction.findOne({
      userId: user._id,
      status: TransactionStatus.PENDING,
      amount: data.transferAmount,
      type: TransactionType.DEPOSIT
    }).sort({ createdAt: -1 });

    if (transaction) {
      // Case A: Update giao dịch PENDING có sẵn
      transaction.status = TransactionStatus.SUCCESS;
      transaction.description = `${transaction.description} - SePay #${data.id}`;
    } else {
      // Case B: Tạo giao dịch mới (Auto Deposit)
      transaction = new Transaction({
        userId: user._id,
        type: TransactionType.DEPOSIT,
        amount: data.transferAmount,
        status: TransactionStatus.SUCCESS,
        description: `Nạp tiền tự động (SePay #${data.id})`,
      });
    }

    // 5. Cộng tiền
    user.wallet_balance += data.transferAmount;
    transaction.balanceAfter = user.wallet_balance;

    await user.save();
    await transaction.save();

    // 6. Bắn thông báo Realtime (Socket.io)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/trigger-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id.toString(),
          balance: user.wallet_balance,
          message: `Nạp thành công ${data.transferAmount.toLocaleString('vi-VN')}đ`
        })
      });
    } catch (err) {
      console.error('Socket trigger failed', err);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction processed successfully',
      user: user.username,
      amount: data.transferAmount
    });

  } catch (error) {
    console.error('SePay Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
