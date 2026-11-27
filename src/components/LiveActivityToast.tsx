'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Coins,
  Gamepad2,
  Star,
  MessageSquare,
  X,
  Sparkles,
  Crown,
  Zap,
  Newspaper,
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

            // Thời gian chờ ngẫu nhiên giữa 2 lần xuất hiện (6s - 12s)
            const nextDelay = Math.floor(Math.random() * 6000) + 6000;
            scheduleNext(nextDelay);
          }, 5000);
        } else {
          scheduleNext(3000);
        }
      }, delayMs);
    };

    // Lần xuất hiện đầu tiên sau 3.5 giây khi vào trang
    scheduleNext(3500);

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
        return <Coins className="w-5 h-5 text-white" />;
      case 'ORDER':
        return <Gamepad2 className="w-5 h-5 text-white" />;
      case 'REVIEW':
        return <Star className="w-5 h-5 text-white fill-white" />;
      case 'COMMENT':
        return <MessageSquare className="w-5 h-5 text-white" />;
      case 'VIP_UPGRADE':
        return <Crown className="w-5 h-5 text-white" />;
      case 'BOOSTER_JOIN':
        return <Zap className="w-5 h-5 text-white fill-white" />;
      case 'BLOG_PUBLISH':
        return <Newspaper className="w-5 h-5 text-white" />;
      default:
        return <Sparkles className="w-5 h-5 text-white" />;
    }
  };

  // Màu sắc icon gradient
  const getGradientByBadge = () => {
    switch (currentItem.type) {
      case 'ORDER':
        return 'from-amber-400 via-orange-500 to-amber-600 shadow-amber-500/25';
      case 'REVIEW':
        return 'from-yellow-400 via-amber-500 to-yellow-600 shadow-yellow-500/25';
      case 'COMMENT':
        return 'from-blue-400 via-indigo-500 to-blue-600 shadow-blue-500/25';
      case 'VIP_UPGRADE':
        return 'from-amber-400 via-yellow-500 to-amber-600 shadow-amber-500/30';
      case 'BOOSTER_JOIN':
        return 'from-purple-500 via-violet-600 to-indigo-700 shadow-purple-500/25';
      case 'BLOG_PUBLISH':
        return 'from-cyan-400 via-sky-500 to-blue-600 shadow-cyan-500/25';
      case 'DEPOSIT':
      default:
        return 'from-emerald-400 via-teal-500 to-emerald-600 shadow-emerald-500/25';
    }
  };

  const getBadgeStyle = () => {
    switch (currentItem.type) {
      case 'ORDER':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-500/30';
      case 'REVIEW':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300 border-yellow-500/30';
      case 'COMMENT':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-blue-500/30';
      case 'VIP_UPGRADE':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-500/30';
      case 'BOOSTER_JOIN':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border-purple-500/30';
      case 'BLOG_PUBLISH':
        return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300 border-cyan-500/30';
      case 'DEPOSIT':
      default:
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-500/30';
    }
  };

  const getLeftBarStyle = () => {
    switch (currentItem.type) {
      case 'VIP_UPGRADE':
        return 'from-amber-400 to-yellow-500';
      case 'BOOSTER_JOIN':
        return 'from-purple-500 to-indigo-600';
      case 'BLOG_PUBLISH':
        return 'from-cyan-400 to-blue-500';
      case 'ORDER':
        return 'from-amber-400 to-orange-500';
      case 'REVIEW':
        return 'from-yellow-400 to-amber-500';
      case 'COMMENT':
        return 'from-blue-400 to-indigo-500';
      case 'DEPOSIT':
      default:
        return 'from-emerald-400 to-teal-500';
    }
  };

  const getHighlightColor = () => {
    switch (currentItem.type) {
      case 'VIP_UPGRADE':
        return 'text-amber-600 dark:text-amber-400';
      case 'BOOSTER_JOIN':
        return 'text-purple-600 dark:text-purple-300';
      case 'BLOG_PUBLISH':
        return 'text-cyan-600 dark:text-cyan-400';
      case 'ORDER':
        return 'text-amber-600 dark:text-amber-400';
      case 'REVIEW':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'COMMENT':
        return 'text-blue-600 dark:text-blue-400';
      case 'DEPOSIT':
      default:
        return 'text-emerald-600 dark:text-emerald-400';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] pointer-events-none select-none">
      <AnimatePresence>
        {visible && currentItem && (
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="pointer-events-auto relative flex items-center gap-3 pl-3 pr-8 py-2.5 max-w-[340px] sm:max-w-[400px] rounded-2xl bg-white dark:bg-zinc-900/95 border border-emerald-500/25 dark:border-zinc-800 shadow-[0_12px_38px_-4px_rgba(0,0,0,0.18)] dark:shadow-[0_18px_48px_-8px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden group"
          >
            {/* Dải màu nhấn viền trái giống hình ảnh mẫu */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${getLeftBarStyle()} rounded-l-2xl`}
            />

            {/* Icon đại diện dạng Squircle gradient bo tròn */}
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${getGradientByBadge()} flex items-center justify-center shrink-0 shadow-md`}
            >
              {renderIcon()}
            </div>

            {/* Nội dung thông báo */}
            <div className="flex-1 min-w-0 pr-1">
              {/* Dòng 1: Badge + Tên người dùng + Hành động */}
              <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded-[5px] text-[10px] font-black tracking-wider uppercase border shrink-0 ${getBadgeStyle()}`}
                >
                  {currentItem.badge}
                </span>
                <span className="font-extrabold text-zinc-900 dark:text-white text-xs sm:text-[13px] tracking-tight">
                  {currentItem.username}
                </span>
                <span className="text-zinc-600 dark:text-zinc-300 text-xs sm:text-[12.5px] truncate max-w-[150px] sm:max-w-[190px]">
                  {currentItem.actionText}
                </span>
              </div>

              {/* Dòng 2: Giá trị nổi bật (Số tiền/Gói rank/Bài viết) + Thời gian tương đối */}
              <div className="flex items-center gap-1.5 mt-0.5 leading-tight">
                <span
                  className={`font-extrabold text-xs sm:text-[13px] tracking-tight truncate max-w-[190px] sm:max-w-[230px] ${getHighlightColor()}`}
                >
                  {currentItem.highlight}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500 text-[11px] font-medium shrink-0">
                  · {currentItem.timeAgo}
                </span>
              </div>
            </div>

            {/* Nút đóng thông báo nhỏ ở góc phải */}
            <button
              type="button"
              onClick={handleDismiss}
              title="Đóng thông báo"
              className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
