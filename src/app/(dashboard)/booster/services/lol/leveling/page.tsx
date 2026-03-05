'use client';

import { useServiceContext } from '../../../../../../components/ServiceContext';
import { useState, useEffect } from 'react';
import { Zap, Calculator, Coins, ArrowRight, Info, ChevronDown } from 'lucide-react';

const LEVEL_RANGES = [
  { id: '1-10', label: 'Cấp 1 - 10', min: 1, max: 10, desc: 'Giai đoạn tân thủ, XP thấp.' },
  { id: '11-20', label: 'Cấp 11 - 20', min: 11, max: 20, desc: 'Giai đoạn trung bình.' },
  { id: '21-30', label: 'Cấp 21 - 30', min: 21, max: 30, desc: 'Giai đoạn cao, cần nhiều XP để mở khóa Ranked.' },
];

export default function LevelingPage() {
  const { settings, setSettings, MAX_PRICE_PER_STEP, platformFee } = useServiceContext();

  // Calculator State
  const [calcFrom, setCalcFrom] = useState(1);
  const [calcTo, setCalcTo] = useState(30);
  const [calcPrice, setCalcPrice] = useState(0);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [calcBreakdown, setCalcBreakdown] = useState<{range: string, count: number, price: number}[]>([]);

  // Fee Tool State
  const [toolNet, setToolNet] = useState('');
  const [toolGross, setToolGross] = useState('');

  // Collapsible State
  const [expanded, setExpanded] = useState({ info: true, calc: true, fee: true, pricing: true });

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setExpanded({ info: true, calc: false, fee: false, pricing: true });
    }
  }, []);

  const toggle = (key: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
    const breakdownMap: Record<string, {count: number, price: number}> = {};

    for (let lvl = calcFrom; lvl < calcTo; lvl++) {
      // Xác định range cho level hiện tại
      let rangeId = '';
      if (lvl < 11) rangeId = '1-10';
      else if (lvl < 21) rangeId = '11-20';
      else rangeId = '21-30';

      const price = settings.levelingPrices?.[rangeId];
      if (!price || price <= 0) missingCount++;
      total += (price || 0);

      if (!breakdownMap[rangeId]) {
          breakdownMap[rangeId] = { count: 0, price: price || 0 };
      }
      breakdownMap[rangeId].count++;
    }

    if (missingCount > 0) {
      setCalcPrice(0);
      setCalcError(`Chưa nhập giá cho ${missingCount} cấp`);
    } else {
      setCalcPrice(total);
      setCalcBreakdown(Object.entries(breakdownMap).map(([range, data]) => ({
          range,
          count: data.count,
          price: data.price
      })));
    }
  }, [calcFrom, calcTo, settings.levelingPrices]);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div onClick={() => toggle('info')} className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-white">Cấu hình Cày Level 30</h2>
            </div>
            <ChevronDown className={`w-6 h-6 text-zinc-500 transition-transform duration-300 ${expanded.info ? 'rotate-180' : ''}`} />
        </div>
        
        {expanded.info && (
        <div className="px-6 pb-6 animate-in slide-in-from-top-2">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200 flex gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5 flex-none" />
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
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden h-fit">
          <div onClick={() => toggle('calc')} className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors">
            <h3 className="text-white font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-500" />
                Mô phỏng đơn đặt (Khách hàng)
            </h3>
            <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${expanded.calc ? 'rotate-180' : ''}`} />
          </div>
          
          {expanded.calc && (
          <div className="px-5 pb-5 animate-in slide-in-from-top-2">
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
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-600 hidden md:block mt-5" />
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs text-zinc-500 block">Đến Level</label>
                <div className="group relative">
                  <Info className="w-3 h-3 text-zinc-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                    <p className="font-bold text-white mb-1">Tại sao 1-&gt;30 chỉ có 29 cấp?</p>
                    <p>Vì tài khoản bắt đầu từ Level 1, nên chỉ cần cày thêm 29 cấp nữa để đạt Level 30.</p>
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-800 border-b border-r border-zinc-700 rotate-45"></div>
                  </div>
                </div>
              </div>
              <input 
                type="number" 
                min="2" max="30" 
                value={calcTo} 
                onChange={(e) => {
                  // Cho phép nhập tự do, chỉ chặn max 30
                  // Logic tính giá sẽ tự xử lý nếu Đến < Từ
                  setCalcTo(Math.min(30, Number(e.target.value)));
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="mt-4">
            {calcError ? (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <span className="text-sm font-bold text-red-400 animate-pulse">{calcError}</span>
                </div>
            ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                    {/* Breakdown */}
                    <div className="space-y-1 mb-3 pb-3 border-b border-zinc-800/50">
                        {calcBreakdown.map((item) => (
                            <div key={item.range} className="flex justify-between text-xs text-zinc-500">
                                <span>{item.count} cấp ({item.range}):</span>
                                <span>{item.count} x {item.price.toLocaleString()} = {(item.count * item.price).toLocaleString()} đ</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-sm text-zinc-400">
                        <span>Giá gốc:</span>
                        <span className="text-white font-bold">{calcPrice.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between text-sm text-zinc-400">
                        <span>Phí sàn ({platformFee}%):</span>
                        <span className="text-yellow-400">+{Math.ceil(calcPrice * (platformFee / 100)).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="border-t border-zinc-800 pt-2 flex justify-between items-center">
                        <span className="text-sm font-bold text-white">Khách trả:</span>
                        <span className="text-xl font-bold text-blue-400">
                            {(calcPrice + Math.ceil(calcPrice * (platformFee / 100))).toLocaleString('vi-VN')} đ
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="bg-green-900/10 border border-green-500/20 p-2 rounded-lg">
                            <span className="text-green-400 text-xs font-bold block mb-1">Bạn nhận:</span>
                            <span className="text-lg font-bold text-white">{calcPrice.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="bg-yellow-900/10 border border-yellow-500/20 p-2 rounded-lg">
                            <span className="text-yellow-400 text-xs font-bold block mb-1">Admin nhận:</span>
                            <span className="text-lg font-bold text-white">{Math.ceil(calcPrice * (platformFee / 100)).toLocaleString('vi-VN')} ₫</span>
                        </div>
                    </div>
                </div>
            )}
          </div>
          </div>
          )}
        </div>

        {/* Fee Tool */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden h-fit">
          <div onClick={() => toggle('fee')} className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors">
            <h3 className="text-white font-bold flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                Công cụ tính phí sàn ({platformFee}%)
            </h3>
            <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${expanded.fee ? 'rotate-180' : ''}`} />
          </div>
          
          {expanded.fee && (
          <div className="px-5 pb-5 animate-in slide-in-from-top-2">
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
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-zinc-400 text-xs">Phí sàn (+{platformFee}%):</span>
                            <span className="text-yellow-400 font-bold text-sm">
                                +{(Math.ceil(parseInt(toolNet.replace(/\./g, '')) * (platformFee / 100))).toLocaleString('vi-VN')} đ
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-yellow-500/20">
                            <span className="text-zinc-300 text-xs font-medium">Bạn cần nhập:</span>
                            <span className="text-yellow-400 font-bold text-lg">
                                {Math.ceil(parseInt(toolNet.replace(/\./g, '')) * (1 + platformFee / 100)).toLocaleString('vi-VN')} đ
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
                                -{(parseInt(toolGross.replace(/\./g, '')) - Math.floor(parseInt(toolGross.replace(/\./g, '')) / (1 + platformFee / 100))).toLocaleString('vi-VN')} đ
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-green-500/20">
                            <span className="text-zinc-300 text-xs font-medium">Thực nhận:</span>
                            <span className="text-green-400 font-bold text-lg">
                                {Math.floor(parseInt(toolGross.replace(/\./g, '')) / (1 + platformFee / 100)).toLocaleString('vi-VN')} đ
                            </span>
                        </div>
                    </div>
                )}
             </div>
          </div>
        </div>
        )}
      </div>
      </div>

      {/* Pricing Inputs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div onClick={() => toggle('pricing')} className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <h2 className="text-xl font-bold text-white">Bảng giá Leveling</h2>
            <ChevronDown className={`w-6 h-6 text-zinc-500 transition-transform duration-300 ${expanded.pricing ? 'rotate-180' : ''}`} />
        </div>

        {expanded.pricing && (
        <div className="px-6 pb-6 animate-in slide-in-from-top-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LEVEL_RANGES.map((range) => {
          const currentPrice = settings.levelingPrices?.[range.id] || 0;

          return (
            <div key={range.id} className="p-5 rounded-2xl border bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 hover:-translate-y-1 transition-all duration-300 group">
              <div className="mb-4">
                <div className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{range.label}</div>
                <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{range.desc}</div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Giá / 1 cấp..."
                  value={currentPrice ? currentPrice.toLocaleString('en-US') : ''}
                  onChange={(e) => updatePrice(range.id, e.target.value)}
                  className={`w-full bg-zinc-900 border rounded-xl pl-4 pr-12 py-4 text-right text-lg font-bold outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    currentPrice > MAX_PRICE_PER_STEP 
                      ? 'border-red-500 text-red-500' 
                      : 'border-zinc-800 text-white focus:border-blue-500 focus:bg-zinc-900'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end pointer-events-none">
                    <span className="text-[10px] text-zinc-500 font-medium uppercase">VNĐ</span>
                    <span className="text-[10px] text-zinc-600">/ 1 Level</span>
                </div>
              </div>
            </div>
          );
        })}
        </div>
        </div>
        )}
      </div>
    </div>
  );
}
