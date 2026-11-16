// src/app/boosters/apply/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Loader2, CheckCircle2, ShieldAlert, Upload, ChevronRight, ChevronLeft, 
  AlertTriangle, Trophy, ChevronsUpDown, Check, Search, CloudUpload, 
  Image as ImageIcon, X, Eraser, Download, LogOut, DoorOpen, Landmark,
  ShieldCheck, Zap, Sparkles, Lock, ArrowRight, Wallet, UserCheck, Flame
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import SignatureCanvas from 'react-signature-canvas';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import BankSelectModal from './bank-select-modal';

// Form Schema
const formSchema = z.object({
  fullName: z.string().min(2, "Họ tên quá ngắn"),
  phoneNumber: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ (10-11 số)"),
  facebookUrl: z.string().url("Link Facebook không hợp lệ"),
  discordTag: z.string().min(3, "Discord Tag không hợp lệ"),
  currentRank: z.string().min(1, "Vui lòng nhập Rank hiện tại"),
  highestRank: z.string().min(1, "Vui lòng nhập Rank cao nhất"),
  opggLink: z.string().url("Link OP.GG không hợp lệ"),
  rankImageUrl: z.string().url("Vui lòng tải lên ảnh bằng chứng"),
  bankName: z.string().min(1, "Vui lòng chọn ngân hàng thụ hưởng"),
  bankAccountName: z.string().min(1, "Vui lòng nhập tên chủ tài khoản"),
  bankAccountNumber: z.string().min(1, "Vui lòng nhập số tài khoản ngân hàng"),
  agreementSigned_name: z.string(),
  signatureImage: z.string().optional(),
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
  const [contractDate, setContractDate] = useState<Date | null>(null);
  const [hasDownloadedContract, setHasDownloadedContract] = useState(false);
  const [isAlreadyBooster, setIsAlreadyBooster] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  
  // Signature Ref
  const sigCanvas = useRef<any>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Admin Settings State
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    adminBank: { bankName: '', accountNumber: '', accountHolder: '' },
    depositConfig: { depositRequired: false, depositAmount: 0 },
    platformName: 'LeoRank Esports Platform'
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

  // Set contract date on client
  React.useEffect(() => {
    setContractDate(new Date());
  }, []);

  // Fetch Admin Settings
  React.useEffect(() => {
    const fetchAdminSettings = async () => {
      try {
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

    // Check user role
    const checkUserRole = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'BOOSTER') setIsAlreadyBooster(true);
      }
    };
    checkUserRole();
  }, []);

  // Constants
  const STEPS = [
    { id: 1, title: 'Thông tin cá nhân' },
    { id: 2, title: 'Trình độ & Ngân hàng' },
    { id: 3, title: 'Cam kết & Hợp đồng' },
  ];

  const COMMITMENTS = [
    { id: 'tool', title: 'Không sử dụng phần mềm thứ ba', desc: 'Tuyệt đối không sử dụng tool, script, hack, bot hay bất kỳ phần mềm gian lận nào trong quá trình thi đấu.' },
    { id: 'security', title: 'Bảo mật tài khoản khách hàng', desc: 'Bảo mật thông tin đăng nhập, không tự ý đổi mật khẩu, không tiêu xài Tinh Hoa Lam hay RP của khách.' },
    { id: 'private', title: 'Giữ kín thông tin & Ẩn danh', desc: 'Không chat trong trận, không kết bạn, không trả lời tin nhắn bạn bè của khách, luôn bật chế độ Offline.' },
    { id: 'stream', title: 'Quy tắc Livestream (nếu có)', desc: 'Chỉ livestream khi khách hàng có đăng ký gói add-on xem trực tiếp và tuân thủ che tên tài khoản.' },
    { id: 'penalty', title: 'Cam kết bồi thường vi phạm', desc: 'Chịu trách nhiệm bồi thường 100% nếu gây ra sự cố khóa tài khoản do lỗi chủ quan của booster.' },
    { id: 'deposit', title: 'Quy tắc ký quỹ bảo chứng', desc: 'Khoản tiền ký quỹ bảo chứng (nếu có) sẽ được hoàn trả 100% khi booster kết thúc hợp tác đúng quy trình.' },
  ];

  // Stepper handlers
  const nextStep = async () => {
    if (step === 2) {
      try {
        const res = await fetch(`/api/settings/public?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) {
          const serverDepositConfig = data.find((s: any) => s.key === 'booster_registration_config')?.value;
          if (serverDepositConfig && serverDepositConfig.depositRequired !== adminSettings.depositConfig.depositRequired) {
            setAdminSettings(prev => ({ ...prev, depositConfig: serverDepositConfig }));
            toast.warning("Cấu hình hệ thống đã cập nhật", {
              description: serverDepositConfig.depositRequired 
                ? "Admin vừa bật yêu cầu đặt cọc bảo chứng. Vui lòng chuyển khoản để tiếp tục."
                : "Admin vừa tắt yêu cầu đặt cọc. Bạn không cần chuyển khoản nữa."
            });
            return;
          }
        }
      } catch (e) { 
        console.error("Sync check failed", e); 
      }

      if (adminSettings.depositConfig.depositRequired && !billImageUrl) {
        toast.error("Thiếu ảnh chuyển khoản tiền cọc", {
          description: "Vui lòng tải lên ảnh Bill chuyển khoản để tiếp tục bước tiếp theo."
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

  // QR Code Generation
  const transferContent = `BOOSTERAPPLY ${phoneNumber || 'SDT'}`;
  const qrCodeUrl = `https://img.vietqr.io/image/${adminSettings.adminBank.bankName}-${adminSettings.adminBank.accountNumber}-compact2.png?amount=${adminSettings.depositConfig.depositAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(adminSettings.adminBank.accountHolder)}`;

  // Upload Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File quá lớn", { description: "Vui lòng chọn ảnh dung lượng dưới 5MB" });
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
      toast.error("Lỗi upload ảnh", { description: "Vui lòng thử lại" });
    } finally {
      setIsUploadingRank(false);
    }
  };

  const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File quá lớn", { description: "Vui lòng chọn ảnh dung lượng dưới 5MB" });
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

  // PDF Contract Generation
  const generateContractBlob = async (): Promise<Blob | null> => {
    const contractElement = document.getElementById('contract-template');
    if (!contractElement) return null;

    try {
      const canvas = await html2canvas(contractElement, { 
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const styles = clonedDoc.getElementsByTagName('style');
          const links = clonedDoc.getElementsByTagName('link');
          for (let i = styles.length - 1; i >= 0; i--) { styles[i].remove(); }
          for (let i = links.length - 1; i >= 0; i--) { 
            if (links[i].rel === 'stylesheet') links[i].remove(); 
          }
        }
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
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
      const formData = new FormData();
      const cleanFileName = `contract_${Date.now()}.pdf`;
      formData.append('file', pdfBlob, cleanFileName);
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
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setSignatureDataUrl(sigCanvas.current.getCanvas().toDataURL('image/png'));
    }
    await new Promise(resolve => setTimeout(resolve, 100));

    const blob = await generateContractBlob();
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hop_Dong_Booster_${fullName || 'Application'}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã tải xuống bản khai hợp đồng!");
      setHasDownloadedContract(true);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        setSignatureDataUrl(sigCanvas.current.getCanvas().toDataURL('image/png'));
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));

      toast.info("Đang tạo hợp đồng điện tử...");
      const result = await generateAndUploadContract();
      
      if (!result) throw new Error("Không thể tạo hợp đồng. Vui lòng thử lại.");

      const token = localStorage.getItem('token');
      const res = await fetch('/api/boosters/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...data, contractUrl: result.url }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Đăng ký thất bại");
      }

      toast.success("Đăng ký thành công!", {
        description: "Hồ sơ của bạn đang được xét duyệt. Ban quản trị sẽ liên hệ sớm qua Discord.",
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast.error("Lỗi", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const confirmResign = async () => {
    try {
      const res = await fetch('/api/boosters/resign', { method: 'POST' });
      if (res.ok) {
        toast.success("Đã hủy tư cách Booster thành công.");
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

  // State: Already Booster
  if (isAlreadyBooster) {
    return (
      <div className="min-h-screen bg-[#050608] text-white font-sans selection:bg-cyan-500/30 relative overflow-hidden flex items-center justify-center p-4">
        <Navbar />
        <div className="fixed inset-0 bg-gradient-to-b from-cyan-600/10 via-transparent to-transparent pointer-events-none" />
        
        <Card className="border-cyan-500/30 bg-zinc-900/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-md w-full relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500" />
          
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto w-20 h-20 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-4 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
              <ShieldCheck className="w-10 h-10 text-cyan-400" />
            </div>
            <CardTitle className="text-2xl font-black text-white">Bạn Đang Là Booster</CardTitle>
            <CardDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
              Tài khoản của bạn đã được phê duyệt tư cách Booster chính thức. Bạn có thể nhận đơn và kiếm thu nhập ngay.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4 pb-8">
            <Button 
              onClick={() => router.push('/booster/dashboard')}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black h-12 shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all hover:scale-102"
            >
              <Trophy className="mr-2 h-4 w-4" /> Vào Booster Dashboard
            </Button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-zinc-900 px-3 text-zinc-500">Hoặc</span></div>
            </div>

            <Button 
              onClick={() => setShowResignModal(true)}
              variant="outline"
              className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-12 text-xs font-bold"
            >
              <DoorOpen className="mr-2 h-4 w-4" /> Xin Nghỉ Việc (Về Tài Khoản Khách)
            </Button>
          </CardContent>
        </Card>

        {/* Resign Confirmation Modal */}
        <Dialog open={showResignModal} onOpenChange={setShowResignModal}>
          <DialogContent className="bg-zinc-900 border-red-500/30 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Hủy Quyền Booster
              </DialogTitle>
              <DialogDescription className="text-zinc-300 pt-3 text-sm">
                Bạn có chắc chắn muốn ngừng hoạt động với tư cách Booster trên hệ thống?
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
              <p className="font-bold text-zinc-300">Sau khi xác nhận:</p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li>Khoản tiền cọc (nếu có) sẽ được hoàn trả theo quy định</li>
                <li>Bạn sẽ không thể nhận thêm đơn hàng mới</li>
                <li>Tài khoản sẽ chuyển về giao diện Khách hàng</li>
              </ul>
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => setShowResignModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs">Hủy</Button>
              <Button onClick={confirmResign} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs">Xác nhận</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden pt-28 pb-32">
      <Navbar />

      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.png")' }}></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="relative z-10 container mx-auto px-4 max-w-4xl">
        
        {/* ========================================================================= */}
        {/* HERO HEADER SECTION                                                       */}
        {/* ========================================================================= */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Gia Nhập Đội Ngũ Tuyển Thủ LeoRank Pro</span>
            </span>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-4 uppercase">
              Đăng Ký Trở Thành <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
                Booster Chuyên Nghiệp
              </span>
            </h1>

            <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
              Nhận nguồn đơn hàng ổn định hàng ngày, hưởng mức chia sẻ doanh thu lên đến 85%, rút tiền tức thì 24/7 và được bảo vệ quyền lợi bằng hợp đồng điện tử.
            </p>

            {/* 3 Booster Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3 text-left">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><Wallet className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-bold text-white">Chia sẻ 80% - 85%</div>
                  <div className="text-[11px] text-zinc-500">Mức chiết khấu cao nhất</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3 text-left">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><Zap className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-bold text-white">Rút Tiền Tức Thì 24/7</div>
                  <div className="text-[11px] text-zinc-500">Về mọi ngân hàng VN</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3 text-left">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><ShieldCheck className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-bold text-white">Bảo Hộ Escrow</div>
                  <div className="text-[11px] text-zinc-500">100% không lo quỵt tiền</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* STEPPER PROGRESS BAR                                                      */}
        {/* ========================================================================= */}
        <div className="mb-12">
          <div className="relative">
            {/* Background Track */}
            <div className="absolute top-6 left-0 w-full h-1 bg-zinc-800 rounded-full -z-10 -translate-y-1/2">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>

            <div className="flex justify-between items-center w-full">
              {STEPS.map((s) => {
                const isActive = step >= s.id;
                const isCurrent = step === s.id;
                
                return (
                  <div key={s.id} className="flex flex-col items-center gap-2 relative group">
                    <div 
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 z-10 relative
                        ${isActive 
                          ? 'bg-zinc-950 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]' 
                          : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                        }
                      `}
                    >
                      {step > s.id ? (
                        <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                      ) : (
                        <span className={`text-base font-black font-mono ${isActive ? 'text-cyan-300' : 'text-zinc-600'}`}>{s.id}</span>
                      )}
                      
                      {isCurrent && (
                        <span className="absolute inset-0 rounded-2xl border border-cyan-400/50 animate-ping opacity-75" />
                      )}
                    </div>

                    <span className={`hidden md:block text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="md:hidden text-center mt-5">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                Bước {step}: {STEPS[step - 1]?.title}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FORM CONTENT CARD                                                         */}
        {/* ========================================================================= */}
        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500" />
          
          <CardContent className="p-6 md:p-10">
            <form onSubmit={(e) => e.preventDefault()}>
              <AnimatePresence mode="wait">
                
                {/* ---------------- STEP 1: PERSONAL INFO ---------------- */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-cyan-400" />
                        1. Thông Tin Định Danh Cá Nhân
                      </h3>
                      <p className="text-xs text-zinc-400">Thông tin này được bảo mật tuyệt đối và chỉ dùng để đối soát thanh toán.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Họ và tên thật *</Label>
                        <Input 
                          {...register('fullName')} 
                          placeholder="Ví dụ: Nguyễn Văn A" 
                          className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-500 transition-colors" 
                        />
                        {errors.fullName && <p className="text-red-400 text-xs">{errors.fullName.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Số điện thoại liên hệ *</Label>
                        <Input 
                          {...register('phoneNumber')} 
                          placeholder="Ví dụ: 0987654321" 
                          className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-500 transition-colors" 
                        />
                        {errors.phoneNumber && <p className="text-red-400 text-xs">{errors.phoneNumber.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Link Facebook cá nhân *</Label>
                        <Input 
                          {...register('facebookUrl')} 
                          placeholder="https://facebook.com/username" 
                          className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-500 transition-colors" 
                        />
                        {errors.facebookUrl && <p className="text-red-400 text-xs">{errors.facebookUrl.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Discord Tag (Để liên hệ nhận đơn) *</Label>
                        <Input 
                          {...register('discordTag')} 
                          placeholder="Ví dụ: leorank#1234" 
                          className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-500 transition-colors" 
                        />
                        {errors.discordTag && <p className="text-red-400 text-xs">{errors.discordTag.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ---------------- STEP 2: GAME VERIFICATION & BANK ---------------- */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    {/* Game Details */}
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-400" />
                          2. Xác Thực Trình Độ Thi Đấu
                        </h3>
                        <p className="text-xs text-zinc-400">Yêu cầu tối thiểu đạt mức rank Cao Thủ trở lên trong mùa hiện tại hoặc gần nhất.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Bậc Rank Hiện Tại *</Label>
                          <Input 
                            {...register('currentRank')} 
                            placeholder="Ví dụ: Cao Thủ 350 LP" 
                            className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-500 transition-colors" 
                          />
                          {errors.currentRank && <p className="text-red-400 text-xs">{errors.currentRank.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Bậc Rank Cao Nhất Từng Đạt *</Label>
                          <Input 
                            {...register('highestRank')} 
                            placeholder="Ví dụ: Thách Đấu 1100 LP" 
                            className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-500 transition-colors" 
                          />
                          {errors.highestRank && <p className="text-red-400 text-xs">{errors.highestRank.message}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Link Hồ Sơ OP.GG hoặc Tracker *</Label>
                          <Input 
                            {...register('opggLink')} 
                            placeholder="https://www.op.gg/summoners/vn/..." 
                            className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-500 transition-colors" 
                          />
                          {errors.opggLink && <p className="text-red-400 text-xs">{errors.opggLink.message}</p>}
                        </div> 

                        {/* Rank Proof Screenshot */}
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ảnh Bằng Chứng Màn Hình Trong Game *</Label>
                          
                          <div className="relative group">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload}
                              disabled={isUploadingRank}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                            />
                            <div className={`
                              border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all
                              ${errors.rankImageUrl ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 hover:border-cyan-500/50'}
                            `}>
                              {isUploadingRank ? (
                                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                              ) : rankImageUrl ? (
                                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-zinc-800 group-hover:opacity-60 transition-opacity">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={rankImageUrl} alt="Rank Proof" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-black/80 text-white px-4 py-1.5 rounded-full text-xs font-bold">Nhấn để thay đổi ảnh</span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 group-hover:scale-110 transition-transform">
                                    <CloudUpload className="w-8 h-8 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs sm:text-sm font-bold text-zinc-300">Nhấn để tải lên ảnh bằng chứng rank</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">Hỗ trợ PNG, JPG, JPEG (Tối đa 5MB)</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {errors.rankImageUrl && <p className="text-red-400 text-xs">{errors.rankImageUrl.message}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-zinc-800" />

                    {/* Deposit Section (Conditional based on Admin config) */}
                    {adminSettings.depositConfig.depositRequired ? (
                      <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 animate-in fade-in">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="text-amber-400 shrink-0 mt-1 w-5 h-5" />
                          <div className="w-full">
                            <h4 className="font-bold text-amber-300 text-sm">Khoản Ký Quỹ Bảo Chứng Uy Tín (Deposit Required)</h4>
                            <p className="text-xs text-zinc-400 mt-1 mb-4 leading-relaxed">
                              Nhằm đảm bảo an toàn tài khoản của khách hàng, hệ thống yêu cầu khoản cọc bảo chứng là <span className="text-white font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(adminSettings.depositConfig.depositAmount)}</span>. Khoản này được giữ an toàn và <b className="text-amber-300">hoàn lại 100%</b> khi bạn ngừng hợp tác.
                            </p>
                            
                            <div className="flex flex-col md:flex-row gap-5 items-center">
                              {/* QR Code */}
                              <div className="bg-white p-2.5 rounded-2xl shrink-0 shadow-inner">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrCodeUrl} alt="QR Chuyển khoản" className="w-32 h-32 md:w-36 md:h-36 object-contain" />
                              </div>

                              {/* Bank Info */}
                              <div className="flex-1 space-y-2.5 w-full text-xs">
                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                                    <span className="text-zinc-500">Ngân hàng:</span>
                                    <span className="font-bold text-white">{adminSettings.adminBank.bankName}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                                    <span className="text-zinc-500">Số tài khoản:</span>
                                    <span className="font-mono font-bold text-white tracking-wider">{adminSettings.adminBank.accountNumber}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                                    <span className="text-zinc-500">Chủ tài khoản:</span>
                                    <span className="font-bold text-white uppercase">{adminSettings.adminBank.accountHolder}</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-0.5">
                                    <span className="text-zinc-500">Nội dung chuyển khoản:</span>
                                    <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded select-all">{transferContent}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Upload Bill */}
                            <div className="mt-4 pt-4 border-t border-amber-500/20">
                              <Label className="text-xs font-bold text-zinc-300 mb-2 block">Tải lên ảnh Bill chuyển khoản thành công *</Label>
                              <div className="flex items-center gap-3">
                                <div className="relative group flex-1">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleBillUpload}
                                    disabled={isUploadingBill}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                                  />
                                  <div className={`
                                    border border-dashed rounded-xl p-3 flex items-center justify-center gap-2 transition-all
                                    ${billImageUrl ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-900'}
                                  `}>
                                    {isUploadingBill ? (
                                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                                    ) : billImageUrl ? (
                                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Đã tải ảnh Bill thành công</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-zinc-400">Nhấn để tải lên ảnh Bill chuyển khoản...</span>
                                    )}
                                  </div>
                                </div>
                                {billImageUrl && (
                                  <a href={billImageUrl} target="_blank" rel="noreferrer" className="shrink-0 w-11 h-11 rounded-xl border border-zinc-800 overflow-hidden block">
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
                      <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-4 flex items-start gap-3">
                        <CheckCircle2 className="text-cyan-400 shrink-0 mt-0.5 w-5 h-5" />
                        <div>
                          <h4 className="font-bold text-cyan-300 text-sm">Chính Sách Đăng Ký Miễn Cọc</h4>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Hệ thống hiện đang hỗ trợ miễn phí tiền ký quỹ cho các tuyển thủ mới đăng ký trong tháng này.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Booster Bank Details */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-cyan-400" />
                          Thông Tin Tài Khoản Ngân Hàng Thụ Hưởng
                        </h3>
                        <p className="text-xs text-zinc-400">Dùng để nhận tiền thanh toán tự động khi bạn hoàn thành các đơn hàng.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ngân Hàng *</Label>
                          
                          <div 
                            onClick={() => setIsBankOpen(true)}
                            className={cn(
                              "flex items-center justify-between w-full rounded-xl border px-3.5 py-2 text-sm cursor-pointer h-11 transition-all",
                              selectedBankName 
                                ? "border-cyan-500/50 bg-cyan-950/20 shadow-sm"
                                : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                            )}
                          >
                            {selectedBankName ? (
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                {banks.find(b => b.shortName === selectedBankName)?.logo ? (
                                  <img 
                                    src={banks.find(b => b.shortName === selectedBankName)?.logo} 
                                    alt="Bank Logo" 
                                    className="w-6 h-6 object-contain bg-white rounded p-0.5 shrink-0" 
                                  />
                                ) : (
                                  <Landmark className="w-4 h-4 text-cyan-400 shrink-0" />
                                )}
                                <span className="text-white font-bold text-xs truncate">{selectedBankName}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                <Landmark className="w-4 h-4 text-zinc-600" />
                                <span>Chọn ngân hàng...</span>
                              </div>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-zinc-400" />
                          </div>

                          <input type="hidden" {...register('bankName')} />
                          {errors.bankName && <p className="text-red-400 text-xs">{errors.bankName.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Số Tài Khoản *</Label>
                          <Input 
                            {...register('bankAccountNumber')} 
                            placeholder="Số tài khoản..."
                            className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-500 font-mono transition-colors" 
                          />
                          {errors.bankAccountNumber && <p className="text-red-400 text-xs">{errors.bankAccountNumber.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tên Chủ Tài Khoản *</Label>
                          <Input 
                            {...register('bankAccountName')} 
                            placeholder="NGUYEN VAN A"
                            className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-500 uppercase transition-colors" 
                          />
                          {errors.bankAccountName && <p className="text-red-400 text-xs">{errors.bankAccountName.message}</p>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ---------------- STEP 3: COMMITMENTS & DIGITAL CONTRACT ---------------- */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-emerald-400" />
                        3. Cam Kết Nghề Nghiệp & Ký Hợp Đồng Điện Tử
                      </h3>
                      <p className="text-xs text-zinc-400">Vui lòng đọc kỹ và gạt bật toàn bộ các điều khoản cam kết trước khi ký tên.</p>
                    </div>

                    {/* Commitments Switch List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {COMMITMENTS.map((item) => (
                        <div 
                          key={item.id} 
                          className={`p-4 rounded-2xl border transition-all ${
                            agreements[item.id] ? 'bg-emerald-950/20 border-emerald-500/50' : 'bg-zinc-950 border-zinc-800'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className={`text-xs font-bold ${agreements[item.id] ? 'text-emerald-300' : 'text-zinc-200'}`}>
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                            <Switch 
                              checked={!!agreements[item.id]}
                              onCheckedChange={() => toggleAgreement(item.id)}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Digital Signature Pad Box */}
                    <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-bold uppercase tracking-wider text-white">Chữ Ký Điện Tử Của Bạn *</Label>
                          <p className="text-xs text-zinc-500 mt-0.5">Dùng chuột hoặc màn hình cảm ứng để ký tên xác nhận vào khung trắng bên dưới.</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={clearSignature}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Eraser size={12} /> Xóa Chữ Ký
                        </button>
                      </div>

                      {/* Canvas Container */}
                      <div className="border border-zinc-700 rounded-xl bg-white overflow-hidden relative shadow-inner">
                        <SignatureCanvas 
                          ref={sigCanvas}
                          penColor="black"
                          canvasProps={{ width: 500, height: 200, className: 'sigCanvas w-full h-44 cursor-crosshair' }}
                          onEnd={saveSignature}
                        />
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Nhập Lại Họ Tên Để Đối Chiếu Chữ Ký *
                        </Label>
                        <Input 
                          {...register('agreementSigned_name')}
                          placeholder="Ví dụ: Nguyễn Văn A (Phải khớp với tên ở Bước 1)" 
                          className={`bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-sm ${
                            signature && !isNameMatch ? 'border-red-500 focus:border-red-500' : 
                            isNameMatch ? 'border-emerald-500 focus:border-emerald-500' : 'focus:border-cyan-500'
                          }`}
                        />
                        {signature && !isNameMatch && (
                          <p className="text-red-400 text-xs">Họ tên đối chiếu không khớp với họ tên ở Bước 1.</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-10 pt-6 border-t border-zinc-800">
                {step > 1 ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep} 
                    className="border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-bold text-xs h-11 px-5 rounded-xl transition-all"
                  >
                    <ChevronLeft className="mr-1.5 h-4 w-4" /> Quay Lại
                  </Button>
                ) : <div></div>}

                {step < 3 ? (
                  <Button 
                    type="button" 
                    onClick={nextStep} 
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs h-11 px-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
                  >
                    <span>Tiếp Theo</span>
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={() => setShowConfirmModal(true)} 
                    disabled={!allAgreementsChecked || !isSignatureValid || !signatureDataUrl}
                    className={`font-black text-xs h-11 px-7 rounded-xl transition-all ${
                      (!allAgreementsChecked || !isSignatureValid || !signatureDataUrl) 
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                    }`}
                  >
                    Xem Lại & Nộp Đơn
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* HIDDEN CONTRACT TEMPLATE FOR PDF GENERATION (DO NOT USE TAILWIND COLORS)   */}
      {/* ========================================================================= */}
      <div className="fixed top-0 left-0 z-[-50]">
        <div id="contract-template" style={{ width: '210mm', minHeight: '297mm', padding: '20mm', fontFamily: 'Times New Roman, serif', lineHeight: '1.6', position: 'relative', backgroundColor: '#ffffff', color: '#000000', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', margin: 0 }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
            <p style={{ fontWeight: 'bold', marginBottom: '24px', textDecoration: 'underline', textDecorationColor: '#000000', margin: 0 }}>Độc lập - Tự do - Hạnh phúc</p>
            <h2 style={{ fontSize: '30px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '40px', marginBottom: '8px' }}>HỢP ĐỒNG HỢP TÁC CÀY THUÊ ESPORTS</h2>
            <p style={{ fontStyle: 'italic', fontSize: '14px', marginTop: '8px' }}>Số: {contractDate ? contractDate.getTime() : '...'}/HĐ-BOOSTER</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{ margin: 0 }}>Hôm nay, ngày {contractDate ? contractDate.getDate() : '...'} tháng {contractDate ? contractDate.getMonth() + 1 : '...'} năm {contractDate ? contractDate.getFullYear() : '...'}, tại hệ thống {adminSettings.platformName}, chúng tôi gồm:</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>BÊN A: {adminSettings.platformName.toUpperCase()} (Bên quản lý hệ thống)</h3>
            <p style={{ margin: 0 }}>Đại diện bởi ban quản trị nền tảng LeoRank.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>BÊN B: {fullName?.toUpperCase()} (Bên Tuyển thủ Booster)</h3>
            <p style={{ margin: 0 }}>Số điện thoại: {watch('phoneNumber')}</p>
            <p style={{ margin: 0 }}>Discord: {watch('discordTag')}</p>
            <p style={{ margin: 0 }}>Facebook: {watch('facebookUrl')}</p>
            <p style={{ margin: 0 }}>Ngân hàng thụ hưởng: {watch('bankName')} - {watch('bankAccountNumber')} ({watch('bankAccountName')})</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', margin: 0 }}>ĐIỀU 1: NỘI DUNG HỢP TÁC</h3>
            <p style={{ textAlign: 'justify', margin: 0 }}>Bên B đồng ý trở thành đối tác cung cấp dịch vụ cày thuê (Boosting) trên nền tảng của Bên A. Bên B cam kết tuân thủ mọi quy định về bảo mật, chất lượng thi đấu và thái độ phục vụ khách hàng.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', margin: 0 }}>ĐIỀU 2: CÁC CAM KẾT NGHỀ NGHIỆP</h3>
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
              <div style={{ marginTop: '64px', fontWeight: 'bold' }}>LEORANK ADMIN</div>
            </div>
            <div style={{ textAlign: 'center', width: '50%' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>ĐẠI DIỆN BÊN B</p>
              <p style={{ fontStyle: 'italic', fontSize: '14px', margin: 0 }}>(Ký tên xác nhận)</p>
              <div style={{ marginTop: '16px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {signatureDataUrl ? <img src={signatureDataUrl} alt="Signature" style={{ maxHeight: '80px', maxWidth: '100%' }} /> : <span style={{color: '#ccc'}}>...</span>}
              </div>
              <div style={{ marginTop: '16px', fontWeight: 'bold' }}>{fullName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONFIRMATION & PDF DOWNLOAD MODAL                                         */}
      {/* ========================================================================= */}
      <Dialog open={showConfirmModal} onOpenChange={(isOpen) => {
        setShowConfirmModal(isOpen);
        if (!isOpen) {
          setHasDownloadedContract(false);
        }
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Xác Nhận Nộp Hồ Sơ Tuyển Thủ
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs pt-1.5 leading-relaxed">
              Vui lòng bấm <b className="text-cyan-400">"Tải Bản Khai PDF"</b> để lưu lại hợp đồng điện tử trước khi gửi hồ sơ chính thức lên hệ thống.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <Button
              variant="ghost"
              onClick={() => setShowConfirmModal(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              className="border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-bold rounded-xl"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Tải Bản Khai PDF
            </Button>
            <Button
              onClick={() => {
                if (!hasDownloadedContract) {
                  toast.error("Vui lòng tải bản khai hợp đồng trước khi gửi đăng ký.");
                  return;
                }
                handleSubmit(onSubmit)();
              }}
              disabled={isSubmitting}
              className={`bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] ${
                !hasDownloadedContract && !isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
              )}
              Xác Nhận Gửi Hồ Sơ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Selection Modal */}
      <BankSelectModal
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        banks={banks}
        selectedBankName={selectedBankName}
        onSelectBank={(bank) => {
          setValue('bankName', bank.shortName, { shouldValidate: true });
        }}
      />
    </div>
  );
}
