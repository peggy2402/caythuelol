'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Search, ChevronDown, BookOpen, Shield, CreditCard, Gamepad2 } from 'lucide-react';
import BackButton from '@/components/BackButton';

const FAQS = [
  {
    category: 'Tài khoản & Bảo mật',
    icon: Shield,
    items: [
      { q: 'Tài khoản của tôi có an toàn khi giao cho Booster không?', a: 'Có. Chúng tôi mã hóa thông tin tài khoản của bạn. Chỉ Booster nhận đơn mới có thể thấy thông tin. Mọi Booster đều phải ký quỹ và xác minh danh tính trước khi nhận việc.' },
      { q: 'Tôi có thể chơi game khi Booster đang cày không?', a: 'Bạn có thể sử dụng tính năng "Đặt lịch cấm chơi" khi tạo đơn để tránh trùng giờ đăng nhập. Nếu tự ý đăng nhập đè khi Booster đang cày, đơn hàng có thể bị hủy.' }
    ]
  },
  {
    category: 'Giao dịch & Thanh toán',
    icon: CreditCard,
    items: [
      { q: 'Hệ thống giữ tiền (Escrow) hoạt động ra sao?', a: 'Khi bạn thanh toán, hệ thống CAYTHUELOL sẽ giữ số tiền này. Booster chỉ nhận được tiền khi hoàn thành đúng yêu cầu của đơn hàng và bạn xác nhận hài lòng.' },
      { q: 'Tôi có được hoàn tiền nếu Booster không hoàn thành?', a: 'Chắc chắn. Nếu Booster bỏ ngang hoặc không đạt target, hệ thống sẽ hoàn trả 100% số tiền cọc/thanh toán về ví của bạn.' }
    ]
  },
  {
    category: 'Dịch vụ Cày Thuê',
    icon: Gamepad2,
    items: [
      { q: 'Cày Net Wins (Rank Cao Thủ/Thách Đấu) tính điểm thế nào?', a: 'Net Wins = Số trận Thắng - Số trận Thua. Hoặc bạn có thể chọn cày theo mức Điểm (LP) cụ thể. Hệ thống sẽ tự động tính toán quyết toán dựa trên kết quả thực tế.' },
      { q: 'Booster có sử dụng tool/hack không?', a: 'Tuyệt đối KHÔNG. Mọi Booster vi phạm quy định sử dụng phần mềm thứ 3 sẽ bị khóa tài khoản vĩnh viễn, tước tiền cọc và bồi thường cho khách hàng.' }
    ]
  }
];

export default function HelpCenterPage() {
  const [openIndex, setOpenIndex] = useState<string>('0-0');

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30 pb-20 relative overflow-hidden">
      <Navbar />
      
      {/* Background Effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 pt-32 relative z-10">
        <div className="mb-8 flex justify-start w-full">
          <BackButton />
        </div>

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
            <BookOpen className="w-4 h-4" /> Help Center
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">Xin chào, chúng tôi có thể giúp gì?</h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Tìm kiếm câu hỏi..." className="w-full bg-zinc-900/80 border border-zinc-800 rounded-full pl-12 pr-4 py-4 focus:border-blue-500 outline-none backdrop-blur-sm transition-all" />
          </div>
        </div>

        <div className="space-y-12">
          {FAQS.map((cat, cIdx) => (
            <div key={cIdx}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white border-b border-zinc-800 pb-2">
                <cat.icon className="text-blue-500" /> {cat.category}
              </h2>
              <div className="space-y-3">
                {cat.items.map((item, iIdx) => {
                  const id = `${cIdx}-${iIdx}`;
                  const isOpen = openIndex === id;
                  return (
                    <div key={id} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-zinc-900 border-blue-500/50' : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'}`}>
                      <button onClick={() => setOpenIndex(isOpen ? '' : id)} className="w-full flex items-center justify-between p-5 text-left font-semibold text-zinc-200">
                        {item.q}
                        <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && <div className="px-5 pb-5 text-zinc-400 leading-relaxed animate-in fade-in slide-in-from-top-2">{item.a}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
