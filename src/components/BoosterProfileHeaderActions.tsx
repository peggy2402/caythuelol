'use client';

import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight, Star, CheckCircle2, Flame } from 'lucide-react';
import { toast } from 'sonner';
import ShareProfileButton from '@/components/ShareProfileButton';

interface BoosterProfileHeaderActionsProps {
  boosterId: string;
  boosterUsername: string;
  boosterName: string;
  initialLikesCount?: number;
  rating?: number;
  reviewsCount?: number;
  completedOrders?: number;
  highestRank?: string;
}

export default function BoosterProfileHeaderActions({
  boosterId,
  boosterUsername,
  boosterName,
  initialLikesCount = 0,
  rating = 0,
  reviewsCount = 0,
  completedOrders = 0,
  highestRank = 'N/A',
}: BoosterProfileHeaderActionsProps) {
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/user/bookmarks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.bookmarks || []);
          const hasBookmarked = list.some((b: any) => 
            (b?._id || b)?.toString() === boosterId || b?.username === boosterUsername
          );
          setIsBookmarked(hasBookmarked);
        }
      } catch (e) {
        // Silent fail
      }
    };

    checkBookmarkStatus();
  }, [boosterId, boosterUsername]);

  const handleToggleBookmark = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      toast.error('Vui lòng đăng nhập để lưu tuyển thủ vào danh sách yêu thích');
      return;
    }

    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    if (nextState) {
      toast.success(`Đã thêm ${boosterName} vào danh sách yêu thích! ❤️`);
    } else {
      toast.info(`Đã bỏ ${boosterName} khỏi danh sách yêu thích`);
    }

    try {
      const res = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ boosterId }),
      });

      if (!res.ok) {
        setIsBookmarked(!nextState);
        setLikesCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
        toast.error('Không thể cập nhật danh sách yêu thích');
      }
    } catch (e) {
      setIsBookmarked(!nextState);
      setLikesCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
      toast.error('Lỗi kết nối máy chủ');
    }
  };

  const handleOpenHireModal = () => {
    window.dispatchEvent(new CustomEvent('open-hire-booster-modal', { detail: { gameId: 'LOL' } }));
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 w-full">
      {/* Key Metric Chips */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1 text-xs">
        {/* Rating */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold shadow-sm">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          <span>{rating > 0 ? rating.toFixed(1) : '0/0'}</span>
          <span className="text-[10px] text-amber-400/70 font-normal">
            ({reviewsCount} đánh giá)
          </span>
        </div>

        {/* Orders Completed */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 font-semibold shadow-sm">
          <CheckCircle2 size={14} />
          <span>{completedOrders} đơn hoàn thành</span>
        </div>

        {/* Peak Rank */}
        {highestRank && highestRank !== 'N/A' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 font-medium shadow-sm">
            <Flame size={13} className="text-purple-400" />
            <span>Peak: {highestRank}</span>
          </div>
        )}

        {/* SỐ LƯỢT TIM / YÊU THÍCH */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 font-bold shadow-sm">
          <Heart size={14} className="fill-rose-500 text-rose-500" />
          <span>{likesCount} yêu thích</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-row sm:flex-col gap-2.5 w-full sm:w-auto shrink-0 justify-center">
        {/* Nút Thuê ngay mở Modal lựa chọn game & dịch vụ */}
        <button
          type="button"
          onClick={handleOpenHireModal}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 text-sm"
        >
          <span>Thuê ngay</span>
          <ArrowRight size={15} />
        </button>

        <div className="flex items-center gap-2">
          {/* Nút Thả tim / Yêu thích tương tác */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              isBookmarked
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border-zinc-700/80 hover:text-white'
            }`}
            title={isBookmarked ? 'Bỏ lưu yêu thích' : 'Lưu vào danh sách yêu thích'}
          >
            <Heart size={14} className={isBookmarked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'} />
            <span>{isBookmarked ? 'Đã lưu' : 'Lưu'}</span>
          </button>

          {/* Nút Chia sẻ */}
          <ShareProfileButton username={boosterUsername} displayName={boosterName} />
        </div>
      </div>
    </div>
  );
}
