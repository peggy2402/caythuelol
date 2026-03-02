// // src/app/api/webhooks/sepay/route.ts

// import { NextResponse } from 'next/server';
// import dbConnect from '@/lib/db';
// import User from '@/models/User';
// import Transaction, { TransactionStatus, TransactionType } from '@/models/Transaction';

// // SePay Webhook Data Structure
// interface SePayWebhookData {
//   id: number;
//   gateway: string;
//   transactionDate: string;
//   accountNumber: string;
//   subAccount: string | null;
//   transferType: 'in' | 'out';
//   transferAmount: number;
//   transferContent?: string;
//   content?: string;
//   referenceCode: string;
//   description: string;
// }

// export async function POST(req: Request) {
//   const apiKey = req.headers.get('Authorization');

//   try {
//     await dbConnect();

//     // 1. Xác thực SePay
//     const SEPAY_API_KEY = process.env.SEPAY_API_KEY;
//     if (SEPAY_API_KEY && apiKey !== `Apikey ${SEPAY_API_KEY}`) {
//       console.error('🔴 [SePay Webhook] Unauthorized');
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const data: SePayWebhookData = await req.json();
//     console.log('🔥🔥🔥 [SePay RAW DATA]:', JSON.stringify(data, null, 2));

//     if (data.transferType !== 'in') {
//       return NextResponse.json({ success: true, message: 'Ignored outgoing transaction' });
//     }

//     // --- IDEMPOTENCY CHECK ---
//     const existingTransaction = await Transaction.findOne({
//       description: { $regex: `SePay #${data.id}`, $options: 'i' }
//     });

//     if (existingTransaction) {
//       console.log(`🟡 [SePay Webhook] Skipped. SePay ID ${data.id} already processed.`);
//       return NextResponse.json({ success: true, message: 'Transaction already processed', id: existingTransaction._id });
//     }

//     // 2. Phân tích nội dung
//     const content = data.content || data.transferContent || ""; 
//     console.log('🔍 [SePay Analysis] Content:', content);
    
//     // Regex: Tìm ZT + Username + Code (Optional)
//     // Cập nhật: Cho phép khoảng trắng trong username ([\s]) và dùng non-greedy (+?) để không ăn vào phần Code
//     const regex = /ZT\s*([a-zA-Z0-9_\-\.\s]+?)(?:\s+([a-zA-Z0-9]+))?$/i;
//     const match = content.match(regex);
    
//     if (!match) {
//       console.error('🔴 [SePay Webhook] Regex Failed. Content:', content);
//       return NextResponse.json({ success: true, message: 'Syntax error, waiting for manual review' });
//     }

//     const username = match[1].trim(); // Xóa khoảng trắng thừa đầu cuối nếu có
//     let txCode: string | undefined = match[2]; // Mã giao dịch ngắn (nếu có)

//     // --- FIX QUAN TRỌNG: Lọc bỏ mã rác (Trace, số lạ) ---
//     // Chỉ chấp nhận code nếu nó là Hex (0-9, A-F) và không phải chữ "Trace"
//     if (txCode && (txCode.toUpperCase().includes('TRACE') || !/^[0-9A-Fa-f]+$/.test(txCode))) {
//         console.log(`⚠️ [SePay Webhook] Ignoring invalid code suffix: "${txCode}"`);
//         txCode = undefined;
//     }

//     console.log(`🔍 [SePay Analysis] Parsed Username: "${username}", Code: "${txCode || 'N/A'}"`);

//     // 3. Tìm User
//     let user = await User.findOne({ 
//       username: new RegExp(`^${username}$`, 'i') 
//     });

//     // Smart Recovery (Tìm qua Transaction nếu không thấy User)
//     if (!user) {
//         console.log(`⚠️ [SePay Webhook] User not found by name "${username}". Trying smart recovery...`);
//         const potentialTxs = await Transaction.find({
//             amount: data.transferAmount,
//             status: TransactionStatus.PENDING,
//             type: TransactionType.DEPOSIT
//         }).populate('userId');

//         for (const tx of potentialTxs) {
//             // @ts-ignore
//             if (tx.userId && tx.userId.username) {
//                 // @ts-ignore
//                 const dbUsernameClean = tx.userId.username.toUpperCase().replace(/\s/g, '');
//                 const webhookUsernameClean = username.toUpperCase().replace(/\s/g, ''); // Clean cả username từ webhook
//                 if (dbUsernameClean === webhookUsernameClean) {
//                     // @ts-ignore
//                     user = tx.userId;
//                     break;
//                 }
//             }
//         }
//     }

//     if (!user) {
//       console.error(`🔴 [SePay Webhook] User NOT FOUND.`); 
//       return NextResponse.json({ success: true, message: 'User not found' });
//     }

//     // 4. Tìm Transaction PENDING để khớp lệnh
//     const query: any = {
//       userId: user._id,
//       status: TransactionStatus.PENDING,
//       amount: data.transferAmount,
//       type: TransactionType.DEPOSIT
//     };

//     let transaction = await Transaction.findOne(query).sort({ createdAt: -1 });

//     // Kiểm tra mã Code (nếu có mã Hex hợp lệ)
//     if (transaction && txCode) {
//         const txIdString = transaction._id.toString().toUpperCase();
//         // Chỉ so sánh nếu txCode đủ dài (ít nhất 4 ký tự) để tránh trùng ngẫu nhiên
//         if (txCode.length >= 4 && !txIdString.endsWith(txCode.toUpperCase())) {
//             console.warn(`🟡 [SePay Webhook] Code mismatch. Received: ${txCode}, Expected suffix of: ${txIdString}`);
//             transaction = null; // Không khớp -> Tạo đơn mới
//         }
//     }

//     // 5. Update DB (Atomic)
//     const updatedUser = await User.findByIdAndUpdate(
//       user._id,
//       { $inc: { wallet_balance: data.transferAmount } },
//       { new: true }
//     );

//     if (!updatedUser) throw new Error('Failed to update user balance');

//     if (transaction) {
//       // Case A: Khớp đơn PENDING -> Update thành SUCCESS
//       console.log(`✅ [SePay Webhook] Matched PENDING transaction: ${transaction._id}`);
//       transaction.status = TransactionStatus.SUCCESS;
//       transaction.description = `${transaction.description} - SePay #${data.id}`;
//       transaction.balanceAfter = updatedUser.wallet_balance;
//       transaction.metadata = data;
//       await transaction.save();
//     } else {
//       // Case B: Không khớp -> Tạo đơn mới (Auto Deposit)
//       console.log(`✅ [SePay Webhook] Creating NEW transaction (Auto Deposit)`);
//       transaction = await Transaction.create({
//         userId: user._id,
//         type: TransactionType.DEPOSIT,
//         amount: data.transferAmount,
//         status: TransactionStatus.SUCCESS,
//         balanceAfter: updatedUser.wallet_balance,
//         metadata: data,
//         description: `Nạp tiền tự động (SePay #${data.id})`,
//       });
//     }

//     // 6. Socket Realtime
//     const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://caythuelol-server-production.up.railway.app';
//     fetch(`${socketUrl}/trigger-payment`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           userId: user._id.toString(),
//           balance: updatedUser.wallet_balance,
//           message: `Nạp thành công ${data.transferAmount.toLocaleString('vi-VN')}đ`
//         })
//     }).catch(err => console.error('Socket trigger failed', err));

//     return NextResponse.json({ 
//       success: true, 
//       message: 'Transaction processed successfully',
//       user: user.username,
//       amount: data.transferAmount
//     });

//   } catch (error) {
//     console.error('🔴 [SePay Webhook] Error:', error);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }
