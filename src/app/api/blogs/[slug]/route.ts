import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    await dbConnect();
    
    const blog = await Blog.findOne({ slug, isPublished: true })
      .populate('author', 'username profile.avatar');

    if (!blog) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Tăng lượt xem (không cần chờ)
    Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } }).catch(console.error);
      
    // New: Fetch related posts
    let relatedPosts = [];
    if (blog.tags && blog.tags.length > 0) {
        relatedPosts = await Blog.find({
            tags: { $in: blog.tags }, // Find posts with at least one common tag
            _id: { $ne: blog._id },    // Exclude the current post
            isPublished: true
        })
        .sort({ createdAt: -1 })
        .limit(3) // Limit to 3 related posts
        .select('title slug thumbnail excerpt createdAt'); // Select only needed fields
    }
      
    return NextResponse.json({ success: true, blog, relatedPosts }); // Add relatedPosts to response
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
