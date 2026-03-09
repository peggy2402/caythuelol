// src/app/api/blogs/search/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ success: true, blogs: [] });
    }

    await dbConnect();

    const blogs = await Blog.find({
      isPublished: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } }
      ]
    })
    .select('title slug excerpt tags createdAt author')
    .populate('author', 'username')
    .limit(5)
    .lean();

    return NextResponse.json({ success: true, blogs });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
