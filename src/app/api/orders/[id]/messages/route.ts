import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    // Verify access to order
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    
    const isParticipant = 
        order.customerId.toString() === session.user.id || 
        order.boosterId?.toString() === session.user.id ||
        session.user.role === 'ADMIN';

    if (!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const messages = await Message.find({ order_id: id })
      .sort({ created_at: 1 })
      .populate('sender_id', 'username profile.avatar role');

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { content, type = 'TEXT', metadata } = await req.json();

    await dbConnect();
    
    const newMessage = await Message.create({
      order_id: id,
      sender_id: session.user.id,
      content,
      type,
      metadata,
      readBy: [session.user.id]
    });

    await newMessage.populate('sender_id', 'username profile.avatar role');

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
