'use client';

import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight, Star, History, Sparkles } from 'lucide-react';
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
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 w-full pt-2">
      {/* Key Metric Chips Chuẩn Xác Theo Dữ Liệu Thực Tế */}
      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs">
        {/* Rating Chip */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c160c]/90 border border-amber-500/35 text-amber-300 font-bold shadow-sm">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          {reviewsCount > 0 ? (
            <>
              <span>{rating.toFixed(1)}</span>
              <span className="text-[11px] text-amber-400/80 font-normal">
                ({reviewsCount} đánh giá)
              </span>
            </>
          ) : (
            <span className="text-[11px] font-medium text-amber-300/80">
              Chưa có đánh giá
            </span>
          )}
        </div>

        {/* Orders Completed Chip */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b1626]/90 border border-blue-500/35 text-blue-300 font-bold shadow-sm">
          <span className="w-3.5 h-3.5 rounded-full border border-blue-400 flex items-center justify-center text-[9px] text-blue-300">
            ◎
          </span>
          <span>{completedOrders} đơn hoàn thành</span>
        </div>

        {/* Peak Rank Chip */}
        {highestRank && highestRank !== 'N/A' ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a0e26]/90 border border-purple-500/35 text-purple-300 font-bold shadow-sm">
            <Sparkles size={13} className="text-purple-400" />
            <span>Peak: {highestRank}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a0e26]/90 border border-purple-500/35 text-purple-300 font-medium shadow-sm">
            <Sparkles size={13} className="text-purple-400" />
            <span>Verified Booster</span>
          </div>
        )}

        {/* Bookmark / Likes Count Chip */}
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${
            isBookmarked
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'bg-[#1e0e18]/80 hover:bg-[#281220] text-rose-400/90 border-rose-500/30'
          }`}
          title="Thả tim yêu thích"
        >
          <Heart size={13} className={isBookmarked ? 'fill-rose-500 text-rose-500' : 'text-rose-400'} />
          <span>{likesCount} yêu thích</span>
        </button>
      </div>

      {/* Action Buttons Y Hệt Ảnh Mẫu */}
      <div className="flex flex-col items-center lg:items-end gap-2 shrink-0 w-full sm:w-auto">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Nút Thuê ngay rực rỡ Gradient Neon */}
          <button
            type="button"
            onClick={handleOpenHireModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-black rounded-2xl transition-all duration-300 shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 text-sm"
          >
            <span>Thuê ngay</span>
            <ArrowRight size={15} />
          </button>

          {/* Nút Chia sẻ */}
          <ShareProfileButton username={boosterUsername} displayName={boosterName} />
        </div>

        {/* Lịch sử hoạt động text link */}
        <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] hover:text-zinc-300 transition-colors cursor-pointer pt-0.5">
          <History size={12} />
          <span>Lịch sử hoạt động</span>
        </div>
      </div>
    </div>
  );
}
