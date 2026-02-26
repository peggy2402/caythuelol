import Link from "next/link";
import { Shield, Zap, Trophy, Star, CheckCircle, ArrowRight, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Image from 'next/image';
export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Dịch vụ Cày Thuê Uy Tín #1 Việt Nam
            </div>

            <h1 className="mx-auto max-w-5xl text-5xl font-extrabold tracking-tight text-white md:text-7xl lg:text-8xl mb-8 leading-tight">
              LEO RANK <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                THẦN TỐC & AN TOÀN
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-zinc-400 mb-10 leading-relaxed">
              Đội ngũ Thách Đấu chuyên nghiệp sẵn sàng hỗ trợ bạn đạt được mức rank mong muốn.
              Bảo mật tuyệt đối, giá cả hợp lý, hỗ trợ 24/7.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="group relative flex h-14 w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-8 text-lg font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500 hover:scale-105"
              >
                <span className="relative z-10">Bắt đầu ngay</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 skew-x-12" />
              </Link>
              <Link
                href="/services"
                className="flex h-14 w-full sm:w-auto items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/50 px-8 text-lg font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white backdrop-blur-sm"
              >
                Xem bảng giá
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-10 border-y border-white/5 bg-white/5 backdrop-blur-sm">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Đơn hoàn thành", value: "15,000+", icon: CheckCircle, color: "text-green-500" },
                { label: "Booster", value: "500+", icon: Users, color: "text-yellow-500" },
                { label: "Khách hàng", value: "12,000+", icon: Shield, color: "text-blue-500" },
                { label: "Đánh giá", value: "4.9/5", icon: Star, color: "text-purple-500" },
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center text-center group">
                  <div className={`mb-3 p-3 rounded-full bg-zinc-900/50 border border-white/10 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-24 bg-zinc-950 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Tại sao chọn chúng tôi?</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">Chúng tôi cam kết mang lại trải nghiệm dịch vụ tốt nhất với đội ngũ chuyên nghiệp.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Bảo Mật Tuyệt Đối",
                  desc: "Thông tin tài khoản của bạn được mã hóa và bảo vệ an toàn tuyệt đối. Không sử dụng tool/hack.",
                  icon: Shield,
                  gradient: "from-blue-500/20 to-cyan-500/20"
                },
                {
                  title: "Tốc Độ Thần Tốc",
                  desc: "Đội ngũ Booster hoạt động 24/7 đảm bảo đơn hàng được hoàn thành trong thời gian ngắn nhất.",
                  icon: Zap,
                  gradient: "from-yellow-500/20 to-orange-500/20"
                },
                {
                  title: "Giá Cả Hợp Lý",
                  desc: "Hệ thống tính giá tự động minh bạch, cạnh tranh nhất thị trường. Nhiều ưu đãi hấp dẫn.",
                  icon: Trophy,
                  gradient: "from-purple-500/20 to-pink-500/20"
                }
              ].map((item, idx) => (
                <div key={idx} className="group relative p-8 rounded-2xl border border-white/10 bg-zinc-900/50 hover:bg-zinc-900 transition-all duration-300 hover:-translate-y-1">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
                  <div className="relative z-10">
                    <div className="h-14 w-14 rounded-xl bg-zinc-800 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-24 bg-zinc-900/30 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Quy trình đơn giản</h2>
              <p className="text-zinc-400">Chỉ với 3 bước đơn giản để bắt đầu leo rank</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-600/0 via-blue-600/50 to-blue-600/0" />

              {[
                { step: "01", title: "Chọn Dịch Vụ", desc: "Lựa chọn loại dịch vụ, mức rank mong muốn và các tùy chọn đi kèm." },
                { step: "02", title: "Thanh Toán", desc: "Thanh toán an toàn qua QR Code, Momo hoặc Thẻ ngân hàng." },
                { step: "03", title: "Leo Rank", desc: "Theo dõi tiến độ trực tiếp và chat với Booster qua hệ thống." }
              ].map((item, idx) => (
                <div key={idx} className="relative flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-zinc-900 border-4 border-zinc-800 flex items-center justify-center text-2xl font-bold text-blue-500 mb-6 z-10 shadow-xl shadow-black/50">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-zinc-400 max-w-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-24 bg-zinc-950">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-12 text-center">Khách hàng nói gì?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Minh Hoàng", rank: "Kim Cương I", comment: "Dịch vụ quá tốt, booster đánh nhiệt tình, win streak 10 trận liền. Sẽ ủng hộ tiếp!" },
                { name: "Tuấn Anh", rank: "Cao Thủ", comment: "Hỗ trợ nhiệt tình 24/7. Giá cả hợp lý so với chất lượng. Uy tín số 1." },
                { name: "Đức Thắng", rank: "Bạch Kim II", comment: "Cày siêu tốc, mới đặt sáng chiều đã xong. Giao diện web dễ dùng, tracking tiện lợi." }
              ].map((review, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-blue-500/30 transition-colors">
                  <div className="flex gap-1 text-yellow-500 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="text-zinc-300 mb-6 italic">"{review.comment}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
                      {review.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white">{review.name}</div>
                      <div className="text-xs text-blue-400">{review.rank}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-white/10 pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <Image src="/logo.png" alt="Logo" width={32} height={32} />
                <span className="text-xl font-bold text-white">CAYTHUE<span className="text-blue-500">LOL</span></span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Hệ thống cày thuê Liên Minh Huyền Thoại chuyên nghiệp, uy tín hàng đầu Việt Nam.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Dịch vụ</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Cày Rank</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Cày Thuê Placement</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Cày Thông Thạo</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Coaching 1-1</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Hỗ trợ</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Trung tâm trợ giúp</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Điều khoản dịch vụ</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Chính sách bảo mật</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Liên hệ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Liên hệ</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li>Email: support@caythuelol.vn</li>
                <li>Hotline: 0988.888.888</li>
                <li>Facebook: /caythuelol</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 text-center text-sm text-zinc-600">
            &copy; 2026 CAYTHUELOL. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
