'use client';

import { useServiceContext } from '../ServiceContext';
import { useState, useEffect } from 'react';
import { TrendingUp, Calculator, Coins, ArrowRight, Info, Layers, Users } from 'lucide-react';

const PROMOTION_STEPS = [
  { id: 'Iron_I', label: 'Sắt I ➜ Đồng IV', from: 'Sắt I', to: 'Đồng IV' },
  { id: 'Bronze_I', label: 'Đồng I ➜ Bạc IV', from: 'Đồng I', to: 'Bạc IV' },
  { id: 'Silver_I', label: 'Bạc I ➜ Vàng IV', from: 'Bạc I', to: 'Vàng IV' },
  { id: 'Gold_I', label: 'Vàng I ➜ Bạch Kim IV', from: 'Vàng I', to: 'Bạch Kim IV' },
  { id: 'Platinum_I', label: 'Bạch Kim I ➜ Lục Bảo IV', from: 'Bạch Kim I', to: 'Lục Bảo IV' },
  { id: 'Emerald_I', label: 'Lục Bảo I ➜ Kim Cương IV', from: 'Lục Bảo I', to: 'Kim Cương IV' },
  { id: 'Diamond_I', label: 'Kim Cương I ➜ Cao Thủ', from: 'Kim Cương I', to: 'Cao Thủ' },
];

export default function PromotionPage() {
  const { settings, setSettings, MAX_PRICE_PER_STEP, platformFee } = useServiceContext();

  // Calculator State
  const [selectedPromo, setSelectedPromo] = useState(PROMOTION_STEPS[2].id); // Default Silver -> Gold
  const [calcPrice, setCalcPrice] = useState(0);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SOLO' | 'FLEX' | 'DUO'>('SOLO');

  // Fee Tool State
  const [toolGross, setToolGross] = useState('');
  const [toolNet, setToolNet] = useState('');

  // --- LOGIC ---
  const updatePrice = (id: string, price: string) => {
    const cleanPrice = price.replace(/,/g, '');
    const numValue = parseInt(cleanPrice) || 0;

    setSettings(prev => {
      if (activeTab === 'FLEX') {
        return { ...prev, promotionPricesFlex: { ...prev.promotionPricesFlex, [id]: numValue } };
      }
      if (activeTab === 'DUO') {
        return { ...prev, promotionPricesDuo: { ...prev.promotionPricesDuo, [id]: numValue } };
      }
      return { ...prev, promotionPrices: { ...prev.promotionPrices, [id]: numValue } };
    });
  };

  // Calculate Price Preview
  useEffect(() => {
    setCalcError(null);
    let price = settings.promotionPrices?.[selectedPromo] || 0;
    if (activeTab === 'FLEX') price = settings.promotionPricesFlex?.[selectedPromo] || 0;
    if (activeTab === 'DUO') price = settings.promotionPricesDuo?.[selectedPromo] || 0;
    
    if (!price || price <= 0) {
        setCalcPrice(0);
        setCalcError('Chưa nhập giá');
    } else {
        setCalcPrice(price);
    }
  }, [selectedPromo, settings.promotionPrices, settings.promotionPricesFlex, settings.promotionPricesDuo, activeTab]);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-white">Cấu hình Chuỗi Thăng Hạng (Promotion)</h2>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200 flex gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">Dịch vụ Chuỗi Thăng Hạng:</p>
            <p className="text-zinc-400">
              Áp dụng cho khách hàng đang ở bậc I (Ví dụ: Bạc I 100LP hoặc đang trong chuỗi) muốn lên bậc IV của rank tiếp theo.
              <br/>
              Booster cần đảm bảo thắng đủ số trận để khách lên hạng thành công.
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
          
          <div className="space-y-4">
            <div>
                <label className="text-xs text-zinc-500 mb-1 block">Chọn chuỗi thăng hạng</label>
                <select 
                    value={selectedPromo}
                    onChange={(e) => setSelectedPromo(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                    {PROMOTION_STEPS.map((step) => (
                        <option key={step.id} value={step.id}>{step.label}</option>
                    ))}
                </select>
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

      {/* TABS */}
      <div className="flex gap-2">
        <button 
          onClick={() => setActiveTab('SOLO')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'SOLO' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
        >
          Solo / Duo (Mặc định)
        </button>
        <button 
          onClick={() => setActiveTab('FLEX')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'FLEX' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
        >
          <Layers className="w-4 h-4" /> Flex
        </button>
        <button 
          onClick={() => setActiveTab('DUO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'DUO' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
        >
          <Users className="w-4 h-4" /> Duo (Chơi cùng)
        </button>
      </div>

      {/* Pricing Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROMOTION_STEPS.map((step) => {
          let currentPrice = settings.promotionPrices?.[step.id] || 0;
          if (activeTab === 'FLEX') currentPrice = settings.promotionPricesFlex?.[step.id] || 0;
          if (activeTab === 'DUO') currentPrice = settings.promotionPricesDuo?.[step.id] || 0;
          const isHighRank = step.id.includes('Diamond') || step.id.includes('Emerald');

          return (
            <div 
              key={step.id} 
              className={`p-4 rounded-xl border transition-all ${
                isHighRank 
                  ? 'bg-purple-900/10 border-purple-500/30 hover:border-purple-500/50' 
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-zinc-400">{step.from}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                    <span className={isHighRank ? 'text-purple-400' : 'text-white'}>{step.to}</span>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="0"
                  value={currentPrice ? currentPrice.toLocaleString('en-US') : ''}
                  onChange={(e) => updatePrice(step.id, e.target.value)}
                  className={`w-full bg-zinc-950/50 border rounded-xl pl-4 pr-16 py-4 text-right text-lg font-bold outline-none transition-all ${
                    currentPrice > MAX_PRICE_PER_STEP 
                      ? 'border-red-500 text-red-500' 
                      : isHighRank 
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
