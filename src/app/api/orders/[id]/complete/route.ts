import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import User from '@/models/User';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import Notification from '@/models/Notification';
import { auth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const authSession = await auth();
    if (!authSession || authSession.user.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;
    const { actualResult } = await req.json(); // { lpGained: number } or { gamesWon: number }

    await dbConnect();
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error('Order not found');

    if (order.boosterId?.toString() !== authSession.user.id) {
      throw new Error('Forbidden');
    }

    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new Error('Order is not in progress');
    }

    // Calculate Final Price
    // Note: This logic should ideally reuse the pricing engine from lib/pricing.ts
    // For simplicity, we'll do a basic calculation here assuming unit price is stored or re-fetched
    // In a real app, store unit_price in order.pricing to avoid price changes affecting old orders

    // Re-calculate based on actuals
    // We need the unit price. Let's assume we stored base_price for the *estimated* amount.
    // We can derive unit price from (base_price / estimated_units).
    // Or better, store unit_price in the order model.
    // For now, let's approximate using the stored base_price and original details.

    let finalBasePrice = 0;
    const originalBasePrice = order.pricing.base_price;
    
    if (order.serviceType === 'NET_WINS') {
        let originalUnits = 0;
        let actualUnits = 0;

        if (order.details.calc_mode === 'BY_LP') {
            originalUnits = Math.max(0, parseInt(order.details.target_lp) - parseInt(order.details.current_lp));
            actualUnits = actualResult.lpGained;
        } else {
            originalUnits = parseInt(order.details.num_games);
            actualUnits = actualResult.gamesWon; // Or just games played if net wins? Usually net wins means wins - losses.
        }

        // Avoid division by zero
        const unitPrice = originalUnits > 0 ? originalBasePrice / originalUnits : 0;
        finalBasePrice = unitPrice * actualUnits;
    } else {
        // For other services, usually fixed price unless partial completion
        finalBasePrice = originalBasePrice;
    }

    // Recalculate fees
    // Assuming option fees are fixed or proportional? Let's assume fixed for simplicity unless it's per-game options.
    // Let's keep option_fees as is for now.
    const finalTotal = finalBasePrice + order.pricing.option_fees + (finalBasePrice * 0.2); // + Platform fee (20% of base)
    
    order.pricing.final_amount = Math.round(finalTotal);
    order.pricing.booster_earnings = Math.round(finalTotal * 0.8); // Recalculate earnings (80%)
    const deposit = order.pricing.deposit_amount;
    const diff = order.pricing.final_amount - deposit;

    if (diff > 0) {
        order.pricing.settlement_status = 'CUSTOMER_OWES';
        order.status = OrderStatus.COMPLETED; // Pending final payment
    } else if (diff < 0) {
        order.pricing.settlement_status = 'REFUND_NEEDED';
        order.status = OrderStatus.COMPLETED; // Pending refund
        
        // Auto-refund logic could go here or be a separate admin/system step
        // For now, let's just mark it.
    } else {
        order.pricing.settlement_status = 'SETTLED';
        order.status = OrderStatus.COMPLETED;
        // Release payment to booster immediately if settled
        
        const booster = await User.findById(order.boosterId).session(session);
        if (booster) {
            const amount = order.pricing.booster_earnings;
            // Transfer from "System" (conceptually) to Booster Available Balance
            booster.wallet_balance += amount;
            await booster.save({ session });

            await Transaction.create([{
                userId: booster._id,
                orderId: order._id,
                type: TransactionType.PAYMENT_RELEASE,
                amount: amount,
                balanceAfter: booster.wallet_balance,
                status: TransactionStatus.SUCCESS,
                description: `Thanh toán thu nhập đơn hàng #${order._id.toString().slice(-6)}`,
                metadata: { service: order.serviceType }
            }], { session });
        }
    }

    // Save actual result to details for record
    order.details.actual_result = actualResult;

    // Create Notification for Customer
    await Notification.create([{
        userId: order.customerId,
        title: 'Đơn hàng hoàn thành',
        message: `Booster đã hoàn thành đơn hàng #${order._id.toString().slice(-6)}. Vui lòng kiểm tra và xác nhận.`,
        type: 'ORDER_UPDATE',
        link: `/orders/${order._id}`
    }], { session });

    await order.save({ session });
    await session.commitTransaction();

    return NextResponse.json({ success: true, order });

  } catch (error: any) {
    await session.abortTransaction();
    return NextResponse.json({ error: error.message || 'Failed to complete order' }, { status: 500 });
  } finally {
    session.endSession();
  }
}
