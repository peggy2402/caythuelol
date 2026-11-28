// src/app/boosters/apply/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Loader2, CheckCircle2, ShieldAlert, ChevronRight, ChevronLeft, ChevronDown, Gamepad2,
  AlertTriangle, Trophy, ChevronsUpDown, Check, CloudUpload, 
  X, Eraser, Download, DoorOpen, Landmark,
  ShieldCheck, Zap, Sparkles, Lock, ArrowRight, Wallet, UserCheck, Flame,
  FileSignature, Copy, CheckCheck, ExternalLink, Shield, BadgeCheck, Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import SignatureCanvas from 'react-signature-canvas';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';
import BankSelectModal from './bank-select-modal';

// Danh sách tựa game thế mạnh chính được hỗ trợ
const GAME_OPTIONS = [
  {
    code: 'LOL',
    name: 'Liên Minh Huyền Thoại',
    short: 'LMHT',
    currentRankPlaceholder: 'Ví dụ: Cao Thủ 350 LP / Thách Đấu',
    highestRankPlaceholder: 'Ví dụ: Thách Đấu 1100 LP / Top 500',
    trackerLabel: 'Link Hồ Sơ Hoặc Tên Ingame (OP.GG / Riot ID)',
    trackerPlaceholder: 'Ví dụ: TênIngame#VN2 hoặc link https://www.op.gg/summoners/vn/...',
    trackerHint: 'Nhập Riot ID (Tên#Tag) hoặc dán link OP.GG để đối soát',
  },
  {
    code: 'VALORANT',
    name: 'VALORANT',
    short: 'VAL',
    currentRankPlaceholder: 'Ví dụ: Immortal 3 / Radiant',
    highestRankPlaceholder: 'Ví dụ: Radiant #120 / Top 500',
    trackerLabel: 'Link Hồ Sơ Hoặc Riot ID (Tracker.gg)',
    trackerPlaceholder: 'Ví dụ: TênIngame#TAG hoặc link https://tracker.gg/valorant/profile/...',
    trackerHint: 'Nhập Riot ID (Tên#Tag) hoặc link Tracker.gg để đối soát',
  },
  {
    code: 'AOV',
    name: 'Liên Quân Mobile',
    short: 'LQMB',
    currentRankPlaceholder: 'Ví dụ: Chiến Tướng 50 Sao',
    highestRankPlaceholder: 'Ví dụ: Thách Đấu 100 Sao',
    trackerLabel: 'Tên Ingame Hoặc Open ID Garena',
    trackerPlaceholder: 'Ví dụ: Tên ingame, ID Garena hoặc link trang cá nhân...',
    trackerHint: 'Cung cấp tên tài khoản ingame hoặc Open ID Garena để ban quản trị kiểm tra',
  },
  {
    code: 'TFT',
    name: 'Đấu Trường Chân Lý (TFT)',
    short: 'ĐTCL',
    currentRankPlaceholder: 'Ví dụ: Đại Cao Thủ 450 LP',
    highestRankPlaceholder: 'Ví dụ: Thách Đấu 950 LP / Top 100',
    trackerLabel: 'Link Hồ Sơ Hoặc Tên Ingame (Tactics.tools / Riot ID)',
    trackerPlaceholder: 'Ví dụ: TênIngame#VN2 hoặc link Tactics.tools / OP.GG TFT...',
    trackerHint: 'Nhập Riot ID hoặc link Tactics.tools / OP.GG TFT để đối soát',
  },
  {
    code: 'CS2',
    name: 'Counter-Strike 2',
    short: 'CS2',
    currentRankPlaceholder: 'Ví dụ: 20,000 Premier / Faceit Level 10',
    highestRankPlaceholder: 'Ví dụ: 25,000+ Premier / Top Leaderboard',
    trackerLabel: 'Link Profile Hoặc Steam ID / Faceit',
    trackerPlaceholder: 'Ví dụ: Steam ID, tên tài khoản Faceit hoặc link CSStats...',
    trackerHint: 'Nhập link CSStats, Faceit hoặc Steam Profile công khai',
  },
  {
    code: 'DOTA2',
    name: 'Dota 2',
    short: 'DOTA2',
    currentRankPlaceholder: 'Ví dụ: Divine 5 / Immortal',
    highestRankPlaceholder: 'Ví dụ: Immortal Top 1000',
    trackerLabel: 'Link Hồ Sơ Hoặc Friend ID Steam / Dotabuff',
    trackerPlaceholder: 'Ví dụ: Friend ID Dota 2 hoặc link Dotabuff / Stratz...',
    trackerHint: 'Nhập Friend ID Dota 2 hoặc link Dotabuff / Stratz',
  },
  {
    code: 'OVERWATCH2',
    name: 'Overwatch 2',
    short: 'OW2',
    currentRankPlaceholder: 'Ví dụ: Master 2 / Grandmaster',
    highestRankPlaceholder: 'Ví dụ: Top 500 GM1',
    trackerLabel: 'BattleTag Hoặc Link Career Profile',
    trackerPlaceholder: 'Ví dụ: BattleTag#1234 hoặc link Career Profile...',
    trackerHint: 'Nhập BattleTag hoặc link hồ sơ Overwatch công khai',
  },
  {
    code: 'OTHER',
    name: 'Tựa Game Khác',
    short: 'Khác',
    currentRankPlaceholder: 'Ví dụ: Bậc xếp hạng cao nhất hiện tại của bạn',
    highestRankPlaceholder: 'Ví dụ: Mốc rank kỷ lục bạn từng đạt được',
    trackerLabel: 'Tên Ingame Hoặc Link Tra Cứu Trình Độ',
    trackerPlaceholder: 'Ví dụ: Tên Ingame, ID tài khoản hoặc link hồ sơ bất kỳ...',
    trackerHint: 'Nhập tên nhân vật trong game hoặc link chứng minh trình độ',
  },
];

