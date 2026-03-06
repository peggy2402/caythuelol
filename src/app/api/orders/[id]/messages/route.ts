import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Order from '@/models/Order';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import mongoose from 'mongoose';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// GET: Lấy danh sách tin nhắn của đơn hàng
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: orderId } = await params;

    // 1. Kiểm tra quyền truy cập đơn hàng
    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const userId = user.userId as string;
    const orderObj = order as any; // Ép kiểu để tránh lỗi TS do lệch tên trường (customerId vs customer_id)
    const isCustomer = orderObj.customerId.toString() === userId;
    const isBooster = orderObj.boosterId?.toString() === userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isCustomer && !isBooster && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Lấy tin nhắn (populate thông tin người gửi)
    const messages = await Message.find({ order_id: orderId })
      .sort({ created_at: 1 })
      .populate('sender_id', 'username profile.avatar role')
      .populate({ path: 'replyTo', select: 'content sender_id', strictPopulate: false }); // Populate reply info

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get Messages Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Gửi tin nhắn mới
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: orderId } = await params;
    const { content, type, metadata, replyToId } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // 1. Kiểm tra quyền
    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const userId = user.userId as string;
    const orderObj = order as any; // Ép kiểu để tránh lỗi TS
    const isCustomer = orderObj.customerId.toString() === userId;
    const isBooster = orderObj.boosterId?.toString() === userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isCustomer && !isBooster && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // --- SLASH COMMAND HANDLER ---
    let finalContent = content;
    let finalType = type || 'TEXT';
    let finalMetadata = metadata || {};

    if (content.startsWith('/')) {
        const parts = content.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (cmd === '/tip') {
            // Format: /tip @username amount OR /tip amount (defaults to other party)
            // Simplified: /tip amount
            const amount = parseInt(args[0]?.replace(/,/g, ''));
            if (isNaN(amount) || amount < 10000) {
                return NextResponse.json({ error: 'Số tiền không hợp lệ (tối thiểu 10,000)' }, { status: 400 });
            }

            // Transaction Logic
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                const sender = await User.findById(userId).session(session);
                if (sender.wallet_balance < amount) throw new Error('Số dư không đủ');

                // Determine receiver (The other party in the order)
                const receiverId = isCustomer ? orderObj.boosterId : orderObj.customerId;
                if (!receiverId) throw new Error('Không tìm thấy người nhận');
                const receiver = await User.findById(receiverId).session(session);

                // Deduct from Sender
                sender.wallet_balance -= amount;
                await sender.save({ session });

                // Add to Receiver (Directly or Pending? Let's do direct for tips)
                receiver.wallet_balance += amount;
                await receiver.save({ session });

                // Create Transactions
                await Transaction.create([{
                    userId: userId,
                    orderId: orderId,
                    type: TransactionType.PAYMENT_HOLD, // Using HOLD/RELEASE logic or generic transfer
                    amount: -amount,
                    balanceAfter: sender.wallet_balance,
                    status: TransactionStatus.SUCCESS,
                    description: `Tip cho đơn hàng #${orderId.slice(-6)}`,
                }], { session });

                await Transaction.create([{
                    userId: receiverId,
                    orderId: orderId,
                    type: TransactionType.PAYMENT_RELEASE,
                    amount: amount,
                    balanceAfter: receiver.wallet_balance,
                    status: TransactionStatus.SUCCESS,
                    description: `Nhận tiền Tip đơn hàng #${orderId.slice(-6)}`,
                }], { session });

                await session.commitTransaction();
                
                finalType = 'COMMAND_RESULT';
                finalContent = `💸 Đã gửi Tip: ${amount.toLocaleString()} đ`;
                finalMetadata = { amount, currency: 'VND' };
            } catch (e: any) {
                await session.abortTransaction();
                return NextResponse.json({ error: e.message || 'Lỗi xử lý Tip' }, { status: 400 });
            } finally {
                session.endSession();
            }
        } else if (cmd === '/img') {
            if (args.length === 0) return NextResponse.json({ error: 'Thiếu link ảnh' }, { status: 400 });
            finalContent = args[0];
            finalType = 'IMAGE';
        } else if (cmd === '/order') {
            finalType = 'COMMAND_RESULT';
            finalContent = `📦 Đơn hàng #${orderId.slice(-6)}\nRank: ${orderObj.details.current_rank} -> ${orderObj.details.desired_rank}\nServer: ${orderObj.details.server}`;
        } else if (cmd === '/infobooster') {
             if (!orderObj.boosterId) return NextResponse.json({ error: 'Chưa có Booster' }, { status: 400 });
             const booster = await User.findById(orderObj.boosterId).select('username booster_info');
             finalType = 'COMMAND_RESULT';
             finalContent = `👤 Booster: ${booster.username}\nRating: ${booster.booster_info?.rating || 'N/A'} ⭐\nĐã hoàn thành: ${booster.booster_info?.completed_orders || 0} đơn`;
        } else if (cmd === '/live' && isBooster) {
             // Mock data for now
             finalType = 'COMMAND_RESULT';
             finalContent = `🔴 Đang chơi: Lee Sin (12:30)\nKDA: 5/1/2`;
        } else if (cmd === '/matchlol' && isBooster) {
             finalType = 'COMMAND_RESULT';
             finalContent = `🏆 Kết quả trận đấu:\nVictory (+22 LP)\nTướng: Yasuo\nKDA: 10/2/5`;
        }
    }

    // 2. Tạo tin nhắn
    const newMessage = await Message.create({
      order_id: orderId,
      sender_id: userId,
      content: finalContent,
      is_system_message: false,
      type: finalType,
      metadata: finalMetadata,
      replyTo: replyToId || undefined
    });

    // Populate để trả về ngay cho frontend hiển thị
    await newMessage.populate('sender_id', 'username profile.avatar role')
    await newMessage.populate({ path: 'replyTo', select: 'content sender_id', strictPopulate: false });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Send Message Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Xóa tin nhắn (chỉ người gửi mới được xóa)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageId } = await params;
    await dbConnect();
    
    const message = await Message.findOne({ _id: messageId, sender_id: session.userId });
    if (!message) return NextResponse.json({ error: 'Message not found or forbidden' }, { status: 404 });

    await Message.deleteOne({ _id: messageId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}