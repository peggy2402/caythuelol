import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import { calculatePrice } from '@/lib/pricing';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId;
    const role = payload.role;

    // Mặc định lấy đơn của Customer
    let query: any = { customer_id: userId };

    // Nếu là Booster thì lấy đơn Booster nhận (Logic mở rộng sau này)
    if (role === 'BOOSTER') {
      query = { booster_id: userId };
    }

    const orders = await Order.find(query)
      .populate('booster_id', 'username profile.avatar') // Lấy thông tin Booster nếu có
      .sort({ created_at: -1 });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get Orders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = await req.json();
    const { serviceType, currentRank, desiredRank, options, details, customer_id } = body;

    // 1. Validate & Calculate Price Server-side
    const pricingResult = calculatePrice({
      serviceType,
      currentRank,
      desiredRank,
      options,
      gamesCount: body.gamesCount
    });

    // 2. Get User & Check Balance
    // Note: In production, get customer_id from Auth Session (req.session.user.id)
    const user = await User.findById(customer_id).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.wallet_balance < pricingResult.totalPrice) {
      throw new Error(`Insufficient balance. Required: ${pricingResult.totalPrice}, Available: ${user.wallet_balance}`);
    }

    // 3. Create Order
    const newOrder = new Order({
      customer_id: customer_id,
      service_type: serviceType,
      status: OrderStatus.PAID, // Money is held, so status is PAID
      details: {
        ...details,
        server: details.server || 'VN',
      },
      options,
      pricing: {
        base_price: pricingResult.basePrice,
        option_fees: pricingResult.optionFees,
        total_amount: pricingResult.totalPrice,
        platform_fee: pricingResult.totalPrice * 0.2, // 20% Platform Fee
        booster_earnings: pricingResult.totalPrice * 0.8, // 80% to Booster
      },
    });
    await newOrder.save({ session });

    // 4. Deduct Balance & Create Transaction Log
    user.wallet_balance -= pricingResult.totalPrice;
    await user.save({ session });

    const transaction = new Transaction({
      user_id: customer_id,
      order_id: newOrder._id,
      type: TransactionType.PAYMENT_HOLD,
      amount: -pricingResult.totalPrice,
      balance_after: user.wallet_balance,
      status: TransactionStatus.SUCCESS,
      description: `Payment Hold for Order #${newOrder._id}`,
    });
    await transaction.save({ session });

    await session.commitTransaction();
    return NextResponse.json({ success: true, order: newOrder });

  } catch (error: any) {
    await session.abortTransaction();
    return NextResponse.json({ error: error.message }, { status: 400 });
  } finally {
    session.endSession();
  }
}