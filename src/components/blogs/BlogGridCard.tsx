'use client';

import Link from 'next/link';
import { Calendar, Clock, ChevronRight, Eye } from 'lucide-react';

interface BlogGridCardProps {
  post: {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    thumbnail?: string;
    tags?: string[];
    createdAt: string;
    content?: string;
    views?: number;
  };
}

export default function BlogGridCard({ post }: BlogGridCardProps) {
  const readingTime = Math.max(2, Math.ceil((post.content?.length || 1500) / 1200));

  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group flex flex-col bg-zinc-900/60 border border-zinc-800/80 rounded-3xl overflow-hidden hover:border-cyan-500/40 hover:bg-zinc-900/90 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent z-10 opacity-70" />
        <img
          src={post.thumbnail || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop'}
          alt={post.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
        />
        <div className="absolute top-4 left-4 z-20">
          {post.tags?.[0] && (
            <span className="px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-cyan-300">
              {post.tags[0]}
            </span>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-2.5">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(post.createdAt).toLocaleDateString('vi-VN')}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            {readingTime} phút đọc
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Eye className="w-3 h-3 text-sky-400" />
            {post.views || 0} xem
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors leading-snug">
          {post.title}
        </h3>

        <p className="text-zinc-400 text-xs line-clamp-2 flex-grow leading-relaxed mb-4">
          {post.excerpt}
        </p>

        <div className="pt-3 border-t border-zinc-800 text-cyan-400 font-bold text-xs flex items-center justify-between mt-auto">
          <span>Chi tiết bài viết</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
