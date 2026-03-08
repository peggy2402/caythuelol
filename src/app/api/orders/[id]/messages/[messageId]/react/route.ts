import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import mongoose from 'mongoose';
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageId } = await params;
    const { emoji } = await req.json();

    await dbConnect();

    const message = await Message.findById(messageId);
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    const existingReactionIndex = message.reactions?.findIndex(
      (r: any) => r.userId.toString() === session.user.id && r.emoji === emoji
    );

    if (existingReactionIndex !== undefined && existingReactionIndex > -1) {
      message.reactions?.splice(existingReactionIndex, 1);
    } else {
      if (!message.reactions) message.reactions = [];
      message.reactions.push({ emoji, userId: new mongoose.Types.ObjectId(session.user.id) });
    }

    await message.save();

    return NextResponse.json({ success: true, reactions: message.reactions });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
