'use client';

import { Users, Star, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface ReviewItem {
  id: string;
  name: string;
  country: string;
  game: string;
  stars: number;
  timeAgo: string;
  comment: string;
  avatarBg: string;
  boosterRole?: string;
}

const COLUMN_1_REVIEWS: ReviewItem[] = [
  {
    id: 'c1-1',
    name: 'Nguyễn Hải Đăng',
    country: 'VN',
    game: 'LMHT',
    stars: 5,
    timeAgo: '2 giờ trước',
    comment:
      'Booster đánh quá khủng khiếp, chuỗi 14 trận thắng liền không để thua ván nào. Đặt lúc 10h tối mà sáng hôm sau đã bàn giao xong. Cực kỳ uy tín!',
    avatarBg: 'from-blue-600 to-cyan-500',
    boosterRole: 'Thách Đấu 1100LP',
  },
  {
    id: 'c1-2',
    name: 'Trần Quốc Tuấn',
    country: 'VN',
    game: 'Valorant',
    stars: 5,
    timeAgo: '5 giờ trước',
    comment:
      'Mình chọn gói Chơi Cùng Booster (Duo) vì không muốn share tài khoản. Bạn booster call team nhiệt tình, chỉ bảo kê góc rất hay. Đáng đồng tiền bát gạo!',
    avatarBg: 'from-rose-600 to-amber-500',
    boosterRole: 'Radiant Top 50',
  },
  {
    id: 'c1-3',
    name: 'Lê Minh Quân',
    country: 'VN',
    game: 'Liên Quân Mobile',
    stars: 5,
    timeAgo: '1 ngày trước',
    comment:
      'Hệ thống Escrow giữ tiền làm mình rất yên tâm. Khi nào lên đủ điểm Chiến Tướng mình vào kiểm tra xong mới bấm thanh toán giải ngân.',
    avatarBg: 'from-amber-600 to-yellow-500',
    boosterRole: 'Chiến Thần 85★',
  },
  {
    id: 'c1-4',
    name: 'Hoàng Anh Đức',
    country: 'VN',
    game: 'LMHT: Tốc Chiến',
    stars: 5,
    timeAgo: '1 ngày trước',
    comment:
      'Giao tiếp nhanh gọn, bật VPN định tuyến chuẩn IP Hà Nội nên nick không bị cảnh báo gì cả. Điểm số tăng đều, dịch vụ 10 điểm không có nhưng.',
    avatarBg: 'from-emerald-600 to-teal-500',
    boosterRole: 'Đại Cao Thủ',
  },
  {
    id: 'c1-5',
    name: 'Phạm Thanh Sơn',
    country: 'VN',
    game: 'ĐTCL (TFT)',
    stars: 5,
    timeAgo: '2 ngày trước',
    comment:
      'Fast 8 giữ máu siêu đỉnh, trận nào cũng vào Top 2, Top 1. Chỉ 2 ngày từ Kim Cương IV lên Cao Thủ nhẹ nhàng.',
    avatarBg: 'from-purple-600 to-indigo-500',
    boosterRole: 'Thách Đấu TFT',
  },
];

const COLUMN_2_REVIEWS: ReviewItem[] = [
  {
    id: 'c2-1',
    name: 'Vũ Mạnh Cường',
    country: 'VN',
    game: 'LMHT',
    stars: 5,
    timeAgo: '3 giờ trước',
    comment:
      'Ban đầu hơi e ngại vì sợ lộ pass, nhưng bên LeoRank có mã hóa bảo vệ và bắt buộc booster đổi VPN. KDA toàn 15/2, cực kỳ an tâm.',
    avatarBg: 'from-cyan-600 to-blue-700',
    boosterRole: 'Master 600LP',
  },
  {
    id: 'c2-2',
    name: 'Đỗ Tiến Đạt',
    country: 'VN',
    game: 'Valorant',
    stars: 5,
    timeAgo: '7 giờ trước',
    comment:
      'Aim đối phương gãy hết với booster này. Kéo từ Ascendant lên Immortal 2 chỉ trong 1 ngày cuối tuần. Quá nhanh quá nguy hiểm!',
    avatarBg: 'from-red-600 to-pink-500',
    boosterRole: 'Immortal 3',
  },
  {
    id: 'c2-3',
    name: 'Bùi Gia Huy',
    country: 'VN',
    game: 'Liên Quân Mobile',
    stars: 5,
    timeAgo: '1 ngày trước',
    comment:
      'Giá cày sao tính theo phân khúc rất rõ ràng, không phụ phí phát sinh. Cọc 40% xong cày xong xuôi mới thanh toán nốt. Rất văn minh.',
    avatarBg: 'from-yellow-600 to-orange-500',
    boosterRole: 'Top 1 Server',
  },
  {
    id: 'c2-4',
    name: 'Ngô Việt Hùng',
    country: 'VN',
    game: 'LMHT',
    stars: 5,
    timeAgo: '2 ngày trước',
    comment:
      'Support của LeoRank phản hồi 24/7 siêu tốc. Đơn hàng cập nhật từng trận thắng/thua trực tiếp trên web theo thời gian thực.',
    avatarBg: 'from-sky-600 to-indigo-600',
    boosterRole: 'Challenger 900LP',
  },
  {
    id: 'c2-5',
    name: 'Đặng Tuấn Kiệt',
    country: 'VN',
    game: 'CS2',
    stars: 5,
    timeAgo: '3 ngày trước',
    comment:
      'Rating 18k lên 22k Premier trong vòng 3 ngày. Booster bắn chuẩn pro, không gian lận, tài khoản bảo toàn 100%.',
    avatarBg: 'from-teal-600 to-emerald-500',
    boosterRole: 'Faceit Level 10',
  },
];

export default function CustomerReviews() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#04060a]">
      {/* Background Glow Overlay */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* CỘT TRÁI: BANNER POSTER & TRUST STATS (5 Cột) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Users className="w-3.5 h-3.5" />
                TESTIMONIALS
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15] mb-4">
                Hơn 25.000 Game Thủ Đã Lên Rank Thành Công
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Minh chứng thực tế cho chất lượng dịch vụ và cơ chế bảo chứng ký quỹ (Escrow) số 1 thị trường.
              </p>
            </div>

            {/* 2 Review Provider Badges (Reviews.io & Trustpilot) */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* REVIEWS.io Box */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-cyan-500/40 transition-colors shadow-lg">
                <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider mb-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-black flex items-center justify-center text-[10px] font-bold">★</span>
                  <span>REVIEWS.io</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">4.9</span>
                  <div className="flex text-amber-400 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Dựa trên 3,083+ đánh giá</p>
              </div>

              {/* Trustpilot Box */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/40 transition-colors shadow-lg">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">
                  <span className="text-emerald-400 font-bold">★</span>
                  <span>Trustpilot</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">4.7</span>
                  <div className="flex text-emerald-400 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Dựa trên 650+ đánh giá</p>
              </div>
            </div>

            {/* Visual Mascot Poster Card */}
            <div className="relative rounded-3xl overflow-hidden border border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8 flex items-center justify-between shadow-2xl group">
              <div className="relative z-10 space-y-2 max-w-[65%]">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800/40">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified
                </div>
                <h4 className="text-lg sm:text-xl font-black text-white leading-snug">
                  Đảm bảo mức Rank hoặc Hoàn tiền 100%
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Bảo hiểm rủi ro tài khoản lên tới 100 triệu VNĐ với hệ thống kiểm soát chống vi phạm.
                </p>
              </div>
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/30 transition-all duration-500" />
                <Image
                  src="/images/ranks/challenger.png"
                  alt="Challenger LeoRank"
                  width={110}
                  height={110}
                  className="relative z-10 object-contain drop-shadow-[0_10px_20px_rgba(6,182,212,0.4)] group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          {/* 2 CỘT PHẢI: INFINITE MARQUEE RUNNING UP & DOWN (7 Cột) */}
          <div className="lg:col-span-7 relative h-[600px] overflow-hidden rounded-3xl marquee-container">
            {/* Top & Bottom Gradient Shadows for Seamless Infinite Effect */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#04060a] via-[#04060a]/80 to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#04060a] via-[#04060a]/80 to-transparent z-20 pointer-events-none" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
              
              {/* CỘT 1: CHẠY LÊN TRÊN (Scroll Up) */}
              <div className="flex flex-col gap-4 animate-marquee-up will-change-transform">
                {/* Duplicate mảng 2 lần để chạy liên tục không đứt đoạn */}
                {[...COLUMN_1_REVIEWS, ...COLUMN_1_REVIEWS].map((item, idx) => (
                  <ReviewCard key={`${item.id}-${idx}`} item={item} />
                ))}
              </div>

              {/* CỘT 2: CHẠY XUỐNG DƯỚI (Scroll Down) */}
              <div className="hidden sm:flex flex-col gap-4 animate-marquee-down will-change-transform">
                {/* Duplicate mảng 2 lần để chạy liên tục không đứt đoạn */}
                {[...COLUMN_2_REVIEWS, ...COLUMN_2_REVIEWS].map((item, idx) => (
                  <ReviewCard key={`${item.id}-${idx}`} item={item} />
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  return (
    <div className="p-4 sm:p-4.5 rounded-2xl bg-zinc-900/85 border border-zinc-800/80 hover:border-cyan-500/40 hover:bg-zinc-900 transition-all duration-200 shadow-lg flex flex-col justify-between group">
      <div>
        {/* Top Header: Star + Game + Arrow */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-400 text-xs">
              {[...Array(item.stars)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-cyan-300 font-mono">
              {item.game}
            </span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
        </div>

        {/* Comment Text */}
        <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed mb-3 line-clamp-3">
          &ldquo;{item.comment}&rdquo;
        </p>
      </div>

      {/* User Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/70 text-[11px]">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full bg-gradient-to-br ${item.avatarBg} text-white font-bold flex items-center justify-center text-[10px] shadow-sm`}
          >
            {item.name.charAt(0)}
          </div>
          <div>
            <span className="text-white font-semibold block leading-tight">{item.name}</span>
            <span className="text-[10px] text-zinc-500">{item.country} • {item.timeAgo}</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
          <CheckCircle2 className="w-3 h-3" />
          <span>Đã kiểm chứng</span>
        </div>
      </div>
    </div>
  );
}
