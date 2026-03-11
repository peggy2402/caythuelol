'use client';

import { Star, MessageSquare } from 'lucide-react';
import Image from 'next/image';

const RatingStars = ({ rating, size = 16 }: { rating: number, size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={size}
        className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}
      />
    ))}
  </div>
);

export default function BoosterReviewList({ reviews }: { reviews: any[] }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <MessageSquare size={20} className="text-purple-500" />
        Đánh giá từ khách hàng
      </h3>
      
      {reviews.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-zinc-700 rounded-lg">
          <p className="text-zinc-500">Chưa có đánh giá nào.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {reviews.map((review) => (
            <div key={review._id} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800">
                    <Image src={review.customerId?.profile?.avatar || '/default-avatar.png'} alt={review.customerId?.username} fill className="object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{review.customerId?.username}</div>
                    <div className="text-xs text-zinc-500">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>
                <RatingStars rating={review.rating.stars} />
              </div>
              {review.review && (
                <p className="text-sm text-zinc-300 italic bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                  "{review.review}"
                </p>
              )}
              <div className="text-right text-[10px] text-zinc-600 mt-2 font-mono">
                Đơn hàng #{review._id.toString().slice(-6).toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}