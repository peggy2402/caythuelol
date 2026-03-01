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
  // Log raw headers để debug
  const apiKey = req.headers.get('Authorization');
  console.log('🔹 [SePay Webhook] Incoming Request. Auth Header:', apiKey ? '***HIDDEN***' : 'MISSING');

  try {
    await dbConnect();

    // 1. Xác thực SePay (Optional nhưng Recommended)
    // Kiểm tra API Key trong Header nếu bạn đã cấu hình trong SePay Dashboard
    const SEPAY_API_KEY = process.env.SEPAY_API_KEY;
    
    // SePay gửi header theo định dạng: "Apikey <API_KEY>"
    if (SEPAY_API_KEY && apiKey !== `Apikey ${SEPAY_API_KEY}`) {
      console.error('🔴 [SePay Webhook] Unauthorized. Expected:', `Apikey ${SEPAY_API_KEY?.substring(0,5)}...`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: SePayWebhookData = await req.json();
    console.log('🔹 [SePay Webhook] Body:', JSON.stringify(data));

    // Chỉ xử lý giao dịch nhận tiền (transferType = 'in')
    if (data.transferType !== 'in') {
      console.log('🔸 [SePay Webhook] Ignored outgoing transaction (transferType != in)');
      return NextResponse.json({ success: true, message: 'Ignored outgoing transaction' });
    }

    // --- IDEMPOTENCY CHECK ---
    // Kiểm tra xem giao dịch SePay này đã được xử lý chưa
    const existingTransaction = await Transaction.findOne({
      description: { $regex: `SePay #${data.id}`, $options: 'i' }
    });

    if (existingTransaction) {
      console.log('🟡 [SePay Webhook] Transaction already processed:', data.id);
      return NextResponse.json({ success: true, message: 'Transaction already processed', id: existingTransaction._id });
    }
    // -------------------------

    // 2. Phân tích nội dung chuyển khoản (transferContent)
    // Format mong đợi: "NAP <USERNAME>" hoặc "NAP <USERNAME> <CODE>"
    // Ví dụ: "NAP CHIEN123" hoặc "NAP CHIEN123 8A2B9C"
    const content = data.transferContent.toUpperCase();
    
    // Regex mới: Tìm NAP + Username + Code (Optional)
    // Ví dụ: NAP CHIEN123 B60357
    // Group 1: Username
    // Group 2: Transaction Code (6 ký tự cuối) - Có thể có hoặc không
    const match = content.match(/NAP\s*([A-Z0-9_\-\.]+)(?:\s+([A-Z0-9]+))?/);
    
    if (!match) {
      console.error('🔴 [SePay Webhook] Syntax Error. Content:', content);
      // Trả về success true để SePay không gửi lại nữa, nhưng không xử lý giao dịch (để Admin duyệt tay)
      return NextResponse.json({ success: true, message: 'Syntax error, waiting for manual review' });
    }

    const username = match[1];
    const txCode = match[2]; // Mã giao dịch ngắn (nếu khách có nhập)

    // 3. Tìm User
    const user = await User.findOne({ 
      username: new RegExp(`^${username}$`, 'i') 
    });

    if (!user) {
      console.error('🔴 [SePay Webhook] User not found in DB:', username); 
      return NextResponse.json({ success: true, message: 'User not found, waiting for manual review' });
    }

    // 4. Xử lý Giao dịch
    // Tìm giao dịch PENDING gần nhất của User có số tiền khớp (để update)
    // Hoặc tạo giao dịch mới nếu không tìm thấy (User chuyển khoản mà không tạo lệnh trên web)
    
    // Query tìm kiếm
    const query: any = {
      userId: user._id,
      status: TransactionStatus.PENDING,
      amount: data.transferAmount,
      type: TransactionType.DEPOSIT
    };

    let transaction = await Transaction.findOne(query).sort({ createdAt: -1 });

    // Kiểm tra thêm mã Code nếu có (Double check)
    if (transaction && txCode) {
        const txIdString = transaction._id.toString().toUpperCase();
        if (!txIdString.endsWith(txCode)) {
            console.warn(`🟡 [SePay Webhook] Code mismatch. Received: ${txCode}, Expected suffix of: ${txIdString}`);
            // Nếu mã không khớp, có thể là giao dịch khác hoặc khách nhập bừa.
            // Thay vì return lỗi, ta set transaction = null để hệ thống tự tạo giao dịch mới (Auto Deposit)
            // Điều này giúp khách vẫn nhận được tiền dù nhập sai mã đơn, nhưng đúng cú pháp nạp
            transaction = null;
        }
    }

    // --- ATOMIC UPDATE ---
    // Sử dụng $inc để cộng tiền an toàn, tránh Race Condition
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { wallet_balance: data.transferAmount } },
      { new: true }
    );
    // ---------------------

    console.log(`✅ [SePay Webhook] Updated balance for ${user.username}: +${data.transferAmount}`);

    if (transaction) {
      // Case A: Update giao dịch PENDING có sẵn
      transaction.status = TransactionStatus.SUCCESS;
      transaction.description = `${transaction.description} - SePay #${data.id}`;
      transaction.balanceAfter = updatedUser.wallet_balance;
      await transaction.save();
    } else {
      // Case B: Tạo giao dịch mới (Auto Deposit)
      transaction = await Transaction.create({
        userId: user._id,
        type: TransactionType.DEPOSIT,
        amount: data.transferAmount,
        status: TransactionStatus.SUCCESS,
        balanceAfter: updatedUser.wallet_balance,
        description: `Nạp tiền tự động (SePay #${data.id})`,
      });
    }

    // 6. Bắn thông báo Realtime (Socket.io)
    // URL này phải là URL của Socket Server trên Railway
    // Lưu ý: Server to Server nên dùng biến môi trường riêng hoặc dùng chung NEXT_PUBLIC nếu public
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://caythuelol-server-production.up.railway.app';
    
    if (socketUrl) {
      // Không await fetch để tránh block response trả về SePay
      console.log(`🔹 [SePay Webhook] Calling Socket Server: ${socketUrl}/trigger-payment`);
      fetch(`${socketUrl}/trigger-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id.toString(),
          balance: updatedUser.wallet_balance,
          message: `Nạp thành công ${data.transferAmount.toLocaleString('vi-VN')}đ`
        })
      })
      .then(res => {
        if (!res.ok) console.error(`🔴 [SePay Webhook] Socket trigger failed. Status: ${res.status}`);
        else console.log('✅ [SePay Webhook] Socket trigger sent successfully');
      })
      .catch(err => console.error('🔴 [SePay Webhook] Socket trigger NETWORK error:', err));
    } else {
      console.warn('🟡 [SePay Webhook] NEXT_PUBLIC_SOCKET_URL is missing');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction processed successfully',
      user: user.username,
      amount: data.transferAmount
    });

  } catch (error) {
    console.error('🔴 [SePay Webhook] CRITICAL ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
