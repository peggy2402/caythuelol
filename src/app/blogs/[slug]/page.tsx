import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlogDetailClient from '@/components/BlogDetailClient';

// Hàm tạo metadata động cho SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    // Cần thay thế bằng URL production của bạn
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blogs/${slug}`);
    if (!res.ok) return { title: 'Bài viết không tồn tại' };
    
    const { blog } = await res.json();
    
    return {
      title: `${blog.title} | CAYTHUELOL Blog`,
      description: blog.excerpt,
    };
  } catch (error) {
    return { title: 'Lỗi', description: 'Không thể tải nội dung bài viết.' };
  }
}

async function getPageData(slug: string) {
  try {
    const [postRes, commentsRes, popularRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blogs/${slug}`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blogs/${slug}/comments`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blogs/popular`, { cache: 'no-store' })
    ]);

    if (!postRes.ok) return null;

    const postData = await postRes.json();
    const commentsData = await commentsRes.json();
    const popularData = await popularRes.json();

    return {
      initialPost: postData.blog,
      initialRelatedPosts: postData.relatedPosts || [],
      initialComments: commentsData.comments || [],
      initialPopularPosts: popularData.blogs || [],
    };
  } catch (error) {
    console.error("Failed to fetch page data:", error);
    return null;
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPageData(slug);

  if (!data) {
    notFound();
  }

  return (
    <BlogDetailClient {...data} slug={slug} />
  );
}
