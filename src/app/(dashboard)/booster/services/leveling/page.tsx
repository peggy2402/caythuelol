'use client';

import { useServiceContext } from '../ServiceContext';
import { useState, useEffect } from 'react';
import { Zap, Calculator, Coins, ArrowRight, Info } from 'lucide-react';

const LEVEL_RANGES = [
  { id: '1-10', label: 'Cấp 1 - 10', min: 1, max: 10, desc: 'Giai đoạn tân thủ, XP thấp.' },
  { id: '11-20', label: 'Cấp 11 - 20', min: 11, max: 20, desc: 'Giai đoạn trung bình.' },
  { id: '21-30', label: 'Cấp 21 - 30', min: 21, max: 30, desc: 'Giai đoạn cao, cần nhiều XP để mở khóa Ranked.' },
];

export default function LevelingPage() {
  const { settings, setSettings, MAX_PRICE_PER_STEP } = useServiceContext();

  // Calculator State
  const [calcFrom, setCalcFrom] = useState(1);
  const [calcTo, setCalcTo] = useState(30);
  const [calcPrice, setCalcPrice] = useState(0);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Fee Tool State
  const [toolNet, setToolNet] = useState('');

  // --- LOGIC ---
  const updatePrice = (rangeId: string, price: string) => {
    const cleanPrice = price.replace(/,/g, '');
    const numValue = parseInt(cleanPrice) || 0;

    setSettings(prev => ({
      ...prev,
      levelingPrices: { ...prev.levelingPrices, [rangeId]: numValue }
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

    for (let lvl = calcFrom; lvl < calcTo; lvl++) {
      // Xác định range cho level hiện tại
      let rangeId = '';
      if (lvl < 11) rangeId = '1-10';
      else if (lvl < 21) rangeId = '11-20';
      else rangeId = '21-30';

      const price = settings.levelingPrices?.[rangeId];
      if (!price || price <= 0) missingCount++;
      total += (price || 0);
    }

    if (missingCount > 0) {
      setCalcPrice(0);
      setCalcError(`Chưa nhập giá cho ${missingCount} cấp`);
    } else {
      setCalcPrice(total);
    }
  }, [calcFrom, calcTo, settings.levelingPrices]);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-white">Cấu hình Cày Level 30</h2>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200 flex gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">Dịch vụ Cày Level:</p>
            <p className="text-zinc-400">
              Khách hàng thường đặt cày từ Level 1 lên 30 để mở khóa chế độ Xếp Hạng (Ranked).
              <br/>
              Bạn hãy nhập giá <strong>trên mỗi 1 cấp độ</strong> cho từng khoảng level tương ứng.
            </p>
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
              <label className="text-xs text-zinc-500 mb-1 block">Từ Level</label>
              <input 
                type="number" 
                min="1" max="29" 
                value={calcFrom} 
                onChange={(e) => {
                    const val = Math.min(29, Math.max(1, Number(e.target.value)));
                    setCalcFrom(val);
                    if (val >= calcTo) setCalcTo(val + 1);
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-600 hidden md:block mt-5" />
            <div className="flex-1 w-full">
              <label className="text-xs text-zinc-500 mb-1 block">Đến Level</label>
              <input 
                type="number" 
                min="2" max="30" 
                value={calcTo} 
                onChange={(e) => setCalcTo(Math.min(30, Math.max(calcFrom + 1, Number(e.target.value))))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              />
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
                <Coins className="w-3 h-3" /> Thực nhận (-5%)
              </span>
              <span className="text-xl font-bold text-green-400">{(calcPrice * 0.95).toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* Fee Tool */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-bold flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-yellow-500" />
            Tính phí sàn (5%)
          </h3>
          <div className="space-y-4">
             <div className="relative">
                <input type="text" value={toolNet} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setToolNet(val ? Number(val).toLocaleString('vi-VN') : ''); }} placeholder="Muốn thực nhận (VNĐ)" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none" />
                <span className="absolute right-3 top-2 text-zinc-500 text-xs">VNĐ</span>
             </div>
             {toolNet && (
                <div className="flex justify-between items-center border-t border-zinc-800 pt-2">
                    <span className="text-zinc-400 text-sm">Cần nhập giá:</span>
                    <span className="text-yellow-400 font-bold text-lg">{Math.ceil(parseInt(toolNet.replace(/\./g, '')) / 0.95).toLocaleString('vi-VN')} đ</span>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Pricing Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LEVEL_RANGES.map((range) => {
          const currentPrice = settings.levelingPrices?.[range.id] || 0;

          return (
            <div key={range.id} className="p-4 rounded-xl border bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all">
              <div className="mb-3">
                <div className="font-bold text-white text-lg">{range.label}</div>
                <div className="text-xs text-zinc-500 mt-1">{range.desc}</div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Giá / 1 cấp..."
                  value={currentPrice ? currentPrice.toLocaleString('en-US') : ''}
                  onChange={(e) => updatePrice(range.id, e.target.value)}
                  className={`w-full bg-zinc-950 border rounded-lg pl-4 pr-10 py-3 text-right font-bold outline-none transition-colors ${
                    currentPrice > MAX_PRICE_PER_STEP 
                      ? 'border-red-500 text-red-500' 
                      : 'border-zinc-700 text-green-400 focus:border-green-500'
                  }`}
                />
                <span className="absolute right-3 top-3.5 text-zinc-500 text-sm">VNĐ</span>
              </div>
              <div className="mt-2 text-right text-[10px] text-zinc-600">
                (Giá tính cho 1 level)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
