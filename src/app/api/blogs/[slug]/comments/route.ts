import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';
import Comment from '@/models/Comment';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await dbConnect();

    const blog = await Blog.findOne({ slug });
    if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

    const comments = await Comment.find({ blogId: blog._id })
      .populate('userId', 'username profile.avatar')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;
    const { content, parentId } = await req.json();

    if (!content.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    await dbConnect();
    const blog = await Blog.findOne({ slug });
    if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

    const comment = await Comment.create({
      blogId: blog._id,
      userId: session.user.id,
      content,
      parentId: parentId || null
    });

    const populatedComment = await Comment.findById(comment._id).populate('userId', 'username profile.avatar');
    return NextResponse.json({ success: true, comment: populatedComment });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}