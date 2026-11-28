'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, ChevronRight, ArrowRight, Clock, BookOpen, Sparkles } from 'lucide-react';
import Image from 'next/image';

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

// Dữ liệu fallback chuẩn SEO & hình ảnh gaming esports đa dạng
const FALLBACK_POSTS: BlogPost[] = [
  {
    _id: 'seed-1',
    title: 'Nâng Cấp Hệ Thống Bảo Chứng Escrow & An Toàn Tuyệt Đối Cho Mọi Đơn Hàng',
    slug: 'thong-bao-nang-cap-he-thong-escrow-bao-mat-leorank',
    excerpt:
      'LeoRank chính thức áp dụng cơ chế ký quỹ thông minh 3 lớp, đảm bảo tiền cọc của khách hàng được bảo vệ 100% cho đến khi nghiệm thu hài lòng.',
    thumbnail: '/images/games/lol-card.jpg',
    tags: ['HỆ THỐNG', 'BẢO MẬT'],
    createdAt: '2026-11-17T08:00:00Z',
  },
  {
    _id: 'seed-2',
    title: 'Lịch Thi Đấu & Cập Nhật Thể Thức Mới Các Giải Đấu Esports Mùa Giải 2026',
    slug: 'lich-thi-dau-cap-nhat-the-thuc-moi-esports-2026',
    excerpt:
      'Tổng hợp toàn bộ lịch thi đấu LCK, LPL, VCS và các giải Valorant Champions Tour với thể thức nhánh thắng thua kịch tính.',
    thumbnail: '/images/games/cs2-card.jpg',
    tags: ['ESPORTS', 'LỊCH ĐẤU'],
    createdAt: '2026-11-16T10:00:00Z',
  },
  {
    _id: 'seed-3',
    title: 'Top 5 Tướng Leo Rank Đơn Hiệu Quả Nhất Meta Phiên Bản Mới',
    slug: 'top-5-tuong-leo-rank-don-hieu-qua-nhat-meta',
    excerpt:
      'Phân tích chi tiết tỉ lệ thắng, cách lên đồ và lộ trình gank đầu trận của tuyển thủ Thách Đấu giúp bạn tối ưu hóa điểm cộng LP mỗi trận.',
    thumbnail: '/images/games/wildrift-card.jpg',
    tags: ['LMHT', 'CẨM NANG'],
    createdAt: '2026-11-15T14:30:00Z',
  },
  {
    _id: 'seed-4',
    title: 'Bí Quyết Duo Queue Thắng Chuỗi 10 Trận Mà Không Cần Call Mic',
    slug: 'bi-quyet-duo-queue-thang-chuoi-10-tran',
    excerpt:
      'Cách phối hợp cặp tướng đường dưới hoặc Rừng - Mid để snowball ván đấu ngay từ phút thứ 5 mà không cần giao tiếp voice chat.',
    thumbnail: '/images/games/val-card.jpg',
    tags: ['CẨM NANG DUO', 'CHIẾN THUẬT'],
    createdAt: '2026-11-14T09:15:00Z',
  },
  {
    _id: 'seed-5',
    title: 'Liên Quân Mobile: Cách Xử Lý Khi Dính Chuỗi Thua & Reset Điểm MMR',
    slug: 'lien-quan-mobile-cach-xu-ly-chuoi-thua-reset-mmr',
    excerpt:
      'Bí kíp từ các Booster Thách Đấu: Cách ngắt chuỗi tilt, lấy lại bình tĩnh và phục hồi điểm ẩn MMR sau chuỗi trận không như ý.',
    thumbnail: '/images/games/aov-card.jpg',
    tags: ['LIÊN QUÂN', 'KINH NGHIỆM'],
    createdAt: '2026-11-13T16:00:00Z',
  },
];

function getCategoryBadge(tag?: string) {
  if (!tag) return { text: 'TIN MỚI', style: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
  const lower = tag.toLowerCase();
  if (lower.includes('hệ thống') || lower.includes('bảo mật')) {
    return { text: tag, style: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' };
  }
  if (lower.includes('esports')) {
    return { text: tag, style: 'bg-purple-500/15 text-purple-300 border-purple-500/40' };
  }
  if (lower.includes('duo') || lower.includes('chiến thuật')) {
    return { text: tag, style: 'bg-amber-500/15 text-amber-300 border-amber-500/40' };
  }
  if (lower.includes('liên quân') || lower.includes('aov')) {
    return { text: tag, style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' };
  }
  return { text: tag, style: 'bg-blue-500/15 text-blue-300 border-blue-500/40' };
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
      }
    };

    fetchLatestBlogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const featuredPost = posts[0] || FALLBACK_POSTS[0];
  const subPosts = posts.slice(1, 5);
  const featuredBadge = getCategoryBadge(featuredPost.tags?.[0]);

  return (
    <section className="py-24 relative z-10 border-t border-zinc-800/60 bg-[#05070c]/70 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              GÓC CHIẾN THUẬT & CẨM NANG RANK
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

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* 1. Featured Big Card (7 Cols) */}
          <div className="lg:col-span-7">
            <Link
              href={`/blogs/${featuredPost.slug}`}
              className="group relative rounded-3xl bg-zinc-900/90 border border-zinc-800/90 hover:border-cyan-500/50 overflow-hidden h-full flex flex-col justify-between transition-all duration-300 hover:shadow-[0_20px_50px_rgba(6,182,212,0.15)] hover:-translate-y-1"
            >
              {/* Media Thumbnail Container */}
              <div className="relative w-full aspect-[16/10] bg-zinc-950 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredPost.thumbnail || '/images/games/lol-card.jpg'}
                  alt={featuredPost.title}
                  loading="eager"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <span
                  className={`absolute top-4 left-4 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-lg ${featuredBadge.style}`}
                >
                  {featuredBadge.text}
                </span>
              </div>

              {/* Text Info */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-zinc-500 mb-2.5 flex items-center gap-2">
                    <span>{formatDate(featuredPost.createdAt)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {estimateReadingTime(featuredPost.content, featuredPost.excerpt)}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white mb-2.5 group-hover:text-cyan-300 transition-colors leading-snug">
                    {featuredPost.title}
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-2">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 group-hover:text-cyan-300 pt-3 border-t border-white/5">
                  <span>Đọc bài phân tích chi tiết</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </Link>
          </div>

          {/* 2. Sub Articles (5 Cols) with Thumbnail & Rich Layout */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
            {subPosts.map((art, idx) => {
              const tag = art.tags?.[0] || 'CẨM NANG';
              const badge = getCategoryBadge(tag);
              const readTime = estimateReadingTime(art.content, art.excerpt);
              const thumb = art.thumbnail || FALLBACK_POSTS[(idx + 1) % FALLBACK_POSTS.length].thumbnail;

              return (
                <Link
                  key={art._id || idx}
                  href={`/blogs/${art.slug}`}
                  className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-cyan-500/40 hover:bg-zinc-900 transition-all duration-300 flex items-center gap-4 group hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {/* Thumbnail nhỏ trực quan */}
                  <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    />
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border text-[9px] ${badge.style}`}>
                          {badge.text}
                        </span>
                        <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                          <Clock size={10} />
                          {readTime}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2 mt-1">
                        {art.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-white/5 text-[10px] text-zinc-500">
                      <span>{formatDate(art.createdAt)}</span>
                      <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold">
                        Đọc <ChevronRight size={11} />
                      </span>
                    </div>
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
