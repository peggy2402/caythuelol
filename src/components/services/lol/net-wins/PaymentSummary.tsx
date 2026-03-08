// src/components/services/lol/PaymentSummary.tsx
'use client';

import { useState } from 'react';
import { Flame, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PaymentSummaryProps {
  boosterConfig: any;
  boosterId: string | null;
  priceDetails: {
    basePrice: number;
    totalPrice: number;
    optionDetails: { label: string; percent?: number; value: number }[];
    platformFeeValue: number;
    depositAmount?: number;
    depositPercent?: number;
  } | null;
  platformFee: number;
  isValid: boolean;
  // Add props to pass data for checkout
  serviceType?: string;
  details?: any;
  options?: any;
  queueType?: string;
  children?: React.ReactNode; // Dùng để chèn thêm thông tin breakdown riêng của từng service (VD: Rank A -> Rank B)
  validationMessage?: string;
}

export default function PaymentSummary({
  boosterConfig,
  boosterId,
  priceDetails,
  platformFee,
  isValid,
  serviceType = 'NET_WINS',
  details,
  options,
  queueType,
  children,
  validationMessage
}: PaymentSummaryProps) {
  const router = useRouter();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
    <div className="sticky top-24 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-4">Thanh toán</h3>
        {!boosterId ? (
            <div className="text-yellow-500 text-sm mb-4 flex items-start gap-2 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                <Flame className="w-4 h-4 mt-0.5 shrink-0" /> 
                <span>Vui lòng chọn <b>Booster</b> ở phía trên để xem giá chính xác.</span>
            </div>
        ) : (
            <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-950 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                        {boosterConfig?.profile?.avatar && <img src={boosterConfig.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                        <div className="text-xs text-zinc-400">Booster đang chọn</div>
                        <div className="font-bold text-white text-sm">{boosterConfig?.username || 'Loading...'}</div>
                    </div>
                </div>

                {/* Service Specific Breakdown */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                    {children}
                    
                    <div className="border-t border-white/5 my-1"></div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Giá gốc:</span>
                        <span className="text-white font-medium">{priceDetails?.basePrice.toLocaleString('vi-VN')} đ</span>
                    </div>
                    {priceDetails?.optionDetails.map((opt, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="text-zinc-400">{opt.label} {opt.percent ? `(${opt.percent}%)` : ''}:</span>
                            <span className="text-white font-medium">+{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(opt.value)}</span>
                        </div>
                    ))}
                    
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Phí dịch vụ ({platformFee}%):</span>
                        <span className="text-white font-medium">+{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceDetails?.platformFeeValue || 0)}</span>
                    </div>
                </div>
                
                {/* Total */}
                <div className="flex justify-between items-end pt-4 border-t-2 border-white/10 mt-4">
                    <span className="text-zinc-400 font-medium">Tổng tiền dự kiến:</span>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceDetails?.totalPrice || 0)}
                    </span>
                </div>
            </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4 mb-3 sm:mb-4 px-1">
            <button 
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center transition-all shrink-0 ${agreedToTerms ? 'bg-blue-600 border-blue-600' : 'border-zinc-600 hover:border-zinc-500'}`}
            >
                {agreedToTerms && <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />}
            </button>
            <span className="text-xs sm:text-sm text-zinc-400 select-none cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                Tôi đồng ý với <span className="text-blue-400 hover:underline">Điều khoản & Chính sách</span>
            </span>
        </div>

        <button
            onClick={() => {
                if (!boosterId) {
                    toast.error('Vui lòng chọn một Booster.');
                    return;
                }
                if (!priceDetails || priceDetails.totalPrice <= 0) {
                    toast.error('Vui lòng cấu hình dịch vụ trước khi thanh toán.');
                    return;
                }
                if (!isValid) {
                    toast.error(validationMessage || 'Vui lòng kiểm tra lại thông tin đã nhập.');
                    return;
                }
                if (!agreedToTerms) {
                    toast.error('Bạn cần đồng ý với Điều khoản & Chính sách của chúng tôi.');
                    return;
                }

                // If all checks pass, proceed to checkout
                const checkoutData = {
                    serviceType,
                    booster: boosterConfig,
                    details,
                    options,
                    pricing: {
                        ...priceDetails,
                        deposit_amount: priceDetails?.depositAmount,
                        total_amount: priceDetails?.totalPrice,
                        platform_fee: priceDetails?.platformFeeValue,
                        booster_earnings: (priceDetails?.totalPrice || 0) - (priceDetails?.platformFeeValue || 0) // Fix: Calculate earnings
                    },
                    queueType
                };
                localStorage.setItem('pendingCheckout', JSON.stringify(checkoutData));
                router.push('/checkout');
            }}
            disabled={!boosterId || !priceDetails || priceDetails.totalPrice <= 0}
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {priceDetails && priceDetails.totalPrice > 0 ? 'Bắt đầu thuê' : 'Vui lòng cấu hình'} <ArrowRight className="w-5 h-5" />
        </button>
        {!isValid && validationMessage && (
            <div className="text-center mt-2 text-xs text-red-400">
                {validationMessage}
            </div>
        )}
    </div>
  );
}
