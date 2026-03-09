'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft, Calendar, Clock, ChevronRight, User, Loader2, Search, X, ChevronLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

const CATEGORIES = ['All', 'Meta & Guide', 'Esports', 'System'];

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

  // Debounce search
  // This useEffect is for the main search functionality (when user presses Enter or clears search)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // This useEffect is for fetching the main list of posts
  useEffect(() => {
    // Nếu người dùng xóa hết chữ, ẩn dropdown và tải lại danh sách chính
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
        toast.error('Lỗi tải bài viết.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page, activeCategory, debouncedSearch]);

  // Effect for live search dropdown suggestions
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
        const res = await fetch(`/api/blogs/search?q=${searchInput}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.blogs);
          setIsDropdownOpen(data.blogs.length > 0);
        }
      } catch (e) {
        // Silent error, no need to notify the user
      } finally {
        setIsSearching(false);
      }
    };

    // Use a separate debounce for live search to avoid re-fetching the main list
    const liveSearchTimer = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(liveSearchTimer);
  }, [searchTerm]);

  // Effect để xử lý click ra ngoài và đóng dropdown
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
    setPage(1); // Reset về trang 1 khi đổi danh mục
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setDebouncedSearch(searchTerm); // Trigger main search
      setIsDropdownOpen(false); // Close dropdown
    }
  };

  // Component để highlight từ khóa
  const Highlight = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim() || !text) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return (
        <>
            {text.split(regex).map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-blue-500/20 text-blue-300 font-bold rounded-sm">{part}</span>
                ) : ( part )
            )}
        </>
    );
  };

  const featuredPost = page === 1 ? posts[0] : null;
  const listPosts = page === 1 ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-20 px-4 relative overflow-hidden font-sans selection:bg-blue-500/30">
      <Navbar />
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('/noise.png')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" suppressHydrationWarning />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            {t('blogPageTitle')}
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            {t('blogPageDesc')}
          </p>
        </div>

        {/* Search & Category Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12" ref={searchContainerRef}>
            <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Tìm kiếm bài viết..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
                />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X size={16} /></button>}
                
                {/* Search Dropdown */}
                {isDropdownOpen && (
                    <div className="absolute top-full mt-2 w-full md:w-[200%] max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {isSearching ? (
                            <div className="p-4 flex items-center justify-center text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" /></div>
                        ) : searchResults.length > 0 ? (
                            <div className="max-h-96 overflow-y-auto">
                                {searchResults.map(post => (
                                    <Link key={post._id} href={`/blogs/${post.slug}`} onClick={() => setIsDropdownOpen(false)} className="block p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800 last:border-b-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white text-sm mb-1"><Highlight text={post.title} highlight={debouncedSearch} /></h4>
                                            {post.tags?.[0] && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 whitespace-nowrap">{post.tags[0]}</span>}
                                        </div>
                                        <p className="text-xs text-zinc-400 line-clamp-2 mb-2"><Highlight text={post.excerpt} highlight={debouncedSearch} /></p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-zinc-500">{post.author?.username} - {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                                            <ArrowRight className="w-4 h-4 text-zinc-600" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-zinc-500 text-sm">Không tìm thấy kết quả.</div>
                        )}
                    </div>
                )}
            </div>
            <div className="flex items-center justify-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((category) => (
                    <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                            activeCategory === category
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-zinc-900/50 border border-white/10 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                    >
                    {category}
                    </button>
                ))}
            </div>
        </div>

        {loading && posts.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <div className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <Link href={`/blogs/${featuredPost.slug}`} className="group relative block rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 hover:border-blue-500/50 transition-all duration-500">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-64 md:h-auto overflow-hidden">
                      <div className="absolute inset-0 bg-blue-500/20 mix-blend-overlay z-10 group-hover:bg-transparent transition-colors duration-500" />
                      <img 
                        src={featuredPost.thumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"} 
                        alt={featuredPost.title} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">
                        {featuredPost.tags?.[0] && <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">{featuredPost.tags[0]}</span>}
                        <span className="flex items-center gap-1 text-zinc-500"><Calendar className="w-3 h-3" /> {new Date(featuredPost.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-blue-400 transition-colors">
                        {featuredPost.title}
                      </h2>
                      <p className="text-zinc-400 mb-6 line-clamp-3 text-lg">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          {featuredPost.author?.username && (
                            <>
                              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                                <User className="w-4 h-4" />
                              </div>
                              <span>{featuredPost.author.username}</span>
                            </>
                          )}
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
            {listPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                {listPosts.map((post) => (
                <Link key={post._id} href={`/blogs/${post.slug}`} className="group flex flex-col bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 hover:bg-zinc-900/60 transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-10 opacity-60" />
                    <img 
                      src={post.thumbnail || "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop"} 
                      alt={post.title} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 z-20">
                      {post.tags?.[0] && <span className="px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-xs font-bold text-white">{post.tags[0]}</span>}
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.ceil(post.content.length / 1500)} min read</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-zinc-400 text-sm line-clamp-3 flex-grow">
                      {post.excerpt}
                    </p>
                    
                    <div className="mt-6 pt-4 border-t border-white/10 text-blue-400 font-bold text-sm flex items-center">
                      {t('readMore')} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
                ))}
              </div>
            )}
            
            {!loading && posts.length === 0 && (
              <div className="text-center py-20 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
                <h3 className="text-xl font-bold text-white">Không tìm thấy bài viết nào</h3>
                <p className="text-zinc-500 mt-2">Không có bài viết nào khớp với tìm kiếm hoặc danh mục của bạn.</p>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-center mt-12 gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold">{page} / {totalPages}</span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}