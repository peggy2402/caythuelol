'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

import BlogsHero from '@/components/blogs/BlogsHero';
import FeaturedBlogCard from '@/components/blogs/FeaturedBlogCard';
import BlogGridCard from '@/components/blogs/BlogGridCard';
import BlogPagination from '@/components/blogs/BlogPagination';

export default function BlogsPage() {
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
          tag: activeCategory === 'All' ? '' : activeCategory,
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

  const featuredPost = page === 1 ? posts[0] : null;
  const listPosts = page === 1 ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden pt-28 pb-32">
      <Navbar />

      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.png")' }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* 1. Hero & Search */}
        <BlogsHero
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          debouncedSearch={debouncedSearch}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          searchResults={searchResults}
          isSearching={isSearching}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          searchContainerRef={searchContainerRef}
        />

        {/* 2. Loading State */}
        {loading && posts.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-80 gap-4 text-cyan-400">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-xs uppercase tracking-wider font-bold text-zinc-500">Đang tải cẩm nang bài viết...</span>
          </div>
        ) : (
          <>
            {/* 3. Featured Post Spotlight */}
            {featuredPost && <FeaturedBlogCard post={featuredPost} />}

            {/* 4. Grid Posts */}
            {listPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listPosts.map((post) => (
                  <BlogGridCard key={post._id} post={post} />
                ))}
              </div>
            )}

            {/* 5. Empty State */}
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

            {/* 6. Pagination Controls */}
            {!loading && totalPages > 1 && (
              <BlogPagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
