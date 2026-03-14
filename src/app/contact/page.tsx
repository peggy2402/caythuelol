'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FaDiscord, FaFacebookMessenger } from "react-icons/fa";
import BackButton from '@/components/BackButton';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return toast.error("Vui lòng điền đủ thông tin");
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Gửi tin nhắn thất bại");
      
      toast.success("Đã gửi tin nhắn!", { description: "Chúng tôi sẽ phản hồi lại bạn qua Email sớm nhất có thể." });
      setFormData({ name: '', email: '', message: '' });
      
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30 pb-20 relative">
      <Navbar />
      
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 pt-32 relative z-10">
        <div className="mb-8">
          <BackButton />
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Left: Contact Info */}
          <div>
            <h1 className="text-4xl md:text-6xl font-black mb-6">Liên hệ với chúng tôi</h1>
            <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
              Bạn có thắc mắc về dịch vụ, hoặc cần hỗ trợ về đơn hàng? Hãy liên hệ ngay, đội ngũ CAYTHUELOL hoạt động 24/7.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Email hỗ trợ</div>
                  <div className="font-bold text-lg">support@caythuelol.com</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Hotline (Zalo)</div>
                  <div className="font-bold text-lg">0862.587.229</div>
                </div>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="mt-8 rounded-2xl overflow-hidden border border-white/5 opacity-80 hover:opacity-100 transition-opacity h-64 bg-zinc-900">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.096814183571!2d105.7827318!3d21.0288118!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab86cece9ac1%3A0xa9bc04e04602f85b!2zVMO0biBUaOG6pXQgVGh1eeG6v3QsIEPhuqd1IEdp4bqleSwgSMOgIE7hu5lp!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            <div className="mt-12 flex gap-4">
              <a href="#" className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#1877F2] hover:border-[#1877F2] transition-colors"><FaFacebookMessenger size={20} /></a>
              <a href="#" className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#5865F2] hover:border-[#5865F2] transition-colors"><FaDiscord size={20} /></a>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-zinc-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Gửi tin nhắn trực tiếp</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Họ và tên</label>
                  <input 
                    required type="text" 
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="VD: Nguyễn Văn A" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Email liên hệ</label>
                  <input 
                    required type="email" 
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="email@example.com" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Nội dung cần hỗ trợ</label>
                <textarea 
                  required rows={5} 
                  value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none resize-none" placeholder="Mô tả chi tiết vấn đề của bạn..."
                ></textarea>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Gửi tin nhắn</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
