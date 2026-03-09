'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Calendar, User, ArrowLeft, MessageSquare, Send, Flame, ThumbsUp, Reply } from 'lucide-react';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import Navbar from '@/components/Navbar';
import SocialShare from '@/components/SocialShare'; // New
import CommentItem from '@/components/CommentItem'; // New

// This component will receive initial data as props
export default function BlogDetailClient({ initialPost, initialComments, initialPopularPosts, initialRelatedPosts, slug }: any) {
  const router = useRouter();

  const [post, setPost] = useState<any>(initialPost);
  const [popularPosts, setPopularPosts] = useState<any[]>(initialPopularPosts);
  const [relatedPosts, setRelatedPosts] = useState<any[]>(initialRelatedPosts);
  const [comments, setComments] = useState<any[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  const handlePostComment = async (content: string, parentId: string | null = null) => {
    if (!currentUser) return toast.error('Vui lòng đăng nhập để bình luận');
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/blogs/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId })
      });
      const data = await res.json();
      if (res.ok) {
        setComments([data.comment, ...comments]);
        if (!parentId) setCommentText(''); // Only clear main input
        toast.success('Đã gửi bình luận');
      } else {
        toast.error('Gửi thất bại');
      }
    } catch (e) { toast.error('Lỗi kết nối'); }
    finally { setSubmitting(false); }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) return toast.error('Vui lòng đăng nhập để thích bình luận');

    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c._id === commentId) {
        const hasLiked = c.likes.includes(currentUser._id);
        const newLikes = hasLiked
          ? c.likes.filter((id: string) => id !== currentUser._id)
          : [...c.likes, currentUser._id];
        return { ...c, likes: newLikes };
      }
      return c;
    }));

    try {
      await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
    } catch (e) {
      toast.error("Lỗi khi thích bình luận");
      // Revert on error if needed, but for likes it's often acceptable to fail silently
    }
  };

  if (!post) {
    // This can happen if the server-side fetch failed but the page still rendered.
    // We can show a message and redirect.
    useEffect(() => {
        toast.error('Không tìm thấy bài viết.');
        router.push('/blogs');
    }, [router]);
    return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">Đang chuyển hướng...</div>;
  }

  const sanitizedContent = typeof window !== 'undefined' ? DOMPurify.sanitize(post.content) : post.content;
  const postUrl = typeof window !== 'undefined' ? window.location.href : '';
  const topLevelComments = comments.filter(c => !c.parentId);

  // The rest of the JSX from the original file...
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-20 px-4 font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="mb-8">
              <Link href="/blogs" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Quay lại trang tin tức
              </Link>
            </div>

            <article className="prose prose-invert prose-lg max-w-none break-words prose-headings:font-bold prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-img:rounded-xl">
              <header className="mb-12 border-b border-zinc-800 pb-8">
                <h1 className="text-4xl md:text-5xl font-black text-white !mb-4">{post.title}</h1>
                <div className="flex items-center gap-6 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{post.author?.username || 'Admin'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </header>

              {post.thumbnail && <img src={post.thumbnail} alt={post.title} className="w-full rounded-2xl mb-8 shadow-lg" />}
              
              <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
            </article>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
            <div className="space-y-8">
              {/* Social Share */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <SocialShare url={postUrl} title={post.title} />
              </div>

              {/* Most Viewed Posts */}
              {popularPosts.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Xem nhiều nhất
                  </h3>
                  <div className="space-y-4">
                    {popularPosts.map((p: any, index: number) => (
                      <Link key={p._id} href={`/blogs/${p.slug}`} className="group flex items-center gap-4">
                        <span className="text-2xl font-black text-zinc-700 group-hover:text-blue-500 transition-colors">0{index + 1}</span>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-zinc-300 group-hover:text-white transition-colors line-clamp-2">{p.title}</h4>
                          <span className="text-xs text-zinc-500">{p.views} lượt xem</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Bài viết liên quan</h3>
                  <div className="space-y-4">
                    {relatedPosts.map((related: any) => (
                      <Link key={related._id} href={`/blogs/${related.slug}`} className="group block">
                        <h4 className="font-bold text-zinc-300 group-hover:text-white transition-colors line-clamp-2">{related.title}</h4>
                        <span className="text-xs text-zinc-500">{new Date(related.createdAt).toLocaleDateString('vi-VN')}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Comments Section */}
        <div className="mt-16 pt-8 border-t border-zinc-800">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-500" /> Bình luận ({comments.length})
          </h3>

          {currentUser ? (
            <form onSubmit={(e) => {
                e.preventDefault();
                handlePostComment(commentText);
            }} className="mb-8 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                {currentUser.profile?.avatar ? <img src={currentUser.profile.avatar} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-zinc-500" />}
              </div>
              <div className="flex-1">
                <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Viết bình luận của bạn..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none min-h-[80px]" />
                <div className="flex justify-end mt-2">
                  <button disabled={submitting || !commentText.trim()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-zinc-900/50 p-6 rounded-xl text-center mb-8 border border-zinc-800">
              <p className="text-zinc-400 mb-3">Vui lòng đăng nhập để tham gia bình luận.</p>
              <Link href="/login" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">Đăng nhập ngay</Link>
            </div>
          )}

          <div className="space-y-6">
            {topLevelComments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                allComments={comments}
                onLike={handleLikeComment}
                onReply={handlePostComment}
                currentUser={currentUser}
              />
            ))}
            {topLevelComments.length === 0 && <p className="text-zinc-500 text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}