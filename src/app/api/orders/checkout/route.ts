import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) throw new Error('Unauthorized');

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    // 2. Parse Body
    const body = await req.json();
    const { 
      serviceType, 
      boosterId, 
      details, 
      options, 
      pricing, // { total, deposit, base, fee... } calculated from frontend
      queueType 
    } = body;

    // 3. Validate Balance
    const customer = await User.findById(userId).session(session);
    if (!customer) throw new Error('User not found');

    const depositAmount = pricing.deposit_amount;

    if (customer.wallet_balance < depositAmount) {
      throw new Error(`Số dư không đủ. Cần cọc: ${depositAmount.toLocaleString()}đ`);
    }

    // 4. Create Order (PENDING_APPROVE)
    // Note: Status is PENDING_APPROVE because Booster needs to accept it.
    // Money is held by Admin (System) first.
    const newOrder = new Order({
      customerId: userId,
      boosterId: boosterId,
      serviceType,
      status: OrderStatus.PENDING_PAYMENT, // Will update to PAID/PENDING_APPROVE after transaction
      details: {
        ...details,
        server: details.server || 'VN',
      },
      options,
      pricing: {
        base_price: pricing.base_price,
        option_fees: pricing.option_fees,
        total_amount: pricing.total_amount,
        deposit_amount: depositAmount,
        platform_fee: pricing.platform_fee,
        booster_earnings: pricing.booster_earnings,
      },
      payment: {
        is_locked: true,
        deposit_paid: true,
        final_paid: false
      },
      match_history: []
    });

    await newOrder.save({ session });

    // 5. Deduct Customer Balance
    customer.wallet_balance -= depositAmount;
    await customer.save({ session });

    // 6. Create Transaction Log (Payment Hold)
    await Transaction.create([{
      userId: userId,
      orderId: newOrder._id,
      type: TransactionType.PAYMENT_HOLD,
      amount: -depositAmount,
      balanceAfter: customer.wallet_balance,
      status: TransactionStatus.SUCCESS,
      description: `Thanh toán cọc đơn hàng #${newOrder._id.toString().slice(-6)}`,
      metadata: { service: serviceType }
    }], { session });

    // 7. Update Order Status
    // If Booster is selected, status -> PENDING_APPROVE (Wait for booster)
    // If no Booster (Job Market), status -> PENDING_APPROVE (Wait for any booster)
    newOrder.status = OrderStatus.APPROVED; // Or PENDING_APPROVE based on your flow. Let's assume APPROVED means "Paid & Waiting for Booster Action"
    // Actually, usually:
    // PAID -> System holds money.
    // Booster clicks "Accept" -> IN_PROGRESS.
    // Let's set it to PAID for now, or PENDING_APPROVE if specific booster.
    newOrder.status = OrderStatus.PENDING_PAYMENT; // Re-using enum, but logically it's "PAID_DEPOSIT"
    // Let's use a standard status from your enum.
    // If money is taken, it is PAID.
    newOrder.status = OrderStatus.PAID; 
    
    await newOrder.save({ session });

    await session.commitTransaction();
    
    return NextResponse.json({ success: true, orderId: newOrder._id });

  } catch (error: any) {
    await session.abortTransaction();
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 400 });
  } finally {
    session.endSession();
  }
}