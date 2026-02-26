import Link from "next/link";
import Image from "next/image";
import { Shield, Zap, Trophy, Star, CheckCircle, ArrowRight, Users, Clock, Target, ChevronRight, CreditCard, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <Navbar />

      <main className="relative">
        {/* Ambient Background Noise/Texture */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("/noise.png")' }}></div>
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
          {/* Dynamic Background Glows */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen animate-pulse-slow" />
          <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/5 px-4 py-1.5 text-sm font-semibold text-blue-400 mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all duration-300 cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="tracking-wide uppercase text-xs">Dịch vụ Cày Thuê Uy Tín #1 Việt Nam</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-8 leading-[1.1]">
                LEO RANK <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  THẦN TỐC & AN TOÀN
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl leading-relaxed font-medium">
                Đội ngũ <span className="text-white font-bold">Thách Đấu</span> chuyên nghiệp sẵn sàng hỗ trợ bạn đạt được mức rank mong muốn. 
                Bảo mật tuyệt đối, giá cả hợp lý, hỗ trợ 24/7.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
                <Link
                  href="/dashboard"
                  className="group relative flex h-14 w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-xl bg-blue-600 px-8 text-lg font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(37,99,235,0.5)]"
                >
                  <span className="relative z-10">Bắt đầu ngay</span>
                  <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 skew-x-12" />
                </Link>
                
                <Link
                  href="/services"
                  className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/50 px-8 text-lg font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white hover:border-zinc-500 backdrop-blur-sm"
                >
                  <span>Xem bảng giá</span>
                  <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Floating Cards */}
        <section className="py-12 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm relative z-20">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
              {[
                { label: "Đơn hoàn thành", value: "15,000+", icon: CheckCircle, color: "text-green-400", glow: "group-hover:shadow-green-500/20" },
                { label: "Booster", value: "500+", icon: Users, color: "text-yellow-400", glow: "group-hover:shadow-yellow-500/20" },
                { label: "Khách hàng", value: "12,000+", icon: Shield, color: "text-blue-400", glow: "group-hover:shadow-blue-500/20" },
                { label: "Đánh giá", value: "4.9/5", icon: Star, color: "text-purple-400", glow: "group-hover:shadow-purple-500/20" },
              ].map((stat, idx) => (
                <div key={idx} className={`group flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/40 border border-white/5 transition-all duration-300 hover:-translate-y-2 hover:bg-zinc-800/60 hover:border-white/10 ${stat.glow} hover:shadow-xl`}>
                  <div className={`mb-4 p-3 rounded-xl bg-zinc-950 border border-white/10 ${stat.color} shadow-lg`}>
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tight">{stat.value}</div>
                  <div className="text-sm text-zinc-500 font-semibold uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-32 relative">
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                TẠI SAO CHỌN <span className="text-blue-500">CHÚNG TÔI?</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                Cam kết mang lại trải nghiệm dịch vụ tốt nhất với đội ngũ chuyên nghiệp và hệ thống hiện đại.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Bảo Mật Tuyệt Đối",
                  desc: "Thông tin tài khoản được mã hóa 2 lớp. Cam kết không sử dụng tool/hack, đảm bảo an toàn 100% cho tài khoản của bạn.",
                  icon: Shield,
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  title: "Tốc Độ Thần Tốc",
                  desc: "Đội ngũ Booster hoạt động 24/7. Đơn hàng được xử lý ngay lập tức sau khi thanh toán. Hoàn thành đúng hạn cam kết.",
                  icon: Zap,
                  gradient: "from-yellow-500 to-orange-500"
                },
                {
                  title: "Giá Cả Hợp Lý",
                  desc: "Hệ thống tính giá tự động minh bạch, cạnh tranh nhất thị trường. Nhiều ưu đãi hấp dẫn cho khách hàng thân thiết.",
                  icon: Trophy,
                  gradient: "from-purple-500 to-pink-500"
                }
              ].map((item, idx) => (
                <div key={idx} className="group relative p-1 rounded-3xl bg-gradient-to-b from-white/10 to-white/0 hover:from-blue-500/50 hover:to-purple-500/50 transition-all duration-500">
                  <div className="relative h-full p-8 rounded-[22px] bg-[#0a0a0a] border border-white/5 overflow-hidden">
                    {/* Hover Gradient Blob */}
                    <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-20 blur-[60px] transition-opacity duration-500`} />
                    
                    <div className="relative z-10">
                      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-8 shadow-lg shadow-black/50 group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                      <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-32 bg-zinc-900/30 border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">QUY TRÌNH ĐƠN GIẢN</h2>
              <p className="text-zinc-400 text-lg">Chỉ với 3 bước để bắt đầu hành trình leo rank</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-600/0 via-blue-600/30 to-blue-600/0" />

              {[
                { step: "01", title: "Chọn Dịch Vụ", desc: "Lựa chọn loại dịch vụ, mức rank mong muốn và các tùy chọn đi kèm.", icon: Target },
                { step: "02", title: "Thanh Toán", desc: "Thanh toán an toàn qua QR Code, Momo hoặc Thẻ ngân hàng.", icon: CreditCard },
                { step: "03", title: "Leo Rank", desc: "Theo dõi tiến độ trực tiếp và chat với Booster qua hệ thống.", icon: TrendingUp }
              ].map((item, idx) => (
                <div key={idx} className="relative flex flex-col items-center text-center group">
                  <div className="w-32 h-32 rounded-full bg-zinc-950 border-4 border-zinc-800 flex items-center justify-center mb-8 z-10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-500">
                    <div className="text-4xl font-black text-zinc-700 group-hover:text-blue-500 transition-colors duration-300">{item.step}</div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                  <p className="text-zinc-400 max-w-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-32 relative">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center tracking-tight">KHÁCH HÀNG NÓI GÌ?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Minh Hoàng", rank: "Kim Cương I", comment: "Dịch vụ quá tốt, booster đánh nhiệt tình, win streak 10 trận liền. Sẽ ủng hộ tiếp!", avatar: "M" },
                { name: "Tuấn Anh", rank: "Cao Thủ", comment: "Hỗ trợ nhiệt tình 24/7. Giá cả hợp lý so với chất lượng. Uy tín số 1.", avatar: "T" },
                { name: "Đức Thắng", rank: "Bạch Kim II", comment: "Cày siêu tốc, mới đặt sáng chiều đã xong. Giao diện web dễ dùng, tracking tiện lợi.", avatar: "Đ" }
              ].map((review, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-blue-500/30 hover:bg-zinc-800/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                  <div className="flex gap-1 text-yellow-500 mb-6">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                  </div>
                  <p className="text-zinc-300 mb-8 text-lg italic leading-relaxed">"{review.comment}"</p>
                  <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-lg">
                      {review.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">{review.name}</div>
                      <div className="text-sm text-blue-400 font-medium">{review.rank}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#020202] border-t border-white/10 pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative h-10 w-10">
                   <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tighter">CAYTHUE<span className="text-blue-500">LOL</span></span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Hệ thống cày thuê Liên Minh Huyền Thoại chuyên nghiệp, uy tín hàng đầu Việt Nam.
                Nâng tầm đẳng cấp game thủ.
              </p>
              <div className="flex gap-4">
                {/* Social Icons placeholders */}
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">F</div>
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">Y</div>
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">D</div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Dịch vụ</h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-blue-400 transition-colors hover:underline decoration-blue-500/50 underline-offset-4">Cày Rank</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors hover:underline decoration-blue-500/50 underline-offset-4">Cày Thuê Placement</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors hover:underline decoration-blue-500/50 underline-offset-4">Cày Thông Thạo</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors hover:underline decoration-blue-500/50 underline-offset-4">Coaching 1-1</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Hỗ trợ</h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-blue-400 transition-colors hover:underline decoration-blue-500/50 underline-offset-4">Trung tâm trợ giúp</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors hover:underline decoration-blue-500/50 underline-offset-4">Điều khoản dịch vụ</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors hover:underline decoration-blue-500/50 underline-offset-4">Chính sách bảo mật</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors hover:underline decoration-blue-500/50 underline-offset-4">Liên hệ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Liên hệ</h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500"><Users size={16}/></span>
                  support@caythuelol.vn
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500"><Zap size={16}/></span>
                  0988.888.888
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 text-center text-sm text-zinc-600 flex flex-col md:flex-row justify-between items-center gap-4">
            <span>&copy; 2026 CAYTHUELOL. All rights reserved.</span>
            <div className="flex gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
