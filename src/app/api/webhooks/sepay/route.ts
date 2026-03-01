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
    
    // Regex mới: Tìm NAP + Username + Code (Optional)
    // Ví dụ: NAP CHIEN123 B60357
    // Group 1: Username
    // Group 2: Transaction Code (6 ký tự cuối) - Có thể có hoặc không
    const match = content.match(/NAP\s+([A-Z0-9_\-\.]+)(?:\s+([A-Z0-9]+))?/);
    
    if (!match) {
      console.log('Webhook: Cannot parse content (Wrong syntax)', content);
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
      console.log('Webhook: User not found', username); 
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

    // Nếu khách nhập đúng cả mã Code (6 ký tự cuối ID), ta tìm chính xác giao dịch đó luôn cho an toàn tuyệt đối
    if (txCode && txCode.length >= 4) {
        // Tìm các giao dịch mà _id kết thúc bằng txCode
        // Lưu ý: MongoDB ObjectId là hex, nhưng ở đây ta so sánh chuỗi
        // Cách đơn giản nhất là lấy list pending ra và filter trong code JS
    }

    let transaction = await Transaction.findOne(query).sort({ createdAt: -1 });

    // Kiểm tra thêm mã Code nếu có (Double check)
    if (transaction && txCode) {
        const txIdString = transaction._id.toString().toUpperCase();
        if (!txIdString.endsWith(txCode)) {
            console.log('Webhook: Code mismatch', txCode, txIdString);
            // Nếu mã không khớp, có thể là giao dịch khác hoặc khách nhập bừa.
            // Ta vẫn có thể duyệt nếu số tiền khớp, hoặc bỏ qua để Admin duyệt.
            // Ở đây ta chọn cách an toàn: Nếu có Code mà Code sai -> Để Admin duyệt.
            return NextResponse.json({ success: true, message: 'Transaction code mismatch, waiting for manual review' });
        }
    }

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
    // URL này phải là URL của Socket Server trên Railway
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    
    try {
      const socketRes = await fetch(`${socketUrl}/trigger-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id.toString(),
          balance: user.wallet_balance,
          message: `Nạp thành công ${data.transferAmount.toLocaleString('vi-VN')}đ`
        })
      });
      
      if (!socketRes.ok) {
        console.error('Socket trigger failed with status:', socketRes.status);
      } else {
        console.log('Socket trigger sent successfully to:', socketUrl);
      }
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
