'use client';

import { useServiceContext } from '../../../../../../components/ServiceContext';
import { useState, useEffect } from 'react';
import { Swords, Calculator, Coins, ArrowRight, Info, Layers, Users, ChevronDown } from 'lucide-react';

const PLACEMENT_RANKS = [
  'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'
];
const PLACEMENT_GAMES = [1, 2, 3, 4, 5];

export default function PlacementsPage() {
  const { settings, setSettings, MAX_PRICE_PER_STEP, ranks, platformFee } = useServiceContext();

  // Calculator State
  const [calcPrevRank, setCalcPrevRank] = useState('SILVER'); // Default Silver (Uppercase)
  const [calcNumGames, setCalcNumGames] = useState(5); // Default 5 games
  const [calcPrice, setCalcPrice] = useState(0);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SOLO' | 'FLEX' | 'DUO'>('SOLO');

  // Fee Tool State
  const [toolGross, setToolGross] = useState('');
  const [toolNet, setToolNet] = useState('');

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

  // Pricing Inputs State
  const [selectedConfigRank, setSelectedConfigRank] = useState('IRON'); // Rank currently being configured (Uppercase)

  // --- LOGIC ---
  const updatePrice = (prevRank: string, numGames: number, price: string) => {
    const normalizedRank = prevRank.toUpperCase();
    const key = `P_${normalizedRank}_${numGames}`;
    const cleanPrice = price.replace(/,/g, '');
    const numValue = parseInt(cleanPrice) || 0;

    setSettings(prev => {
      if (activeTab === 'FLEX') {
        return { ...prev, placementPricesFlex: { ...prev.placementPricesFlex, [key]: numValue } };
      }
      if (activeTab === 'DUO') {
        return { ...prev, placementPricesDuo: { ...prev.placementPricesDuo, [key]: numValue } };
      }
      return { ...prev, placementPrices: { ...prev.placementPrices, [key]: numValue } };
    });
  };

  // Calculate Total Price for Preview
  useEffect(() => {
    setCalcError(null);
    if (!calcPrevRank || !calcNumGames) {
      setCalcPrice(0);
      return;
    }

    const normalizedRank = calcPrevRank.toUpperCase();
    const key = `P_${normalizedRank}_${calcNumGames}`;
    
    let price = settings.placementPrices?.[key] || 0;
    if (activeTab === 'FLEX') price = settings.placementPricesFlex?.[key] || 0;
    if (activeTab === 'DUO') price = settings.placementPricesDuo?.[key] || 0;

    if (!price || price <= 0) {
      setCalcPrice(0);
      setCalcError('Chưa nhập giá');
    } else {
      setCalcPrice(price);
    }
  }, [calcPrevRank, calcNumGames, settings.placementPrices, settings.placementPricesFlex, settings.placementPricesDuo, activeTab]);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div onClick={() => toggle('info')} className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
                <Swords className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-bold text-white">Cấu hình Phân hạng đầu mùa</h2>
            </div>
            <ChevronDown className={`w-6 h-6 text-zinc-500 transition-transform duration-300 ${expanded.info ? 'rotate-180' : ''}`} />
        </div>
        
        {expanded.info && (
        <div className="px-6 pb-6 animate-in slide-in-from-top-2">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200 flex gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5 flex-none" />
          <div>
            <p className="font-bold mb-1">Dịch vụ Phân hạng:</p>
            <p className="text-zinc-400">
              Khách hàng sẽ chọn Rank mùa trước của họ và số trận phân hạng muốn cày (1-5 trận).
              <br/>
              Bạn cần nhập giá cho từng cặp "Rank mùa trước" và "Số trận".
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
              <label className="text-xs text-zinc-500 mb-1 block">Rank mùa trước</label>
              <select 
                value={calcPrevRank}
                onChange={(e) => setCalcPrevRank(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                {PLACEMENT_RANKS.map(rank => (
                  <option key={rank} value={rank.toUpperCase()}>{rank}</option>
                ))}
              </select>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-600 hidden md:block mt-5" />
            <div className="flex-1 w-full">
              <label className="text-xs text-zinc-500 mb-1 block">Số trận</label>
              <select 
                value={calcNumGames}
                onChange={(e) => setCalcNumGames(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                {PLACEMENT_GAMES.map(games => (
                  <option key={games} value={games}>{games} trận</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            {calcError ? (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <span className="text-sm font-bold text-red-400 animate-pulse">{calcError}</span>
                </div>
            ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
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
      </div>

      {/* Pricing Inputs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div onClick={() => toggle('pricing')} className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <h3 className="text-xl font-bold text-white">Nhập giá theo Rank mùa trước</h3>
            <ChevronDown className={`w-6 h-6 text-zinc-500 transition-transform duration-300 ${expanded.pricing ? 'rotate-180' : ''}`} />
        </div>

        {expanded.pricing && (
        <div className="px-6 pb-6 animate-in slide-in-from-top-2">
        <div className="mb-6">
            <label className="text-xs text-zinc-500 mb-2 block">Chọn Rank để cấu hình</label>
            {ranks.length > 0 ? (
              <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar snap-x">
                {ranks.map((rank) => (
                  <button
                    key={rank._id}
                    onClick={() => setSelectedConfigRank(rank.name)}
                    className={`flex-shrink-0 snap-center flex flex-col items-center justify-center gap-2 p-3 rounded-xl border w-24 transition-all ${
                      selectedConfigRank === rank.name
                        ? 'bg-blue-600/10 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                    }`}
                  >
                    <img src={rank.imageUrl} alt={rank.name} className={`w-10 h-10 object-contain transition-all ${selectedConfigRank === rank.name ? 'scale-110 drop-shadow-lg' : 'grayscale opacity-50'}`} />
                    <span className="text-xs font-bold">{rank.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <select 
                  value={selectedConfigRank}
                  onChange={(e) => setSelectedConfigRank(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                  {PLACEMENT_RANKS.map(rank => (
                      <option key={rank} value={rank.toUpperCase()}>{rank}</option>
                  ))}
              </select>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLACEMENT_GAMES.map((games) => {
            const key = `P_${selectedConfigRank}_${games}`;
            let currentPrice = settings.placementPrices?.[key] || 0;
            if (activeTab === 'FLEX') currentPrice = settings.placementPricesFlex?.[key] || 0;
            if (activeTab === 'DUO') currentPrice = settings.placementPricesDuo?.[key] || 0;
            const isHighRank = PLACEMENT_RANKS.indexOf(selectedConfigRank) >= PLACEMENT_RANKS.indexOf('Diamond');

            return (
              <div 
                key={key} 
                className={`p-4 rounded-xl border transition-all ${
                  isHighRank 
                    ? 'bg-purple-900/10 border-purple-500/30 hover:border-purple-500/50' 
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="font-bold text-white flex items-center gap-2">
                      <span className="text-zinc-400">{games} trận</span>
                  </div>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="0"
                        value={currentPrice ? currentPrice.toLocaleString('en-US') : ''}
                        onChange={(e) => updatePrice(selectedConfigRank, games, e.target.value)}
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
        )}
      </div>
    </div>
  );
}