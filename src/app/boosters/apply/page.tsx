// src/app/booster/apply/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle2, ShieldAlert, Upload, ChevronRight, ChevronLeft, AlertTriangle, Trophy, ChevronsUpDown, Check, Search, CloudUpload, Image as ImageIcon, X, Eraser, Download, LogOut, DoorOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import SignatureCanvas from 'react-signature-canvas';

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
  signatureImage: z.string().optional(), // Lưu ảnh chữ ký base64
  contractUrl: z.string().optional(),
  billImageUrl: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Bank {
  id: number;
  name: string;
  code: string;
  shortName: string;
  logo: string;
}

interface AdminSettings {
  adminBank: { bankName: string; accountNumber: string; accountHolder: string };
  depositConfig: { depositRequired: boolean; depositAmount: number };
  platformName: string;
}

export default function BoosterApplyPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUploadingRank, setIsUploadingRank] = useState(false);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Bank State
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [contractDate, setContractDate] = useState<Date | null>(null);
  const [hasDownloadedContract, setHasDownloadedContract] = useState(false);
  const [isAlreadyBooster, setIsAlreadyBooster] = useState(false); // State check booster
  const [showResignModal, setShowResignModal] = useState(false); // State modal nghỉ việc
  
  // Signature Ref
  const sigCanvas = useRef<any>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Admin Settings State
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    adminBank: { bankName: '', accountNumber: '', accountHolder: '' },
    depositConfig: { depositRequired: false, depositAmount: 0 },
    platformName: 'LOL Boosting Platform'
  });

  const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange'
  });

  const fullName = watch('fullName');
  const signature = watch('agreementSigned_name');
  const selectedBankName = watch('bankName');
  const rankImageUrl = watch('rankImageUrl');
  const billImageUrl = watch('billImageUrl');
  const phoneNumber = watch('phoneNumber');

  // Fetch Banks
  React.useEffect(() => {
    fetch('https://api.vietqr.io/v2/banks')
      .then(res => res.json())
      .then(data => setBanks(data.data || []))
      .catch(err => console.error("Failed to fetch banks", err));
  }, []);

  // Set contract date on client side to avoid hydration mismatch
  React.useEffect(() => {
    setContractDate(new Date());
  }, []);

  // Fetch Admin Settings (Bank & Deposit Config)
  React.useEffect(() => {
    const fetchAdminSettings = async () => {
      try {
        // Sử dụng API public để tránh lỗi 403 Forbidden
        const res = await fetch(`/api/settings/public?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) {
          const bankInfo = data.find((s: any) => s.key === 'ADMIN_BANK_INFO')?.value;
          const depositConfig = data.find((s: any) => s.key === 'booster_registration_config')?.value;
          
          setAdminSettings(prev => ({
            ...prev,
            adminBank: bankInfo || prev.adminBank,
            depositConfig: depositConfig || prev.depositConfig
          }));
        }
      } catch (error) {
        console.error("Failed to fetch admin settings", error);
      }
    };
    fetchAdminSettings();

    // Check if user is already a booster
    const checkUserRole = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'BOOSTER') setIsAlreadyBooster(true);
      }
    };
    checkUserRole();
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
    // CONFLICT CHECK: Trước khi qua bước 3 (Cam kết & Ký), kiểm tra lại cấu hình Admin
    if (step === 2) {
      try {
        const res = await fetch(`/api/settings/public?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) {
          const serverDepositConfig = data.find((s: any) => s.key === 'booster_registration_config')?.value;
          
          // Nếu cấu hình trên server khác với state hiện tại
          if (serverDepositConfig && serverDepositConfig.depositRequired !== adminSettings.depositConfig.depositRequired) {
            setAdminSettings(prev => ({ ...prev, depositConfig: serverDepositConfig }));
            
            toast.warning("Cấu hình hệ thống đã thay đổi", {
              description: serverDepositConfig.depositRequired 
                ? "Admin vừa BẬT yêu cầu đặt cọc. Vui lòng thực hiện chuyển khoản."
                : "Admin vừa TẮT yêu cầu đặt cọc. Bạn không cần chuyển khoản nữa."
            });
            return; // Dừng lại để UI cập nhật, User phải bấm Next lần nữa
          }
        }
      } catch (e) { console.error("Sync check failed", e); }

      // Validate Bill Image if deposit is required
      if (adminSettings.depositConfig.depositRequired && !billImageUrl) {
        toast.error("Thiếu ảnh xác nhận chuyển khoản", {
          description: "Vui lòng upload ảnh Bill chuyển khoản tiền cọc để tiếp tục."
        });
        return;
      }
    }

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
  // Validate: Phải nhập đúng tên VÀ (đã ký tên HOẶC đang ở bước xem lại)
  const isNameMatch = signature && fullName && signature.trim().toLowerCase() === fullName.trim().toLowerCase();
  const isSignatureValid = isNameMatch && !sigCanvas.current?.isEmpty();

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setSignatureDataUrl(null);
  };
  const saveSignature = () => {
    if (sigCanvas.current) {
      setSignatureDataUrl(sigCanvas.current.getCanvas().toDataURL('image/png'));
    }
  };

  // --- QR Code Generation Logic ---
  // Cấu trúc: BOOSTERAPPLY [SĐT]
  const transferContent = `BOOSTERAPPLY ${phoneNumber || 'SDT'}`;
  // Link tạo QR từ VietQR (Template: compact2 để gọn đẹp)
  const qrCodeUrl = `https://img.vietqr.io/image/${adminSettings.adminBank.bankName}-${adminSettings.adminBank.accountNumber}-compact2.png?amount=${adminSettings.depositConfig.depositAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(adminSettings.adminBank.accountHolder)}`;

  // --- Upload Handler ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File quá lớn", { description: "Vui lòng chọn ảnh dưới 5MB" });
      return;
    }

    setIsUploadingRank(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error("Upload thất bại");
      
      const data = await res.json();
      setValue('rankImageUrl', data.url, { shouldValidate: true });
      toast.success("Đã tải ảnh lên thành công");
    } catch (error) {
      toast.error("Lỗi upload ảnh", { description: "Vui lòng thử lại hoặc nhập link trực tiếp" });
    } finally {
      setIsUploadingRank(false);
    }
  };

  // --- Upload Bill Handler ---
  const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File quá lớn", { description: "Vui lòng chọn ảnh dưới 5MB" });
      return;
    }

    setIsUploadingBill(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error("Upload thất bại");
      
      const data = await res.json();
      setValue('billImageUrl', data.url, { shouldValidate: true });
      toast.success("Đã tải ảnh Bill thành công");
    } catch (error) {
      toast.error("Lỗi upload ảnh", { description: "Vui lòng thử lại" });
    } finally {
      setIsUploadingBill(false);
    }
  };

  // --- PDF Generation Logic ---
  const generateContractBlob = async (): Promise<Blob | null> => {
    const contractElement = document.getElementById('contract-template');
    if (!contractElement) return null;

    try {
      // 1. Convert HTML to Canvas
      const canvas = await html2canvas(contractElement, { 
        scale: 1.5, // Giảm scale để giảm dung lượng file
        useCORS: true,
        backgroundColor: '#ffffff', // Đảm bảo nền trắng
        // QUAN TRỌNG: Xóa toàn bộ CSS global trong bản clone để html2canvas không parse file Tailwind (gây lỗi oklch)
        onclone: (clonedDoc) => {
          const styles = clonedDoc.getElementsByTagName('style');
          const links = clonedDoc.getElementsByTagName('link');
          // Xóa ngược từ cuối lên để tránh lỗi index
          for (let i = styles.length - 1; i >= 0; i--) { styles[i].remove(); }
          for (let i = links.length - 1; i >= 0; i--) { 
            if (links[i].rel === 'stylesheet') links[i].remove(); 
          }
        }
      });
      // Sử dụng JPEG chất lượng 0.75 thay vì PNG để giảm dung lượng (từ ~14MB xuống <2MB)
      const imgData = canvas.toDataURL('image/jpeg', 0.75);

      // 2. Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      // 3. Convert PDF to Blob
      return pdf.output('blob');
    } catch (error) {
      console.error("Lỗi tạo hợp đồng:", error);
      toast.error("Lỗi tạo hợp đồng", { description: error instanceof Error ? error.message : "Vui lòng thử lại" });
      return null;
    }
  };

  const generateAndUploadContract = async (): Promise<{ url: string, blob: Blob } | null> => {
    const pdfBlob = await generateContractBlob();
    if (!pdfBlob) return null;

    try {
      // 4. Upload to Cloudinary (via API)
      const formData = new FormData();
      // Đặt tên file đơn giản, chỉ gồm chữ số và timestamp để tránh lỗi URL
      const cleanFileName = `contract_${Date.now()}.pdf`;
      formData.append('file', pdfBlob, cleanFileName);
      // Gửi thêm resource_type = raw để API (nếu hỗ trợ) sẽ upload dưới dạng file thô, tránh lỗi xử lý ảnh của Cloudinary
      formData.append('resource_type', 'raw');
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error("Upload hợp đồng thất bại");
      
      const uploadData = await uploadRes.json();
      return { url: uploadData.url, blob: pdfBlob };
    } catch (error) {
      console.error("Lỗi upload hợp đồng:", error);
      toast.error("Lỗi upload hợp đồng", { description: error instanceof Error ? error.message : "Vui lòng thử lại" });
      return null;
    }
  };

  const handleDownload = async () => {
    // Đảm bảo chữ ký được cập nhật vào state để render ra PDF
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setSignatureDataUrl(sigCanvas.current.getCanvas().toDataURL('image/png'));
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Chờ render

    // toast.info("Đang tạo file PDF...");
    const blob = await generateContractBlob();
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hop_Dong_Booster_${fullName || 'Application'}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã tải xuống bản khai!");
      setHasDownloadedContract(true);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // 1. Generate & Upload Contract
      // Đảm bảo chữ ký đã được lưu vào state để render ra template
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        setSignatureDataUrl(sigCanvas.current.getCanvas().toDataURL('image/png'));
      }
      
      // Chờ 1 chút để state cập nhật (nếu cần) hoặc render lại DOM
      await new Promise(resolve => setTimeout(resolve, 100));

      toast.info("Đang tạo hợp đồng điện tử...");
      const result = await generateAndUploadContract();
      
      if (!result) throw new Error("Không thể tạo hợp đồng. Vui lòng thử lại.");

      // 2. Submit Application
      const res = await fetch('/api/boosters/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, contractUrl: result.url }),
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

  // --- Resign Handler ---
  const confirmResign = async () => {
    try {
      const res = await fetch('/api/boosters/resign', { method: 'POST' });
      if (res.ok) {
        toast.success("Đã hủy tư cách Booster thành công.");
        // Cập nhật localStorage và redirect
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.role = 'CUSTOMER';
          localStorage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new Event('user-updated'));
        }
        router.push('/dashboard');
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Lỗi khi thực hiện yêu cầu.");
    }
    setShowResignModal(false);
  };

  // --- Render Components ---

  if (isAlreadyBooster) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30 relative overflow-hidden flex items-center justify-center">
        <Navbar />
        <div className="fixed inset-0 bg-[url('/noise.png')] bg-center opacity-10 pointer-events-none" />
        
        <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-2xl max-w-md w-full mx-4">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Bạn đang là Booster</CardTitle>
            <CardDescription className="text-zinc-400">
              Tài khoản của bạn đang hoạt động với tư cách Booster. Bạn có thể nhận đơn và kiếm thu nhập.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Button 
              onClick={() => router.push('/booster/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12"
            >
              <Trophy className="mr-2 h-4 w-4" /> Vào Dashboard Booster
            </Button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-zinc-500">Hoặc</span></div>
            </div>

            <Button 
              onClick={() => setShowResignModal(true)}
              variant="outline"
              className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-12"
            >
              <DoorOpen className="mr-2 h-4 w-4" /> Xin nghỉ việc (Về Customer)
            </Button>
          </CardContent>
        </Card>

        {/* Resign Confirmation Modal */}
        <Dialog open={showResignModal} onOpenChange={setShowResignModal}>
          <DialogContent className="bg-zinc-900 border-red-500/20 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-500 flex items-center gap-2">
                <AlertTriangle /> Gỡ quyền Booster
              </DialogTitle>
              <DialogDescription className="text-zinc-300 pt-4 text-base font-medium">
                Bạn có chắc muốn ngừng làm Booster?
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-zinc-950/50 p-4 rounded-lg border border-white/5 text-sm text-zinc-400 space-y-2">
              <p className="font-semibold text-zinc-300">Sau khi xác nhận:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Bạn sẽ được hoàn lại tiền cọc</li>
                <li>Bạn sẽ không nhận được đơn mới</li>
                <li>Các đơn đang làm vẫn phải hoàn thành</li>
                <li>Bạn sẽ trở lại tài khoản Khách hàng</li>
              </ul>
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => setShowResignModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white">Hủy</Button>
              <Button onClick={confirmResign} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold">Xác nhận</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

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
                          
                          {/* URL Input */}
                          <Input 
                            {...register('rankImageUrl')} 
                            placeholder="https://i.imgur.com/..." 
                            className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20 mb-2" 
                          />

                          {/* Big Upload Button Area */}
                          <div className="relative group">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload}
                              disabled={isUploadingRank}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                            />
                            <div className={`
                              border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all duration-200
                              ${errors.rankImageUrl ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-zinc-950/30 hover:bg-zinc-900 hover:border-blue-500/50'}
                            `}>
                              {isUploadingRank ? (
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                              ) : rankImageUrl ? (
                                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-white/10 group-hover:opacity-50 transition-opacity">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={rankImageUrl} alt="Rank Proof" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">Nhấn để thay đổi</span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="p-4 bg-zinc-900 rounded-full border border-white/5 group-hover:scale-110 transition-transform duration-200">
                                    <CloudUpload className="w-8 h-8 text-zinc-400 group-hover:text-blue-400" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm font-medium text-zinc-300 group-hover:text-white">Nhấn để tải ảnh lên</p>
                                    <p className="text-xs text-zinc-500 mt-1">Hoặc kéo thả file vào đây (Max 5MB)</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {errors.rankImageUrl && <p className="text-red-500 text-xs">{errors.rankImageUrl.message}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Deposit Info (Conditional) */}
                    {adminSettings.depositConfig.depositRequired ? (
                      <div className="bg-orange-900/10 border border-orange-500/20 rounded-lg p-4 animate-in fade-in">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="text-orange-400 shrink-0 mt-1" />
                          <div className="w-full">
                            <h4 className="font-semibold text-orange-300">Yêu cầu Đặt cọc (Deposit)</h4>
                            <p className="text-sm text-zinc-400 mt-1 mb-3">
                              Để đảm bảo uy tín, bạn cần đóng khoản cọc là <span className="text-white font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(adminSettings.depositConfig.depositAmount)}</span>. Khoản này sẽ được hoàn lại 100% khi bạn ngừng làm Booster.
                            </p>
                            
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                              {/* QR Code */}
                              <div className="bg-white p-2 rounded-lg shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrCodeUrl} alt="QR Chuyển khoản" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
                              </div>

                              {/* Admin Bank Info Display */}
                              <div className="flex-1 space-y-3 w-full">
                                <div className="bg-zinc-950/80 p-3 rounded border border-orange-500/10 grid grid-cols-1 gap-3 text-sm">
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-zinc-500">Ngân hàng:</span>
                                    <span className="font-bold text-white">{adminSettings.adminBank.bankName}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-zinc-500">Số tài khoản:</span>
                                    <span className="font-mono font-bold text-white tracking-wide">{adminSettings.adminBank.accountNumber}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-zinc-500">Chủ tài khoản:</span>
                                    <span className="font-bold text-white uppercase">{adminSettings.adminBank.accountHolder}</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-1">
                                    <span className="text-zinc-500">Nội dung:</span>
                                    <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded select-all">{transferContent}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-zinc-500 italic text-center md:text-left">* Quét mã QR để nội dung chuyển khoản được điền tự động chính xác.</p>
                              </div>
                            </div>

                            {/* Upload Bill Section */}
                            <div className="mt-4 pt-4 border-t border-white/5">
                              <Label className="text-zinc-300 mb-2 block">Xác nhận chuyển khoản (Upload Bill)</Label>
                              <div className="flex items-center gap-4">
                                <div className="relative group flex-1">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleBillUpload}
                                    disabled={isUploadingBill}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                                  />
                                  <div className={`
                                    border border-dashed rounded-lg p-3 flex items-center justify-center gap-3 transition-all duration-200
                                    ${billImageUrl ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-zinc-950/30 hover:bg-zinc-900'}
                                  `}>
                                    {isUploadingBill ? (
                                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                    ) : billImageUrl ? (
                                      <div className="flex items-center gap-2 text-green-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="text-sm font-medium">Đã tải ảnh lên</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-zinc-400">Nhấn để tải ảnh Bill chuyển khoản...</span>
                                    )}
                                  </div>
                                </div>
                                {billImageUrl && (
                                  <a href={billImageUrl} target="_blank" rel="noreferrer" className="shrink-0 w-12 h-12 rounded-lg border border-white/10 overflow-hidden block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={billImageUrl} alt="Bill" className="w-full h-full object-cover" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="text-blue-400 shrink-0 mt-1" />
                          <div>
                            <h4 className="font-semibold text-blue-300">Đăng ký Miễn phí</h4>
                            <p className="text-sm text-zinc-400 mt-1">
                              Hiện tại hệ thống đang miễn phí đặt cọc cho các Booster mới. Hãy tận dụng cơ hội này!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Booster Bank Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span> Ngân hàng của bạn
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
                      <Label className="text-zinc-300">Ký tên xác nhận</Label>
                      <p className="text-sm text-zinc-500">{t('signatureDesc').replace('{name}', fullName || '...')}</p>
                      
                      {/* Signature Pad */}
                      <div className="border border-zinc-700 rounded-lg bg-white overflow-hidden relative">
                        <SignatureCanvas 
                          ref={sigCanvas}
                          penColor="black"
                          canvasProps={{ width: 500, height: 200, className: 'sigCanvas w-full h-40 md:h-52 cursor-crosshair' }}
                          onEnd={saveSignature}
                        />
                        <button 
                          type="button" 
                          onClick={clearSignature}
                          className="absolute top-2 right-2 p-1 bg-zinc-200 rounded text-zinc-600 hover:bg-zinc-300 text-xs flex items-center gap-1"
                        >
                          <Eraser size={12} /> Xóa
                        </button>
                      </div>

                      <Label className="text-zinc-300 mt-4 block">Nhập lại họ tên để xác thực</Label>
                      <Input 
                        {...register('agreementSigned_name')}
                        placeholder={t('fullName')} 
                        className={`bg-zinc-900 border-white/10 text-white placeholder:text-zinc-600 h-12 text-lg ${
                          signature && !isNameMatch ? 'border-red-500 focus:ring-red-500' : 
                          isNameMatch ? 'border-green-500 focus:ring-green-500' : 'focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                      />
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
                    disabled={!allAgreementsChecked || !isSignatureValid || !signatureDataUrl}
                    className={`font-bold min-w-[150px] ${(!allAgreementsChecked || !isSignatureValid || !signatureDataUrl) ? 'bg-slate-700 text-slate-400' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  >
                    {t('submitApp')}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* HIDDEN CONTRACT TEMPLATE FOR PDF GENERATION */}
      {/* Fix: Sử dụng fixed top-0 left-0 z-[-50] để tránh lỗi render và clipping */}
      <div className="fixed top-0 left-0 z-[-50]">
        {/* 
            QUAN TRỌNG: Sử dụng Inline Styles 100% cho phần này.
            Không dùng class Tailwind để tránh lỗi 'oklch' color function của html2canvas.
        */}
        <div id="contract-template" style={{ width: '210mm', minHeight: '297mm', padding: '20mm', fontFamily: 'Times New Roman, serif', lineHeight: '1.6', position: 'relative', backgroundColor: '#ffffff', color: '#000000', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', margin: 0 }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
            <p style={{ fontWeight: 'bold', marginBottom: '24px', textDecoration: 'underline', textDecorationColor: '#000000', margin: 0 }}>Độc lập - Tự do - Hạnh phúc</p>
            <h2 style={{ fontSize: '30px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '40px', marginBottom: '8px' }}>HỢP ĐỒNG HỢP TÁC CÀY THUÊ</h2>
            <p style={{ fontStyle: 'italic', fontSize: '14px', marginTop: '8px' }}>Số: {contractDate ? contractDate.getTime() : '...'}/HĐ-BOOSTER</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{ margin: 0 }}>Hôm nay, ngày {contractDate ? contractDate.getDate() : '...'} tháng {contractDate ? contractDate.getMonth() + 1 : '...'} năm {contractDate ? contractDate.getFullYear() : '...'}, tại hệ thống {adminSettings.platformName}, chúng tôi gồm:</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>BÊN A: {adminSettings.platformName.toUpperCase()} (Bên quản lý)</h3>
            <p style={{ margin: 0 }}>Đại diện bởi hệ thống quản trị viên.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>BÊN B: {fullName?.toUpperCase()} (Bên Booster)</h3>
            <p style={{ margin: 0 }}>Số điện thoại: {watch('phoneNumber')}</p>
            <p style={{ margin: 0 }}>Discord: {watch('discordTag')}</p>
            <p style={{ margin: 0 }}>Facebook: {watch('facebookUrl')}</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', margin: 0 }}>ĐIỀU 1: NỘI DUNG HỢP TÁC</h3>
            <p style={{ textAlign: 'justify', margin: 0 }}>Bên B đồng ý trở thành đối tác cung cấp dịch vụ cày thuê (Boosting) trên nền tảng của Bên A. Bên B cam kết tuân thủ mọi quy định về bảo mật, chất lượng dịch vụ và thái độ phục vụ khách hàng.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', margin: 0 }}>ĐIỀU 2: CAM KẾT CỦA BÊN B</h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', margin: 0 }}>
              {COMMITMENTS.map((c) => (
                <li key={c.id} style={{ textAlign: 'justify', marginBottom: '4px' }}>{c.desc}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', width: '50%' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>ĐẠI DIỆN BÊN A</p>
              <p style={{ fontStyle: 'italic', fontSize: '14px', margin: 0 }}>(Đã ký điện tử)</p>
              <div style={{ marginTop: '64px', fontWeight: 'bold' }}>CHIEN</div>
            </div>
            <div style={{ textAlign: 'center', width: '50%' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>ĐẠI DIỆN BÊN B</p>
              <p style={{ fontStyle: 'italic', fontSize: '14px', margin: 0 }}>(Ký tên xác nhận)</p>
              
              {/* Hiển thị ảnh chữ ký thay vì text */}
              <div style={{ marginTop: '16px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {signatureDataUrl ? <img src={signatureDataUrl} alt="Signature" style={{ maxHeight: '80px', maxWidth: '100%' }} /> : <span style={{color: '#ccc'}}>...</span>}
              </div>
              <div style={{ marginTop: '16px', fontWeight: 'bold' }}>{fullName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={(isOpen) => {
        setShowConfirmModal(isOpen);
        if (!isOpen) {
          setHasDownloadedContract(false); // Reset khi đóng modal
        }
      }}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-blue-400 flex items-center gap-2">
              <AlertTriangle /> {t('confirmAppTitle')}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 pt-2">
              {t('confirmAppDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowConfirmModal(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              {t('cancelBtn')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Tải bản khai
            </Button>
            <Button
              onClick={() => {
                if (!hasDownloadedContract) {
                  toast.error("Vui lòng tải bản khai trước khi gửi đăng ký.");
                  return;
                }
                handleSubmit(onSubmit)();
              }}
              disabled={isSubmitting}
              className={`bg-blue-600 hover:bg-blue-500 text-white font-bold transition-opacity ${!hasDownloadedContract && !isSubmitting ? 'opacity-60' : ''}`}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {t('confirmSend')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
