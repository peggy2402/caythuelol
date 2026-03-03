'use client';

import { useServiceContext } from '../ServiceContext';
import { useState, useEffect } from 'react';
import { Target, Calculator, Coins, ArrowRight, Info, RefreshCw, Trophy, TrendingUp } from 'lucide-react';

const HIGH_ELO_RANKS = [
  { id: 'Master', label: 'Cao Thủ (Master)', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  { id: 'Grandmaster', label: 'Đại Cao Thủ (Grandmaster)', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' },
  { id: 'Challenger', label: 'Thách Đấu (Challenger)', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' },
];

interface RankStat {
  cutoff: number;
  count: number;
}

interface RankHistoryItem {
  date: string;
  challengerCutoff: number;
  grandmasterCutoff: number;
}

const LP_GAIN_OPTIONS = [
  { value: 15, label: 'LOW ELO (+15 LP)', settingKey: 'high' },     // Ít LP -> Khó -> Tăng giá
  { value: 19, label: 'MEDIUM ELO (+19 LP)', settingKey: 'medium' }, // TB -> Giá chuẩn
  { value: 24, label: 'HIGH ELO (+24 LP)', settingKey: 'low' },     // Nhiều LP -> Dễ -> Giảm giá
  { value: 30, label: 'VERY HIGH ELO (+30 LP)', settingKey: 'low' }, // Rất nhiều LP -> Giảm giá
];

export default function NetWinsPage() {
  const { settings, setSettings, MAX_PRICE_PER_STEP, platformFee } = useServiceContext();

  // Calculator State
  const [calcRank, setCalcRank] = useState('Master');
  const [calcCurrentLP, setCalcCurrentLP] = useState(0);
  const [calcDesiredLP, setCalcDesiredLP] = useState(100);
  const [calcLPGain, setCalcLPGain] = useState(19); // Default Medium
  const [calcPrice, setCalcPrice] = useState(0);
  const [calcWins, setCalcWins] = useState(0);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [appliedModifier, setAppliedModifier] = useState(0);

  // Fee Tool State
  const [toolNet, setToolNet] = useState('');

  // Rank Stats State
  const [challengerStat, setChallengerStat] = useState<RankStat>({ cutoff: 0, count: 0 });
  const [gmStat, setGmStat] = useState<RankStat>({ cutoff: 0, count: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [history, setHistory] = useState<RankHistoryItem[]>([]);

  // --- FETCH RANK DATA ---
  const fetchRankStats = async () => {
    setLoadingStats(true);
    try {
      // Gọi API nội bộ (Proxy) để tránh lỗi CORS
      const res = await fetch('/api/rank-stats');
      if (res.ok) {
        const data = await res.json();
        if (data.challenger) setChallengerStat(data.challenger);
        if (data.grandmaster) setGmStat(data.grandmaster);
        if (data.history) setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch rank stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchRankStats();
  }, []);

  // --- LOGIC ---
  const updatePrice = (rankId: string, price: string) => {
    const cleanPrice = price.replace(/,/g, '');
    const numValue = parseInt(cleanPrice) || 0;

    setSettings(prev => ({
      ...prev,
      netWinPrices: { ...prev.netWinPrices, [rankId]: numValue }
    }));
  };

  // Calculate Total Price
  useEffect(() => {
    setCalcError(null);
    if (calcDesiredLP <= calcCurrentLP) {
      setCalcPrice(0);
      setCalcWins(0);
      return;
    }

    // Công thức mới: Tổng tiền = Chênh lệch LP * Giá mỗi LP
    const lpDiff = calcDesiredLP - calcCurrentLP;
    const pricePerLP = settings.netWinPrices?.[calcRank];

    // Ước tính số trận (chỉ để tham khảo)
    setCalcWins(Math.ceil(lpDiff / calcLPGain));

    // Validation Logic (Input Validation)
    if (calcRank === 'Grandmaster' && challengerStat.cutoff > 0 && calcDesiredLP >= challengerStat.cutoff) {
      setCalcPrice(0);
      setCalcError(`Điểm mong muốn (${calcDesiredLP}) đã đạt mức Thách Đấu (${challengerStat.cutoff}+). Vui lòng chọn rank Thách Đấu.`);
      return;
    }

    if (calcRank === 'Master' && gmStat.cutoff > 0 && calcDesiredLP >= gmStat.cutoff) {
      setCalcPrice(0);
      setCalcError(`Điểm mong muốn (${calcDesiredLP}) đã đạt mức Đại Cao Thủ (${gmStat.cutoff}+). Vui lòng chọn rank Đại Cao Thủ.`);
      return;
    }

    if (!pricePerLP || pricePerLP <= 0) {
      setCalcPrice(0);
      setCalcError('Chưa nhập giá');
    } else {
      // Tính toán giá có áp dụng Modifier theo ELO
      const lpOption = LP_GAIN_OPTIONS.find(o => o.value === calcLPGain) || LP_GAIN_OPTIONS[1];
      const modifier = settings.lpGain[lpOption.settingKey as keyof typeof settings.lpGain] || 0;
      setAppliedModifier(modifier);

      const basePrice = lpDiff * pricePerLP;
      setCalcPrice(basePrice * (1 + modifier / 100));
    }
  }, [calcRank, calcCurrentLP, calcDesiredLP, calcLPGain, settings.netWinPrices, challengerStat.cutoff, gmStat.cutoff, settings.lpGain]);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-white">Cấu hình Cày Điểm (Master+)</h2>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200 flex gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">Dịch vụ Cày Điểm (Net Wins):</p>
            <p className="text-zinc-400">
              Áp dụng cho các Rank cao (Cao Thủ, Đại Cao Thủ, Thách Đấu).
              <br/>
              Hệ thống tính tiền dựa trên <strong>số điểm LP cần cày</strong>.
              <br/>
              Ví dụ: Bạn nhập giá <strong>1.000đ / 1 LP</strong>. Khách cần cày <strong>60 LP</strong> ➜ Giá gốc là <strong>60.000đ</strong> (Chưa tính hệ số Elo).
            </p>
          </div>
        </div>

        {/* Live Rank Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500 uppercase font-bold mb-1 flex items-center gap-2">
                <Trophy className="w-3 h-3 text-yellow-500" /> 
                Challenger Cut-off
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loadingStats ? '...' : challengerStat.cutoff.toLocaleString()} LP
              </div>
              <div className="text-xs text-zinc-600 mt-1">{challengerStat.count} Players</div>
            </div>
            <div className="h-14 w-14 flex items-center justify-center">
              <img src="/images/ranks/challenger.png" alt="Challenger" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500 uppercase font-bold mb-1 flex items-center gap-2">
                <Trophy className="w-3 h-3 text-red-500" /> 
                Grandmaster Cut-off
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loadingStats ? '...' : gmStat.cutoff.toLocaleString()} LP
              </div>
              <div className="text-xs text-zinc-600 mt-1">{gmStat.count} Players</div>
            </div>
            <div className="h-14 w-14 flex items-center justify-center">
              <img src="/images/ranks/grandmaster.png" alt="Grandmaster" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
            </div>
          </div>
        </div>

        {/* History Chart */}
        {history.length > 1 && (
          <div className="mt-6 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-bold text-white">Xu hướng Cut-off (7 ngày qua)</h4>
            </div>
            
            <div className="h-32 flex items-end gap-2 relative">
              {/* Simple Bar Chart Visualization */}
              {history.map((item, index) => {
                const maxVal = Math.max(...history.map(h => h.challengerCutoff));
                const minVal = Math.min(...history.map(h => h.grandmasterCutoff)) * 0.9;
                const range = maxVal - minVal;
                
                const chalHeight = ((item.challengerCutoff - minVal) / range) * 100;
                const gmHeight = ((item.grandmasterCutoff - minVal) / range) * 100;

                return (
                  <div key={item.date} className="flex-1 flex flex-col justify-end gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 text-[10px] text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none border border-zinc-700">
                      <div className="font-bold mb-1">{new Date(item.date).toLocaleDateString('vi-VN')}</div>
                      <div className="text-yellow-400">Chal: {item.challengerCutoff} LP</div>
                      <div className="text-red-400">GM: {item.grandmasterCutoff} LP</div>
                    </div>

                    {/* Challenger Bar */}
                    <div 
                      style={{ height: `${chalHeight}%` }} 
                      className="w-full bg-yellow-500/20 border-t-2 border-yellow-500 rounded-t-sm relative transition-all group-hover:bg-yellow-500/30"
                    >
                    </div>
                    
                    {/* Grandmaster Bar (Overlay or Stacked - here using absolute positioning for overlay effect) */}
                    <div 
                      style={{ height: `${gmHeight}%` }} 
                      className="absolute bottom-0 w-full bg-red-500/20 border-t-2 border-red-500 rounded-t-sm transition-all group-hover:bg-red-500/30"
                    >
                    </div>

                    <div className="text-[10px] text-zinc-600 text-center mt-1 truncate">
                      {new Date(item.date).getDate()}/{new Date(item.date).getMonth() + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-2">
          <button 
            onClick={fetchRankStats} 
            disabled={loadingStats}
            className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loadingStats ? 'animate-spin' : ''}`} /> Cập nhật dữ liệu
          </button>
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
                <label className="text-xs text-zinc-500 mb-1 block">Rank hiện tại</label>
                <select 
                    value={calcRank}
                    onChange={(e) => setCalcRank(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                    {HIGH_ELO_RANKS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-xs text-zinc-500 mb-1 block">Điểm hiện tại</label>
                    <input 
                        type="number" 
                        value={calcCurrentLP} 
                        onChange={(e) => setCalcCurrentLP(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                    />
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-600 self-center mt-5" />
                <div className="flex-1">
                    <label className="text-xs text-zinc-500 mb-1 block">Điểm mong muốn</label>
                    <input 
                        type="number" 
                        value={calcDesiredLP} 
                        onChange={(e) => setCalcDesiredLP(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <div>
                <label className="text-xs text-zinc-500 mb-1 block">
                  Mức độ Elo / Điểm cộng (Ảnh hưởng giá tiền)
                </label>
                <div className="relative">
                  <select 
                      value={calcLPGain}
                      onChange={(e) => setCalcLPGain(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  >
                      {LP_GAIN_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                  </select>
                  <div className={`absolute right-8 top-1/2 -translate-y-1/2 text-xs font-bold ${appliedModifier > 0 ? 'text-green-400' : appliedModifier < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                    {appliedModifier > 0 ? '+' : ''}{appliedModifier}%
                  </div>
                </div>
            </div>

            <div className="flex gap-2 mt-4">
                <div className="flex-1 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
                    <span className="text-xs text-blue-200 block">Tổng tiền (Khoảng {calcWins} trận)</span>
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
            Tính phí sàn ({platformFee}%)
          </h3>
            <span className="text-red-400 font-semibold">
            ⚠ Lưu ý quan trọng:
            </span>{" "}
            <span className="text-zinc-300">
            Bạn cần điều chỉnh giá phù hợp và
            </span>{" "}
            <span className="text-yellow-400 font-bold">
            Tips cho ADMIN {platformFee}%
            </span>{" "}
            <span className="text-zinc-300">
            (Phí sàn để duy trì hệ thống).
            </span>

            <br />

            <span className="text-xs text-zinc-500 italic">
            Vui lòng tính toán trước khi nhập giá để tránh bị lỗ.
            </span>
          <div className="space-y-4">
             <div className="relative">
                <input type="text" value={toolNet} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setToolNet(val ? Number(val).toLocaleString('vi-VN') : ''); }} placeholder="Muốn thực nhận (VNĐ)" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none" />
                <span className="absolute right-3 top-2 text-zinc-500 text-xs">VNĐ</span>
             </div>
             {toolNet && (
                <div className="flex justify-between items-center border-t border-zinc-800 pt-2">
                    <span className="text-zinc-400 text-sm">Cần nhập giá:</span>
                    <span className="text-yellow-400 font-bold text-lg">{Math.ceil(parseInt(toolNet.replace(/\./g, '')) / (1 - platformFee / 100)).toLocaleString('vi-VN')} đ</span>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Pricing Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {HIGH_ELO_RANKS.map((rank) => {
          const currentPrice = settings.netWinPrices?.[rank.id] || 0;

          return (
            <div 
              key={rank.id} 
              className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 ${rank.bg} ${rank.border}`}
            >
              <div className="flex flex-col gap-1 mb-4">
                <div className={`font-black text-xl ${rank.color}`}>
                    {rank.label.split(' (')[0]}
                </div>
                <div className={`text-xs font-medium opacity-80 ${rank.color}`}>
                    {rank.label.match(/\((.*?)\)/)?.[1]}
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="0"
                  value={currentPrice ? currentPrice.toLocaleString('en-US') : ''}
                  onChange={(e) => updatePrice(rank.id, e.target.value)}
                  className={`w-full bg-zinc-950/50 border rounded-xl pl-4 pr-16 py-4 text-right text-lg font-bold outline-none transition-all ${
                    currentPrice > MAX_PRICE_PER_STEP 
                      ? 'border-red-500 text-red-500' 
                      : 'border-white/10 text-white focus:border-green-500 focus:text-green-400'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end pointer-events-none">
                    <span className="text-[10px] text-zinc-500 font-medium uppercase">VNĐ</span>
                    <span className="text-[10px] text-zinc-600">/ 1 LP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
