import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { sendEmail } from '@/lib/mail';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    // Security Check
    const authHeader = req.headers.get('authorization');
    const session = await auth();
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isAdmin = session?.user?.role === 'ADMIN';

    if (!isCron && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Check window: 55 mins to 65 mins from now
    let timeWindowStart = new Date(oneHourLater.getTime() - 5 * 60 * 1000);
    let timeWindowEnd = new Date(oneHourLater.getTime() + 5 * 60 * 1000);

    if (force) {
      // Force Mode: Expand window to check pending sessions in the next 24 hours
      timeWindowStart = now;
      timeWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    // Find orders with coaching sessions in the next hour
    const orders = await Order.find({
      serviceType: 'COACHING',
      status: { $in: ['APPROVED', 'IN_PROGRESS'] },
      'details.schedule': {
        $elemMatch: {
          timestamp: { $gte: timeWindowStart.getTime(), $lte: timeWindowEnd.getTime() },
          isCompleted: { $ne: true }
        }
      }
    }).populate('boosterId');

    const results = [];

    for (const order of orders) {
      const booster = order.boosterId as any;
      if (!booster || !booster.email) continue;

      const session = order.details.schedule.find((s: any) => 
        s.timestamp >= timeWindowStart.getTime() && 
        s.timestamp <= timeWindowEnd.getTime() &&
        !s.isCompleted
      );

      if (session) {
        try {
          await sendEmail(
            booster.email,
            `[Nhắc nhở] Buổi Coaching sắp bắt đầu trong 1 giờ`,
            `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2>Nhắc nhở lịch Coaching</h2>
                <p>Xin chào <strong>${booster.username}</strong>,</p>
                <p>Bạn có một buổi Coaching sắp diễn ra:</p>
                <ul>
                  <li><strong>Thời gian:</strong> ${session.start} - ${session.end} (${session.displayDate})</li>
                  <li><strong>Mã đơn:</strong> #${order._id.toString().slice(-6).toUpperCase()}</li>
                </ul>
                <p>Vui lòng chuẩn bị sẵn sàng trước giờ học.</p>
                <a href="${process.env.NEXTAUTH_URL}/orders/${order._id}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Xem đơn hàng</a>
              </div>
            `
          );
          results.push({ orderId: order._id, email: booster.email });
        } catch (error) {
          console.error(`Failed to send reminder for order ${order._id}:`, error);
        }
      }
    }

    return NextResponse.json({ success: true, count: results.length, sent_to: results });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}