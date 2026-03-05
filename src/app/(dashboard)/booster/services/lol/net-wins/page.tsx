'use client';

import { useServiceContext } from '../../../../../../components/ServiceContext';
import { useState, useEffect } from 'react';
import { Target, Calculator, Coins, ArrowRight, Info, RefreshCw, Trophy, TrendingUp, Layers, Users, Wallet, Scale, AlertCircle, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';

const HIGH_ELO_RANKS = [
  { id: 'Master', label: 'Cao Thủ (Master)', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  { id: 'Grandmaster', label: 'Đại Cao Thủ (Grandmaster)', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' },
  { id: 'Challenger', label: 'Thách Đấu (Challenger)', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' },
];

interface RankStat {
  cutoff: number;
  count: number;
}

const LP_GAIN_OPTIONS = [
  { key: 'low', value: 18, label: 'Ít LP (<19 LP/win)', desc: 'Khó cày, nên tăng giá (+)', color: 'text-red-500' },
  { key: 'medium', value: 20, label: 'Bình thường (19-21 LP)', desc: 'Giá tiêu chuẩn', color: 'text-yellow-500' },
  { key: 'high', value: 22, label: 'Nhiều LP (>21 LP/win)', desc: 'Dễ cày, nên giảm giá (-)', color: 'text-green-500' },
];

export default function NetWinsPage() {
  const { settings, setSettings, MAX_PRICE_PER_STEP, platformFee } = useServiceContext();

  // --- CONFIG STATE ---
  const [activeTab, setActiveTab] = useState<'SOLO' | 'FLEX' | 'DUO'>('SOLO');
  const depositPercent = settings.netWinDepositPercent || 50;
  const setDepositPercent = (val: number) => {
    setSettings(prev => ({ ...prev, netWinDepositPercent: val }));
  };

  // --- CALCULATOR STATE (PHASE 1: BOOKING) ---
  const [calcMode, setCalcMode] = useState<'BY_LP' | 'BY_GAMES'>('BY_LP');
  const [calcRank, setCalcRank] = useState('Master');
  const [calcCurrentLP, setCalcCurrentLP] = useState(0);
  const [calcTarget, setCalcTarget] = useState(100); // Target LP or Num of Games
  const [calcLPGain, setCalcLPGain] = useState(19);
  
  // --- SIMULATION STATE (PHASE 2: SETTLEMENT) ---
  const [simActualLP, setSimActualLP] = useState(0); // LP thực tế đạt được
  const [simGames, setSimGames] = useState<{id: number, lp: number}[]>([{id: 1, lp: 20}]); // Danh sách trận đấu mô phỏng

  // --- OUTPUT STATE ---
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [actualPrice, setActualPrice] = useState(0);
  const [appliedModifier, setAppliedModifier] = useState(0);
  const [calcBreakdown, setCalcBreakdown] = useState({ base: 0, elo: 0, fee: 0 });
  const [simBreakdown, setSimBreakdown] = useState({ base: 0, elo: 0, fee: 0 });
  
  // Rank Stats
  const [challengerStat, setChallengerStat] = useState<RankStat>({ cutoff: 0, count: 0 });
  const [gmStat, setGmStat] = useState<RankStat>({ cutoff: 0, count: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  // --- FETCH RANK DATA ---
  const fetchRankStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/rank-stats');
      if (res.ok) {
        const data = await res.json();
        if (data.challenger) setChallengerStat(data.challenger);
        if (data.grandmaster) setGmStat(data.grandmaster);
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
  const getPricePerLP = (rank: string) => {
    if (activeTab === 'FLEX') return settings.netWinPricesFlex?.[rank] || 0;
    if (activeTab === 'DUO') return settings.netWinPricesDuo?.[rank] || 0;
    return settings.netWinPrices?.[rank] || 0;
  };

  const updatePrice = (rankId: string, price: string) => {
    const cleanPrice = price.replace(/,/g, '');
    const numValue = parseInt(cleanPrice) || 0;

    setSettings(prev => {
      if (activeTab === 'FLEX') {
        return { ...prev, netWinPricesFlex: { ...prev.netWinPricesFlex, [rankId]: numValue } };
      }
      if (activeTab === 'DUO') {
        return { ...prev, netWinPricesDuo: { ...prev.netWinPricesDuo, [rankId]: numValue } };
      }
      return { ...prev, netWinPrices: { ...prev.netWinPrices, [rankId]: numValue } };
    });
  };

  // --- AUTO-CALC SIMULATION ---
  useEffect(() => {
    if (calcMode === 'BY_LP') {
        setSimActualLP(Math.max(0, calcTarget - calcCurrentLP));
    }
  }, [calcTarget, calcCurrentLP, calcMode]);

  // --- CORE CALCULATION EFFECT ---
  useEffect(() => {
    const basePricePerLP = getPricePerLP(calcRank);
    
    // 1. Calculate Modifier
    let lpKey = 'medium';
    if (calcLPGain < 19) lpKey = 'low';
    else if (calcLPGain > 21) lpKey = 'high';
    const mod = settings.lpModifiers[lpKey as keyof typeof settings.lpModifiers] || 0;
    setAppliedModifier(mod);

    // Helper: Calculate Elo Amount
    const getEloAmt = (base: number) => {
        return base * (mod / 100);
    };

    // 2. Phase 1: Estimated Price (Booking)
    let base1 = 0;
    if (calcMode === 'BY_LP') {
        const lpDiff = Math.max(0, calcTarget - calcCurrentLP);
        base1 = lpDiff * basePricePerLP;
    } else {
        const estimatedTotalLP = calcTarget * calcLPGain; 
        base1 = estimatedTotalLP * basePricePerLP;
    }
    
    const elo1 = getEloAmt(base1);
    const fee1 = base1 * (platformFee / 100);
    const total1 = base1 + elo1 + fee1;

    setEstimatedPrice(Math.round(total1));
    setCalcBreakdown({ base: base1, elo: elo1, fee: fee1 });
    setDepositAmount(Math.round(total1 * (depositPercent / 100)));

    // 3. Phase 2: Actual Price (Settlement Simulation)
    let base2 = 0;
    if (calcMode === 'BY_LP') {
        base2 = simActualLP * basePricePerLP;
    } else {
        const totalLPChange = simGames.reduce((sum, game) => sum + game.lp, 0);
        base2 = Math.max(0, totalLPChange) * basePricePerLP;
    }
    
    const elo2 = getEloAmt(base2);
    const fee2 = base2 * (platformFee / 100);
    const total2 = base2 + elo2 + fee2;

    setActualPrice(Math.round(total2));
    setSimBreakdown({ base: base2, elo: elo2, fee: fee2 });

  }, [calcRank, calcCurrentLP, calcTarget, calcLPGain, calcMode, simActualLP, simGames, settings, activeTab, platformFee]);


  // --- SETTLEMENT HELPERS ---
  const settlementDiff = actualPrice - depositAmount;
  const settlementStatus = 
    settlementDiff > 0 ? 'CUSTOMER_PAYS' : 
    settlementDiff < 0 ? 'REFUND_CUSTOMER' : 'DONE';

  const addSimGame = () => setSimGames([...simGames, { id: Date.now(), lp: 20 }]);
  const updateSimGame = (id: number, val: number) => setSimGames(simGames.map(g => g.id === id ? { ...g, lp: val } : g));
  const removeSimGame = (id: number) => setSimGames(simGames.filter(g => g.id !== id));

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-white">Cấu hình Cày Điểm (Net Wins)</h2>
            </div>
            <div className="flex gap-2">
                <button 
                onClick={() => setActiveTab('SOLO')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'SOLO' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                Solo / Duo
                </button>
                <button 
                onClick={() => setActiveTab('FLEX')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'FLEX' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                <Layers className="w-4 h-4" /> Flex
                </button>
            </div>
        </div>

        {/* Pricing Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {HIGH_ELO_RANKS.map((rank) => {
            const currentPrice = getPricePerLP(rank.id);
            return (
                <div key={rank.id} className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 ${rank.bg} ${rank.border}`}>
                <div className="flex flex-col gap-1 mb-4">
                    <div className={`font-black text-xl ${rank.color}`}>{rank.label.split(' (')[0]}</div>
                    <div className={`text-xs font-medium opacity-80 ${rank.color}`}>{rank.label.match(/\((.*?)\)/)?.[1]}</div>
                </div>
                <div className="relative">
                    <input
                    type="text"
                    placeholder="0"
                    value={currentPrice ? currentPrice.toLocaleString('en-US') : ''}
                    onChange={(e) => updatePrice(rank.id, e.target.value)}
                    className={`w-full bg-zinc-950/50 border rounded-xl pl-4 pr-16 py-4 text-right text-lg font-bold outline-none transition-all ${
                        currentPrice > MAX_PRICE_PER_STEP ? 'border-red-500 text-red-500' : 'border-white/10 text-white focus:border-green-500 focus:text-green-400'
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

      {/* --- DEPOSIT CONFIGURATION --- */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-emerald-500" />
            <h3 className="text-lg font-bold text-white">Cấu hình Đặt cọc (Deposit)</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1">
                <label className="text-sm text-zinc-400 mb-2 block">Tỷ lệ cọc yêu cầu (%)</label>
                <div className="flex gap-2">
                    {[30, 50, 70, 100].map(pct => (
                        <button 
                            key={pct}
                            onClick={() => setDepositPercent(pct)}
                            className={`flex-1 py-2 rounded-lg font-bold border transition-all ${depositPercent === pct ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                        >
                            {pct}%
                        </button>
                    ))}
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                    * Khách hàng sẽ thanh toán khoản này trước. Số tiền được Admin giữ (HOLD) cho đến khi đơn hoàn thành.
                </p>
            </div>
            <div className="flex-1 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-sm">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-blue-400"/> Quy trình dòng tiền:</h4>
                <ul className="space-y-2 text-zinc-400 list-disc list-inside">
                    <li>Khách đặt đơn ➜ Thanh toán <strong>Tiền cọc</strong> ➜ Admin giữ tiền.</li>
                    <li>Booster nhận đơn ➜ Trạng thái <strong>IN_PROGRESS</strong>.</li>
                    <li>Hoàn thành ➜ Tính <strong>Giá thực tế</strong> dựa trên kết quả.</li>
                    <li>Quyết toán ➜ So sánh <strong>Giá thực tế</strong> vs <strong>Tiền cọc</strong> để hoàn tiền hoặc thu thêm.</li>
                </ul>
            </div>
        </div>
      </div>

      {/* --- PREVIEW & SIMULATION SYSTEM --- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* LEFT: BOOKING SIMULATION (CUSTOMER VIEW) */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    1. Mô phỏng Đặt đơn (Khách hàng)
                </h3>
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                    <button onClick={() => setCalcMode('BY_LP')} className={`px-3 py-1 text-xs font-bold rounded ${calcMode === 'BY_LP' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>Theo LP</button>
                    <button onClick={() => setCalcMode('BY_GAMES')} className={`px-3 py-1 text-xs font-bold rounded ${calcMode === 'BY_GAMES' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>Theo Trận</button>
                </div>
            </div>
            
            <div className="p-5 space-y-5 flex-1">
                {/* Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Rank áp dụng</label>
                        <select value={calcRank} onChange={(e) => setCalcRank(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none">
                            {HIGH_ELO_RANKS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">LP trung bình/trận</label>
                        <div className="relative">
                            <select 
                                value={calcLPGain} 
                                onChange={(e) => setCalcLPGain(Number(e.target.value))} 
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value={18}>Thấp (&lt; 19 LP)</option>
                                <option value={19}>Trung bình (19-21 LP)</option>
                                <option value={22}>Cao (&gt; 21 LP)</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                        <div className={`text-right text-[10px] mt-1 font-bold ${appliedModifier > 0 ? 'text-red-400' : appliedModifier < 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                            {appliedModifier > 0 ? `Tăng giá ${Math.abs(appliedModifier)}%` : appliedModifier < 0 ? `Giảm giá ${Math.abs(appliedModifier)}%` : ''}
                        </div>
                    </div>
                </div>

                {calcMode === 'BY_LP' ? (
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <label className="text-xs text-zinc-500 mb-1 block">LP Hiện tại</label>
                            <input type="number" value={calcCurrentLP} onChange={(e) => setCalcCurrentLP(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-600 mt-5" />
                        <div className="flex-1">
                            <label className="text-xs text-zinc-500 mb-1 block">LP Mong muốn</label>
                            <input type="number" value={calcTarget} min={calcMode === 'BY_LP' ? calcCurrentLP : 1} onChange={(e) => setCalcTarget(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Số trận muốn thuê</label>
                        <input type="number" value={calcTarget} onChange={(e) => setCalcTarget(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                )}

                {/* Booking Result */}
                <div className="mt-auto pt-4 border-t border-zinc-800">
                    <div className="space-y-1 text-sm text-zinc-400 mb-2 border-b border-zinc-800 pb-2">
                        <div className="flex justify-between">
                            <span>Giá gốc:</span>
                            <span>{calcBreakdown.base.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Hệ số Elo ({appliedModifier > 0 ? '+' : ''}{appliedModifier}%):</span>
                            <span className={appliedModifier > 0 ? 'text-red-400' : appliedModifier < 0 ? 'text-green-400' : 'text-zinc-400'}>{calcBreakdown.elo > 0 ? '+' : ''}{calcBreakdown.elo.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Phí sàn ({platformFee}%):</span>
                            <span className="text-yellow-400">+{calcBreakdown.fee.toLocaleString('vi-VN')} ₫</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-zinc-400 text-sm">Giá tạm tính:</span>
                        <span className="text-white font-bold">{estimatedPrice.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-3 rounded-xl flex justify-between items-center">
                        <div>
                            <span className="text-emerald-400 font-bold text-sm block">Tiền cọc ({depositPercent}%)</span>
                            <span className="text-[10px] text-emerald-500/70">Khách thanh toán ngay</span>
                        </div>
                        <span className="text-2xl font-bold text-emerald-400">{depositAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">Trạng thái: PENDING_BOOSTER</span>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: SETTLEMENT SIMULATION (BOOSTER VIEW) */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 bg-zinc-900/50 border-b border-zinc-800">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-500" />
                    2. Mô phỏng Quyết toán (Kết thúc đơn)
                </h3>
            </div>

            <div className="p-5 space-y-5 flex-1 flex flex-col">
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                    <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Nhập kết quả thực tế:</label>
                    
                    {calcMode === 'BY_LP' ? (
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Tổng LP đạt được (Actual Gained)</label>
                            <input 
                                type="number" 
                                value={simActualLP} 
                                onChange={(e) => setSimActualLP(Number(e.target.value))} 
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="Ví dụ: 95 LP"
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">Giá thực tế = {simActualLP} LP x {getPricePerLP(calcRank).toLocaleString()}đ</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                                {simGames.map((game, idx) => (
                                    <div key={game.id} className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-500 w-12">Trận {idx + 1}:</span>
                                        <input 
                                            type="number" 
                                            value={game.lp} 
                                            onChange={(e) => updateSimGame(game.id, Number(e.target.value))}
                                            className={`flex-1 bg-zinc-950 border rounded px-2 py-1 text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${game.lp >= 0 ? 'text-green-400 border-green-900' : 'text-red-400 border-red-900'}`}
                                        />
                                        <button onClick={() => removeSimGame(game.id)} className="text-zinc-600 hover:text-red-500"><XCircle className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addSimGame} className="w-full py-1.5 text-xs border border-dashed border-zinc-700 text-zinc-400 rounded hover:text-white hover:border-zinc-500">+ Thêm trận đấu</button>
                            <p className="text-[10px] text-zinc-500 mt-1">Tổng LP thay đổi: <span className={simGames.reduce((s,g)=>s+g.lp,0) >= 0 ? 'text-green-400' : 'text-red-400'}>{simGames.reduce((s,g)=>s+g.lp,0)} LP</span></p>
                        </div>
                    )}
                </div>

                {/* Settlement Result */}
                <div className="mt-auto space-y-3">
                    <div className="space-y-1 text-sm text-zinc-400 border-b border-zinc-800 pb-2">
                        <div className="flex justify-between">
                            <span>Giá gốc thực tế:</span>
                            <span>{simBreakdown.base.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Hệ số Elo ({appliedModifier > 0 ? '+' : ''}{appliedModifier}%):</span>
                            <span className={appliedModifier > 0 ? 'text-red-400' : appliedModifier < 0 ? 'text-green-400' : 'text-zinc-400'}>{simBreakdown.elo > 0 ? '+' : ''}{simBreakdown.elo.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Phí sàn ({platformFee}%):</span>
                            <span className="text-yellow-400">+{simBreakdown.fee.toLocaleString('vi-VN')} ₫</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400">Giá thực tế (Actual):</span>
                        <span className="text-white font-bold">{actualPrice.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400">Đã cọc (Deposit):</span>
                        <span className="text-emerald-400 font-bold">- {depositAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    
                    <div className="border-t border-zinc-800 pt-3">
                        {settlementStatus === 'DONE' && (
                            <div className="bg-zinc-800 p-3 rounded-xl text-center">
                                <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
                                <span className="text-green-400 font-bold block">Đã thanh toán đủ</span>
                                <span className="text-xs text-zinc-500">Booster nhận đủ tiền cọc. Không phát sinh thêm.</span>
                            </div>
                        )}

                        {settlementStatus === 'REFUND_CUSTOMER' && (
                            <div className="bg-red-900/10 border border-red-500/20 p-3 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-red-400 font-bold text-sm">Hoàn lại khách:</span>
                                    <span className="text-xl font-bold text-red-400">{Math.abs(settlementDiff).toLocaleString('vi-VN')} đ</span>
                                </div>
                                <p className="text-[10px] text-red-300/70">
                                    Giá thực tế &lt; Cọc. Hệ thống tự động trích từ tiền cọc trả về ví khách.
                                </p>
                            </div>
                        )}

                        {settlementStatus === 'CUSTOMER_PAYS' && (
                            <div className="bg-yellow-900/10 border border-yellow-500/20 p-3 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-yellow-400 font-bold text-sm">Khách trả thêm:</span>
                                    <span className="text-xl font-bold text-yellow-400">{Math.abs(settlementDiff).toLocaleString('vi-VN')} đ</span>
                                </div>
                                <p className="text-[10px] text-yellow-300/70">
                                    Giá thực tế &gt; Cọc. Khách cần thanh toán phần còn thiếu để hoàn tất đơn.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-xl">
                            <span className="text-blue-200 text-xs font-bold block mb-1">Bạn thực nhận:</span>
                            <span className="text-lg font-bold text-blue-400">{Math.round(actualPrice - simBreakdown.fee).toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="bg-yellow-600/10 border border-yellow-500/20 p-3 rounded-xl">
                            <span className="text-yellow-200 text-xs font-bold block mb-1">Admin nhận:</span>
                            <span className="text-lg font-bold text-yellow-400">{Math.round(simBreakdown.fee).toLocaleString('vi-VN')} ₫</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
