import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    const blogs = await Blog.find({ isPublished: true })
      .sort({ views: -1 })
      .limit(5)
      .select('title slug views thumbnail')
      .lean();

    return NextResponse.json({ success: true, blogs });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
