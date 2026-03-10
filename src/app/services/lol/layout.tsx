// src/app/services/lol/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BoosterPicker from '@/components/BoosterPicker';
import { Trophy, Target, TrendingUp, Swords, Zap, Medal, GraduationCap, ChevronLeft, ChevronRight, Banknote } from 'lucide-react';
import { Suspense, useEffect, useState, useRef } from 'react';

const TABS = [
  { id: 'rank-boost', label: 'Cày Rank/Elo', href: '/services/lol/rank-boost', icon: Trophy, key: 'RANK_BOOST' },
  { id: 'net-wins', label: 'Cày Điểm Cao Thủ, Thách Đấu', href: '/services/lol/net-wins', icon: Target, key: 'NET_WINS' },
  { id: 'promotion', label: 'Chuỗi Thăng Hạng', href: '/services/lol/promotion', icon: TrendingUp, key: 'PROMOTION' },
  { id: 'placements', label: 'Phân Hạng Đầu Mùa', href: '/services/lol/placements', icon: Swords, key: 'PLACEMENTS' },
  { id: 'leveling', label: 'Cày Level 30', href: '/services/lol/leveling', icon: Zap, key: 'LEVELING' },
  { id: 'mastery', label: 'Cày Thông Thạo Tướng', href: '/services/lol/mastery', icon: Medal, key: 'MASTERY' },
  { id: 'coaching', label: 'Coaching 1-1', href: '/services/lol/coaching', icon: GraduationCap, key: 'COACHING' },
  { id: 'onbet', label: 'Cày Rank Sự Kiện', href: '/services/lol/onbet', icon: Banknote, key: 'ONBET' },
];

function ServiceTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString().replace(/%40/g, '@');
  const query = queryString ? `?${queryString}` : '';
  const boosterId = searchParams.get('booster');

  const [allowedServices, setAllowedServices] = useState<string[] | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 2);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Fetch thông tin services của Booster khi boosterId thay đổi
  useEffect(() => {
    if (!boosterId) {
      setAllowedServices(null); // Nếu chưa chọn booster, hiện tất cả (hoặc logic tuỳ bạn)
      return;
    }

    const fetchBoosterServices = async () => {
      try {
        // Gọi API chi tiết Booster
        const res = await fetch(`/api/boosters/${boosterId}`); 
        const data = await res.json();
        const booster = data.booster;
        
        if (booster && booster.booster_info?.services) {
          setAllowedServices(booster.booster_info.services);
        }
      } catch (error) {
        console.error("Failed to fetch booster services", error);
      }
    };

    fetchBoosterServices();
  }, [boosterId]);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [allowedServices]);

  return (
    <div className="relative group mb-8">
      {showLeftArrow && (
        <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-zinc-900/90 border border-zinc-700 rounded-full text-white shadow-xl hover:bg-zinc-800 transition-all -ml-3 md:-ml-5 hidden md:flex">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      
      <div 
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="overflow-x-auto pb-2 no-scrollbar scroll-smooth"
      >
        <div className="flex gap-2 min-w-max px-1">
        {TABS.map((tab) => {
          // Logic ẩn hiện: Nếu đã chọn booster và booster đó KHÔNG có service này -> Ẩn
          if (allowedServices && tab.key && !allowedServices.includes(tab.key)) return null;

          const isActive = pathname.includes(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href + query} // Preserve query params (booster)
              scroll={false}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 border border-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
      </div>

      {showRightArrow && (
        <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-zinc-900/90 border border-zinc-700 rounded-full text-white shadow-xl hover:bg-zinc-800 transition-all -mr-3 md:-mr-5 hidden md:flex">
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default function LOLLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      <Navbar />
      
      <main className="relative pt-24 pb-32 px-4">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[url('/noise.png')] bg-center opacity-10 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
              DỊCH VỤ <span className="text-blue-500">LIÊN MINH HUYỀN THOẠI</span>
            </h1>
            <p className="text-zinc-400">Chọn Booster và cấu hình dịch vụ mong muốn</p>
          </div>

          {/* Step 1: Select Booster (Shared across all LOL services) */}
          <Suspense fallback={<div className="h-40 bg-zinc-900/50 rounded-2xl animate-pulse" />}>
            <BoosterPicker />
          </Suspense>

          {/* Step 2: Service Configuration */}
          <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-sm border border-white/10">2</span>
                    Chọn dịch vụ
                </h2>
            </div>

            {/* Navigation Tabs */}
            <Suspense fallback={<div className="h-14 bg-zinc-900/50 rounded-xl animate-pulse mb-8" />}>
              <ServiceTabs />
            </Suspense>

            {/* Render Specific Service Page */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
