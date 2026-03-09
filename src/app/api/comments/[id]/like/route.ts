import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Comment from '@/models/Comment';
import mongoose from 'mongoose';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: commentId } = await params;
    const userId = new mongoose.Types.ObjectId(session.user.id);

    await dbConnect();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const hasLiked = comment.likes.some((likeId: mongoose.Types.ObjectId) => likeId.equals(userId));

    if (hasLiked) {
      (comment.likes as any).pull(userId);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();
    return NextResponse.json({ success: true, likes: comment.likes });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}