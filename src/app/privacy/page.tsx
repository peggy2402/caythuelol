import Navbar from '@/components/Navbar';
import { ShieldCheck } from 'lucide-react';
import BackButton from '@/components/BackButton';

export const metadata = {
  title: 'Chính sách bảo mật | CAYTHUELOL',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30 pb-20 relative">
      <Navbar />
      
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 pt-32 relative z-10">
        <div className="mb-8">
          <BackButton />
        </div>

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4" /> Cam kết an toàn 100%
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">Chính sách bảo mật</h1>
          <p className="text-zinc-400 text-lg">CAYTHUELOL cam kết bảo vệ dữ liệu cá nhân và tài khoản game của bạn bằng các tiêu chuẩn bảo mật cao nhất.</p>
        </div>

        <div className="prose prose-invert prose-blue max-w-none space-y-8 text-zinc-300">
          <section className="bg-zinc-900/50 p-6 md:p-8 rounded-2xl border border-white/5">
            <h2 className="text-2xl font-bold text-white mb-4">Mã hóa Thông tin Game</h2>
            <p>Mật khẩu tài khoản Liên Minh Huyền Thoại của bạn khi được cung cấp cho hệ thống sẽ được mã hóa bằng thuật toán <strong>AES-256</strong> trước khi lưu vào Cơ sở dữ liệu. Mật khẩu này chỉ được giải mã và hiển thị duy nhất cho Booster đã nhận đơn hàng của bạn.</p>
          </section>

          <section className="bg-zinc-900/50 p-6 md:p-8 rounded-2xl border border-white/5">
            <h2 className="text-2xl font-bold text-white mb-4">Thu thập dữ liệu</h2>
            <p>Chúng tôi chỉ thu thập các thông tin cần thiết phục vụ cho việc vận hành dịch vụ:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Email và Tên đăng nhập (Dùng để xác thực và khôi phục tài khoản).</li>
              <li>Lịch sử IP (Dùng để ngăn chặn Spam và Hacker).</li>
              <li>Thông tin tài khoản Game (Phục vụ cho đơn hàng).</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 p-6 md:p-8 rounded-2xl border border-white/5">
            <h2 className="text-2xl font-bold text-white mb-4">Chia sẻ thông tin</h2>
            <p>CAYTHUELOL cam kết <strong>tuyệt đối không bán, trao đổi hoặc chia sẻ</strong> thông tin cá nhân của người dùng cho bất kỳ bên thứ 3 nào vì mục đích thương mại.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
