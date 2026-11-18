'use client';

import { Star, MessageSquare, Sparkles } from 'lucide-react';
import BoosterAvatar from '@/components/BoosterAvatar';

const RatingStars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={size}
        className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}
      />
    ))}
  </div>
);

export default function BoosterReviewList({ reviews = [] }: { reviews: any[] }) {
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating?.stars || 5), 0) / totalReviews).toFixed(1)
    : '5.0';

  return (
    <div className="bg-[#090d16]/80 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md h-[320px] flex flex-col justify-between">
      {/* Header cố định */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare size={18} className="text-purple-400" />
          <span>Đánh giá từ khách hàng</span>
        </h3>

        {totalReviews > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              {averageRating}
            </span>
            <span className="text-zinc-500">({totalReviews} lượt)</span>
          </div>
        )}
      </div>

      {/* Body danh sách có scrollbar cuộn bên trong */}
      <div className="flex-1 overflow-y-auto custom-scrollbar my-3 pr-1 space-y-3">
        {reviews.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-800/80 rounded-xl bg-zinc-950/30">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
              <Sparkles size={18} />
            </div>
            <p className="text-sm font-semibold text-zinc-300">Chưa có đánh giá nào</p>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              Tuyển thủ luôn đảm bảo uy tín và bảo mật. Hãy là người đầu tiên trải nghiệm và để lại nhận xét!
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/70 hover:border-zinc-700 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700">
                    <BoosterAvatar
                      src={review.customerId?.profile?.avatar}
                      alt={review.customerId?.username || 'Customer'}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {review.customerId?.username || 'Khách hàng'}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                <RatingStars rating={review.rating?.stars || 5} />
              </div>

              {(review.rating?.comment || review.review) && (
                <p className="text-xs text-zinc-300 italic bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/40">
                  "{review.rating?.comment || review.review}"
                </p>
              )}

              <div className="text-right text-[10px] text-zinc-600 mt-1.5 font-mono">
                Đơn hàng #{review._id.toString().slice(-6).toUpperCase()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer nhỏ cố định */}
      <div className="pt-2 border-t border-white/5 text-[11px] text-zinc-500 flex justify-between items-center shrink-0">
        <span>Đánh giá thật từ các đơn cày hoàn thành</span>
        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          100% Xác thực
        </span>
      </div>
    </div>
  );
}
