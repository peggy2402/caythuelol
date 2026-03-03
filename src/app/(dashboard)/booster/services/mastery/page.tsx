'use client';

import { useServiceContext } from '../ServiceContext';
import { useState, useEffect } from 'react';
import { Medal, Calculator, Coins, ArrowRight, Info } from 'lucide-react';

const MASTERY_STEPS = [
  { from: 1, to: 2, label: 'Cấp 1 ➜ Cấp 2', desc: 'Cày 1.800 Điểm Thông Thạo' },
  { from: 2, to: 3, label: 'Cấp 2 ➜ Cấp 3', desc: 'Cày 4.200 Điểm Thông Thạo' },
  { from: 3, to: 4, label: 'Cấp 3 ➜ Cấp 4', desc: 'Cày 6.600 Điểm Thông Thạo' },
  { from: 4, to: 5, label: 'Cấp 4 ➜ Cấp 5', desc: '9.000 ĐTT + 1 Dấu Ấn (Cần Rank A-)' },
  { from: 5, to: 6, label: 'Cấp 5 ➜ Cấp 6', desc: '10.000 ĐTT + 1 Dấu Ấn (Cần Rank A-)' },
  { from: 6, to: 7, label: 'Cấp 6 ➜ Cấp 7', desc: '11.000 ĐTT + 1 Dấu Ấn (Cần Rank A-)' },
  { from: 7, to: 8, label: 'Cấp 7 ➜ Cấp 8', desc: '11.000 ĐTT + 1 Dấu Ấn (Cần Rank A-)' },
  { from: 8, to: 9, label: 'Cấp 8 ➜ Cấp 9', desc: '11.000 ĐTT + 1 Dấu Ấn (Cần Rank A-)' },
  { from: 9, to: 10, label: 'Cấp 9 ➜ Cấp 10', desc: '11.000 ĐTT + 3 Dấu Ấn (Cần Rank S-)' },
];

