// src/app/booster/apply/page.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle2, ShieldAlert, Upload, ChevronRight, ChevronLeft, AlertTriangle, Trophy, ChevronsUpDown, Check, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

// UI Components (Giả sử bạn đã cài Shadcn)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/i18n';

// --- Zod Schema cho Frontend ---
const formSchema = z.object({
  fullName: z.string().min(2, "Họ tên quá ngắn"),
  phoneNumber: z.string().regex(/^[0-9]{10,11}$/, "SĐT không hợp lệ"),
  facebookUrl: z.string().url("Link Facebook không hợp lệ"),
  discordTag: z.string().min(3, "Discord Tag không hợp lệ"),
  currentRank: z.string().min(1, "Vui lòng nhập Rank hiện tại"),
  highestRank: z.string().min(1, "Vui lòng nhập Rank cao nhất"),
  opggLink: z.string().url("Link OP.GG không hợp lệ"),
  rankImageUrl: z.string().url("Vui lòng upload ảnh bằng chứng"), // Giả lập đã có URL
  bankName: z.string().min(1, "Vui lòng chọn ngân hàng"),
  bankAccountName: z.string().min(1, "Vui lòng nhập tên chủ TK"),
  bankAccountNumber: z.string().min(1, "Vui lòng nhập số TK"),
  agreementSigned_name: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface Bank {
  id: number;
  name: string;
  code: string;
  shortName: string;
  logo: string;
}

export default function BoosterApplyPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Bank State
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange'
  });

  const fullName = watch('fullName');
  const signature = watch('agreementSigned_name');
  const selectedBankName = watch('bankName');

  // Fetch Banks
  React.useEffect(() => {
    fetch('https://api.vietqr.io/v2/banks')
      .then(res => res.json())
      .then(data => setBanks(data.data || []))
      .catch(err => console.error("Failed to fetch banks", err));
  }, []);

  // --- Constants with i18n ---
  const STEPS = [
    { id: 1, title: t('step1Info'), icon: "👤" },
    { id: 2, title: t('step2Game'), icon: "🎮" },
    { id: 3, title: t('step3Commit'), icon: "✍️" },
  ];

  const COMMITMENTS = [
    { id: 'tool', title: t('commitTool'), desc: t('commitToolDesc') },
    { id: 'security', title: t('commitSecurity'), desc: t('commitSecurityDesc') },
    { id: 'private', title: t('commitPrivate'), desc: t('commitPrivateDesc') },
    { id: 'stream', title: t('commitStream'), desc: t('commitStreamDesc') },
    { id: 'penalty', title: t('commitPenalty'), desc: t('commitPenaltyDesc') },
    { id: 'deposit', title: t('commitDeposit'), desc: t('commitDepositDesc') },
  ];

  // --- Handlers ---
  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) fieldsToValidate = ['fullName', 'phoneNumber', 'facebookUrl', 'discordTag'];
    if (step === 2) fieldsToValidate = ['currentRank', 'highestRank', 'opggLink', 'rankImageUrl', 'bankName', 'bankAccountName', 'bankAccountNumber'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const toggleAgreement = (id: string) => {
    setAgreements(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allAgreementsChecked = COMMITMENTS.every(c => agreements[c.id]);
  const isSignatureValid = signature && fullName && signature.trim().toLowerCase() === fullName.trim().toLowerCase();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/boosters/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Đăng ký thất bại");
      }

      toast.success("Đăng ký thành công!", {
        description: "Hồ sơ của bạn đang được xét duyệt. Vui lòng chờ liên hệ qua Discord.",
      });
      
      router.push('/dashboard'); // Redirect về dashboard
    } catch (error: any) {
      toast.error("Lỗi", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  // --- Render Components ---

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30 relative overflow-hidden">
      <Navbar />
      
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('/noise.png')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 pt-28 pb-20 container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
              <Trophy className="w-3 h-3" /> {t('boosterApplySubtitle') || 'Join the Elite'}
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
              {t('boosterApplyTitle')}
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
              {t('boosterApplyDesc')}
            </p>
          </motion.div>
        </div>

        {/* Stepper */}
        <div className="mb-12">
          <div className="relative">
            {/* Progress Bar Background */}
            <div className="absolute top-6 left-0 w-full h-1 bg-zinc-800 rounded-full -z-10 -translate-y-1/2">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>

            <div className="flex justify-between items-center w-full">
              {STEPS.map((s) => {
                const isActive = step >= s.id;
                const isCurrent = step === s.id;
                
                return (
                  <div key={s.id} className="flex flex-col items-center gap-3 relative group">
                    {/* Circle */}
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 relative
                        ${isActive 
                          ? 'bg-zinc-900 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                          : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                        }
                      `}
                    >
                      {step > s.id ? (
                        <CheckCircle2 className="w-6 h-6 text-blue-500" />
                      ) : (
                        <span className={`text-lg font-bold ${isActive ? 'text-blue-400' : 'text-zinc-600'}`}>{s.id}</span>
                      )}
                      
                      {/* Active Pulse Ring */}
                      {isCurrent && (
                        <span className="absolute inset-0 rounded-full border border-blue-500/50 animate-ping opacity-75" />
                      )}
                    </div>

                    {/* Label */}
                    <span className={`hidden md:block text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mobile Step Label - Chỉ hiện tên bước đang active trên mobile để tránh dính chữ */}
            <div className="md:hidden text-center mt-6">
              <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                {STEPS[step - 1]?.title}
              </span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-50" />
          <CardContent className="p-6 md:p-10">
            <form onSubmit={(e) => e.preventDefault()}>
              <AnimatePresence mode="wait">
                
                {/* STEP 1: PERSONAL INFO */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-zinc-400">{t('fullName')}</Label>
                        <Input {...register('fullName')} placeholder="Nguyễn Văn A" className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20" />
                        {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400">{t('phoneNumber')}</Label>
                        <Input {...register('phoneNumber')} placeholder="0912..." className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20" />
                        {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400">{t('facebookUrl')}</Label>
                        <Input {...register('facebookUrl')} placeholder="https://facebook.com/..." className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20" />
                        {errors.facebookUrl && <p className="text-red-500 text-xs">{errors.facebookUrl.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400">{t('discordTag')}</Label>
                        <Input {...register('discordTag')} placeholder="username#1234" className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20" />
                        {errors.discordTag && <p className="text-red-500 text-xs">{errors.discordTag.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: GAME & BANK INFO */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    {/* Game Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span> {t('servicesCurrentRank')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-zinc-400">{t('servicesCurrentRank')}</Label>
                          <Input {...register('currentRank')} placeholder="VD: Cao Thủ 200LP" className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20" />
                          {errors.currentRank && <p className="text-red-500 text-xs">{errors.currentRank.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-400">{t('highestRank')}</Label>
                          <Input {...register('highestRank')} placeholder="VD: Thách Đấu 500LP" className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20" />
                          {errors.highestRank && <p className="text-red-500 text-xs">{errors.highestRank.message}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-zinc-400">{t('opggLink')}</Label>
                          <Input {...register('opggLink')} placeholder="https://www.op.gg/summoners/vn/..." className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20" />
                          {errors.opggLink && <p className="text-red-500 text-xs">{errors.opggLink.message}</p>}
                        </div> 
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-zinc-400">{t('rankProof')}</Label>
                          {/* Note: Thực tế sẽ dùng component Upload Cloudinary ở đây */}
                          <div className="flex gap-2">
                            <Input {...register('rankImageUrl')} placeholder="https://i.imgur.com/..." className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20" />
                            <Button type="button" variant="outline" className="border-white/10 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"><Upload size={16} /></Button>
                          </div>
                          <p className="text-xs text-slate-500">Vui lòng upload ảnh chụp màn hình client game có hiển thị rank và ngày giờ hệ thống.</p>
                          {errors.rankImageUrl && <p className="text-red-500 text-xs">{errors.rankImageUrl.message}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Deposit Info */}
                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="text-blue-400 shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold text-blue-300">{t('depositInfoTitle')}</h4>
                          <p className="text-sm text-zinc-400 mt-1">
                            {t('depositInfoDesc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Booster Bank Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span> {t('bankName')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-zinc-400">{t('bankName')}</Label>
                          
                          {/* Custom Bank Selector */}
                          <div className="relative">
                            <div 
                              onClick={() => setIsBankOpen(!isBankOpen)}
                              className="flex items-center justify-between w-full rounded-md border border-white/10 bg-zinc-950/50 px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 cursor-pointer h-10"
                            >
                              {selectedBankName ? (
                                <div className="flex items-center gap-2">
                                  {banks.find(b => b.shortName === selectedBankName)?.logo && (
                                    <img src={banks.find(b => b.shortName === selectedBankName)?.logo} alt="Bank Logo" className="w-6 h-6 object-contain bg-white rounded-full p-0.5" />
                                  )}
                                  <span className="text-white font-medium truncate">{selectedBankName}</span>
                                </div>
                              ) : (
                                <span className="text-zinc-600">Chọn ngân hàng...</span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </div>

                            {/* Dropdown Panel */}
                            {isBankOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsBankOpen(false)} />
                                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-white/10 bg-zinc-900 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                  <div className="sticky top-0 z-10 bg-zinc-900 p-2 border-b border-white/10">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                                      <input 
                                        className="w-full bg-zinc-800 text-white rounded-md py-2 pl-8 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Tìm kiếm ngân hàng..."
                                        value={bankSearch}
                                        onChange={(e) => setBankSearch(e.target.value)}
                                        autoFocus
                                      />
                                    </div>
                                  </div>
                                  {banks.filter(b => b.shortName.toLowerCase().includes(bankSearch.toLowerCase()) || b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.code.toLowerCase().includes(bankSearch.toLowerCase())).map((bank) => (
                                    <div
                                      key={bank.id}
                                      className="relative flex cursor-pointer select-none items-center py-2 pl-3 pr-9 hover:bg-blue-600/20 hover:text-blue-400 text-zinc-300"
                                      onClick={() => {
                                        setValue('bankName', bank.shortName, { shouldValidate: true });
                                        setIsBankOpen(false);
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <img src={bank.logo} alt={bank.code} className="h-8 w-8 object-contain bg-white rounded-md p-0.5" />
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{bank.shortName}</span>
                                            <span className="text-[10px] text-zinc-400 font-normal bg-zinc-800 px-1.5 py-0.5 rounded border border-white/5">{bank.code}</span>
                                          </div>
                                          <span className="text-xs text-zinc-500 truncate max-w-[180px]">{bank.name}</span>
                                        </div>
                                      </div>
                                      {selectedBankName === bank.shortName && (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-500">
                                          <Check className="h-4 w-4" />
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {banks.length === 0 && <div className="p-4 text-center text-zinc-500">Đang tải danh sách...</div>}
                                </div>
                              </>
                            )}
                          </div>
                          {/* Hidden input to register with hook form */}
                          <input type="hidden" {...register('bankName')} />
                          
                          {errors.bankName && <p className="text-red-500 text-xs">{errors.bankName.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-400">{t('bankAccountNum')}</Label>
                          <Input {...register('bankAccountNumber')} className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20" />
                          {errors.bankAccountNumber && <p className="text-red-500 text-xs">{errors.bankAccountNumber.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-400">{t('bankAccountName')}</Label>
                          <Input {...register('bankAccountName')} className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20" />
                          {errors.bankAccountName && <p className="text-red-500 text-xs">{errors.bankAccountName.message}</p>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: COMMITMENT */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {COMMITMENTS.map((item) => (
                        <div 
                          key={item.id} 
                          className={`p-4 rounded-lg border transition-all duration-200 ${agreements[item.id] ? 'bg-green-950/20 border-green-500/50' : 'bg-zinc-950/50 border-white/10'}`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className={`font-semibold ${agreements[item.id] ? 'text-green-400' : 'text-zinc-200'}`}>{item.title}</h4>
                              <p className="text-sm text-zinc-500 mt-1">{item.desc}</p>
                            </div>
                            <Switch 
                              checked={!!agreements[item.id]}
                              onCheckedChange={() => toggleAgreement(item.id)}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-zinc-950/50 p-6 rounded-xl border border-white/10 space-y-4">
                      <Label className="text-zinc-300">{t('digitalSignature')}</Label>
                      <p className="text-sm text-zinc-500">{t('signatureDesc').replace('{name}', fullName || '...')}</p>
                      
                      <Input 
                        {...register('agreementSigned_name')}
                        placeholder={t('fullName')} 
                        className={`bg-zinc-900 border-white/10 text-white placeholder:text-zinc-600 h-12 text-lg ${
                          signature && !isSignatureValid ? 'border-red-500 focus:ring-red-500' : 
                          isSignatureValid ? 'border-green-500 focus:ring-green-500' : 'focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                      />
                      {signature && !isSignatureValid && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertTriangle size={14} /> Chữ ký không khớp với họ tên đã đăng ký.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-10 pt-6 border-t border-white/10">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep} className="border-white/10 bg-zinc-800/50 hover:bg-zinc-700 hover:text-white text-white font-bold shadow-lg shadow-black/20 backdrop-blur-sm transition-all">
                    <ChevronLeft className="mr-2 h-4 w-4" /> {t('prevStep')}
                  </Button>
                ) : <div></div>}

                {step < 3 ? (
                  <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20">
                    {t('nextStep')} <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={() => setShowConfirmModal(true)} 
                    disabled={!allAgreementsChecked || !isSignatureValid}
                    className={`font-bold min-w-[150px] ${(!allAgreementsChecked || !isSignatureValid) ? 'bg-slate-700 text-slate-400' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  >
                    {t('submitApp')}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-blue-400 flex items-center gap-2">
              <AlertTriangle /> {t('confirmAppTitle')}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 pt-2">
              {t('confirmAppDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-800">{t('cancelBtn')}</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {t('confirmSend')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
