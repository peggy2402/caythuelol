// src/components/orders/PayRemainingModal.tsx

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'; // Giả sử bạn dùng shadcn/ui dialog, nếu không dùng HTML/Tailwind thuần
import { Loader2, Wallet, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PayRemainingModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    walletBalance: number;
    onConfirm: () => Promise<void>;
    isLoading: boolean;
}

export default function PayRemainingModal({
    isOpen,
    onClose,
    amount,
    walletBalance,
    onConfirm,
    isLoading
}: PayRemainingModalProps) {
    const router = useRouter();
    const isInsufficient = walletBalance < amount;

    if (!isOpen) return null;

    // Fallback UI nếu không dùng shadcn/ui Dialog component
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                            <Wallet className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Thanh toán bổ sung</h3>
                            <p className="text-xs text-zinc-400">Quyết toán đơn hàng Net Wins</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Số tiền cần trả:</span>
                                <span className="text-red-400 font-bold text-lg">{amount.toLocaleString()} đ</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Số dư ví hiện tại:</span>
                                <span className={`font-bold ${isInsufficient ? 'text-red-500' : 'text-green-500'}`}>
                                    {walletBalance.toLocaleString()} đ
                                </span>
                            </div>
                            {isInsufficient && (
                                <div className="pt-2 border-t border-zinc-800 text-xs text-red-400 flex items-center gap-1.5">
                                    <AlertCircle size={12} />
                                    Bạn thiếu {(amount - walletBalance).toLocaleString()} đ. Vui lòng nạp thêm.
                                </div>
                            )}
                        </div>
                        
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Sau khi thanh toán, đơn hàng sẽ được chuyển sang trạng thái 
                            <span className="text-white font-bold mx-1">Đã thanh toán đủ (Settled)</span> 
                            và Booster sẽ nhận được tiền công.
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
                            <button 
                                onClick={() => router.push('/wallet')}
                                className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                Nạp tiền ngay <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button 
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-900/20"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận trả'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
