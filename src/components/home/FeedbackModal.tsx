'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Bug, Lightbulb, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedbackModal() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'BUG' | 'SUGGESTION'>('BUG');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackImage, setFeedbackImage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Kích thước ảnh tối đa là 5MB!");
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'uploads');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Tải ảnh thất bại");

      setFeedbackImage(data.url || data.secure_url);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return toast.error("Vui lòng nhập nội dung!");
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          message: feedbackText,
          imageUrl: feedbackImage
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi khi gửi phản hồi");

      toast.success("Cảm ơn bạn đã đóng góp ý kiến!");
      setIsFeedbackOpen(false);
      setFeedbackText('');
      setFeedbackImage('');
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-6 left-6 z-40 p-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 hover:border-cyan-500 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all group"
        title="Góp ý & Báo lỗi"
      >
        <MessageSquarePlus className="w-6 h-6 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
      </button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900/95 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.7)] backdrop-blur-md"
            >
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <MessageSquarePlus className="w-5 h-5 text-cyan-400" />
                  Góp ý & Báo lỗi hệ thống
                </h3>
                <button onClick={() => setIsFeedbackOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setFeedbackType('BUG')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${feedbackType === 'BUG' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}>
                    <Bug className="w-5 h-5" />
                    <span className="text-sm font-bold">Báo lỗi</span>
                  </button>
                  <button onClick={() => setFeedbackType('SUGGESTION')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${feedbackType === 'SUGGESTION' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}>
                    <Lightbulb className="w-5 h-5" />
                    <span className="text-sm font-bold">Góp ý cải tiến</span>
                  </button>
                </div>

                <textarea
                  autoFocus
                  value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={feedbackType === 'BUG' ? 'Mô tả chi tiết lỗi bạn gặp phải (Ví dụ: Không nạp được tiền, Web bị giật...)' : 'Bạn muốn hệ thống có thêm tính năng gì?'}
                  className="w-full h-28 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none resize-none placeholder:text-zinc-600"
                />

                {!feedbackImage ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-sm transition-colors ${isUploadingImage ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-zinc-800 bg-zinc-950/50 text-zinc-500 hover:border-zinc-600 hover:bg-zinc-900'}`}>
                      {isUploadingImage ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Đang tải ảnh lên...</>
                      ) : (
                        <><UploadCloud className="w-5 h-5" /> Tải lên ảnh màn hình (Tùy chọn)</>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-zinc-800 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={feedbackImage} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setFeedbackImage('')} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-red-900/20">
                        <X className="w-4 h-4" /> Gỡ ảnh
                      </button>
                    </div>
                  </div>
                )}

                <button onClick={handleSubmitFeedback} disabled={isSubmittingFeedback} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  {isSubmittingFeedback ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi phản hồi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
