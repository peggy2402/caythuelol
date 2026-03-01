// src/app/booster/apply/page.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle2, ShieldAlert, Upload, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// UI Components (Giả sử bạn đã cài Shadcn)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

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

// --- Constants ---
const STEPS = [
  { id: 1, title: "Thông tin cá nhân", icon: "👤" },
  { id: 2, title: "Hồ sơ Game & Cọc", icon: "🎮" },
  { id: 3, title: "Cam kết & Ký tên", icon: "✍️" },
];

const COMMITMENTS = [
  { id: 'tool', title: "Không Tool/Hack", desc: "Tuyệt đối không sử dụng phần mềm thứ 3 can thiệp vào game." },
  { id: 'security', title: "Bảo mật tài khoản", desc: "Không thay đổi thông tin (Email, Pass) của khách hàng." },
  { id: 'private', title: "Riêng tư", desc: "Không liên hệ riêng, không giao dịch ngoài hệ thống." },
  { id: 'stream', title: "Quy định Stream", desc: "Chỉ Stream khi khách hàng cho phép." },
  { id: 'penalty', title: "Chế tài xử phạt", desc: "3 tố cáo hợp lệ/tháng sẽ bị khóa tài khoản vĩnh viễn." },
  { id: 'deposit', title: "Quy định cọc", desc: "Tiền cọc sẽ bị mất nếu vi phạm quy định nghiêm trọng." },
];

