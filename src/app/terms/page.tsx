import Navbar from '@/components/Navbar';
import { FileText } from 'lucide-react';
import BackButton from '@/components/BackButton';

export const metadata = {
  title: 'Điều khoản dịch vụ | CAYTHUELOL',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30 pb-20 relative">
      <Navbar />
      
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 pt-32 relative z-10">
        <div className="mb-8">
          <BackButton />
        </div>

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6">
            <FileText className="w-4 h-4" /> Cập nhật lần cuối: 10/03/2026
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">Điều khoản dịch vụ</h1>
          <p className="text-zinc-400 text-lg">Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng hệ thống CAYTHUELOL.</p>
        </div>

        <div className="prose prose-invert prose-blue max-w-none space-y-8 text-zinc-300">
          <section className="bg-zinc-900/50 p-6 md:p-8 rounded-2xl border border-white/5">
            <h2 className="text-2xl font-bold text-white mb-4">1. Chấp nhận điều khoản</h2>
            <p>Bằng việc đăng ký tài khoản và sử dụng dịch vụ tại CAYTHUELOL, bạn đồng ý tuân thủ toàn bộ các quy định và điều khoản của chúng tôi. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.</p>
          </section>

          <section className="bg-zinc-900/50 p-6 md:p-8 rounded-2xl border border-white/5">
            <h2 className="text-2xl font-bold text-white mb-4">2. Quy định dành cho Khách hàng</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Tuyệt đối không tự ý đăng nhập vào tài khoản game trong quá trình Booster đang thực hiện đơn hàng (trừ khi nằm trong khung giờ Đặt lịch cấm chơi).</li>
              <li>Không yêu cầu Booster thực hiện các giao dịch ngầm bên ngoài hệ thống.</li>
              <li>Cung cấp thông tin tài khoản (Tài khoản, Mật khẩu, Server) chính xác.</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 p-6 md:p-8 rounded-2xl border border-white/5">
            <h2 className="text-2xl font-bold text-white mb-4">3. Quy định về Hoàn tiền & Tranh chấp</h2>
            <p>Hệ thống hoạt động dựa trên cơ chế giữ tiền trung gian (Escrow). Tiền sẽ được hoàn lại 100% cho khách hàng trong các trường hợp sau:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Booster tự ý hủy đơn hoặc quá thời hạn quy định mà không hoàn thành.</li>
              <li>Booster sử dụng phần mềm thứ 3 (Tool/Hack) dẫn đến khóa tài khoản khách hàng.</li>
              <li>Tranh chấp xảy ra và bộ phận Quản trị (Admin) phán quyết lỗi thuộc về Booster.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
