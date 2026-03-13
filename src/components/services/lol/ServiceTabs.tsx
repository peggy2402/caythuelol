// src/components/services/lol/ServiceTabs.tsx
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Trophy, Target, TrendingUp, Swords, Zap, Medal, GraduationCap, ChevronLeft, ChevronRight, Banknote } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

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

export default function ServiceTabs() {
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

  useEffect(() => {
    if (!boosterId) {
      setAllowedServices(null);
      return;
    }

    const fetchBoosterServices = async () => {
      try {
        const res = await fetch(`/api/boosters/`); 
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
          if (allowedServices && tab.key && !allowedServices.includes(tab.key)) return null;

          const isActive = pathname.includes(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href + query}
              scroll={false}
              className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-colors duration-200 ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30 -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
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
