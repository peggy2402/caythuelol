'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Shield, Zap, Trophy, Star, CheckCircle, ArrowRight, Users, Clock, Target, ChevronRight, CreditCard, TrendingUp, Activity, Sparkles, MessageSquarePlus, Lightbulb, Bug, X, Loader2, UploadCloud, Facebook, Youtube, MessageCircle, Mail, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/i18n";
import { motion, useScroll, useTransform, Variants, AnimatePresence } from "framer-motion";
import CountUp from 'react-countup';
import { toast } from "sonner";
import { FaDiscord, FaFacebookMessenger } from "react-icons/fa";
// Lightweight Custom Typewriter Hook
const Typewriter = ({ words }: { words: string[] }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 2500);
      return () => clearTimeout(timeout);
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 40 : 80);
    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  return <span className="inline-block min-w-[20px]">{words[index].substring(0, subIndex)}<span className="animate-pulse">|</span></span>;
};

export default function Home() {
  const { t } = useLanguage();
  const [scrollY, setScrollY] = useState(0);

  // Parallax effects
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Feedback Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'BUG' | 'SUGGESTION'>('BUG');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackImage, setFeedbackImage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] } }
  };

  const typewriterWords = [
    "Boost rank siêu tốc",
    "Bảo mật tài khoản tuyệt đối",
    "Đội ngũ Thách Đấu 1000LP+",
    "Hỗ trợ nhiệt tình 24/7"
  ];

  // Hàm xử lý Upload file lên Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Giới hạn dung lượng 5MB
      if (file.size > 5 * 1024 * 1024) {
          return toast.error("Kích thước ảnh tối đa là 5MB!");
      }

      setIsUploadingImage(true);
      try {
          const formData = new FormData();
          formData.append('file', file);
          
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await res.json();
          
          if (!res.ok) throw new Error(data.error || "Tải ảnh thất bại");
          
          setFeedbackImage(data.url || data.secure_url);
      } catch (error: any) {
          toast.error(error.message);
      } finally {
          setIsUploadingImage(false);
      }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return toast.error("Vui lòng nhập nội dung!");
    setIsSubmittingFeedback(true);
    try {
        const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type: feedbackType, 
                message: feedbackText,
                imageUrl: feedbackImage
            })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Lỗi khi gửi phản hồi");

        toast.success("Cảm ơn bạn đã đóng góp ý kiến!");
        setIsFeedbackOpen(false);
        setFeedbackText('');
        setFeedbackImage('');
    } catch (error: any) {
        toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
        setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-blue-500/30 overflow-x-hidden" suppressHydrationWarning>
      <Navbar />

      <main className="relative">
        {/* Ambient Background Noise/Texture */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.png")' }}></div>
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden min-h-[90vh] flex items-center">
          {/* Dynamic Background Glows */}
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
          <div className="absolute top-[10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

          <motion.div style={{ opacity: opacityHero, y: y1 }} className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
              
              {/* Left Content */}
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col items-start text-left max-w-2xl">
                
                {/* Badge */}
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 mb-6 backdrop-blur-md">
                  <Sparkles className="w-4 h-4" />
                  <span className="tracking-wide">{t('heroBadge')}</span>
                </motion.div>

                {/* Headline */}
                <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-6 leading-[1.15]">
                  {t('heroTitle1')} <br />
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                    {t('heroTitle2')}
                  </span>
                </motion.h1>

                {/* Typewriter Effect */}
                <motion.div variants={itemVariants} className="h-8 mb-6 text-xl md:text-2xl font-medium text-zinc-300 flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-blue-500" />
                  <Typewriter words={typewriterWords} />
                </motion.div>

                {/* Subheadline */}
                <motion.p variants={itemVariants} className="text-lg text-zinc-400 mb-10 max-w-xl leading-relaxed">
                  {t('heroDesc')}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <div className="relative group w-full sm:w-auto">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <Link
                      href="/dashboard"
                      className="relative flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-zinc-950 px-8 text-lg font-bold text-white border border-white/10 transition-all hover:bg-zinc-900"
                    >
                      <span>{t('startNow')}</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                  
                  <Link
                    href="/services"
                    className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-transparent px-8 text-lg font-bold text-zinc-400 transition-all hover:text-white hover:bg-white/5"
                  >
                    <span>{t('viewPricing')}</span>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Right Visual - SaaS Dashboard Mockup style */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="relative lg:h-[600px] w-full flex items-center justify-center"
              >
                {/* Main Abstract Window */}
                <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_80px_rgba(37,99,235,0.15)] overflow-hidden">
                  {/* macOS style header */}
                  <div className="h-10 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                  </div>
                  
                  {/* Dashboard Content Mock */}
                  <div className="p-6 relative h-full">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[60px] rounded-full" />
                     <div className="flex justify-between items-center mb-6">
                        <div className="space-y-1">
                           <div className="h-2 w-16 bg-zinc-800 rounded"></div>
                           <div className="text-xl font-bold text-white tracking-tight">Win Rate</div>
                        </div>
                        <Activity className="text-cyan-400" />
                     </div>
                     
                     {/* Graph Lines */}
                     <svg className="w-full h-24 mb-6" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <motion.path 
                          d="M0 30 Q 20 35, 40 20 T 70 10 T 100 5" 
                          fill="none" 
                          stroke="url(#gradient)" 
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, ease: "easeInOut", delay: 0.8 }}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#22d3ee" />
                          </linearGradient>
                        </defs>
                     </svg>

                     <div className="space-y-3">
                        <div className="h-10 w-full bg-zinc-900/50 rounded-lg border border-white/5"></div>
                        <div className="h-10 w-[80%] bg-zinc-900/50 rounded-lg border border-white/5"></div>
                     </div>
                  </div>
                </div>

                {/* Floating Glassmorphism UI Card */}
                <motion.div
                  animate={{ y: [-15, 10, -15] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-8 -left-6 z-20 w-[280px] p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-inner">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">Booster Pro</div>
                      <div className="text-cyan-400 text-[10px] font-mono tracking-wider uppercase">Thách Đấu 1200 LP</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-zinc-400">Tỉ lệ thắng:</span>
                    <span className="text-green-400 font-bold">92%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '92%' }}
                      transition={{ duration: 1.5, delay: 1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" 
                    />
                  </div>
                </motion.div>

              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Stats Section - Floating Cards */}
        <section className="py-16 relative z-20">
          <div className="container mx-auto px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
            >
              {[
                { label: t('statsCompleted'), num: 15000, suffix: "+", icon: CheckCircle, color: "text-green-400", glow: "group-hover:shadow-green-500/20" },
                { label: t('statsBooster'), num: 500, suffix: "+", icon: Users, color: "text-yellow-400", glow: "group-hover:shadow-yellow-500/20" },
                { label: t('statsCustomer'), num: 12000, suffix: "+", icon: Shield, color: "text-blue-400", glow: "group-hover:shadow-blue-500/20" },
                { label: t('statsRating'), num: 4.9, decimals: 1, suffix: "/5", icon: Star, color: "text-purple-400", glow: "group-hover:shadow-purple-500/20" },
              ].map((stat, idx) => (
                <motion.div variants={itemVariants} key={idx} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl blur-sm transition-all duration-300 group-hover:bg-white/10" />
                  <div className={`relative flex flex-col items-center justify-center p-8 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-sm border border-white/5 transition-all duration-500 hover:-translate-y-2 hover:border-white/10 ${stat.glow} shadow-xl overflow-hidden`}>
                    <div className="absolute top-0 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className={`mb-5 p-3.5 rounded-xl bg-zinc-900/50 border border-white/5 ${stat.color} shadow-inner`}>
                      <stat.icon className="h-7 w-7" />
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                      <CountUp 
                        end={stat.num} 
                        decimals={stat.decimals || 0} 
                        duration={2.5} 
                        separator="," 
                        enableScrollSpy 
                        scrollSpyOnce 
                      />
                      {stat.suffix}
                    </div>
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-32 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                {t('whyChoose')} <span className="text-blue-500">{t('whyChooseUs')}</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                {t('whyDesc')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: t('secSecurity'), desc: t('descSecurity'), icon: Shield, gradient: "from-blue-500 to-cyan-500" },
                {
                  title: t('secSpeed'),
                  desc: t('descSpeed'),
                  icon: Zap,
                  gradient: "from-yellow-500 to-orange-500"
                },
                {
                  title: t('secPrice'),
                  desc: t('descPriceGood'),
                  icon: Trophy,
                  gradient: "from-purple-500 to-pink-500"
                }
              ].map((item, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative rounded-3xl bg-gradient-to-b from-white/5 to-transparent p-[1px] hover:from-white/20 transition-all duration-500"
                >
                  <div className="relative h-full p-8 rounded-[23px] bg-[#080808] overflow-hidden">
                    {/* Hover Gradient Blob */}
                    <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 blur-[60px] transition-opacity duration-700`} />
                    
                    <div className="relative z-10">
                      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-8 shadow-lg shadow-black/50 group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                      <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-black" />
          
          <div className="container mx-auto px-6 relative z-10">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">{t('processTitle')}</h2>
              <p className="text-zinc-400 text-lg">{t('processDesc')}</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

              {[
                { step: "01", title: t('step1'), desc: t('step1Desc'), icon: Target },
                { step: "02", title: t('step2'), desc: t('step2Desc'), icon: CreditCard },
                { step: "03", title: t('step3'), desc: t('step3Desc'), icon: TrendingUp }
              ].map((item, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  className="relative flex flex-col items-center text-center group"
                >
                  <div className="w-24 h-24 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-center mb-8 z-10 backdrop-blur-md shadow-xl group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-500 rotate-3 group-hover:rotate-0">
                    <div className="text-3xl font-black text-zinc-600 group-hover:text-blue-400 transition-colors duration-300">{item.step}</div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                  <p className="text-zinc-400 max-w-xs text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-32 relative">
          <div className="container mx-auto px-6">
            <motion.h2 
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-16 text-center tracking-tight"
            >
              {t('reviewsTitle')}
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Minh Hoàng", rank: "Kim Cương I", comment: "Dịch vụ quá tốt, booster đánh nhiệt tình, win streak 10 trận liền. Sẽ ủng hộ tiếp!", avatar: "M" },
                { name: "Tuấn Anh", rank: "Cao Thủ", comment: "Hỗ trợ nhiệt tình 24/7. Giá cả hợp lý so với chất lượng. Uy tín số 1.", avatar: "T" },
                { name: "Đức Thắng", rank: "Bạch Kim II", comment: "Cày siêu tốc, mới đặt sáng chiều đã xong. Giao diện web dễ dùng, tracking tiện lợi.", avatar: "Đ" }
              ].map((review, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} 
                  className="p-8 rounded-3xl bg-[#080808] border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between"
                >
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
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Floating Feedback Button (Góc dưới bên trái để tránh đụng Chat Widget nếu có) */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-6 left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-700 hover:border-blue-500 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all group"
        title="Góp ý & Báo lỗi"
      >
        <MessageSquarePlus className="w-6 h-6 text-zinc-400 group-hover:text-blue-400 transition-colors" />
      </button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900/90 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] backdrop-blur-md"
            >
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <MessageSquarePlus className="w-5 h-5 text-blue-500" />
                  Góp ý & Báo lỗi hệ thống
                </h3>
                <button onClick={() => setIsFeedbackOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setFeedbackType('BUG')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${feedbackType === 'BUG' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}>
                    <Bug className="w-5 h-5" />
                    <span className="text-sm font-bold">Báo lỗi</span>
                  </button>
                  <button onClick={() => setFeedbackType('SUGGESTION')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${feedbackType === 'SUGGESTION' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}>
                    <Lightbulb className="w-5 h-5" />
                    <span className="text-sm font-bold">Góp ý cải tiến</span>
                  </button>
                </div>

                <textarea
                  autoFocus
                  value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={feedbackType === 'BUG' ? 'Mô tả chi tiết lỗi bạn gặp phải (Ví dụ: Không nạp được tiền, Web bị giật...)' : 'Bạn muốn hệ thống có thêm tính năng gì?'}
                  className="w-full h-28 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none resize-none placeholder:text-zinc-600"
                />

                {/* Vùng tải ảnh đính kèm */}
                {!feedbackImage ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-sm transition-colors ${isUploadingImage ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-zinc-800 bg-zinc-950/50 text-zinc-500 hover:border-zinc-600 hover:bg-zinc-900'}`}>
                      {isUploadingImage ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Đang tải ảnh lên...</>
                      ) : (
                        <><UploadCloud className="w-5 h-5" /> Tải lên ảnh màn hình (Tùy chọn)</>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-zinc-800 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={feedbackImage} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setFeedbackImage('')} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-red-900/20">
                        <X className="w-4 h-4" /> Gỡ ảnh
                      </button>
                    </div>
                  </div>
                )}

                <button onClick={handleSubmitFeedback} disabled={isSubmittingFeedback} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmittingFeedback ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi phản hồi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative bg-[#030303] border-t border-white/5 pt-20 pb-10 overflow-hidden">
        {/* Glow Line & Ambient Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative h-10 w-10">
                   <Image src="/logo-ver3.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tighter">CAYTHUE<span className="text-blue-500">LOL</span></span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm">
                {t("footerDesc")}
              </p>
              <div className="flex gap-4">
                <a 
                  href="https://www.facebook.com/boostking.official/" 
                  className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all shadow-lg hover:shadow-[#1877F2]/25"
                >
                  <Facebook size={18} />
                </a>

                <a 
                  href="https://discord.gg/yourserver" 
                  className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2] transition-all shadow-lg hover:shadow-[#5865F2]/25"
                >
                  <FaDiscord size={18} />
                </a>

                <a 
                  href="https://www.messenger.com/t/1067718439753127/" 
                  className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:bg-[#0084FF] hover:text-white hover:border-[#0084FF] transition-all shadow-lg hover:shadow-[#0084FF]/25"
                >
                  <FaFacebookMessenger size={18} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">{t("services")}</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><Link href="/services/lol/rank-boost" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-500 transition-colors" /> {t("serviceList.boostRank")}</Link></li>
                <li><Link href="/services/lol/placements" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-500 transition-colors" /> {t("serviceList.placement")}</Link></li>
                <li><Link href="/services/lol/mastery" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-500 transition-colors" /> {t("serviceList.mastery")}</Link></li>
                <li><Link href="/services/lol/coaching" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-500 transition-colors" /> {t("serviceList.coaching")}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">{t("support")}</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><Link href="/help" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-500 transition-colors" /> {t("supportList.helpCenter")}</Link></li>
                <li><Link href="/terms" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-500 transition-colors" /> {t("supportList.terms")}</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-500 transition-colors" /> {t("supportList.privacy")}</Link></li>
                <li><Link href="/contact" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-500 transition-colors" /> {t("supportList.contact")}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">{t("contact")}</h4>
              <ul className="space-y-4 text-sm text-zinc-400 mt-2">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-blue-500 shrink-0"><Mail size={14}/></div>
                  <a href="mailto:support@caythuelol.com" className="hover:text-blue-400 transition-colors">support@caythuelol.com</a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-blue-500 shrink-0"><Phone size={14}/></div>
                  <span className="font-mono">0862.587.229</span>
                </li>
                {/* Thời gian hoạt động */}
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-blue-500 shrink-0"><Clock size={14}/></div>
                  {t("contactHours")}
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-sm text-zinc-500">&copy; {new Date().getFullYear()} CAYTHUELOL. All rights reserved.</span>
            <div className="flex gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