export default function MasteryPage() {
  const { settings, setSettings, MAX_PRICE_PER_STEP, platformFee } = useServiceContext();

  // Calculator State
  const [calcFrom, setCalcFrom] = useState(1);
  const [calcTo, setCalcTo] = useState(10);
  const [calcPrice, setCalcPrice] = useState(0);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Fee Tool State
  const [toolNet, setToolNet] = useState('');
  const [toolGross, setToolGross] = useState('');

  // --- LOGIC ---
  const updatePrice = (from: number, to: number, price: string) => {
    const key = `M${from}_M${to}`;
    const cleanPrice = price.replace(/,/g, '');
    const numValue = parseInt(cleanPrice) || 0;

    setSettings(prev => ({
      ...prev,
      masteryPrices: { ...prev.masteryPrices, [key]: numValue }
    }));
  };

  // Calculate Total Price
  useEffect(() => {
    setCalcError(null);
    if (calcFrom >= calcTo) {
      setCalcPrice(0);
      return;
    }

    let total = 0;
    let missingCount = 0;

    for (let i = calcFrom; i < calcTo; i++) {
      const key = `M${i}_M${i + 1}`;
      const price = settings.masteryPrices?.[key];
      if (!price || price <= 0) missingCount++;
      total += (price || 0);
    }

    if (missingCount > 0) {
      setCalcPrice(0);
      setCalcError(`Chưa nhập giá ${missingCount} cấp`);
    } else {
      setCalcPrice(total);
    }
  }, [calcFrom, calcTo, settings.masteryPrices]);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Medal className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-white">Cấu hình Cày Thông Thạo</h2>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-200 flex gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">Hệ thống Thông Thạo Mới (Patch 14.10+):</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li><strong>Cấp 1-4:</strong> Chỉ cần cày Điểm Thông Thạo (ĐTT).</li>
              <li><strong>Cấp 5-9:</strong> Cần ĐTT + <strong>1 Dấu Ấn</strong> (Kiếm bằng cách đạt Rank A- trở lên).</li>
              <li><strong>Cấp 10 (Danh Hiệu):</strong> Cần ĐTT + <strong>3 Dấu Ấn</strong> (Kiếm bằng cách đạt Rank S- trở lên).</li>
              <li>Hệ thống sẽ tự động cộng dồn giá nếu khách đặt nhiều cấp (VD: Từ cấp 1 lên 7).</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-white font-bold flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-blue-500" />
          Xem trước giá (Preview)
        </h3>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs text-zinc-500 mb-1 block">Từ Cấp</label>
            <select 
              value={calcFrom}
              onChange={(e) => {
                setCalcFrom(Number(e.target.value));
                if (Number(e.target.value) >= calcTo) setCalcTo(Number(e.target.value) + 1);
              }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
                <option key={lvl} value={lvl}>Cấp {lvl}</option>
              ))}
            </select>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-600 hidden md:block mt-5" />
          <div className="flex-1 w-full">
            <label className="text-xs text-zinc-500 mb-1 block">Đến Cấp</label>
            <select 
              value={calcTo}
              onChange={(e) => setCalcTo(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
                <option key={lvl} value={lvl} disabled={lvl <= calcFrom}>Cấp {lvl}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <div className="flex-1 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
            <span className="text-xs text-blue-200 block">Tổng tiền</span>
            {calcError ? (
              <span className="text-sm font-bold text-red-400 animate-pulse">{calcError}</span>
            ) : (
              <span className="text-xl font-bold text-blue-400">{calcPrice.toLocaleString('vi-VN')} đ</span>
            )}
          </div>
          <div className="flex-1 bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center">
            <span className="text-xs text-green-200 block flex items-center justify-center gap-1">
              <Coins className="w-3 h-3" /> Thực nhận (-{platformFee}%)
            </span>
            <span className="text-xl font-bold text-green-400">{(Math.floor(calcPrice * (1 - platformFee / 100))).toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      </div>

        {/* Fee Tool */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-bold flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-yellow-500" />
            Công cụ tính phí sàn ({platformFee}%)
          </h3>
          <div className="space-y-6">
             {/* Net to Gross */}
             <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Muốn thực nhận (VNĐ)</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={toolNet} 
                        onChange={(e) => { 
                            const val = e.target.value.replace(/[^0-9]/g, ''); 
                            setToolNet(val ? Number(val).toLocaleString('vi-VN') : ''); 
                        }} 
                        placeholder="Ví dụ: 95.000" 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-yellow-500 transition-colors" 
                    />
                    <span className="absolute right-3 top-2 text-zinc-500 text-xs">VNĐ</span>
                </div>
                {toolNet && (
                    <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg animate-in fade-in slide-in-from-top-1">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-xs">Bạn cần nhập:</span>
                            <span className="text-yellow-400 font-bold text-lg">
                                {Math.ceil(parseInt(toolNet.replace(/\./g, '')) / (1 - platformFee / 100)).toLocaleString('vi-VN')} đ
                            </span>
                        </div>
                    </div>
                )}
             </div>

             <div className="border-t border-zinc-800"></div>

             {/* Gross to Net */}
             <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Nhập giá gốc (Khách trả)</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={toolGross} 
                        onChange={(e) => { 
                            const val = e.target.value.replace(/[^0-9]/g, ''); 
                            setToolGross(val ? Number(val).toLocaleString('vi-VN') : ''); 
                        }} 
                        placeholder="Ví dụ: 100.000" 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-green-500 transition-colors" 
                    />
                    <span className="absolute right-3 top-2 text-zinc-500 text-xs">VNĐ</span>
                </div>
                {toolGross && (
                    <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-1 animate-in fade-in slide-in-from-top-1">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-xs">Phí sàn (-{platformFee}%):</span>
                            <span className="text-red-400 font-bold text-sm">
                                -{(Math.ceil(parseInt(toolGross.replace(/\./g, '')) * (platformFee / 100))).toLocaleString('vi-VN')} đ
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-green-500/20">
                            <span className="text-zinc-300 text-xs font-medium">Thực nhận:</span>
                            <span className="text-green-400 font-bold text-lg">
                                {Math.floor(parseInt(toolGross.replace(/\./g, '')) * (1 - platformFee / 100)).toLocaleString('vi-VN')} đ
                            </span>
                        </div>
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Pricing Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MASTERY_STEPS.map((step) => {
          const key = `M${step.from}_M${step.to}`;
          const currentPrice = settings.masteryPrices?.[key] || 0;
          const isHighLevel = step.to > 4; // Cấp 5 trở lên cần Dấu Ấn

          return (
            <div 
              key={key} 
              className={`p-4 rounded-xl border transition-all ${
                isHighLevel 
                  ? 'bg-purple-900/10 border-purple-500/30 hover:border-purple-500/50' 
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {step.label}
                    {isHighLevel && <Medal className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="text-xs text-zinc-500">{step.desc}</div>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="0"
                  value={currentPrice ? currentPrice.toLocaleString('en-US') : ''}
                  onChange={(e) => updatePrice(step.from, step.to, e.target.value)}
                  className={`w-full bg-zinc-950/50 border rounded-xl pl-4 pr-16 py-4 text-right text-lg font-bold outline-none transition-all ${
                    currentPrice > MAX_PRICE_PER_STEP 
                      ? 'border-red-500 text-red-500' 
                      : isHighLevel 
                        ? 'border-purple-500/30 text-purple-400 focus:border-purple-500' 
                        : 'border-white/10 text-white focus:border-green-500 focus:text-green-400'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end pointer-events-none">
                    <span className="text-[10px] text-zinc-500 font-medium uppercase">VNĐ</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
