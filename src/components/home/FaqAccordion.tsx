'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS_LEFT: FaqItem[] = [
  {
    q: "Tài khoản của tôi có bị khóa khi cày thuê không?",
    a: "LeoRank áp dụng 100% công nghệ ảo hóa VPN định tuyến theo vị trí máy chủ của bạn và bật chế độ Offline trong game. Booster không chat, không troll game, đảm bảo an toàn tài khoản tối đa với cam kết bảo hiểm 100% giá trị nick."
  },
  {
    q: "Cơ chế ký quỹ Escrow bảo vệ tôi như thế nào?",
    a: "Khoản tiền của bạn sẽ được giữ an toàn tại tài khoản Escrow của hệ thống. Booster chỉ được thanh toán sau khi bạn đăng nhập xác nhận đúng mức rank cam kết và hài lòng tuyệt đối."
  },
  {
    q: "Tôi có thể chơi Duo với Booster mà không cần đưa tài khoản không?",
    a: "Hoàn toàn được! Bạn chỉ cần chọn tùy chọn 'Chơi cùng Booster (Duo)' khi đặt đơn. Booster sẽ kết bạn trong game và cùng bạn leo rank mà bạn không cần phải chia sẻ mật khẩu hay thông tin tài khoản."
  },
  {
    q: "Thời gian hoàn thành một đơn hàng trung bình là bao lâu?",
    a: "Thông thường mỗi bậc rank (ví dụ Vàng IV lên Vàng III) chỉ mất từ 2 đến 4 giờ thi đấu. Nếu chọn gói Siêu Tốc, đơn hàng được ưu tiên chạy liên tục và hoàn thành chỉ trong 1 đêm."
  }
];

const FAQS_RIGHT: FaqItem[] = [
  {
    q: "Nếu Booster không đạt mức rank mong muốn thì sao?",
    a: "Hệ thống tự động tính toán đối soát theo quy chuẩn Section 8: hoàn lại 100% tiền cọc cho các mốc chưa hoàn thành, đồng thời hỗ trợ đổi booster khác hoặc hoàn tiền về ví ngay lập tức kèm bồi thường."
  },
  {
    q: "Làm thế nào để trở thành Booster trên LeoRank?",
    a: "Bạn cần có mức rank từ Cao Thủ 300LP trở lên (đối với LMHT) hoặc Chiến Tướng 50★ trở lên (đối với Liên Quân), trải qua bài test kỹ năng 3 trận và xác minh danh tính KYC kèm tiền cọc bảo chứng uy tín."
  },
  {
    q: "Tôi có thể theo dõi tiến độ cày rank như thế nào?",
    a: "Trang Dashboard của bạn tự động cập nhật kết quả từng trận đấu (Thắng/Thua, KDA, Tướng đã dùng, LP tăng giảm) theo thời gian thực và gửi thông báo tức thì qua Telegram/Zalo cho bạn."
  },
  {
    q: "Hệ thống hỗ trợ những phương thức nạp/rút nào?",
    a: "LeoRank hỗ trợ nạp tiền tức thì qua VietQR (tất cả các ngân hàng tại Việt Nam), Ví MoMo, Thẻ ATM nội địa và Visa/Mastercard với phí nạp 0% và xử lý giao dịch tự động chỉ trong 30 giây."
  }
];

export default function FaqAccordion() {
  const [openLeft, setOpenLeft] = useState<number | null>(0); // Mở câu đầu tiên mặc định
  const [openRight, setOpenRight] = useState<number | null>(null);

  return (
    <section className="py-24 relative z-10 border-t border-zinc-850 bg-[#06080d]/60 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            Giải Đáp Thắc Mắc
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
            Mọi thông tin bạn cần biết về độ an toàn, bảo chứng tiền và quy trình cày thuê tại LeoRank.
          </p>
        </div>

        {/* 2 Cột Độc Lập - Giải quyết triệt để lỗi kéo dãn chiều cao trống rỗng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
          
          {/* CỘT TRÁI */}
          <div className="space-y-4">
            {FAQS_LEFT.map((item, idx) => {
              const isOpen = openLeft === idx;
              return (
                <div
                  key={`left-${idx}`}
                  className={`rounded-2xl transition-all duration-200 border ${
                    isOpen
                      ? 'bg-zinc-900 border-cyan-500/40 shadow-[0_8px_30px_rgba(6,182,212,0.08)]'
                      : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenLeft(isOpen ? null : idx)}
                    className="w-full p-5 flex items-center justify-between text-left gap-4"
                  >
                    <span className="font-bold text-white text-sm sm:text-base leading-snug">
                      {item.q}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isOpen
                          ? 'bg-cyan-500 text-black rotate-180 shadow-md shadow-cyan-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-300/90 leading-relaxed border-t border-zinc-800/60 mt-1">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* CỘT PHẢI */}
          <div className="space-y-4">
            {FAQS_RIGHT.map((item, idx) => {
              const isOpen = openRight === idx;
              return (
                <div
                  key={`right-${idx}`}
                  className={`rounded-2xl transition-all duration-200 border ${
                    isOpen
                      ? 'bg-zinc-900 border-cyan-500/40 shadow-[0_8px_30px_rgba(6,182,212,0.08)]'
                      : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenRight(isOpen ? null : idx)}
                    className="w-full p-5 flex items-center justify-between text-left gap-4"
                  >
                    <span className="font-bold text-white text-sm sm:text-base leading-snug">
                      {item.q}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isOpen
                          ? 'bg-cyan-500 text-black rotate-180 shadow-md shadow-cyan-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-300/90 leading-relaxed border-t border-zinc-800/60 mt-1">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