export default function BoosterApplyPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange'
  });

  const fullName = watch('fullName');
  const signature = watch('agreementSigned_name');

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
      const res = await fetch('/api/booster/apply', {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-yellow-500/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-900/20 to-slate-950 py-20 text-center">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
        <div className="container relative z-10 mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block rounded-full bg-yellow-500/10 px-4 py-1.5 text-sm font-semibold text-yellow-400 border border-yellow-500/20 mb-4">
              BECOME A LEGEND
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
              Trở thành <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Booster Chuyên Nghiệp</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Gia nhập hệ thống cày thuê uy tín số 1. Thu nhập hấp dẫn, thanh toán minh bạch, bảo vệ quyền lợi tuyệt đối.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Stepper */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-10"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-yellow-500 transition-all duration-500 -z-10" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-2 bg-slate-950 px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' : 'border-slate-700 bg-slate-900 text-slate-500'}`}>
                  {step > s.id ? <CheckCircle2 size={20} /> : <span>{s.id}</span>}
                </div>
                <span className={`text-sm font-medium ${step >= s.id ? 'text-slate-200' : 'text-slate-600'}`}>{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
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
                        <Label>Họ và tên thật</Label>
                        <Input {...register('fullName')} placeholder="Nguyễn Văn A" className="bg-slate-950 border-slate-800 focus:border-yellow-500" />
                        {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Số điện thoại</Label>
                        <Input {...register('phoneNumber')} placeholder="0912..." className="bg-slate-950 border-slate-800 focus:border-yellow-500" />
                        {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Link Facebook chính chủ</Label>
                        <Input {...register('facebookUrl')} placeholder="https://facebook.com/..." className="bg-slate-950 border-slate-800 focus:border-yellow-500" />
                        {errors.facebookUrl && <p className="text-red-500 text-xs">{errors.facebookUrl.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Discord Tag</Label>
                        <Input {...register('discordTag')} placeholder="username#1234" className="bg-slate-950 border-slate-800 focus:border-yellow-500" />
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
                      <h3 className="text-lg font-semibold text-yellow-500 flex items-center gap-2">
                        <span className="w-1 h-6 bg-yellow-500 rounded-full"></span> Thông tin Rank
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Rank hiện tại</Label>
                          <Input {...register('currentRank')} placeholder="VD: Cao Thủ 200LP" className="bg-slate-950 border-slate-800" />
                          {errors.currentRank && <p className="text-red-500 text-xs">{errors.currentRank.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Rank cao nhất (Peak)</Label>
                          <Input {...register('highestRank')} placeholder="VD: Thách Đấu 500LP" className="bg-slate-950 border-slate-800" />
                          {errors.highestRank && <p className="text-red-500 text-xs">{errors.highestRank.message}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Link OP.GG</Label>
                          <Input {...register('opggLink')} placeholder="https://www.op.gg/summoners/vn/..." className="bg-slate-950 border-slate-800" />
                          {errors.opggLink && <p className="text-red-500 text-xs">{errors.opggLink.message}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Link ảnh bằng chứng (Rank + Ngày giờ)</Label>
                          {/* Note: Thực tế sẽ dùng component Upload Cloudinary ở đây */}
                          <div className="flex gap-2">
                            <Input {...register('rankImageUrl')} placeholder="https://i.imgur.com/..." className="bg-slate-950 border-slate-800" />
                            <Button type="button" variant="outline" className="border-slate-700"><Upload size={16} /></Button>
                          </div>
                          <p className="text-xs text-slate-500">Vui lòng upload ảnh chụp màn hình client game có hiển thị rank và ngày giờ hệ thống.</p>
                          {errors.rankImageUrl && <p className="text-red-500 text-xs">{errors.rankImageUrl.message}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    {/* Deposit Info */}
                    <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="text-indigo-400 shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold text-indigo-300">Thông tin cọc: 200.000 VNĐ</h4>
                          <p className="text-sm text-slate-400 mt-1">
                            Để đảm bảo uy tín, Booster cần cọc 200k. Số tiền này sẽ được hoàn lại 100% khi bạn nghỉ làm (nếu không vi phạm).
                          </p>
                          <div className="mt-3 p-3 bg-slate-950 rounded border border-slate-800 text-sm font-mono text-slate-300">
                            <p>Ngân hàng: MB Bank</p>
                            <p>STK: 0000 1111 9999</p>
                            <p>Chủ TK: ADMIN CAYTHUELOL</p>
                            <p>Nội dung: COC {fullName || "TEN_BOOSTER"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booster Bank Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-yellow-500 flex items-center gap-2">
                        <span className="w-1 h-6 bg-yellow-500 rounded-full"></span> Tài khoản nhận tiền của bạn
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Ngân hàng</Label>
                          <Input {...register('bankName')} placeholder="MB, VCB..." className="bg-slate-950 border-slate-800" />
                          {errors.bankName && <p className="text-red-500 text-xs">{errors.bankName.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Số tài khoản</Label>
                          <Input {...register('bankAccountNumber')} className="bg-slate-950 border-slate-800" />
                          {errors.bankAccountNumber && <p className="text-red-500 text-xs">{errors.bankAccountNumber.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Chủ tài khoản</Label>
                          <Input {...register('bankAccountName')} className="bg-slate-950 border-slate-800" />
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
                          className={`p-4 rounded-lg border transition-all duration-200 ${agreements[item.id] ? 'bg-green-950/20 border-green-500/50' : 'bg-slate-950 border-slate-800'}`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className={`font-semibold ${agreements[item.id] ? 'text-green-400' : 'text-slate-200'}`}>{item.title}</h4>
                              <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
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

                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                      <Label className="text-slate-300">Xác nhận chữ ký số</Label>
                      <p className="text-sm text-slate-500">Vui lòng nhập chính xác họ tên của bạn <strong>({fullName})</strong> để xác nhận đồng ý với toàn bộ điều khoản trên.</p>
                      
                      <Input 
                        {...register('agreementSigned_name')}
                        placeholder="Nhập họ tên đầy đủ..." 
                        className={`bg-slate-900 border-slate-700 h-12 text-lg ${
                          signature && !isSignatureValid ? 'border-red-500 focus:ring-red-500' : 
                          isSignatureValid ? 'border-green-500 focus:ring-green-500' : ''
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
              <div className="flex justify-between mt-10 pt-6 border-t border-slate-800">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep} className="border-slate-700 hover:bg-slate-800 text-slate-300">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Quay lại
                  </Button>
                ) : <div></div>}

                {step < 3 ? (
                  <Button type="button" onClick={nextStep} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                    Tiếp tục <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={() => setShowConfirmModal(true)} 
                    disabled={!allAgreementsChecked || !isSignatureValid}
                    className={`font-bold min-w-[150px] ${(!allAgreementsChecked || !isSignatureValid) ? 'bg-slate-700 text-slate-400' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  >
                    Gửi Đăng Ký
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-500 flex items-center gap-2">
              <AlertTriangle /> Xác nhận đăng ký
            </DialogTitle>
            <DialogDescription className="text-slate-400 pt-2">
              Bằng việc nhấn xác nhận, bạn đồng ý rằng:
              <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
                <li>Mọi thông tin khai báo là sự thật.</li>
                <li>Sẵn sàng test kỹ năng khi được yêu cầu.</li>
                <li>Chấp nhận khóa tài khoản nếu vi phạm quy định.</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-white">Hủy</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Xác nhận & Gửi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
