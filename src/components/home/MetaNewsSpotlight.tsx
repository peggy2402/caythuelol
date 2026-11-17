'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, ChevronRight, ArrowRight, BookOpen, Clock } from 'lucide-react';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  thumbnail?: string;
  tags?: string[];
  createdAt: string;
  views?: number;
  author?: {
    username?: string;
  };
}

// Dữ liệu mẫu chuẩn SEO & Esports fallback sẵn sàng khi SSR hoặc offline
const FALLBACK_POSTS: BlogPost[] = [
  {
    _id: 'seed-1',
    title: 'Top 5 Tướng Leo Rank Đơn Hiệu Quả Nhất Meta Phiên Bản Mới',
    slug: 'top-5-tuong-leo-rank-don-hieu-qua-nhat-meta',
    excerpt:
      'Phân tích chi tiết tỉ lệ thắng, cách lên đồ và lộ trình gank đầu trận của tuyển thủ Thách Đấu giúp bạn tối ưu hóa điểm cộng LP mỗi trận.',
    thumbnail: '/images/games/lol-card.jpg',
    tags: ['LMHT', 'Cẩm Nang', 'Meta 2026'],
    createdAt: '2026-11-15T08:00:00Z',
  },
  {
    _id: 'seed-2',
    title: 'Bí quyết Duo Queue thắng chuỗi 10 trận mà không cần call mic',
    slug: 'bi-quyet-duo-queue-thang-chuoi-10-tran',
    excerpt:
      'Cách phối hợp cặp tướng đường dưới (Xạ thủ - Hỗ trợ) hoặc Rừng - Đường giữa để snowball ván đấu ngay từ phút thứ 5 mà không cần giao tiếp voice chat.',
    thumbnail: '/images/games/lol-card.jpg',
    tags: ['Cẩm Nang Duo', 'LMHT'],
    createdAt: '2026-11-14T10:00:00Z',
  },
  {
    _id: 'seed-3',
    title: 'Valorant: Hướng dẫn line-up Sova & Fade kiểm soát map Ascent',
    slug: 'valorant-huong-dan-line-up-sova-fade-ascent',
    excerpt:
      'Trọn bộ góc recon dart và mắt Haunt công/thủ chuẩn thi đấu VCT, giúp đội bạn luôn có thông tin đối phương trước khi execute vào site A và B.',
    thumbnail: '/images/games/val-card.jpg',
    tags: ['Valorant', 'Chiến Thuật'],
    createdAt: '2026-11-13T14:30:00Z',
  },
  {
    _id: 'seed-4',
    title: 'Đấu Trường Chân Lý Mùa Mới: Các đội hình Fast 8 giữ máu chuẩn Thách Đấu',
    slug: 'dtcl-mua-moi-doi-hinh-fast-8-giu-mau-thach-dau',
    excerpt:
      'Chiến thuật quản lý chuỗi thắng thua, tối ưu trang bị đầu trận và thời điểm roll 4 tiền 2 sao để chắc chắn lọt Top 4 và bảo toàn điểm rank.',
    thumbnail: '/images/games/tft-card.jpg',
    tags: ['ĐTCL', 'TFT'],
    createdAt: '2026-11-12T09:15:00Z',
  },
  {
    _id: 'seed-5',
    title: 'Cách xử lý tâm lý khi dính chuỗi thua và reset MMR hiệu quả',
    slug: 'cach-xu-ly-tam-ly-khi-dinh-chuoi-thua-reset-mmr',
    excerpt:
      'Chia sẻ từ tâm lý học thể thao điện tử và kinh nghiệm các tuyển thủ Pro: cách ngắt chuỗi tilt, lấy lại bình tĩnh và phục hồi điểm ẩn MMR sau chuỗi trận thất bại.',
    thumbnail: '/images/games/cs2-card.jpg',
    tags: ['Tâm Lý Thi Đấu', 'Kinh Nghiệm'],
    createdAt: '2026-11-11T16:00:00Z',
  },
];

