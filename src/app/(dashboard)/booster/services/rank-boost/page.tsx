'use client';

import { useServiceContext } from '../ServiceContext';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Info, Calculator, ArrowRight, Coins, FileText, TrendingUp, Trash2, AlertTriangle, Users, Layers } from 'lucide-react';

export default function RankBoostPage() {
  const { settings, setSettings, ranks, MAX_PRICE_PER_STEP, platformFee } = useServiceContext();
  
  // Filter ranks to only show up to Master (exclude Master, Grandmaster and Challenger)
  const visibleRanks = useMemo(() => {
    // FIX: Chuyển về chữ hoa để so sánh chính xác với DB (MASTER, GRANDMASTER, CHALLENGER)
    // Thêm check r.name để tránh crash nếu dữ liệu lỗi
    return ranks.filter(r => r.name && !['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(r.name.toUpperCase()));
  }, [ranks]);

  // Local State for Calculator & Tools
  const [calcFrom, setCalcFrom] = useState('');
  const [calcTo, setCalcTo] = useState('');
  const [calcPrice, setCalcPrice] = useState(0);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [toolGross, setToolGross] = useState('');
  const [toolNet, setToolNet] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState<'SOLO' | 'FLEX' | 'DUO'>('SOLO');

  // Helper: Lấy giá an toàn (Case-insensitive) để fix lỗi hiển thị 0đ
  const getPrice = (key: string) => {
    let prices = settings.rankPrices || {};
    if (activeTab === 'FLEX') prices = settings.rankPricesFlex || {};
    if (activeTab === 'DUO') prices = settings.rankPricesDuo || {};

    if (prices[key] !== undefined) return prices[key];
    if (prices[key.toUpperCase()] !== undefined) return prices[key.toUpperCase()];
    return 0;
  };

  // --- LOGIC ---
  const flatTiers = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (Array.isArray(visibleRanks)) {
      visibleRanks.forEach(rank => {
        if (Array.isArray(rank.tiers)) {
          rank.tiers.forEach(tier => {
            list.push({
              key: tier ? `${rank.name}_${tier}` : rank.name,
              label: tier ? `${rank.name} ${tier}` : rank.name,
            });
          });
        }
      });
    }
    // Thêm Master vào cuối danh sách để làm đích đến (Target) cho Calculator
    // Vì cấu hình chỉ đến Diamond I -> Master, nên Master là điểm cuối cùng
    list.push({ key: 'MASTER', label: 'MASTER' });
    
    return list;
  }, [visibleRanks]);

  useEffect(() => {
    setCalcError(null);

    // Validation: Nếu chọn Từ Rank là Master (hoặc MASTER) -> Báo lỗi ngay
    if (calcFrom.toUpperCase() === 'MASTER') {
        setCalcPrice(0);
        setCalcError('Đây là rank tối đa. Vui lòng chọn lại!');
        return;
    }

    if (!calcFrom || !calcTo || !flatTiers.length) {
      setCalcPrice(0);
      return;
    }

    const fromIndex = flatTiers.findIndex(t => t.key === calcFrom);
    const toIndex = flatTiers.findIndex(t => t.key === calcTo);

    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
      setCalcPrice(0);
      return;
    }

    let total = 0;
    let missingCount = 0;

    for (let i = fromIndex; i < toIndex; i++) {
      const stepKey = flatTiers[i].key;
      const price = getPrice(stepKey);
      if (!price || price <= 0) missingCount++;
      total += (price || 0);
    }

    if (missingCount > 0) {
      setCalcPrice(0);
      setCalcError(`Chưa nhập giá ${missingCount} bậc`);
    } else {
      setCalcPrice(total);
    }
  }, [calcFrom, calcTo, settings.rankPrices, settings.rankPricesFlex, settings.rankPricesDuo, flatTiers, activeTab]);

  const updateRankPrice = (rankName: string, tier: string, price: string) => {
    // FIX: Lưu key dạng UPPERCASE (IRON_IV) để đồng bộ với JSON data
    const key = (tier ? `${rankName}_${tier}` : rankName).toUpperCase();
    const cleanPrice = price.replace(/,/g, '');
    const numValue = parseInt(cleanPrice) || 0;

    setSettings(prev => {
      if (activeTab === 'FLEX') {
        return { ...prev, rankPricesFlex: { ...prev.rankPricesFlex, [key]: numValue } };
      }
      if (activeTab === 'DUO') {
        return { ...prev, rankPricesDuo: { ...prev.rankPricesDuo, [key]: numValue } };
      }
      return { ...prev, rankPrices: { ...prev.rankPrices, [key]: numValue } };
    });
  };

  const handleIncreasePrices = () => {
    let currentPrices = settings.rankPrices;
    if (activeTab === 'FLEX') currentPrices = settings.rankPricesFlex || {};
    if (activeTab === 'DUO') currentPrices = settings.rankPricesDuo || {};

    const newPrices = { ...currentPrices };
    let count = 0;
    for (const key in newPrices) {
      const currentPrice = newPrices[key];
      if (currentPrice > 0) {
        const increased = currentPrice * 1.1;
        newPrices[key] = Math.ceil(increased / 1000) * 1000;
        count++;
      }
    }
    
    setSettings(prev => {
      if (activeTab === 'FLEX') return { ...prev, rankPricesFlex: newPrices };
      if (activeTab === 'DUO') return { ...prev, rankPricesDuo: newPrices };
      return { ...prev, rankPrices: newPrices };
    });
    toast.success(`Đã tăng giá 10% cho ${count} mục`);
  };

  const confirmClearPrices = () => {
    setSettings(prev => {
      if (activeTab === 'FLEX') return { ...prev, rankPricesFlex: {} };
      if (activeTab === 'DUO') return { ...prev, rankPricesDuo: {} };
      return { ...prev, rankPrices: {} };
    });
    toast.success('Đã xóa toàn bộ giá');
    setShowClearConfirm(false);
  };

  const normalizeTier = (input: string): string => {
    const map: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' };
    return map[input] || input.toUpperCase();
  };

  const handleBulkImport = () => {
    if (!bulkImportText.trim()) return;
    const lines = bulkImportText.trim().split('\n');
    
    let currentPrices = settings.rankPrices;
    if (activeTab === 'FLEX') currentPrices = settings.rankPricesFlex || {};
    if (activeTab === 'DUO') currentPrices = settings.rankPricesDuo || {};
    const newPrices = { ...currentPrices };
    let count = 0;

    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        const from = parts[0];
        const priceStr = parts[2];
        const rankMatch = from.match(/^([a-zA-Z\s]+?)\s*(\d+|I|II|III|IV)$/i);
        
        let rankName = '', tier = '';
        if (rankMatch) {
          const rawName = rankMatch[1].trim().toUpperCase();
          const rawTier = rankMatch[2];
          const validRank = visibleRanks.find(r => r.name.toUpperCase() === rawName);
          if (validRank) {
            rankName = validRank.name;
            tier = normalizeTier(rawTier);
          }
        }
        
        const key = (tier ? `${rankName}_${tier}` : rankName).toUpperCase();
        const price = parseInt(priceStr.replace(/[^0-9]/g, ''));

        if (rankName && !isNaN(price)) {
            newPrices[key] = price;
            count++;
        }
      }
    });

    setSettings(prev => {
      if (activeTab === 'FLEX') return { ...prev, rankPricesFlex: newPrices };
      if (activeTab === 'DUO') return { ...prev, rankPricesDuo: newPrices };
      return { ...prev, rankPrices: newPrices };
    });
    toast.success(`Đã cập nhật ${count} mục giá`);
    setShowBulkImport(false);
    setBulkImportText('');
  };

  return (
    <div className="space-y-8">
      {/* LP Gain Settings */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Info className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-white">Điểm cộng mỗi ván (LP Gain)</h2>
        </div>

        <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/50 mb-8">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm"><span className="text-blue-400 font-bold">LP (League Points):</span></p>
              <p className="text-xs leading-relaxed text-zinc-400">Là điểm số xếp hạng nhận được sau mỗi trận thắng. Đạt 100 LP sẽ được vào chuỗi thăng hạng.</p>
            </div>
            <div>
              <p className="mb-2 text-sm"><span className="text-purple-400 font-bold">MMR (Matchmaking Rating):</span></p>
              <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                <li><strong>MMR Cao:</strong> Cộng nhiều LP (+25~30) → <span className="text-green-500 font-bold">Nên giảm giá</span>.</li>
                <li><strong>MMR Thấp:</strong> Cộng ít LP (+10~15) → <span className="text-red-500 font-bold">Nên tăng giá</span>.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator & Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview Calculator */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-blue-500" />
                Xem trước giá (Preview Calculator)
            </h3>
            <p className="text-sm md:text-base mt-4 text-left font-medium mb-6">
              <span className="text-red-400 font-semibold">
                ⚠ Lưu ý quan trọng:
              </span>{" "}
              <span className="text-zinc-300">
                Bạn cần điều chỉnh giá phù hợp và
              </span>{" "}
              <span className="text-yellow-400 font-bold text-nowrap">
                Tips cho ADMIN {platformFee}%
              </span>{" "}
              <span className="text-zinc-300">
                (Phí sàn để duy trì hệ thống).
              </span>

              <br />

              <span className="text-xs text-zinc-500 italic">
                Vui lòng tính toán trước khi nhập giá để tránh bị lỗ.
              </span>

              <br />
              <br />

              <span className="text-zinc-300">
                Ví dụ:
              </span>{" "}
              <span className="text-cyan-400 font-semibold">
                IRON IV → IRON III
              </span>{" "}
              ={" "}
              <span className="text-white font-semibold">
                50.000 VNĐ
              </span>
              <br />
              <span className="text-zinc-400">
                Thực nhận sẽ là{" "}
              </span>
              <span className="text-green-400 font-bold">
                47.500 VNĐ
              </span>{" "}
              <span className="text-red-400 font-semibold text-nowrap">
                (-{platformFee}%)
              </span>
            </p>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                    <label className="text-xs text-zinc-500 mb-1 block">Từ Rank</label>
                    <select 
                        value={calcFrom}
                        onChange={(e) => {
                            setCalcFrom(e.target.value);
                            setCalcTo(''); // Reset đích đến khi thay đổi điểm xuất phát
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                    >
                        <option value="">Chọn Rank bắt đầu</option>
                        {flatTiers.map((t) => {
                            // Ẩn Master khỏi danh sách "Từ Rank" vì không ai cày từ Master ở mục này
                            if (t.key.toUpperCase() === 'MASTER') return null;
                            return (
                                <option key={t.key} value={t.key}>{t.label}</option>
                            );
                        })}
                    </select>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-600 hidden md:block mt-5" />
                <div className="flex-1 w-full">
                    <label className="text-xs text-zinc-500 mb-1 block">Đến Rank</label>
                    <select 
                        value={calcTo}
                        onChange={(e) => setCalcTo(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                    >
                        <option value="">Chọn Rank mục tiêu</option>
                        {flatTiers.map((t, idx) => {
                            // Logic: Chỉ hiển thị các rank đứng SAU rank bắt đầu
                            const startIdx = flatTiers.findIndex(item => item.key === calcFrom);
                            if (startIdx !== -1 && idx <= startIdx) return null;
                            
                            return <option key={t.key} value={t.key}>{t.label}</option>
                        })}
                    </select>
                </div>
            </div>

            <div className="flex gap-2 mt-4">
                <div className="flex-1 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
                    <span className="text-xs text-blue-200 block">Tổng tiền</span>
                    {calcError ? (
                      <span className="text-sm font-bold text-red-400 animate-pulse text-center">
                        {calcError}
                      </span>
                    ) : (
                      <span className="text-xl font-bold text-blue-400">
                          {calcPrice.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                </div>
                {/* Net Earnings Preview */}
                <div className="flex-1 bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center">
                    <span className="text-xs text-green-200 block flex items-center justify-center gap-1 text-nowrap">
                      <Coins className="w-3 h-3" /> Thực nhận (-{platformFee}%)
                    </span>
                    <span className="text-xl font-bold text-green-400">
                        {(Math.floor(calcPrice * (1 - platformFee / 100))).toLocaleString('vi-VN')} đ
                    </span>
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

      {/* Rank Pricing Table */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            {/* TABS */}
            <div className="flex gap-2 mb-4">
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

            <h2 className="text-xl font-bold text-white">Bảng giá leo Rank</h2>
            <div className="mt-3 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-sm">
              <p className="text-blue-100 mb-2"><span className="text-yellow-400 font-bold mr-2">⚠️ LƯU Ý:</span>Chỉ nhập giá cho <span className="font-bold text-white border-b border-white">1 BẬC DUY NHẤT</span> (Ví dụ: Vàng 1 lên Bạch Kim 4).</p>
              <p className="text-zinc-400 text-xs mb-3 italic">
                 * Hệ thống sẽ <span className="text-green-400 font-bold">TỰ ĐỘNG CỘNG DỒN</span> giá tiền nếu khách đặt đơn leo nhiều bậc (Ví dụ: Từ Sắt 4 lên Thách Đấu = Tổng giá của tất cả các bậc ở giữa cộng lại). Bạn không cần nhập giá cho khoảng dài.
              </p>
              <div className="flex gap-2 mt-2">
                <button onClick={handleIncreasePrices} className="flex items-center gap-1 bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-600/30"><TrendingUp className="w-3 h-3" /> +10%</button>
                <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-1 bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-600/30"><Trash2 className="w-3 h-3" /> Xóa hết</button>
              </div>
            </div>
          </div>
          <button onClick={() => setShowBulkImport(!showBulkImport)} className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"><FileText className="w-4 h-4" /> Nhập nhanh</button>
        </div>

        {showBulkImport && (
          <div className="mb-6 bg-zinc-950 p-4 rounded-xl border border-zinc-800 animate-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
                Dán bảng giá nhanh (Bulk Import)
            </label>
            <p className="text-xs text-zinc-500 mb-3">
                Nhập theo định dạng: <code className="bg-zinc-900 px-1 py-0.5 rounded text-blue-400">Rank Hiện Tại | Rank Mục Tiêu | Giá Tiền</code><br/>
                Mỗi dòng một mục. Ví dụ:<br/>
                <span className="text-zinc-400 block mt-1 pl-2 border-l-2 border-zinc-800">
                    Diamond 2 | Diamond 1 | 159000<br/>
                    Platinum 1 | Emerald 4 | 120000
                </span>
            </p>
            <textarea value={bulkImportText} onChange={(e) => setBulkImportText(e.target.value)} className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-white font-mono outline-none" placeholder="Dán danh sách giá vào đây..." />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={handleBulkImport} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">Áp dụng</button>
            </div>
          </div>
        )}
        
        {/* Rank Selector (Horizontal Scroll) */}
        {visibleRanks.length > 0 ? (
          <div className="mb-6">
            <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar snap-x">
              {visibleRanks.map((rank, index) => (
                <button
                  key={rank._id}
                  onClick={() => setPage(index)}
                  className={`flex-shrink-0 snap-center flex flex-col items-center justify-center gap-2 p-3 rounded-xl border w-24 transition-all ${
                    page === index
                      ? 'bg-blue-600/10 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                  }`}
                >
                  <img src={rank.imageUrl} alt={rank.name} className={`w-10 h-10 object-contain transition-all ${page === index ? 'scale-110 drop-shadow-lg' : 'grayscale opacity-50'}`} />
                  <span className="text-xs font-bold">{rank.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-zinc-500 py-10 border border-dashed border-zinc-800 rounded-xl mb-6">
             Không tìm thấy dữ liệu Rank. Vui lòng kiểm tra lại cấu hình hệ thống hoặc tải lại trang.
          </div>
        )}

        <div className="space-y-4 min-h-[200px]">
          {Array.isArray(visibleRanks) && visibleRanks.length > 0 && (() => {
            const rank = visibleRanks[page] || visibleRanks[0];
            if (!rank) return <div className="text-center text-zinc-500 py-10">Vui lòng chọn Rank</div>;
            const rankIndex = page;

            return (
            <div key={rank._id} className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
              {Array.isArray(rank.tiers) && rank.tiers.map((tier, tierIndex) => {
                const currentTierName = tier ? `${rank.name} ${tier}` : rank.name;
                const isLastTier = tierIndex === rank.tiers.length - 1;
                let nextTierName = 'Next Rank';
                if (!isLastTier) {
                  const nextTier = rank.tiers[tierIndex + 1];
                  nextTierName = nextTier ? `${rank.name} ${nextTier}` : rank.name;
                } else {
                  // Logic hiển thị đích đến: Nếu là Diamond I thì đích đến là Master
                  // Các rank khác thì lấy rank kế tiếp trong danh sách
                  const currentRankIdx = ranks.findIndex(r => r.name === rank.name);
                  const nextRank = ranks[currentRankIdx + 1];
                  nextTierName = nextRank ? (nextRank.tiers?.[0] ? `${nextRank.name} ${nextRank.tiers[0]}` : nextRank.name) : `Master`;
                }
                
                const key = tier ? `${rank.name}_${tier}` : rank.name;
                const currentPrice = getPrice(key);

                let prevPrice = 0;
                if (tierIndex > 0) {
                   const prevTier = rank.tiers[tierIndex - 1];
                   prevPrice = getPrice(`${rank.name}_${prevTier}`);
                } else if (rankIndex > 0) {
                   const prevRank = visibleRanks[rankIndex - 1];
                   if (prevRank && prevRank.tiers && prevRank.tiers.length > 0) {
                      const prevTier = prevRank.tiers[prevRank.tiers.length - 1];
                      prevPrice = getPrice(`${prevRank.name}_${prevTier}`);
                   }
                }
                
                const isTooHigh = currentPrice > MAX_PRICE_PER_STEP;
                const isInvalid = (currentPrice > 0 && prevPrice > 0 && currentPrice < prevPrice) || isTooHigh;

                return (
                  <div key={key} className="flex flex-col md:flex-row items-center gap-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group">
                    <div className="flex items-center justify-between w-full md:w-1/3">
                      <div className="flex items-center gap-3">
                        <img src={rank.imageUrl} alt={rank.name} className="w-8 h-8 object-contain" />
                        <span className="font-bold text-zinc-200 text-sm">{currentTierName}</span>
                      </div>
                      <div className="flex md:hidden items-center text-zinc-500 text-xs gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800"><ArrowRight className="w-3 h-3" /><span>{nextTierName}</span></div>
                    </div>
                    <div className="hidden md:flex justify-center w-10"><ArrowRight className="w-6 h-6 text-zinc-600" /></div>
                    <div className="hidden md:flex items-center gap-3 w-full md:w-1/3 md:pl-8"><span className="font-bold text-white">{nextTierName}</span></div>
                    <div className="w-full md:w-1/3 relative mt-1 md:mt-0">
                      <input type="text" placeholder="Nhập giá..." value={currentPrice ? currentPrice.toLocaleString('en-US') : ''} onChange={(e) => updateRankPrice(rank.name, tier, e.target.value)} className={`w-full bg-zinc-900 border rounded-lg pl-4 pr-10 py-2 text-right font-bold outline-none transition-colors ${isInvalid ? 'border-red-500 text-red-500' : 'border-zinc-700 text-green-400 focus:border-green-500'}`} />
                      <span className="absolute right-3 top-2.5 text-zinc-500 text-xs">VNĐ</span>
                      {isInvalid && <p className="absolute right-0 -bottom-5 text-[10px] text-red-500">{isTooHigh ? 'Giá quá cao' : `Thấp hơn bậc trước (${prevPrice.toLocaleString()})`}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })()}
        </div>
      </section>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa?</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 bg-zinc-800 text-white py-2 rounded-xl">Hủy</button>
              <button onClick={confirmClearPrices} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold">Xóa tất cả</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
