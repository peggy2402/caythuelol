import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; 
import dbConnect from "@/lib/db";
import Order, { OrderStatus } from "@/models/Order";
import Transaction, { TransactionType, TransactionStatus } from "@/models/Transaction";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    console.log("API /api/boosters/stats called"); // Debug log
    const session = await auth();
    if (!session || session.user.role !== 'BOOSTER') {
      console.log("Unauthorized access to stats");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const boosterId = new mongoose.Types.ObjectId(session.user.id);

    // 1. Calculate total income (Based on PAYMENT_RELEASE transactions)
    const incomeResult = await Transaction.aggregate([
      { 
        $match: { 
          userId: boosterId,
          type: TransactionType.PAYMENT_RELEASE,
          status: TransactionStatus.SUCCESS
        } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalIncome = incomeResult[0]?.total || 0;

    // 2. Count orders
    const completedOrders = await Order.countDocuments({ 
      boosterId: boosterId, 
      status: OrderStatus.COMPLETED 
    });

    const activeOrders = await Order.countDocuments({ 
      boosterId: boosterId, 
      status: { $in: [OrderStatus.APPROVED, OrderStatus.IN_PROGRESS] } 
    });

    // 3. Get active orders list
    const activeOrdersList = await Order.find({
      boosterId: boosterId,
      status: { $in: [OrderStatus.APPROVED, OrderStatus.IN_PROGRESS] }
    })
    .populate('customerId', 'username profile.avatar')
    .sort({ updatedAt: -1 })
    .limit(5);

    return NextResponse.json({
      stats: {
        totalIncome,
        completedOrders,
        activeOrders
      },
      activeOrdersList
    });

  } catch (error) {
    console.error("Booster Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
