// src/components/orders/RatingModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export default function RatingModal({ isOpen, onClose, orderId, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Gửi đánh giá thành công!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Lỗi gửi đánh giá');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Đánh giá Booster</DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            Trải nghiệm thuê cày của bạn thế nào?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none p-1"
              >
                <Star
                  size={36}
                  className={`${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-zinc-800 text-zinc-700'
                  } transition-colors duration-200`}
                />
              </button>
            ))}
          </div>
          <div className="text-sm font-medium text-yellow-400">
            {hoveredRating || rating === 5 ? 'Tuyệt vời' : 
             (hoveredRating || rating) === 4 ? 'Rất tốt' : 
             (hoveredRating || rating) === 3 ? 'Bình thường' : 
             (hoveredRating || rating) === 2 ? 'Tệ' : 'Rất tệ'}
          </div>
          
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Viết nhận xét của bạn (tùy chọn)..."
            className="w-full h-28 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none resize-none placeholder:text-zinc-600"
          />
        </div>

        <DialogFooter>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi Đánh Giá'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
