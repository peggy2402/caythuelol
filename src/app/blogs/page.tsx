'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft, Calendar, Clock, ChevronRight, Tag, User } from 'lucide-react';

// --- Mock Data ---
const BLOG_POSTS = [
  {
    id: 1,
    title: "Meta 14.5: Sự trỗi dậy của Smolder và Aurelion Sol",
    excerpt: "Phân tích chi tiết bản cập nhật 14.5 với những thay đổi lớn về trang bị pháp sư và sự thống trị của các rồng thần ở đường dưới.",
    category: "Meta & Guide",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    date: "28/02/2026",
    author: "Challenger Team",
    readTime: "5 min read",
    featured: true
  },
  {
    id: 2,
    title: "Hướng dẫn leo Rank đầu mùa giải 2026",
    excerpt: "Những mẹo quan trọng để tối ưu hóa 5 trận phân hạng đầu tiên. Nên chơi vị trí nào để gánh team tốt nhất?",
    category: "Meta & Guide",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
    date: "25/02/2026",
    author: "Admin",
    readTime: "8 min read",
    featured: false
  },
  {
    id: 3,
    title: "Thông báo bảo trì hệ thống ngày 01/03",
    excerpt: "Hệ thống sẽ tạm dừng nhận đơn trong khoảng thời gian từ 02:00 đến 04:00 để nâng cấp server.",
    category: "System",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
    date: "24/02/2026",
    author: "Support Team",
    readTime: "1 min read",
    featured: false
  },
  {
    id: 4,
    title: "T1 vs Gen.G: Phân tích trận chung kết LCK",
    excerpt: "Nhìn lại những pha giao tranh mãn nhãn và chiến thuật cấm chọn đỉnh cao của hai đội tuyển hàng đầu thế giới.",
    category: "Esports",
    image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=2070&auto=format&fit=crop",
    date: "20/02/2026",
    author: "Esports Analyst",
    readTime: "10 min read",
    featured: false
  },
  {
    id: 5,
    title: "Top 5 Tướng Rừng leo rank hiệu quả nhất Patch 14.4",
    excerpt: "Danh sách các tướng đi rừng có tỉ lệ thắng cao nhất hiện tại và cách build đồ tối ưu.",
    category: "Meta & Guide",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop",
    date: "18/02/2026",
    author: "Booster X",
    readTime: "6 min read",
    featured: false
  }
];

const CATEGORIES = ['All', 'Meta & Guide', 'Esports', 'System'];

export default function BlogsPage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts = activeCategory === 'All' 
    ? BLOG_POSTS 
    : BLOG_POSTS.filter(post => post.category === activeCategory);

  const featuredPost = filteredPosts.find(p => p.featured) || filteredPosts[0];
  const listPosts = filteredPosts.filter(p => p.id !== featuredPost?.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-20 px-4 relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('/noise.png')] bg-center opacity-10 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2 rounded-full bg-zinc-900/50 border border-white/10 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all backdrop-blur-md group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('backToHome')}
        </Link>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            Blog & News
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            {t('blogPageTitle')}
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            {t('blogPageDesc')}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                activeCategory === cat
                  ? 'bg-white text-black border-white shadow-lg shadow-white/10'
                  : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              {cat === 'All' ? t('catAll') : cat === 'System' ? t('catSystem') : cat === 'Esports' ? t('catEsports') : t('catMeta')}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <Link href={`/blogs/${featuredPost.id}`} className="group relative block rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 hover:border-blue-500/50 transition-all duration-500">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-64 md:h-auto overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/20 mix-blend-overlay z-10 group-hover:bg-transparent transition-colors duration-500" />
                  <img 
                    src={featuredPost.image} 
                    alt={featuredPost.title} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">
                    <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">{featuredPost.category}</span>
                    <span className="flex items-center gap-1 text-zinc-500"><Calendar className="w-3 h-3" /> {featuredPost.date}</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-blue-400 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-zinc-400 mb-6 line-clamp-3 text-lg">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                        <User className="w-4 h-4" />
                      </div>
                      <span>{featuredPost.author}</span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-bold text-white group-hover:translate-x-2 transition-transform">
                      {t('readMore')} <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Grid Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          {listPosts.map((post) => (
            <Link key={post.id} href={`/blogs/${post.id}`} className="group flex flex-col bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 hover:bg-zinc-900/60 transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-10 opacity-60" />
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 z-20">
                  <span className="px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-xs font-bold text-white">
                    {post.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h3>
                <p className="text-zinc-400 text-sm line-clamp-3 mb-4 flex-1">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center text-sm font-medium text-blue-500 mt-auto">
                  {t('readMore')} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}