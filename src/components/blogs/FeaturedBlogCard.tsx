'use client';

import Link from 'next/link';
import { Calendar, User, ArrowRight, Eye } from 'lucide-react';
import UserBadge from '@/components/UserBadge';

interface FeaturedBlogCardProps {
  post: {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    thumbnail?: string;
    tags?: string[];
    createdAt: string;
    views?: number;
    author?: {
      username?: string;
      role?: string;
    };
  };
}

export default function FeaturedBlogCard({ post }: FeaturedBlogCardProps) {
  return (
    <div className="mb-14">
      <Link
        href={`/blogs/${post.slug}`}
        className="group relative block rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/70 hover:border-cyan-500/50 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <div className="grid md:grid-cols-12 gap-0 items-center">
          {/* Media Cover */}
          <div className="md:col-span-7 relative h-72 sm:h-96 md:h-full min-h-[320px] overflow-hidden bg-zinc-950">
            <img
              src={post.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop'}
              alt={post.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-transparent to-zinc-900/90" />
            <span className="absolute top-4 left-4 px-3 py-1 rounded-md bg-cyan-500 text-black text-[11px] font-black uppercase tracking-wider">
              Tiêu Điểm Meta
            </span>
          </div>

          {/* Content */}
          <div className="md:col-span-5 p-6 sm:p-8 md:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
              {post.tags?.[0] && (
                <span className="px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-[11px]">
                  {post.tags[0]}
                </span>
              )}
              <span className="flex items-center gap-1 text-zinc-500 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.createdAt).toLocaleDateString('vi-VN')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-zinc-400 text-xs">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                {post.views || 0} lượt xem
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 leading-snug group-hover:text-cyan-300 transition-colors">
              {post.title}
            </h2>

            <p className="text-zinc-400 text-xs sm:text-sm line-clamp-3 mb-6 leading-relaxed">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{post.author?.username || 'LeoRank Meta Team'}</span>
                  <UserBadge role={post.author?.role || 'ADMIN'} size="xs" />
                </div>
              </div>

              <span className="flex items-center gap-1 text-xs font-black text-cyan-400 group-hover:translate-x-1.5 transition-transform">
                <span>Đọc Bài Viết</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
