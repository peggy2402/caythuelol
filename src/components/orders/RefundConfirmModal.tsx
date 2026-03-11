'use client';

import { Loader2, RefreshCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RefundConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    onConfirm: () => Promise<void>;
    isLoading: boolean;
}

export default function RefundConfirmModal({
    isOpen,
    onClose,
    amount,
    onConfirm,
    isLoading
}: RefundConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <RefreshCcw className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Xác nhận hoàn tiền</h3>
                            <p className="text-xs text-zinc-400">Quyết toán đơn hàng Net Wins</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Số tiền hoàn lại khách:</span>
                                <span className="text-emerald-400 font-bold text-lg">{amount.toLocaleString()} đ</span>
                            </div>
                            
                            <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
                                <AlertCircle size={14} className="mt-0.5 shrink-0 text-yellow-500" />
                                <span>
                                    Số tiền này sẽ được trừ từ khoản <strong>Tiền Cọc</strong> mà bạn đang giữ (hoặc hệ thống đang giữ) và trả về ví của khách hàng.
                                </span>
                            </div>
                        </div>
                        
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Sau khi hoàn tiền, trạng thái đơn hàng sẽ chuyển sang 
                            <span className="text-white font-bold mx-1">Đã thanh toán đủ (Settled)</span> 
                            và kết thúc hợp đồng.
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
                        
                        <button 
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận hoàn tiền'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}