// Form Validation Schema
const formSchema = z.object({
  fullName: z.string().min(2, "Họ tên quá ngắn (tối thiểu 2 ký tự)"),
  phoneNumber: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ (10-11 số)"),
  facebookUrl: z.string()
    .min(3, "Vui lòng nhập link Facebook")
    .refine((val) => {
      const trimmed = val.trim();
      return /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+$/i.test(trimmed);
    }, "Link Facebook không hợp lệ (ví dụ: facebook.com/vtchn hoặc fb.com/vtchn)"),
  discordTag: z.string().min(3, "Discord Tag không hợp lệ"),
  primaryGame: z.string().min(1, "Vui lòng chọn game thế mạnh chính"),
  customGameName: z.string().optional(),
  currentRank: z.string().min(1, "Vui lòng nhập Rank hiện tại"),
  highestRank: z.string().min(1, "Vui lòng nhập Rank cao nhất từng đạt"),
  opggLink: z.string().min(2, "Vui lòng nhập link hoặc tên Ingame/ID thi đấu"),
  rankImageUrl: z.string().min(1, "Vui lòng tải lên ảnh bằng chứng rank"),
  bankName: z.string().min(1, "Vui lòng chọn ngân hàng thụ hưởng"),
  bankAccountName: z.string().min(1, "Vui lòng nhập tên chủ tài khoản"),
  bankAccountNumber: z.string().min(1, "Vui lòng nhập số tài khoản ngân hàng"),
  agreementSigned_name: z.string(),
  signatureImage: z.string().optional(),
  contractUrl: z.string().optional(),
  billImageUrl: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.primaryGame === 'OTHER') {
    if (!data.customGameName || data.customGameName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập tên tựa game bạn muốn đăng ký (tối thiểu 2 ký tự)",
        path: ["customGameName"],
      });
    }
  }
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
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUploadingRank, setIsUploadingRank] = useState(false);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [rankImageFile, setRankImageFile] = useState<File | null>(null);
  const [billImageFile, setBillImageFile] = useState<File | null>(null);
  const [rankImagePreview, setRankImagePreview] = useState<string | null>(null);
  const [billImagePreview, setBillImagePreview] = useState<string | null>(null);
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
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

  // Existing Booster Application
  const [existingApp, setExistingApp] = useState<any | null>(null);
  const [loadingExistingApp, setLoadingExistingApp] = useState(true);
  const [currentUsername, setCurrentUsername] = useState('');

  const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      primaryGame: 'LOL',
    }
  });

  const selectedGame = watch('primaryGame') || 'LOL';
  const customGameName = watch('customGameName');
  const currentGameConfig = GAME_OPTIONS.find(g => g.code === selectedGame) || GAME_OPTIONS[0];
  const displayGameName = selectedGame === 'OTHER' 
    ? (customGameName?.trim() || 'Tựa game khác') 
    : `${currentGameConfig.name} (${currentGameConfig.short})`;

  const fullName = watch('fullName');
  const signature = watch('agreementSigned_name');
  const selectedBankName = watch('bankName');
  const rankImageUrl = watch('rankImageUrl');
  const billImageUrl = watch('billImageUrl');
  const phoneNumber = watch('phoneNumber');

  // Copy helper
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Fetch Banks
  useEffect(() => {
    fetch('https://api.vietqr.io/v2/banks')
      .then(res => res.json())
      .then(data => setBanks(data.data || []))
      .catch(err => console.error("Failed to fetch banks", err));
  }, []);

  // Set contract date on client
  useEffect(() => {
    setContractDate(new Date());
  }, []);

  // Fetch Existing Booster Application (nếu người dùng đã từng nộp)
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoadingExistingApp(false);
      return;
    }
    fetch('/api/boosters/my-application', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.application) {
          setExistingApp(data.application);
        }
      })
      .catch((err) => console.error('Failed to fetch existing booster application', err))
      .finally(() => setLoadingExistingApp(false));
  }, []);

  // Fetch Admin Settings
  useEffect(() => {
    const fetchAdminSettings = async () => {
      try {
        const res = await fetch(`/api/settings/public?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        const settings = data?.settings || (Array.isArray(data) ? data.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {}) : data) || {};

        const depositConfig = settings.booster_registration_config || settings.boosterRegistrationConfig;
        const adminBankRaw = settings.ADMIN_BANK_INFO || {};
        const bankName = adminBankRaw.bankName || settings.bank_id || 'MB';
        const accountNumber = adminBankRaw.accountNumber || settings.bank_account_no || '';
        const accountHolder = adminBankRaw.accountHolder || settings.bank_account_name || '';

        setAdminSettings(prev => ({
          ...prev,
          adminBank: {
            bankName: bankName || prev.adminBank.bankName,
            accountNumber: accountNumber || prev.adminBank.accountNumber,
            accountHolder: accountHolder || prev.adminBank.accountHolder,
          },
          depositConfig: depositConfig ? {
            depositRequired: Boolean(depositConfig.depositRequired),
            depositAmount: Number(depositConfig.depositAmount) || 49995,
          } : prev.depositConfig
        }));
      } catch (error) {
        console.error("Failed to fetch admin settings", error);
      }
    };
    fetchAdminSettings();

    // Check user role & username
    const checkUserRole = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'BOOSTER') setIsAlreadyBooster(true);
          if (user.username) setCurrentUsername(user.username);
        } catch {}
      }
    };
    checkUserRole();
  }, []);

  // Constants
  const STEPS = [
    { id: 1, title: 'Hồ sơ cá nhân', subtitle: 'Thông tin liên hệ & định danh' },
    { id: 2, title: 'Trình độ & Thanh toán', subtitle: 'Xác thực Rank & Ngân hàng' },
    { id: 3, title: 'Ký hợp đồng điện tử', subtitle: 'Cam kết & Ký tên online' },
  ];

  const COMMITMENTS = [
    { id: 'tool', title: 'Không sử dụng phần mềm thứ ba', desc: 'Tuyệt đối không sử dụng tool, script, hack, bot hay bất kỳ phần mềm can thiệp gian lận nào trong quá trình thi đấu.' },
    { id: 'security', title: 'Bảo mật tài khoản khách hàng', desc: 'Bảo mật thông tin đăng nhập, không tự ý đổi mật khẩu, không tiêu xài tài nguyên ingame (Tinh Hoa Lam, RP, Quân Huy, VP, Radianite, Vàng, Vé quay...) của khách.' },
    { id: 'private', title: 'Giữ kín thông tin & Ẩn danh tuyệt đối', desc: 'Không chat trong trận, không kết bạn, không trả lời tin nhắn bạn bè của khách, luôn bật chế độ bảo mật hoặc Offline khi thực hiện đơn hàng.' },
    { id: 'stream', title: 'Quy tắc Livestream (nếu có)', desc: 'Chỉ livestream khi khách hàng có đăng ký gói add-on xem trực tiếp và tuân thủ che tên tài khoản ingame của khách.' },
    { id: 'penalty', title: 'Cam kết bồi thường vi phạm', desc: 'Chịu trách nhiệm bồi thường 100% nếu gây ra sự cố khóa tài khoản do lỗi chủ quan của Booster.' },
    { id: 'deposit', title: 'Quy chế Escrow & Không phá đơn', desc: 'Tuyệt đối không lôi kéo khách giao dịch ngoài sàn né phí Escrow; nhận đơn có trách nhiệm, không tự ý bỏ đơn giữa chừng.' },
  ];

  // Stepper handlers
  const nextStep = async () => {
    if (step === 2) {
      try {
        const res = await fetch(`/api/settings/public?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        const settings = data?.settings || (Array.isArray(data) ? data.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {}) : data) || {};
        const serverDepositConfig = settings.booster_registration_config || settings.boosterRegistrationConfig;
        if (serverDepositConfig && Boolean(serverDepositConfig.depositRequired) !== adminSettings.depositConfig.depositRequired) {
          setAdminSettings(prev => ({
            ...prev,
            depositConfig: {
              depositRequired: Boolean(serverDepositConfig.depositRequired),
              depositAmount: Number(serverDepositConfig.depositAmount) || 49995,
            }
          }));
          toast.warning("Cấu hình hệ thống đã cập nhật", {
            description: serverDepositConfig.depositRequired 
              ? "Hệ thống vừa bật yêu cầu thanh toán phí kích hoạt quyền Booster. Vui lòng chuyển khoản để tiếp tục."
              : "Hệ thống vừa áp dụng miễn phí đăng ký Booster. Bạn không cần thanh toán nữa."
          });
          return;
        }
      } catch (e) { 
        console.error("Sync check failed", e); 
      }

      if (adminSettings.depositConfig.depositRequired && !billImageUrl && !billImageFile) {
        toast.error("Thiếu ảnh Bill chuyển khoản", {
          description: "Vui lòng tải lên ảnh Bill chuyển khoản phí kích hoạt quyền Booster để tiếp tục."
        });
        return;
      }
    }

    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) fieldsToValidate = ['fullName', 'phoneNumber', 'facebookUrl', 'discordTag'];
    if (step === 2) {
      fieldsToValidate = ['primaryGame', 'currentRank', 'highestRank', 'opggLink', 'rankImageUrl', 'bankName', 'bankAccountName', 'bankAccountNumber'];
      if (watch('primaryGame') === 'OTHER') {
        fieldsToValidate.push('customGameName');
      }
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const toggleAgreement = (id: string) => {
    setAgreements(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllAgreements = () => {
    const allChecked = COMMITMENTS.every(c => agreements[c.id]);
    const newState: Record<string, boolean> = {};
    COMMITMENTS.forEach(c => {
      newState[c.id] = !allChecked;
    });
    setAgreements(newState);
  };

  const allAgreementsChecked = COMMITMENTS.every(c => agreements[c.id]);
  const isNameMatch = signature && fullName && signature.trim().toLowerCase() === fullName.trim().toLowerCase();
  const isSignatureValid = isNameMatch && !sigCanvas.current?.isEmpty();

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setSignatureDataUrl(null);
  };

  const saveSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setSignatureDataUrl(sigCanvas.current.getCanvas().toDataURL('image/png'));
    }
  };

  // QR Code Generation
  const transferContent = `BOOSTERAPPLY ${currentUsername || phoneNumber || 'USER'}`.toUpperCase();
  const qrCodeUrl = `https://img.vietqr.io/image/${adminSettings.adminBank.bankName}-${adminSettings.adminBank.accountNumber}-compact2.png?amount=${adminSettings.depositConfig.depositAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(adminSettings.adminBank.accountHolder)}`;

  // Upload Handlers (Deferred Upload - Tải lên cục bộ 0ms, chỉ upload Cloudinary khi nộp đơn)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File quá lớn", { description: "Vui lòng chọn ảnh dung lượng dưới 5MB" });
      return;
    }

    setRankImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setRankImagePreview(localUrl);
    setValue('rankImageUrl', localUrl, { shouldValidate: true });
    toast.success("Đã chọn ảnh minh chứng Rank");
  };

  const handleBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File quá lớn", { description: "Vui lòng chọn ảnh dung lượng dưới 5MB" });
      return;
    }

    setBillImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setBillImagePreview(localUrl);
    setValue('billImageUrl', localUrl, { shouldValidate: true });
    toast.success("Đã chọn ảnh Bill chuyển khoản");
  };

  const uploadSingleFile = async (file: File, folder: 'uploads' | 'chat' = 'uploads'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error("Không thể tải ảnh lên hệ thống. Vui lòng thử lại.");
    const data = await res.json();
    return data.url;
  };

  // PDF Contract Generation
  const generateContractBlob = async (): Promise<Blob | null> => {
    const contractElement = document.getElementById('contract-template');
    if (!contractElement) return null;

    try {
      // 1. Đồng bộ chữ ký trực tiếp từ canvas vào DOM trước khi chụp canvas
      let currentSig = signatureDataUrl;
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        currentSig = sigCanvas.current.getCanvas().toDataURL('image/png');
        setSignatureDataUrl(currentSig);
      }
      const sigImg = document.getElementById('contract-b-signature-img') as HTMLImageElement;
      if (sigImg && currentSig) {
        sigImg.src = currentSig;
      }

      await new Promise((r) => setTimeout(r, 60));

      const canvas = await html2canvas(contractElement, { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const styles = clonedDoc.getElementsByTagName('style');
          const links = clonedDoc.getElementsByTagName('link');
          for (let i = styles.length - 1; i >= 0; i--) { styles[i].remove(); }
          for (let i = links.length - 1; i >= 0; i--) { 
            if (links[i].rel === 'stylesheet') links[i].remove(); 
          }
          if (currentSig) {
            const clonedImg = clonedDoc.getElementById('contract-b-signature-img') as HTMLImageElement;
            if (clonedImg) clonedImg.src = currentSig;
          }
        }
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      if (pdfHeight <= 297) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      } else {
        // Hỗ trợ chia trang nếu tài liệu dài hơn 1 trang A4
        let position = 0;
        let heightLeft = pdfHeight;
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= 297;
        while (heightLeft > 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= 297;
        }
      }
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
      formData.append('folder', 'uploads');
      
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

      toast.info("Đang xử lý chứng từ & hợp đồng điện tử...");

      // Upload ảnh Rank và Bill lên Cloudinary chỉ khi người dùng nộp đơn chính thức
      let finalRankUrl = data.rankImageUrl;
      if (rankImageFile) {
        finalRankUrl = await uploadSingleFile(rankImageFile);
      }

      let finalBillUrl = data.billImageUrl;
      if (billImageFile) {
        finalBillUrl = await uploadSingleFile(billImageFile);
      }

      const result = await generateAndUploadContract();
      if (!result) throw new Error("Không thể tạo hợp đồng. Vui lòng thử lại.");

      const normalizedFb = data.facebookUrl.trim().startsWith('http')
        ? data.facebookUrl.trim()
        : `https://${data.facebookUrl.trim()}`;

      const resolvedPrimaryGame = (data.primaryGame === 'OTHER' && data.customGameName?.trim()) 
        ? data.customGameName.trim() 
        : data.primaryGame;

      const token = localStorage.getItem('token');
      const res = await fetch('/api/boosters/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          ...data, 
          primaryGame: resolvedPrimaryGame,
          facebookUrl: normalizedFb, 
          rankImageUrl: finalRankUrl,
          billImageUrl: finalBillUrl,
          contractUrl: result.url 
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Đăng ký thất bại");
      }

      toast.success("Nộp hồ sơ thành công!", {
        description: "Hồ sơ của bạn đang được xét duyệt. Bạn có thể xem lại bản khai và hợp đồng bất cứ lúc nào.",
      });
      
      const submittedApp = {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        facebookUrl: normalizedFb,
        discordTag: data.discordTag,
        primaryGame: resolvedPrimaryGame,
        customGameName: data.customGameName,
        currentRank: data.currentRank,
        highestRank: data.highestRank,
        opggLink: data.opggLink,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        bankAccountName: data.bankAccountName,
        agreementSigned_name: data.agreementSigned_name,
        rankImageUrl: finalRankUrl,
        billImageUrl: finalBillUrl,
        contractUrl: result.url,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setExistingApp(submittedApp);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          try {
            const user = JSON.parse(userStr);
            user.role = 'CUSTOMER';
            localStorage.setItem('user', JSON.stringify(user));
            window.dispatchEvent(new Event('user-updated'));
          } catch {}
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
        
        <Card className="border-cyan-500/30 bg-zinc-900/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-md w-full relative z-10 overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500" />
          
          <div className="text-center pb-2 pt-10 px-6">
            <div className="mx-auto w-20 h-20 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-5 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.25)]">
              <BadgeCheck className="w-10 h-10 text-cyan-400" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider mb-2">
              VERIFIED PRO BOOSTER
            </span>
            <h2 className="text-2xl font-black text-white">Bạn Đang Là Booster</h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2 leading-relaxed">
              Tài khoản của bạn đã được phê duyệt tư cách Booster chính thức trên sàn LeoRank. Bạn có thể nhận đơn và kiếm thu nhập ngay.
            </p>
          </div>

          <CardContent className="space-y-3.5 pt-6 pb-8 px-6">
            <Button 
              onClick={() => router.push('/booster/dashboard')}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black h-12 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02]"
            >
              <Trophy className="mr-2 h-4 w-4" /> Vào Bàn Làm Việc Booster
            </Button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-zinc-900 px-3 text-zinc-500">Hoặc</span></div>
            </div>

            <Button 
              onClick={() => setShowResignModal(true)}
              variant="outline"
              className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-11 text-xs font-bold rounded-xl"
            >
              <DoorOpen className="mr-2 h-4 w-4" /> Xin Nghỉ Việc (Về Tài Khoản Khách)
            </Button>
          </CardContent>
        </Card>

        {/* Resign Confirmation Modal */}
        <Dialog open={showResignModal} onOpenChange={setShowResignModal}>
          <DialogContent className="bg-zinc-900 border-red-500/30 text-white sm:max-w-[425px] rounded-3xl">
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
              <Button variant="ghost" onClick={() => setShowResignModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-xl">Hủy</Button>
              <Button onClick={confirmResign} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl">Xác nhận nghỉ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // State: Đã nộp đơn và đang chờ xét duyệt
  if (existingApp && existingApp.status === 'pending') {
    const gameConfig = GAME_OPTIONS.find(g => g.code === existingApp.primaryGame);
    const gameTitle = existingApp.primaryGame === 'OTHER'
      ? (existingApp.customGameName || 'Tựa game khác')
      : (gameConfig ? `${gameConfig.name} (${gameConfig.short})` : existingApp.primaryGame);

    return (
      <div className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden pt-28 pb-32">
        <Navbar />

        {/* Dynamic Ambient Background Glows */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.png")' }}></div>
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-amber-600/15 via-yellow-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
        <div className="fixed bottom-0 right-0 w-[600px] h-[500px] bg-cyan-500/10 blur-[150px] pointer-events-none rounded-full" />

        <div className="relative z-10 container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Hồ Sơ Đang Chờ Phê Duyệt</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3 uppercase">
              Hồ Sơ Ứng Tuyển <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-300 bg-clip-text text-transparent">
                Đang Được Xét Duyệt
              </span>
            </h1>

            <p className="text-zinc-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
              Cảm ơn bạn đã nộp hồ sơ gia nhập đội ngũ Booster LeoRank. Ban Quản Trị đang tiến hành đối soát thông tin tài khoản, bằng chứng rank và hợp đồng điện tử của bạn trong vòng 2 - 24 giờ làm việc.
            </p>
          </div>

          {/* Pending Info Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
            {/* Top Status Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    Mã Hồ Sơ: <span className="font-mono text-amber-300">#{existingApp._id ? existingApp._id.slice(-8).toUpperCase() : 'PENDING'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase">
                      Đang xử lý
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Ngày gửi: {existingApp.createdAt ? new Date(existingApp.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
                  </div>
                </div>
              </div>

              {existingApp.contractUrl && (
                <a
                  href={existingApp.contractUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all shadow-lg shadow-amber-500/20"
                >
                  <Download className="w-4 h-4" /> Tải Hợp Đồng PDF Đã Ký
                </a>
              )}
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Thông tin liên hệ */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> 1. Thông Tin Định Danh
                </div>
                <div className="space-y-2 text-xs text-zinc-300">
                  <div className="flex justify-between py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-500">Họ và tên:</span>
                    <span className="font-bold text-white">{existingApp.fullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-500">Số điện thoại:</span>
                    <span className="font-mono font-medium text-white">{existingApp.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-500">Discord Tag:</span>
                    <span className="font-mono text-cyan-300">{existingApp.discordTag}</span>
                  </div>
                  <div className="flex justify-between py-1 items-center">
                    <span className="text-zinc-500">Facebook:</span>
                    <a href={existingApp.facebookUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline max-w-[200px] truncate">
                      {existingApp.facebookUrl}
                    </a>
                  </div>
                </div>
              </div>

              {/* Box 2: Trình độ & Game thế mạnh */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> 2. Kỹ Năng & Tựa Game
                </div>
                <div className="space-y-2 text-xs text-zinc-300">
                  <div className="flex justify-between py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-500">Game thế mạnh:</span>
                    <span className="font-bold text-white">{gameTitle}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-500">Rank hiện tại:</span>
                    <span className="font-bold text-cyan-400">{existingApp.currentRank}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-500">Peak Rank cao nhất:</span>
                    <span className="font-bold text-purple-400">{existingApp.highestRank}</span>
                  </div>
                  <div className="flex justify-between py-1 items-center">
                    <span className="text-zinc-500">Link tra cứu/Ingame:</span>
                    <a href={existingApp.opggLink?.startsWith('http') ? existingApp.opggLink : undefined} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline max-w-[190px] truncate font-mono">
                      {existingApp.opggLink}
                    </a>
                  </div>
                </div>
              </div>

              {/* Box 3: Tài khoản ngân hàng nhận tiền */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Landmark className="w-4 h-4" /> 3. Ngân Hàng Thụ Hưởng
                </div>
                <div className="space-y-2 text-xs text-zinc-300">
                  <div className="flex justify-between py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-500">Ngân hàng:</span>
                    <span className="font-bold text-white">{existingApp.bankName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-500">Số tài khoản:</span>
                    <span className="font-mono font-bold text-emerald-400">{existingApp.bankAccountNumber}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Chủ tài khoản:</span>
                    <span className="font-bold text-white uppercase">{existingApp.bankAccountName}</span>
                  </div>
                </div>
              </div>

              {/* Box 4: Bằng chứng & Hồ sơ đính kèm */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                  <FileSignature className="w-4 h-4" /> 4. Tài Liệu Đính Kèm
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {existingApp.rankImageUrl && (
                    <a
                      href={existingApp.rankImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" /> Xem Ảnh Rank
                    </a>
                  )}
                  {existingApp.billImageUrl && (
                    <a
                      href={existingApp.billImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" /> Xem Bill Phí Kích Hoạt
                    </a>
                  )}
                  {existingApp.contractUrl && (
                    <a
                      href={existingApp.contractUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" /> Bản Khai Hợp Đồng PDF
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setExistingApp(null)}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline transition-colors"
              >
                Muốn chỉnh sửa hoặc nộp lại đơn khác? Bấm vào đây
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => router.push('/profile')}
                  variant="outline"
                  className="flex-1 sm:flex-none border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 text-xs font-bold rounded-xl h-11"
                >
                  Về Trang Cá Nhân
                </Button>
                <a
                  href="https://discord.gg/leorank"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-600/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Liên Hệ Admin Qua Discord
                </a>
              </div>
            </div>
          </div>
        </div>
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
        {/* HERO HEADER SECTION (Redesigned Esports Luxury Banner)                   */}
        {/* ========================================================================= */}
        <div className="text-center mb-10 sm:mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Gia Nhập Đội Ngũ Booster LeoRank Pro</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3 uppercase">
              Đăng Ký Trở Thành <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
                Booster Chuyên Nghiệp
              </span>
            </h1>

            <p className="text-zinc-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed mb-8">
              Kiếm thu nhập <b className="text-cyan-300 font-bold">20.000.000đ – 50.000.000đ+/tháng</b> từ đam mê và kỹ năng của bạn. Hợp đồng pháp lý minh bạch, chia sẻ doanh thu tới 85% và rút tiền tức thì 24/7.
            </p>

            {/* 4 Booster Perks Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-cyan-500/40 transition-colors flex items-center gap-3 text-left">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0"><Wallet className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-black text-white">80% – 85%</div>
                  <div className="text-[11px] text-zinc-400">Chiết khấu cao nhất</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 transition-colors flex items-center gap-3 text-left">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0"><Zap className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-black text-white">Rút Tiền 24/7</div>
                  <div className="text-[11px] text-zinc-400">Tự động trong 30s</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-emerald-500/40 transition-colors flex items-center gap-3 text-left">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0"><ShieldCheck className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-black text-white">Bảo Hộ Escrow</div>
                  <div className="text-[11px] text-zinc-400">100% không lo nợ tiền</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-purple-500/40 transition-colors flex items-center gap-3 text-left">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0"><FileSignature className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-black text-white">Hợp Đồng Online</div>
                  <div className="text-[11px] text-zinc-400">Ký điện tử pháp lý</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* STEPPER PROGRESS BAR (Redesigned Segmented Cyber Stepper)                */}
        {/* ========================================================================= */}
        <div className="mb-8 sm:mb-10">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-1.5 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
            {STEPS.map((s) => {
              const isActive = step >= s.id;
              const isCurrent = step === s.id;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.id < step) setStep(s.id);
                  }}
                  disabled={s.id > step}
                  className={cn(
                    "flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all duration-300 text-left relative overflow-hidden",
                    isCurrent
                      ? "bg-gradient-to-r from-cyan-950/70 to-blue-950/60 border border-cyan-500/40 text-white shadow-lg shadow-cyan-950/40"
                      : isActive
                      ? "bg-zinc-900/60 text-zinc-300 hover:bg-zinc-900 cursor-pointer"
                      : "text-zinc-600 opacity-60 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 transition-colors",
                      isCurrent
                        ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                        : isActive
                        ? "bg-zinc-800 text-cyan-400"
                        : "bg-zinc-900 text-zinc-600"
                    )}
                  >
                    {step > s.id ? <Check size={14} className="stroke-[3]" /> : s.id}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <div className={cn("text-xs font-black uppercase tracking-wider truncate", isCurrent ? "text-cyan-300" : "")}>
                      {s.title}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">{s.subtitle}</div>
                  </div>
                  {isCurrent && (
                    <span className="sm:hidden text-[11px] font-black text-cyan-300 truncate">
                      {s.title}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FORM CONTENT CARD                                                         */}
        {/* ========================================================================= */}
        <Card className="border-zinc-800/80 bg-zinc-900/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500" />
          
          <CardContent className="p-6 sm:p-10">
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
                    <div className="border-b border-zinc-800/80 pb-4">
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                        <UserCheck className="w-4 h-4" />
                        Bước 1 / 3
                      </div>
                      <h3 className="text-xl font-black text-white">
                        Thông Tin Định Danh Booster
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Dữ liệu được mã hóa bảo mật 256-bit và chỉ dùng để đối soát giải ngân thu nhập của bạn.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                          <span>Họ và tên thật <span className="text-red-500 font-bold">*</span></span>
                          <span className="text-[10px] text-zinc-500 font-normal">Trùng tên thẻ ngân hàng</span>
                        </Label>
                        <Input 
                          {...register('fullName')} 
                          placeholder="Ví dụ: Nguyễn Văn A" 
                          className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all" 
                        />
                        {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                          <span>Số điện thoại Zalo / SMS <span className="text-red-500 font-bold">*</span></span>
                          <span className="text-[10px] text-zinc-500 font-normal">Nhận thông báo đơn gấp</span>
                        </Label>
                        <Input 
                          {...register('phoneNumber')} 
                          placeholder="Ví dụ: 0912345678" 
                          className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all" 
                        />
                        {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                          <span>Link Facebook cá nhân <span className="text-red-500 font-bold">*</span></span>
                          <span className="text-[10px] text-zinc-500 font-normal">Xác thực danh tính</span>
                        </Label>
                        <Input 
                          {...register('facebookUrl')} 
                          placeholder="Ví dụ: facebook.com/vtchn hoặc fb.com/vtchn" 
                          className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all" 
                        />
                        {errors.facebookUrl && <p className="text-red-400 text-xs mt-1">{errors.facebookUrl.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                          <span>Discord Tag <span className="text-red-500 font-bold">*</span></span>
                          <span className="text-[10px] text-zinc-500 font-normal">Nhận phòng chat & đơn hàng</span>
                        </Label>
                        <Input 
                          {...register('discordTag')} 
                          placeholder="Ví dụ: leorank#1234 hoặc username" 
                          className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all" 
                        />
                        {errors.discordTag && <p className="text-red-400 text-xs mt-1">{errors.discordTag.message}</p>}
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
                      <div className="border-b border-zinc-800/80 pb-4">
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                          <Trophy className="w-4 h-4" />
                          Bước 2 / 3
                        </div>
                        <h3 className="text-xl font-black text-white">
                          Xác Thực Trình Độ Thi Đấu & Ngân Hàng
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Yêu cầu tối thiểu đạt mức rank Cao Thủ / Immortal / Radiant trở lên để đảm bảo tỷ lệ thắng &gt; 80%.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Tựa Game Thế Mạnh Chính */}
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                              Tựa Game Thế Mạnh Chính <span className="text-red-500 font-bold">*</span>
                            </span>
                            <span className="text-[10px] text-zinc-500 hidden sm:inline">Có thể bổ sung thêm game khác sau khi được duyệt</span>
                          </Label>
                          <div className="relative">
                            <select
                              {...register('primaryGame')}
                              className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white rounded-xl h-11 pl-4 pr-10 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all outline-none appearance-none cursor-pointer font-medium"
                            >
                              {GAME_OPTIONS.map((g) => (
                                <option key={g.code} value={g.code} className="bg-zinc-900 text-white py-2">
                                  {g.code === 'OTHER' ? 'Khác (Nhập tên tựa game khác)' : `${g.name} (${g.short})`}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                          {errors.primaryGame && <p className="text-red-400 text-xs mt-1">{errors.primaryGame.message}</p>}
                        </div>

                        {/* Input nhập tên game nếu chọn Khác */}
                        {selectedGame === 'OTHER' && (
                          <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <Label className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
                              <span>Tên Tựa Game Của Bạn <span className="text-red-500 font-bold">*</span></span>
                              <span className="text-[10px] text-zinc-500">Ví dụ: Naraka: Bladepoint, EA FC, PUBG, Apex Legends...</span>
                            </Label>
                            <Input 
                              {...register('customGameName')} 
                              placeholder="Nhập chính xác tên tựa game bạn muốn đăng ký thi đấu..." 
                              className="bg-zinc-950 border-cyan-500/40 text-white rounded-xl h-11 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all placeholder:text-zinc-600" 
                            />
                            {errors.customGameName && <p className="text-red-400 text-xs mt-1">{errors.customGameName.message}</p>}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                            Bậc Rank Hiện Tại <span className="text-red-500 font-bold">*</span>
                          </Label>
                          <Input 
                            {...register('currentRank')} 
                            placeholder={currentGameConfig.currentRankPlaceholder}
                            className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all" 
                          />
                          {errors.currentRank && <p className="text-red-400 text-xs mt-1">{errors.currentRank.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                            Bậc Rank Cao Nhất Từng Đạt <span className="text-red-500 font-bold">*</span>
                          </Label>
                          <Input 
                            {...register('highestRank')} 
                            placeholder={currentGameConfig.highestRankPlaceholder}
                            className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all" 
                          />
                          {errors.highestRank && <p className="text-red-400 text-xs mt-1">{errors.highestRank.message}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                            <span>{currentGameConfig.trackerLabel} <span className="text-red-500 font-bold">*</span></span>
                            <span className="text-[10px] text-zinc-500">{currentGameConfig.trackerHint}</span>
                          </Label>
                          <Input 
                            {...register('opggLink')} 
                            placeholder={currentGameConfig.trackerPlaceholder}
                            className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all" 
                          />
                          {errors.opggLink && <p className="text-red-400 text-xs mt-1">{errors.opggLink.message}</p>}
                        </div> 

                        {/* Rank Proof Screenshot */}
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                            <span>Ảnh Bằng Chứng Màn Hình Trong Game <span className="text-red-500 font-bold">*</span></span>
                            <span className="text-[10px] text-zinc-500">Chụp rõ Ingame Name & Bậc Rank</span>
                          </Label>
                          
                          <div className="relative group">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload}
                              disabled={isUploadingRank}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                            />
                            <div className={cn(
                              "border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 transition-all",
                              errors.rankImageUrl 
                                ? 'border-red-500/50 bg-red-500/5' 
                                : 'border-zinc-800 bg-zinc-950/70 hover:bg-zinc-950 hover:border-cyan-500/50'
                            )}>
                              {isUploadingRank ? (
                                <div className="flex flex-col items-center gap-2 py-6">
                                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                                  <span className="text-xs text-zinc-400">Đang xử lý ảnh minh chứng...</span>
                                </div>
                              ) : (rankImagePreview || rankImageUrl) ? (
                                <div className="relative w-full h-56 rounded-xl overflow-hidden border border-zinc-800 group-hover:opacity-80 transition-opacity">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={rankImagePreview || rankImageUrl} alt="Rank Proof" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="bg-cyan-500 text-black px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
                                      Nhấn để thay đổi ảnh khác
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 group-hover:scale-105 transition-transform shadow-inner">
                                    <CloudUpload className="w-8 h-8 text-cyan-400" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs sm:text-sm font-bold text-zinc-200">Kéo thả hoặc Nhấn để tải ảnh minh chứng Rank</p>
                                    <p className="text-xs text-zinc-500 mt-1">Hỗ trợ định dạng PNG, JPG, JPEG (Tối đa 5MB)</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {errors.rankImageUrl && <p className="text-red-400 text-xs mt-1">{errors.rankImageUrl.message}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-zinc-800/80" />

                    {/* Registration Fee Section (Conditional based on Admin config) */}
                    {adminSettings.depositConfig.depositRequired ? (
                      <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 sm:p-6 animate-in fade-in">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="text-amber-400 shrink-0 mt-0.5 w-5 h-5" />
                          <div className="w-full">
                            <h4 className="font-black text-amber-300 text-sm">Phí Kích Hoạt Quyền Booster (Booster Registration Fee)</h4>
                            <p className="text-xs text-zinc-300 mt-1 mb-4 leading-relaxed">
                              Để hoàn tất thủ tục xét duyệt và nâng cấp tài khoản từ Khách hàng lên Booster, hệ thống yêu cầu thanh toán khoản phí kích hoạt là <span className="text-white font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(adminSettings.depositConfig.depositAmount)}</span>. Sau khi chuyển khoản, vui lòng tải ảnh bill bên dưới để Admin duyệt hồ sơ.
                            </p>
                            
                            <div className="flex flex-col md:flex-row gap-5 items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                              {/* QR Code */}
                              <div className="bg-white p-2.5 rounded-2xl shrink-0 shadow-lg">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrCodeUrl} alt="QR Chuyển khoản" className="w-32 h-32 md:w-36 md:h-36 object-contain" />
                              </div>

                              {/* Bank Info */}
                              <div className="flex-1 space-y-2 w-full text-xs">
                                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 space-y-2">
                                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Ngân hàng:</span>
                                    <span className="font-bold text-white">{adminSettings.adminBank.bankName}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Số tài khoản:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-white tracking-wider">{adminSettings.adminBank.accountNumber}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(adminSettings.adminBank.accountNumber, 'accNum')}
                                        className="text-cyan-400 hover:text-cyan-300"
                                      >
                                        {copiedField === 'accNum' ? <CheckCheck size={14} /> : <Copy size={14} />}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Chủ tài khoản:</span>
                                    <span className="font-bold text-white uppercase">{adminSettings.adminBank.accountHolder}</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-0.5">
                                    <span className="text-zinc-500">Nội dung CK:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded select-all">{transferContent}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(transferContent, 'content')}
                                        className="text-amber-400 hover:text-amber-300"
                                      >
                                        {copiedField === 'content' ? <CheckCheck size={14} /> : <Copy size={14} />}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Upload Bill */}
                            <div className="mt-4 pt-4 border-t border-amber-500/20">
                              <Label className="text-xs font-bold text-zinc-300 mb-2 block">
                                Tải lên ảnh Bill chuyển khoản phí đăng ký thành công <span className="text-red-500 font-bold">*</span>
                              </Label>
                              <div className="flex items-center gap-3">
                                <div className="relative group flex-1">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleBillUpload}
                                    disabled={isUploadingBill}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                                  />
                                  <div className={cn(
                                    "border border-dashed rounded-xl p-3 flex items-center justify-center gap-2 transition-all",
                                    (billImagePreview || billImageUrl) ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-900'
                                  )}>
                                    {isUploadingBill ? (
                                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                                    ) : (billImagePreview || billImageUrl) ? (
                                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Đã chọn ảnh Bill chuyển khoản</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-zinc-400">Nhấn để tải lên ảnh Bill chuyển khoản...</span>
                                    )}
                                  </div>
                                </div>
                                {(billImagePreview || billImageUrl) && (
                                  <a href={billImagePreview || billImageUrl || '#'} target="_blank" rel="noreferrer" className="shrink-0 w-11 h-11 rounded-xl border border-zinc-800 overflow-hidden block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={billImagePreview || billImageUrl} alt="Bill" className="w-full h-full object-cover" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
                        <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5 w-5 h-5" />
                        <div>
                          <h4 className="font-black text-emerald-300 text-sm">Đặc Quyền: Miễn Phí Đăng Ký Booster</h4>
                          <p className="text-xs text-zinc-400 mt-1">
                            Hệ thống hiện đang áp dụng chính sách <b className="text-emerald-300">miễn phí kích hoạt quyền Booster</b> cho các ứng viên đăng ký trong đợt này. Bạn không cần thanh toán bất kỳ khoản phí nào để gia nhập đội ngũ Booster!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Booster Bank Details */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-cyan-400" />
                          Tài Khoản Ngân Hàng Thụ Hưởng Thu Nhập Của Bạn
                        </h3>
                        <p className="text-xs text-zinc-400">Tiền cày thuê sẽ được chuyển tự động về tài khoản này sau khi hoàn thành đơn.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                            Ngân Hàng <span className="text-red-500 font-bold">*</span>
                          </Label>
                          
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
                          {errors.bankName && <p className="text-red-400 text-xs mt-1">{errors.bankName.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                            Số Tài Khoản <span className="text-red-500 font-bold">*</span>
                          </Label>
                          <Input 
                            {...register('bankAccountNumber')} 
                            placeholder="Nhập số tài khoản..."
                            className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 font-mono transition-all" 
                          />
                          {errors.bankAccountNumber && <p className="text-red-400 text-xs mt-1">{errors.bankAccountNumber.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                            Tên Chủ Tài Khoản <span className="text-red-500 font-bold">*</span>
                          </Label>
                          <Input 
                            {...register('bankAccountName')} 
                            placeholder="NGUYEN VAN A"
                            className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 uppercase transition-all" 
                          />
                          {errors.bankAccountName && <p className="text-red-400 text-xs mt-1">{errors.bankAccountName.message}</p>}
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
                    <div className="border-b border-zinc-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                          <Lock className="w-4 h-4" />
                          Bước 3 / 3
                        </div>
                        <h3 className="text-xl font-black text-white">
                          Cam Kết Nghề Nghiệp & Ký Hợp Đồng Điện Tử
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Vui lòng gạt bật toàn bộ các cam kết bên dưới và ký tên online để hoàn thiện hồ sơ.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={toggleAllAgreements}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-bold transition-colors shrink-0 self-start sm:self-auto border border-zinc-700"
                      >
                        {allAgreementsChecked ? 'Bỏ chọn tất cả' : 'Bật tất cả cam kết'}
                      </button>
                    </div>

                    {/* Commitments Switch List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {COMMITMENTS.map((item) => {
                        const isChecked = !!agreements[item.id];
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => toggleAgreement(item.id)}
                            className={cn(
                              "p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start gap-4 select-none group",
                              isChecked 
                                ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50'
                            )}
                          >
                            <div className="flex-1 pr-2">
                              <h4 className={cn("text-xs font-bold flex items-center gap-2", isChecked ? 'text-emerald-300' : 'text-zinc-200')}>
                                <span className={cn("w-2 h-2 rounded-full", isChecked ? "bg-emerald-400 animate-pulse" : "bg-zinc-600")} />
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">{item.desc}</p>
                            </div>
                            
                            {/* Custom Toggle Switch (An toàn 100%, không bị Radix Bubble Input click loop) */}
                            <div
                              role="switch"
                              aria-checked={isChecked}
                              className={cn(
                                "w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 mt-0.5 duration-200 ease-in-out relative flex items-center",
                                isChecked ? "bg-emerald-500" : "bg-zinc-800 border border-zinc-700"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-md",
                                  isChecked ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Digital Signature Pad Box */}
                    <div className="bg-zinc-950 p-6 sm:p-7 rounded-2xl border border-zinc-800/80 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <Label className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                            <FileSignature className="w-4 h-4 text-cyan-400" />
                            <span>Chữ Ký Điện Tử Xác Nhận Hợp Đồng <span className="text-red-500 font-bold">*</span></span>
                          </Label>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Dùng chuột hoặc ngón tay để ký tên trực tiếp vào bảng ký hợp đồng bên dưới.
                          </p>
                        </div>
                        <button 
                          type="button" 
                          onClick={clearSignature}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto border border-zinc-700"
                        >
                          <Eraser size={13} /> Xóa Chữ Ký
                        </button>
                      </div>

                      {/* Canvas Container with subtle desk appearance */}
                      <div className="border border-zinc-700/80 rounded-2xl bg-slate-50 overflow-hidden relative shadow-inner p-1">
                        <SignatureCanvas 
                          ref={sigCanvas}
                          penColor="#0f172a"
                          canvasProps={{ width: 600, height: 200, className: 'sigCanvas w-full h-44 cursor-crosshair rounded-xl' }}
                          onEnd={saveSignature}
                        />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none text-[11px] font-semibold text-slate-400 select-none">
                          — Ký tên của bạn tại đây —
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                          <span>Nhập lại họ tên để đối chiếu chữ ký <span className="text-red-500 font-bold">*</span></span>
                          {fullName && (
                            <button
                              type="button"
                              onClick={() => setValue('agreementSigned_name', fullName, { shouldValidate: true })}
                              className="text-[11px] text-cyan-400 hover:underline"
                            >
                              Dùng tên: {fullName}
                            </button>
                          )}
                        </Label>
                        <Input 
                          {...register('agreementSigned_name')}
                          placeholder={`Ví dụ: ${fullName || 'Nguyễn Văn A'} (Phải khớp chính xác với họ tên Bước 1)`} 
                          className={cn(
                            "bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-sm transition-all",
                            signature && !isNameMatch ? 'border-red-500 focus:border-red-500' : 
                            isNameMatch ? 'border-emerald-500 focus:border-emerald-500 text-emerald-300' : 'focus:border-cyan-400'
                          )}
                        />
                        {signature && !isNameMatch && (
                          <p className="text-red-400 text-xs mt-1">Họ tên đối chiếu không khớp với họ tên đã điền ở Bước 1 ({fullName}).</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-10 pt-6 border-t border-zinc-800/80">
                {step > 1 ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep} 
                    className="border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-bold text-xs h-11 px-5 rounded-xl transition-all"
                  >
                    <ChevronLeft className="mr-1.5 h-4 w-4" /> Quay Lại
                  </Button>
                ) : <div />}

                {step < 3 ? (
                  <Button 
                    type="button" 
                    onClick={nextStep} 
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs h-11 px-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02]"
                  >
                    <span>Tiếp Theo Bước {step + 1}</span>
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (!allAgreementsChecked) {
                        toast.error("Vui lòng gạt bật toàn bộ cam kết nghề nghiệp.");
                        return;
                      }
                      if (!isNameMatch) {
                        toast.error("Họ tên đối chiếu chữ ký chưa khớp.");
                        return;
                      }
                      if (!signatureDataUrl && sigCanvas.current?.isEmpty()) {
                        toast.error("Vui lòng ký tên vào khung chữ ký.");
                        return;
                      }
                      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
                        const sig = sigCanvas.current.getCanvas().toDataURL('image/png');
                        setSignatureDataUrl(sig);
                        const sigImg = document.getElementById('contract-b-signature-img') as HTMLImageElement;
                        if (sigImg) sigImg.src = sig;
                      }
                      setShowConfirmModal(true);
                    }} 
                    disabled={!allAgreementsChecked || !isSignatureValid}
                    className={cn(
                      "font-black text-xs h-11 px-7 rounded-xl transition-all",
                      (!allAgreementsChecked || !isSignatureValid)
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-[1.02]'
                    )}
                  >
                    <BadgeCheck className="mr-2 h-4 w-4" /> Xem Lại &amp; Nộp Hồ Sơ
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
      <div className="fixed top-0 left-0 z-[-50] pointer-events-none opacity-0">
        <div id="contract-template" style={{ width: '210mm', minHeight: '297mm', padding: '12mm 16mm', fontFamily: 'Times New Roman, serif', lineHeight: '1.38', position: 'relative', backgroundColor: '#ffffff', color: '#000000', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', margin: 0 }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
            <p style={{ fontWeight: 'bold', marginBottom: '12px', textDecoration: 'underline', textDecorationColor: '#000000', margin: 0, fontSize: '13px' }}>Độc lập - Tự do - Hạnh phúc</p>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '12px', marginBottom: '4px' }}>HỢP ĐỒNG HỢP TÁC CÀY THUÊ ESPORTS</h2>
            <p style={{ fontStyle: 'italic', fontSize: '12px', marginTop: '2px', margin: 0 }}>Số: {contractDate ? contractDate.getTime() : '...'}/HĐ-BOOSTER-LEORANK</p>
          </div>

          <div style={{ marginBottom: '10px', fontSize: '12.5px' }}>
            <p style={{ margin: 0 }}>Hôm nay, ngày {contractDate ? contractDate.getDate() : '...'} tháng {contractDate ? contractDate.getMonth() + 1 : '...'} năm {contractDate ? contractDate.getFullYear() : '...'}, tại hệ thống {adminSettings.platformName}, chúng tôi gồm:</p>
          </div>

          <div style={{ marginBottom: '10px', fontSize: '12.5px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 'bold', marginBottom: '3px', margin: 0 }}>BÊN A: {adminSettings.platformName.toUpperCase()} (Bên quản lý hệ thống)</h3>
            <p style={{ margin: 0 }}>Đại diện: Ban Quản Trị nền tảng trung gian bảo chứng LeoRank (Escrow System).</p>
          </div>

          <div style={{ marginBottom: '10px', fontSize: '12.5px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 'bold', marginBottom: '3px', margin: 0 }}>BÊN B: {fullName?.toUpperCase() || '...'} (Bên Booster)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px', marginTop: '2px' }}>
              <p style={{ margin: 0 }}>Tựa game chính: <b>{displayGameName}</b></p>
              <p style={{ margin: 0 }}>Số điện thoại: <b>{watch('phoneNumber')}</b></p>
              <p style={{ margin: 0 }}>Discord: <b>{watch('discordTag')}</b></p>
              <p style={{ margin: 0 }}>Facebook: {watch('facebookUrl')}</p>
              <p style={{ margin: 0, gridColumn: 'span 2' }}>Ngân hàng nhận thù lao: <b>{watch('bankName')} - {watch('bankAccountNumber')} ({watch('bankAccountName')})</b></p>
            </div>
          </div>

          <div style={{ marginBottom: '10px', fontSize: '12.5px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '3px', margin: 0 }}>ĐIỀU 1: NỘI DUNG HỢP TÁC & BẢO CHỨNG ESCROW</h3>
            <p style={{ textAlign: 'justify', margin: 0 }}>Bên B đồng ý trở thành đối tác cung cấp dịch vụ cày thuê (Boosting) trên nền tảng của Bên A. Bên B cam kết tuân thủ mọi quy chuẩn về bảo mật tài khoản khách hàng, bảo chứng tài chính Escrow, chất lượng thi đấu và tác phong văn minh.</p>
          </div>

          <div style={{ marginBottom: '12px', fontSize: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '3px', margin: 0 }}>ĐIỀU 2: CÁC CAM KẾT NGHỀ NGHIỆP</h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0 }}>
              {COMMITMENTS.map((c) => (
                <li key={c.id} style={{ textAlign: 'justify', marginBottom: '3px' }}>
                  <b>{c.title}:</b> {c.desc}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'center', width: '48%' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: 0, fontSize: '13px' }}>ĐẠI DIỆN BÊN A</p>
              <p style={{ fontStyle: 'italic', fontSize: '11.5px', margin: 0 }}>(Đã ký điện tử bảo chứng)</p>
              <div style={{ marginTop: '12px', height: '55px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ border: '2px solid #16a34a', color: '#16a34a', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  ✓ ĐÃ KÝ ĐIỆN TỬ
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>LEORANK ESCROW SYSTEM</div>
              </div>
              <div style={{ marginTop: '6px', fontWeight: 'bold', fontSize: '13px' }}>LEORANK ADMIN</div>
              <div style={{ fontSize: '10.5px', color: '#666', fontStyle: 'italic' }}>
                (Xác thực hệ thống: {contractDate ? contractDate.toLocaleDateString('vi-VN') : ''})
              </div>
            </div>

            <div style={{ textAlign: 'center', width: '48%' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: 0, fontSize: '13px' }}>ĐẠI DIỆN BÊN B</p>
              <p style={{ fontStyle: 'italic', fontSize: '11.5px', margin: 0 }}>(Ký tên xác nhận)</p>
              <div style={{ marginTop: '8px', height: '55px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img id="contract-b-signature-img" src={signatureDataUrl || ''} alt="Chữ ký Bên B" style={{ maxHeight: '55px', maxWidth: '180px', objectFit: 'contain' }} />
              </div>
              <div style={{ marginTop: '6px', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}>{fullName || 'CHƯA ĐIỀN HỌ TÊN'}</div>
              <div style={{ fontSize: '10.5px', color: '#666', fontStyle: 'italic' }}>
                (Đã ký điện tử: {contractDate ? contractDate.toLocaleString('vi-VN') : ''})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONFIRMATION & PDF DOWNLOAD MODAL (Redesigned Summary Dialog)             */}
      {/* ========================================================================= */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[520px] rounded-3xl p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Xem Lại &amp; Nộp Hồ Sơ Booster
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs pt-1.5 leading-relaxed">
              Vui lòng kiểm tra lại thông tin hồ sơ của bạn trước khi nộp chính thức lên ban quản trị LeoRank.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Summary Pill Box */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-2.5 text-xs my-2">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-zinc-500">Họ và tên:</span>
              <span className="font-bold text-white">{fullName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-zinc-500">Tựa game chính:</span>
              <span className="font-bold text-cyan-400">{displayGameName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-zinc-500">Số điện thoại:</span>
              <span className="font-mono text-white">{phoneNumber}</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-zinc-500">Rank hiện tại:</span>
              <span className="font-bold text-amber-400">{watch('currentRank')}</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-zinc-500">Ngân hàng thụ hưởng:</span>
              <span className="font-mono text-white">{selectedBankName} - {watch('bankAccountNumber')}</span>
            </div>
            <div className="flex justify-between items-center pt-0.5">
              <span className="text-zinc-500">Chữ ký điện tử:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> Đã hoàn tất
              </span>
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <Button
              variant="ghost"
              onClick={() => setShowConfirmModal(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs rounded-xl"
            >
              Xem lại
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
              onClick={() => handleSubmit(onSubmit)()}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
              )}
              Xác Nhận Nộp Đơn
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
