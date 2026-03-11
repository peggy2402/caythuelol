'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Wallet, AlertCircle, ArrowRight, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'PAY' | 'REFUND'; // Chế độ: Thanh toán thêm hoặc Hoàn tiền
    amount: number;
    walletBalance?: number; // Chỉ cần cho mode PAY
    onConfirm: () => Promise<void>;
    isLoading: boolean;
}

export default function SettlementModal({
    isOpen,
    onClose,
    mode,
    amount,
    walletBalance = 0,
    onConfirm,
    isLoading
}: SettlementModalProps) {
    const router = useRouter();
    const isPay = mode === 'PAY';
    const isInsufficient = isPay && walletBalance < amount;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-full border ${isPay ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                            {isPay ? <Wallet className="w-6 h-6 text-red-500" /> : <RefreshCcw className="w-6 h-6 text-emerald-500" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                {isPay ? 'Thanh toán bổ sung' : 'Xác nhận hoàn tiền'}
                            </h3>
                            <p className="text-xs text-zinc-400">Quyết toán đơn hàng Net Wins</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">{isPay ? 'Số tiền cần trả:' : 'Số tiền hoàn lại khách:'}</span>
                                <span className={`font-bold text-lg ${isPay ? 'text-red-400' : 'text-emerald-400'}`}>{amount.toLocaleString()} đ</span>
                            </div>
                            
                            {isPay && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Số dư ví hiện tại:</span>
                                    <span className={`font-bold ${isInsufficient ? 'text-red-500' : 'text-green-500'}`}>
                                        {walletBalance.toLocaleString()} đ
                                    </span>
                                </div>
                            )}

                            {isInsufficient && (
                                <div className="pt-2 border-t border-zinc-800 text-xs text-red-400 flex items-center gap-1.5">
                                    <AlertCircle size={12} />
                                    Bạn thiếu {(amount - walletBalance).toLocaleString()} đ. Vui lòng nạp thêm.
                                </div>
                            )}
                        </div>
                        
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            {isPay 
                                ? 'Sau khi thanh toán, tiền sẽ được chuyển ngay vào ví của Booster và đơn hàng được cập nhật trạng thái "Đã thanh toán đủ".'
                                : 'Số tiền này sẽ được trừ từ khoản Tiền Cọc đang giữ và trả về ví của khách hàng.'
                            }
                        </p>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button 
                            onClick={onClose} 
                            disabled={isLoading}
                            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            Hủy bỏ
                        </button>
                        
                        {isInsufficient ? (
                            <button onClick={() => router.push('/wallet')} className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                Nạp tiền ngay <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button onClick={onConfirm} disabled={isLoading} className={`flex-1 py-2.5 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg ${isPay ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'}`}>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPay ? 'Xác nhận trả' : 'Xác nhận hoàn')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}