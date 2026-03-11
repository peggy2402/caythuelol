import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await dbConnect();

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Authorization check: Only booster of the order or admin can update
    if (session.user.role !== 'ADMIN' && order.boosterId?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Whitelist fields that can be updated to prevent unwanted changes
    const allowedUpdates = ['ingame_name', 'current_rank', 'current_lp', 'vod_link', 'current_level_progress'];
    const updates: Record<string, any> = {};

    for (const key in body) {
      if (allowedUpdates.includes(key)) {
        updates[`details.${key}`] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, { $set: updates }, { new: true });

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Failed to update order or order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, details: updatedOrder.details });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}