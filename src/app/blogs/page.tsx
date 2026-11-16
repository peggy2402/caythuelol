'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import { 
  Calendar, Clock, ChevronRight, User, Loader2, Search, X, 
  ChevronLeft, ArrowRight, Flame, Sparkles, BookOpen, Layers,
  Compass, Newspaper, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

const CATEGORIES = [
  { id: 'All', label: 'Tất Cả' },
  { id: 'Meta & Guide', label: 'Cẩm Nang Meta' },
  { id: 'Esports', label: 'Tin Tức Esports' },
  { id: 'System', label: 'Thông Báo Hệ Thống' }
];

export default function BlogsPage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('All');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Main Posts
  useEffect(() => {
    if (debouncedSearch.length === 0) {
      setIsDropdownOpen(false);
      setSearchResults([]);
    }

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '9',
          tag: activeCategory,
          search: debouncedSearch,
        });
        const res = await fetch(`/api/blogs?${params.toString()}`);
        const data = await res.json();
        if (res.ok) {
          setPosts(data.blogs || []);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          toast.error('Không tìm thấy bài viết.');
        }
      } catch (e) {
        toast.error('Lỗi khi tải danh sách bài viết.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page, activeCategory, debouncedSearch]);

  // Live Search Dropdown Suggestions
  useEffect(() => {
    const searchInput = searchTerm.trim();
    if (searchInput.length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const fetchSearchResults = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/blogs/search?q=${encodeURIComponent(searchInput)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.blogs || []);
          setIsDropdownOpen((data.blogs || []).length > 0);
        }
      } catch (e) {
        // Silent error
      } finally {
        setIsSearching(false);
      }
    };

    const liveSearchTimer = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(liveSearchTimer);
  }, [searchTerm]);

  // Handle outside click to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setDebouncedSearch(searchTerm);
      setIsDropdownOpen(false);
    }
  };

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

  const featuredPost = page === 1 ? posts[0] : null;
  const listPosts = page === 1 ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden pt-28 pb-32">
      <Navbar />

      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.png")' }}></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* ========================================================================= */}
        {/* HERO BANNER SECTION                                                       */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* SEARCH & CATEGORY CONTROLS                                                */}
        {/* ========================================================================= */}
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
                  <div className="max-h-96 overflow-y-auto divide-y divide-zinc-850">
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
            {CATEGORIES.map((category) => {
              const isSelected = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
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

        {/* ========================================================================= */}
        {/* POSTS LISTING                                                             */}
        {/* ========================================================================= */}
        {loading && posts.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-80 gap-4 text-cyan-400">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-xs uppercase tracking-wider font-bold text-zinc-500">Đang tải cẩm nang bài viết...</span>
          </div>
        ) : (
          <>
            {/* Featured Post Spotlight */}
            {featuredPost && (
              <div className="mb-14">
                <Link 
                  href={`/blogs/${featuredPost.slug}`} 
                  className="group relative block rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/70 hover:border-cyan-500/50 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                  <div className="grid md:grid-cols-12 gap-0 items-center">
                    
                    {/* Media Cover */}
                    <div className="md:col-span-7 relative h-72 sm:h-96 md:h-full min-h-[320px] overflow-hidden bg-zinc-950">
                      <img 
                        src={featuredPost.thumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"} 
                        alt={featuredPost.title} 
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
                        {featuredPost.tags?.[0] && (
                          <span className="px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-[11px]">
                            {featuredPost.tags[0]}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-zinc-500 text-xs">
                          <Calendar className="w-3.5 h-3.5" /> 
                          {new Date(featuredPost.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 leading-snug group-hover:text-cyan-300 transition-colors">
                        {featuredPost.title}
                      </h2>

                      <p className="text-zinc-400 text-xs sm:text-sm line-clamp-3 mb-6 leading-relaxed">
                        {featuredPost.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                            <User className="w-4 h-4 text-cyan-400" />
                          </div>
                          <span className="font-bold">{featuredPost.author?.username || 'LeoRank Meta Team'}</span>
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
            )}

            {/* Grid Posts */}
            {listPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listPosts.map((post) => (
                  <Link 
                    key={post._id} 
                    href={`/blogs/${post.slug}`} 
                    className="group flex flex-col bg-zinc-900/60 border border-zinc-800/80 rounded-3xl overflow-hidden hover:border-cyan-500/40 hover:bg-zinc-900/90 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-48 overflow-hidden bg-zinc-950">
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent z-10 opacity-70" />
                      <img 
                        src={post.thumbnail || "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop"} 
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
                          {Math.max(2, Math.ceil((post.content?.length || 1500) / 1200))} phút đọc
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
                ))}
              </div>
            )}
            
            {/* Empty State */}
            {!loading && posts.length === 0 && (
              <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-800">
                <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">Không tìm thấy bài viết nào</h3>
                <p className="text-xs text-zinc-500 mb-6">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory('All');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
                >
                  Xem Tất Cả Bài Viết
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-center mt-16 gap-3">
                <button 
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                >
                  Trang Trước
                </button>
                <span className="px-4 py-2.5 text-zinc-300 text-xs font-mono font-bold bg-zinc-950 rounded-xl border border-zinc-850">
                  Trang {page} / {totalPages}
                </span>
                <button 
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                >
                  Trang Sau
                </button>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
