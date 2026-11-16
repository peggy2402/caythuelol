'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Flame, Search, X, Loader2, ArrowRight } from 'lucide-react';

export const BLOG_CATEGORIES = [
  { id: 'All', label: 'Tất Cả' },
  { id: 'Meta & Guide', label: 'Cẩm Nang Meta' },
  { id: 'Esports', label: 'Tin Tức Esports' },
  { id: 'System', label: 'Thông Báo Hệ Thống' }
];

interface BlogsHeroProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearch: string;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  searchResults: any[];
  isSearching: boolean;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}

export default function BlogsHero({
  searchTerm,
  setSearchTerm,
  debouncedSearch,
  activeCategory,
  onCategoryChange,
  searchResults,
  isSearching,
  isDropdownOpen,
  setIsDropdownOpen,
  searchContainerRef
}: BlogsHeroProps) {
  const Highlight = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim() || !text) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return (
      <>
        {text.split(regex).map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-cyan-500/20 text-cyan-300 font-bold px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div>
      {/* 1. Header Banner */}
      <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>LeoRank Esports Media & Meta Guide Hub</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 tracking-tight uppercase">
          Cẩm Nang Meta & <br />
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
            Chiến Thuật Leo Rank Pro
          </span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-8">
          Phân tích chuyên sâu meta LMHT, Valorant, ĐTCL từ cựu tuyển thủ và chuyên viên phân tích. Hướng dẫn mẹo leo rank, lối lên đồ và thông báo cập nhật hệ thống.
        </p>
      </div>

      {/* 2. Search & Category Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12" ref={searchContainerRef}>
        {/* Search Input with Live Dropdown */}
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết, giáo án meta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl pl-11 pr-10 py-3 text-xs sm:text-sm text-white focus:border-cyan-500 outline-none transition-colors shadow-xl backdrop-blur-md"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X size={15} />
            </button>
          )}

          {/* Live Search Suggestions Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full mt-2 w-full md:w-[180%] max-w-lg bg-zinc-900/95 border border-zinc-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-30 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
              {isSearching ? (
                <div className="p-5 flex items-center justify-center text-cyan-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-96 overflow-y-auto divide-y divide-zinc-800">
                  {searchResults.map((post) => (
                    <Link
                      key={post._id}
                      href={`/blogs/${post.slug}`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="block p-4 hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="font-bold text-white text-xs sm:text-sm">
                          <Highlight text={post.title} highlight={debouncedSearch} />
                        </h4>
                        {post.tags?.[0] && (
                          <span className="text-[10px] bg-cyan-950/60 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 whitespace-nowrap">
                            {post.tags[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2">
                        <Highlight text={post.excerpt} highlight={debouncedSearch} />
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span className="text-cyan-400 font-bold flex items-center gap-1">Đọc bài <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-center text-zinc-500 text-xs">Không tìm thấy bài viết phù hợp.</div>
              )}
            </div>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
          {BLOG_CATEGORIES.map((category) => {
            const isSelected = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-105'
                    : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
