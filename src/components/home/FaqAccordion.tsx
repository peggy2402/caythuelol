'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: "Tài khoản của tôi có bị khóa khi cày thuê không?",
    a: "LeoRank áp dụng 100% công nghệ ảo hóa VPN định tuyến theo vị trí máy chủ của bạn và bật chế độ Offline trong game. Tuyển thủ không chat, không troll game, đảm bảo an toàn tài khoản tối đa."
  },
  {
    q: "Cơ chế ký quỹ Escrow bảo vệ tôi như thế nào?",
    a: "Khoản tiền của bạn sẽ được giữ an toàn tại tài khoản Escrow của hệ thống. Booster chỉ được thanh toán sau khi bạn đăng nhập xác nhận đúng mức rank cam kết và hài lòng."
  },
  {
    q: "Tôi có thể chơi Duo với Booster mà không cần đưa tài khoản không?",
    a: "Có! Bạn chỉ cần chọn tùy chọn 'Chơi cùng Booster (Duo)' khi đặt đơn. Booster sẽ kết bạn trong game và cùng bạn leo rank mà bạn không cần phải chia sẻ mật khẩu."
  },
  {
    q: "Thời gian hoàn thành một đơn hàng trung bình là bao lâu?",
    a: "Thông thường mỗi bậc rank (ví dụ Vàng IV lên Vàng III) chỉ mất từ 2 đến 4 giờ thi đấu. Nếu chọn gói Siêu Tốc, đơn hàng được ưu tiên chạy liên tục."
  },
  {
    q: "Nếu Booster không đạt mức rank mong muốn thì sao?",
    a: "Hệ thống tự động tính toán đối soát theo quy chuẩn Section 8: hoàn lại 100% tiền cọc cho các mốc chưa hoàn thành, đồng thời hỗ trợ đổi booster khác hoặc hoàn tiền về ví ngay lập tức."
  },
  {
    q: "Làm thế nào để trở thành Booster trên LeoRank?",
    a: "Bạn cần có mức rank từ Cao Thủ 300LP trở lên, trải qua bài test kỹ năng 3 trận và xác minh danh tính KYC kèm tiền cọc bảo chứng uy tín."
  },
  {
    q: "Tôi có thể theo dõi tiến độ cày rank như thế nào?",
    a: "Trang Dashboard của bạn tự động cập nhật kết quả từng trận đấu (Thắng/Thua, KDA, Tướng đã dùng) theo thời gian thực và thông báo tức thì qua Telegram/Zalo."
  },
  {
    q: "Hệ thống hỗ trợ những phương thức nạp/rút nào?",
    a: "LeoRank hỗ trợ nạp tiền tức thì qua VietQR (tất cả ngân hàng Việt Nam), Ví MoMo, Thẻ ATM nội địa và Visa/Mastercard với phí 0%."
  }
];

export default function FaqAccordion() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <section className="py-20 relative z-10 border-t border-zinc-850 bg-[#06080d]/50">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
            <HelpCircle className="w-4 h-4" />
            Giải Đáp Thắc Mắc
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-zinc-400 text-base">
            Mọi thông tin bạn cần biết về độ an toàn, bảo chứng tiền và quy trình cày thuê tại LeoRank.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {FAQS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-zinc-900/80 border border-zinc-800/80 p-5 transition-colors hover:border-zinc-700"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between text-left gap-4"
              >
                <span className="font-bold text-white text-sm sm:text-base">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-cyan-400 shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-zinc-800 text-xs sm:text-sm text-zinc-400 leading-relaxed"
                >
                  {item.a}
                </motion.div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
