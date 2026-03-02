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
    console.log('🔥🔥🔥 [SePay RAW DATA]:', JSON.stringify(data, null, 2)); // Log to rõ ràng để debug

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
      console.log(`🟡 [SePay Webhook] Skipped. SePay ID ${data.id} already exists in DB Transaction: ${existingTransaction._id}`);
      return NextResponse.json({ success: true, message: 'Transaction already processed', id: existingTransaction._id });
    }
    // -------------------------

    // 2. Phân tích nội dung chuyển khoản (transferContent)
    // Format mong đợi: "ZT <USERNAME>" hoặc "ZT <USERNAME> <CODE>"
    // Ví dụ: "ZT CHIEN123" hoặc "ZT CHIEN123 8A2B9C"
    const content = data.transferContent; // Giữ nguyên case để log cho chuẩn
    console.log('🔍 [SePay Analysis] Content:', content);
    
    // Regex mới: Tìm ZT + Username + Code (Optional)
    // Cải tiến: Hỗ trợ cả ZTUSERNAME (dính liền) và ZT USERNAME (có cách)
    // 1. /i : Không phân biệt hoa thường (zt = ZT)
    // 2. \s* : Chấp nhận dính liền hoặc cách (ZTCHIEN = ZT CHIEN)
    // 3. ([a-zA-Z0-9_\-\.]+) : Username chấp nhận chữ, số, gạch dưới, gạch ngang, chấm
    const regex = /ZT\s*([a-zA-Z0-9_\-\.]+)(?:\s+([a-zA-Z0-9]+))?/i;
    const match = content.match(regex);
    
    if (!match) {
      console.error('🔴 [SePay Webhook] Regex Failed. Content:', content);
      console.error('🔴 [SePay Webhook] Expected format: ZT <USERNAME> [CODE]');
      // Trả về success true để SePay không gửi lại nữa, nhưng không xử lý giao dịch (để Admin duyệt tay)
      return NextResponse.json({ success: true, message: 'Syntax error, waiting for manual review' });
    }

    const username = match[1];
    const txCode = match[2]; // Mã giao dịch ngắn (nếu khách có nhập)

    console.log(`🔍 [SePay Analysis] Parsed Username: "${username}", Code: "${txCode || 'N/A'}"`);

    // 3. Tìm User
    let user = await User.findOne({ 
      username: new RegExp(`^${username}$`, 'i') 
    });

    // --- SMART RECOVERY: Nếu không tìm thấy user (do username có dấu cách bị xóa trong QR) ---
    if (!user) {
        console.log(`⚠️ [SePay Webhook] User not found by exact name "${username}". Trying smart recovery via Transaction...`);
        
        // Tìm các giao dịch PENDING có cùng số tiền
        const potentialTxs = await Transaction.find({
            amount: data.transferAmount,
            status: TransactionStatus.PENDING,
            type: TransactionType.DEPOSIT
        }).populate('userId');

        for (const tx of potentialTxs) {
            // @ts-ignore
            if (tx.userId && tx.userId.username) {
                // Normalize username trong DB: Upper + Remove Spaces để so sánh
                // @ts-ignore
                const dbUsernameClean = tx.userId.username.toUpperCase().replace(/\s/g, '');
                const webhookUsernameClean = username.toUpperCase();
                
                if (dbUsernameClean === webhookUsernameClean) {
                    // @ts-ignore
                    console.log(`✅ [SePay Webhook] Smart Recovery: Found user "${tx.userId.username}" via Transaction match.`);
                    // @ts-ignore
                    user = tx.userId;
                    break;
                }
            }
        }
    }
    // -----------------------------------------------------------------------------------------

    if (!user) {
      console.error(`🔴 [SePay Webhook] User NOT FOUND in DB. Searched for: "${username}"`); 
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
