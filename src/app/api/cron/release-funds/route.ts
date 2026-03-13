// src/app/api/cron/release-funds/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order'; // Assuming Order tracks the completion date
import Transaction from '@/models/Transaction';

// Security: Check for a secret key in headers
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  // Logic: Find orders completed > 7 days ago where funds are still "HELD"
  // Note: This depends on how you track "Held" funds. 
  // A simpler approach for this demo: 
  // We assume `Transaction` has a `releaseAt` field for earnings, or we query Orders.
  
  // Let's assume we look at Users with pending_balance > 0
  // In a real system, you'd query specific transactions. 
  // Here is a simplified implementation based on "Orders completed 7 days ago".
  
  const HOLDING_PERIOD_DAYS = 7;
  const releaseDate = new Date();
  releaseDate.setDate(releaseDate.getDate() - HOLDING_PERIOD_DAYS);

  // Find orders completed before releaseDate that haven't been paid out
  // This requires an 'isFundsReleased' flag on Order or similar logic.
  // For this demo, I will show the logic structure:

  /*
  const ordersToRelease = await Order.find({
    status: 'COMPLETED',
    updatedAt: { : releaseDate },
    paymentStatus: 'HELD' // Custom field
  });

  let releasedCount = 0;

  for (const order of ordersToRelease) {
    const booster = await User.findById(order.booster_id);
    if (booster) {
       const amount = order.pricing.booster_earnings;
       
       // Move funds
       booster.pending_balance -= amount;
       booster.wallet_balance += amount;
       await booster.save();

       // Log Transaction
       await Transaction.create({
         userId: booster._id,
         type: 'PAYMENT_RELEASE',
         amount: amount,
         balanceAfter: booster.wallet_balance,
         status: 'SUCCESS',
         description: `Giải ngân đơn hàng #${order._id}`
       });

       order.paymentStatus = 'RELEASED';
       await order.save();
       releasedCount++;
    }
  }
  */

  return NextResponse.json({ message: 'Cron job executed', releasedCount: 0 });
}
