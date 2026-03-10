// src/app/(dashboard)/booster/services/lol/onbet/page.tsx
'use client';

import { useServiceContext } from '@/components/ServiceContext';
import { Banknote, Info, CheckCircle2 } from 'lucide-react';

const DEPOSIT_OPTIONS = [30, 50, 70, 100];

export default function OnbetConfigPage() {
  const { settings, setSettings } = useServiceContext();
  
  // Lấy giá trị hiện tại hoặc mặc định là 50%
  const currentPercent = settings.onbetPricePercent || 50;

  const handleSelect = (percent: number) => {
    setSettings({ ...settings, onbetPricePercent: percent });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Banknote className="w-6 h-6 text-green-500" />
          Cấu hình Cày Rank Sự Kiện
        </h2>
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200 space-y-1">
                    <p><strong>Dịch vụ Sự kiện:</strong> Khách hàng thuê bạn cày số trận cố định để nhận thưởng từ Sự kiện.</p>
                    <p>• Phần thưởng Sự kiện sẽ được chuyển trực tiếp vào tài khoản của Khách hàng.</p>
                    <p>• Bạn sẽ nhận được thù lao từ Khách hàng thông qua hệ thống này.</p>
                    <p>• Hãy chọn <strong>Tỉ lệ cọc</strong> (trên tổng giá trị giải thưởng) mà bạn muốn Khách hàng thanh toán cho bạn.</p>
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Chọn tỉ lệ thanh toán (Cọc)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {DEPOSIT_OPTIONS.map((percent) => (
                    <button
                        key={percent}
                        onClick={() => handleSelect(percent)}
                        className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            currentPercent === percent 
                                ? 'bg-green-600/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
                        }`}
                    >
                        <span className={`text-2xl font-black ${currentPercent === percent ? 'text-green-400' : 'text-white'}`}>
                            {percent}%
                        </span>
                        <span className="text-xs text-zinc-500">Giá trị giải thưởng</span>
                        {currentPercent === percent && (
                            <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
            <p className="text-xs text-zinc-500 text-center mt-2">
                Ví dụ: Nếu giải thưởng là 200.000 VNĐ và bạn chọn 50%, Khách hàng sẽ phải trả 100.000 VNĐ trên hệ thống.
            </p>
        </div>
      </div>
    </div>
  );
}