function getCategoryColor(tag?: string): string {
  if (!tag) return 'text-cyan-400';
  const lower = tag.toLowerCase();
  if (lower.includes('duo')) return 'text-amber-400';
  if (lower.includes('val')) return 'text-rose-400';
  if (lower.includes('tft') || lower.includes('đtcl')) return 'text-emerald-400';
  if (lower.includes('tâm lý')) return 'text-purple-400';
  if (lower.includes('cs') || lower.includes('fps')) return 'text-orange-400';
  return 'text-cyan-400';
}

function estimateReadingTime(content?: string, excerpt?: string): string {
  const text = (content || excerpt || '').trim();
  const wordCount = text.length > 0 ? text.split(/\s+/).length : 200;
  const minutes = Math.max(3, Math.ceil(wordCount / 180));
  return `${minutes} Phút Đọc`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  } catch {
    return 'Gần đây';
  }
}

export default function MetaNewsSpotlight() {
  const [posts, setPosts] = useState<BlogPost[]>(FALLBACK_POSTS);
  const [loading, setLoading] = useState(true);

  // Fetch bài viết thực tế từ Backend API (kết nối trực tiếp với Quản lý Bài viết Admin)
  useEffect(() => {
    let isMounted = true;
    const fetchLatestBlogs = async () => {
      try {
        const res = await fetch('/api/blogs?limit=5');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.blogs && data.blogs.length > 0) {
            setPosts(data.blogs);
          }
        }
      } catch (err) {
        console.error('Không thể tải bài viết mới nhất:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLatestBlogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const featuredPost = posts[0] || FALLBACK_POSTS[0];
  const subPosts = posts.slice(1, 5);

  return (
    <section className="py-20 relative z-10 border-t border-zinc-800/60 bg-[#06080d]/60 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              Góc Chiến Thuật & Cẩm Nang Rank
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Meta Phân Tích & Cập Nhật Mới Nhất
            </h2>
          </div>
          <Link
            href="/blogs"
            className="group text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 mt-3 md:mt-0 transition-colors"
          >
            <span>Xem tất cả cẩm nang</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* 1. Featured Big Card (7 Cols) */}
          <div className="lg:col-span-7">
            <Link
              href={`/blogs/${featuredPost.slug}`}
              className="group relative rounded-3xl bg-zinc-900/90 border border-zinc-800/90 hover:border-cyan-500/50 overflow-hidden h-full flex flex-col justify-between transition-all duration-300 hover:shadow-[0_20px_50px_rgba(6,182,212,0.15)] hover:-translate-y-1"
            >
              <div className="relative w-full aspect-[16/9] bg-zinc-950 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredPost.thumbnail || '/images/games/lol-card.jpg'}
                  alt={featuredPost.title}
                  loading="eager"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-cyan-500 text-black text-xs font-black uppercase tracking-wider shadow-lg">
                  {featuredPost.tags?.[0] || 'TIÊU ĐIỂM META'}
                </span>
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-zinc-500 mb-2.5 flex items-center gap-2">
                    <span>{formatDate(featuredPost.createdAt)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {estimateReadingTime(featuredPost.content, featuredPost.excerpt)}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-3 group-hover:text-cyan-300 transition-colors leading-tight">
                    {featuredPost.title}
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6 line-clamp-2">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 group-hover:text-cyan-300 pt-2 border-t border-white/5">
                  <span>Khám phá cẩm nang chi tiết</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </Link>
          </div>

          {/* 2. Sub Articles (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
            {subPosts.map((art, idx) => {
              const tag = art.tags?.[0] || 'CẨM NANG';
              const colorClass = getCategoryColor(tag);
              const readTime = estimateReadingTime(art.content, art.excerpt);

              return (
                <Link
                  key={art._id || idx}
                  href={`/blogs/${art.slug}`}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-cyan-500/50 hover:bg-zinc-900 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className={`font-black uppercase tracking-wider ${colorClass}`}>
                      {tag}
                    </span>
                    <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                      <Clock size={11} />
                      {readTime}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                    {art.title}
                  </h4>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5 text-[10px] text-zinc-500 group-hover:text-zinc-400">
                    <span>{formatDate(art.createdAt)}</span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
                      Đọc ngay <ChevronRight size={12} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
