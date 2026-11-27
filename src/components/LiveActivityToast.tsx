'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DollarSign,
  Gamepad2,
  Star,
  MessageSquare,
  X,
  Crown,
  Zap,
  Newspaper,
  Sparkles,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export interface ActivityFeedItem {
  id: string;
  type: 'DEPOSIT' | 'ORDER' | 'REVIEW' | 'COMMENT' | 'BOOSTER_JOIN' | 'VIP_UPGRADE' | 'BLOG_PUBLISH';
  badge: string;
  badgeColor: 'emerald' | 'amber' | 'yellow' | 'blue' | 'purple' | 'cyan';
  username: string;
  actionText: string;
  highlight: string;
  timeAgo: string;
  createdAt: string;
}

export default function LiveActivityToast() {
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Lấy dữ liệu feed từ Backend API
  const fetchFeed = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/activity/feed`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setFeed(json.data);
        }
      }
    } catch {
      // Bỏ qua lỗi ngầm
    }
  };

  useEffect(() => {
    fetchFeed();
    // Tự động làm mới dữ liệu feed sau mỗi 3 phút
    const refreshInterval = setInterval(fetchFeed, 3 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Vòng lặp hiển thị ticker từ dưới lên bên phải
  useEffect(() => {
    if (feed.length === 0) return;

    let showTimeout: NodeJS.Timeout;
    let hideTimeout: NodeJS.Timeout;

    const scheduleNext = (delayMs: number) => {
      showTimeout = setTimeout(() => {
        if (!isPausedRef.current) {
          setVisible(true);

          // Giữ thông báo hiển thị 5 giây
          hideTimeout = setTimeout(() => {
            setVisible(false);
            setCurrentIndex((prev) => (prev + 1) % feed.length);

            // Thời gian chờ ngẫu nhiên giữa 2 lần xuất hiện (6s - 11s)
            const nextDelay = Math.floor(Math.random() * 5000) + 6000;
            scheduleNext(nextDelay);
          }, 5000);
        } else {
          scheduleNext(3000);
        }
      }, delayMs);
    };

    // Lần xuất hiện đầu tiên sau 3 giây khi vào trang
    scheduleNext(3000);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, [feed]);

  const handleDismiss = () => {
    setVisible(false);
    setCurrentIndex((prev) => (prev + 1) % (feed.length || 1));
  };

  if (feed.length === 0) return null;

  const currentItem = feed[currentIndex] || feed[0];

  // Render icon theo loại hành động
  const renderIcon = () => {
    switch (currentItem.type) {
      case 'DEPOSIT':
        return <DollarSign className="w-5 h-5 text-emerald-400 stroke-[2.5]" />;
      case 'ORDER':
        return <Gamepad2 className="w-5 h-5 text-amber-400" />;
      case 'REVIEW':
        return <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />;
      case 'COMMENT':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'VIP_UPGRADE':
        return <Crown className="w-5 h-5 text-amber-300 fill-amber-300" />;
      case 'BOOSTER_JOIN':
        return <Zap className="w-5 h-5 text-purple-400 fill-purple-400" />;
      case 'BLOG_PUBLISH':
        return <Newspaper className="w-5 h-5 text-cyan-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  // Khối icon box bo góc chuẩn dark mode
  const getIconBoxStyle = () => {
    switch (currentItem.type) {
      case 'ORDER':
        return 'bg-[#241a0d] border-[#4a3416]';
      case 'REVIEW':
        return 'bg-[#231e0d] border-[#483c16]';
      case 'COMMENT':
        return 'bg-[#0d1b2a] border-[#1b3a5b]';
      case 'VIP_UPGRADE':
        return 'bg-[#281c0d] border-[#5a3e18]';
      case 'BOOSTER_JOIN':
        return 'bg-[#1c0f2b] border-[#421d66]';
      case 'BLOG_PUBLISH':
        return 'bg-[#0c222b] border-[#194c5e]';
      case 'DEPOSIT':
      default:
        return 'bg-[#0e211b] border-[#18483b]';
    }
  };

  // Badge màu sắc trên hàng 2
  const getBadgeStyle = () => {
    switch (currentItem.type) {
      case 'ORDER':
        return 'bg-[#251809] text-amber-400 border-[#4a3416]';
      case 'REVIEW':
        return 'bg-[#241d08] text-yellow-400 border-[#483c16]';
      case 'COMMENT':
        return 'bg-[#0b1a29] text-blue-400 border-[#1a3857]';
      case 'VIP_UPGRADE':
        return 'bg-[#281b0a] text-amber-300 border-[#5a3e18]';
      case 'BOOSTER_JOIN':
        return 'bg-[#1d0d2e] text-purple-400 border-[#421d66]';
      case 'BLOG_PUBLISH':
        return 'bg-[#0a2029] text-cyan-400 border-[#18495a]';
      case 'DEPOSIT':
      default:
        return 'bg-[#0c2920] text-emerald-400 border-[#154d3e]';
    }
  };

  // Màu chữ giá trị nổi bật
  const getHighlightColor = () => {
    switch (currentItem.type) {
      case 'ORDER':
        return 'text-amber-400';
      case 'REVIEW':
        return 'text-yellow-400';
      case 'COMMENT':
        return 'text-blue-400';
      case 'VIP_UPGRADE':
        return 'text-amber-300';
      case 'BOOSTER_JOIN':
        return 'text-purple-300';
      case 'BLOG_PUBLISH':
        return 'text-cyan-400';
      case 'DEPOSIT':
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] pointer-events-none select-none">
      <AnimatePresence>
        {visible && currentItem && (
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="pointer-events-auto relative flex items-center gap-3.5 pl-3.5 pr-8 py-3 max-w-[340px] sm:max-w-[410px] rounded-2xl bg-[#0e1318]/95 border border-zinc-800/90 shadow-[0_16px_45px_rgba(0,0,0,0.75)] backdrop-blur-md overflow-hidden"
          >
            {/* Khối icon bên trái */}
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${getIconBoxStyle()}`}
            >
              {renderIcon()}
            </div>

            {/* Nội dung thông báo theo đúng cấu trúc ảnh mẫu */}
            <div className="flex-1 min-w-0">
              {/* Dòng 1: Username đậm màu trắng + Hành động màu xám nhẹ */}
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-bold text-white text-[13.5px] tracking-tight shrink-0">
                  {currentItem.username}
                </span>
                <span className="text-zinc-400 text-[13px] truncate">
                  {currentItem.actionText}
                </span>
              </div>

              {/* Dòng 2: Badge nằm ở dòng 2 + Giá trị nổi bật + Thời gian */}
              <div className="flex items-center gap-2 mt-1 leading-tight flex-wrap">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded-[4px] text-[10.5px] font-bold tracking-wide uppercase border shrink-0 ${getBadgeStyle()}`}
                >
                  {currentItem.badge}
                </span>
                <span
                  className={`font-bold text-[13px] tracking-tight truncate max-w-[170px] sm:max-w-[210px] ${getHighlightColor()}`}
                >
                  {currentItem.highlight}
                </span>
                <span className="text-zinc-500 text-[11.5px] font-normal shrink-0">
                  · {currentItem.timeAgo}
                </span>
              </div>
            </div>

            {/* Nút đóng thông báo nhỏ gọn ở góc phải */}
            <button
              type="button"
              onClick={handleDismiss}
              title="Đóng thông báo"
              className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
