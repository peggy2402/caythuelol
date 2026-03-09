import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';
import { slugify } from '@/lib/slugify';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const blogs = await Blog.find().populate('author', 'username').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, blogs });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    // Generate a unique slug
    let slug = slugify(body.title);
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      slug = `${slug}-${Date.now()}`; // Make it unique if it exists
    }

    const newBlog = await Blog.create({
      ...body,
      slug,
      author: session.user.id
    });

    return NextResponse.json({ success: true, blog: newBlog });
  } catch (error) {
    console.error("Create Blog Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
