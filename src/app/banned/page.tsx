import Link from 'next/link';
import { ShieldAlert, Mail, MessageCircle } from 'lucide-react';

export default function BannedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md w-full bg-zinc-900 border border-red-500/20 rounded-2xl p-8 text-center space-y-6 shadow-2xl shadow-red-500/10">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white">Tài khoản bị tạm khóa</h1>
        
        <p className="text-zinc-400 text-sm leading-relaxed">
          Tài khoản của bạn đã bị khóa tạm thời do vi phạm chính sách của nền tảng hoặc có khoản nợ cước quá hạn chưa được thanh toán. 
        </p>
        
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-left space-y-3">
          <p className="text-sm text-zinc-300 font-medium">Cách liên hệ hỗ trợ mở khóa:</p>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <Mail className="w-4 h-4 text-blue-400" />
            <span>Email: support@caythuelol.com</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            <span>Discord: discord.gg/caythuelol</span>
          </div>
        </div>
        
        <div className="pt-4">
          <Link 
            href="/" 
            className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors w-full"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}