'use client';

import { useServiceContext } from '../../../../../../components/ServiceContext';
import { useState, useEffect } from 'react';
import { Swords, Calculator, Coins, ArrowRight, Info, Layers, Users } from 'lucide-react';

const PLACEMENT_RANKS = [
  'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'
];
const PLACEMENT_GAMES = [1, 2, 3, 4, 5];

export default function PlacementsPage() {
  const { settings, setSettings, MAX_PRICE_PER_STEP, ranks, platformFee } = useServiceContext();

  // Calculator State
  const [calcPrevRank, setCalcPrevRank] = useState(PLACEMENT_RANKS[2]); // Default Silver
  const [calcNumGames, setCalcNumGames] = useState(3); // Default 3 games
  const [calcPrice, setCalcPrice] = useState(0);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SOLO' | 'FLEX' | 'DUO'>('SOLO');

  // Fee Tool State
  const [toolGross, setToolGross] = useState('');
  const [toolNet, setToolNet] = useState('');

  // Pricing Inputs State
  const [selectedConfigRank, setSelectedConfigRank] = useState(PLACEMENT_RANKS[0]); // Rank currently being configured

  // --- LOGIC ---
  const updatePrice = (prevRank: string, numGames: number, price: string) => {
    const key = `P_${prevRank}_${numGames}`;
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

    const key = `P_${calcPrevRank}_${calcNumGames}`;
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Swords className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-bold text-white">Cấu hình Phân hạng đầu mùa</h2>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200 flex gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-bold flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-blue-500" />
            Xem trước giá (Preview)
          </h3>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="text-xs text-zinc-500 mb-1 block">Rank mùa trước</label>
              <select 
                value={calcPrevRank}
                onChange={(e) => setCalcPrevRank(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                {PLACEMENT_RANKS.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Nhập giá theo Rank mùa trước</h3>
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
                      <option key={rank} value={rank}>{rank}</option>
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
    </div>
  );
}