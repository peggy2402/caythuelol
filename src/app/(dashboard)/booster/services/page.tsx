'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Info, Globe, Zap, Video, Users, Clock, Crosshair, ArrowRight, CheckCircle2, Loader2, FileText, Copy, Upload, Download } from 'lucide-react';

interface DBRank {
  _id: string;
  gameCode: string;
  tier: string;
  division: string | null;
  order: number;
}

interface Rank {
  _id: string;
  name: string;
  tiers: string[]; // ["IV", "III", "II", "I"]
  imageUrl: string;
}

interface ServiceSettings {
  servers: string[];
  rankPrices: Record<string, number>; // Key format: "RANK_TIER" (e.g., "IRON_IV")
  lpGain: {
    low: number; // % adjustment
    medium: number;
    high: number;
  };
  options: {
    schedule: boolean;
    roles: string[]; // Changed from boolean to string[]
    specificChamps: number; // %
    streaming: number; // Fixed amount
    express: number; // %
    duo: number; // %
  }
}

const AVAILABLE_SERVERS = [
  { code: 'VN', name: 'Việt Nam' },
  { code: 'KR', name: 'Korea' },
  { code: 'JP', name: 'Japan' },
  { code: 'EU', name: 'Europe' },
  { code: 'NA', name: 'North America' },
];

const AVAILABLE_LANES = [
  { id: 'TOP', label: 'Đường Trên (Top)' },
  { id: 'JUNGLE', label: 'Đi Rừng (Jungle)' },
  { id: 'MID', label: 'Đường Giữa (Mid)' },
  { id: 'ADC', label: 'Xạ Thủ (Adc)' },
  { id: 'SUPPORT', label: 'Hỗ Trợ (Support)' },
];

export default function BoosterServicesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showConfigTools, setShowConfigTools] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [bulkImportText, setBulkImportText] = useState('');
  
  // Default Settings
  const [settings, setSettings] = useState<ServiceSettings>({
    servers: ['VN'],
    rankPrices: {},
    lpGain: { low: 30, medium: 0, high: -20 },
    options: {
      schedule: true,
      roles: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'], // Default all roles
      specificChamps: 30,
      streaming: 349000,
      express: 35,
      duo: 50
    }
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/boosters/services');
      const data = await res.json();
      
      if (data.ranks && Array.isArray(data.ranks)) {
        // Gom nhóm dữ liệu phẳng từ DB thành cấu trúc hiển thị
        const dbRanks: DBRank[] = data.ranks;
        const groups: Record<string, { name: string, items: DBRank[], minOrder: number }> = {};

        dbRanks.forEach(r => {
          if (!groups[r.tier]) {
            groups[r.tier] = { name: r.tier, items: [], minOrder: r.order };
          }
          if (r.order < groups[r.tier].minOrder) groups[r.tier].minOrder = r.order;
          groups[r.tier].items.push(r);
        });

        const processedRanks: Rank[] = Object.values(groups)
          .sort((a, b) => a.minOrder - b.minOrder)
          .map(g => {
            g.items.sort((a, b) => a.order - b.order);
            return {
              _id: g.name,
              name: g.name,
              tiers: g.items.map(i => i.division || ''),
              imageUrl: `/images/ranks/${g.name.toLowerCase()}.png`
            };
          });
        setRanks(processedRanks);
      }

      if (data.settings && Object.keys(data.settings).length > 0) {
        // Merge with default to ensure new fields exist
        setSettings(prev => ({
          ...prev,
          ...data.settings,
          options: { 
            ...prev.options, 
            ...data.settings.options,
            // Migration: If old data was boolean, convert to array
            roles: Array.isArray(data.settings.options?.roles) ? data.settings.options.roles : prev.options.roles
          },
          lpGain: { ...prev.lpGain, ...data.settings.lpGain }
        }));
      }
    } catch (error) {
      toast.error('Lỗi tải cấu hình dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper: Kiểm tra logic giá (Giá sau >= Giá trước)
  const validatePrices = () => {
    for (let r = 0; r < ranks.length; r++) {
      const rank = ranks[r];
      if (!Array.isArray(rank.tiers)) continue;

      for (let t = 0; t < rank.tiers.length; t++) {
        const tier = rank.tiers[t];
        const key = `${rank.name}_${tier}`;
        const currentPrice = settings.rankPrices[key] || 0;

        // Tìm giá của bậc ngay trước đó
        let prevPrice = 0;
        let prevName = '';

        if (t > 0) {
          // Cùng Rank, bậc trước (VD: Bronze III so với Bronze IV)
          const prevTier = rank.tiers[t - 1];
          prevPrice = settings.rankPrices[`${rank.name}_${prevTier}`] || 0;
          prevName = `${rank.name} ${prevTier}`;
        } else if (r > 0) {
          // Khác Rank, lấy bậc cuối của Rank trước (VD: Silver IV so với Bronze I)
          const prevRank = ranks[r - 1];
          if (prevRank.tiers && prevRank.tiers.length > 0) {
            const prevTier = prevRank.tiers[prevRank.tiers.length - 1];
            prevPrice = settings.rankPrices[`${prevRank.name}_${prevTier}`] || 0;
            prevName = `${prevRank.name} ${prevTier}`;
          }
        }

        if (currentPrice < prevPrice && prevPrice > 0 && currentPrice > 0) {
          toast.error(`Lỗi logic: Giá ${rank.name} ${tier} (${currentPrice.toLocaleString()}) thấp hơn bậc trước ${prevName} (${prevPrice.toLocaleString()})`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    // Validate trước khi lưu
    if (!validatePrices()) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/boosters/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        toast.success('Đã lưu cấu hình dịch vụ');
      } else {
        toast.error('Lỗi khi lưu cấu hình');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  const toggleServer = (code: string) => {
    setSettings(prev => {
      const current = prev.servers || [];
      if (current.includes(code)) {
        return { ...prev, servers: current.filter(s => s !== code) };
      } else {
        return { ...prev, servers: [...current, code] };
      }
    });
  };

  const toggleRole = (roleId: string) => {
    setSettings(prev => {
      const currentRoles = prev.options.roles || [];
      if (currentRoles.includes(roleId)) {
        return { ...prev, options: { ...prev.options, roles: currentRoles.filter(r => r !== roleId) } };
      } else {
        return { ...prev, options: { ...prev.options, roles: [...currentRoles, roleId] } };
      }
    });
  };

  const updateRankPrice = (rankName: string, tier: string, price: string) => {
    const key = tier ? `${rankName}_${tier}` : rankName;
    const cleanPrice = price.replace(/,/g, '');
    const numValue = parseInt(cleanPrice) || 0;

    setSettings(prev => ({
      ...prev,
      rankPrices: {
        ...prev.rankPrices,
        [key]: numValue
      }
    }));
  };

  // Helper to normalize tier input (1 -> I, 2 -> II)
  const normalizeTier = (input: string): string => {
    const map: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' };
    return map[input] || input.toUpperCase();
  };

  const handleBulkImport = () => {
    if (!bulkImportText.trim()) return;

    const lines = bulkImportText.trim().split('\n');
    const newPrices = { ...settings.rankPrices };
    let count = 0;

    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        const from = parts[0]; // "EMERALD I"
        // const to = parts[1]; // "DIAMOND IV" (Not used for key, but good for validation if needed)
        const priceStr = parts[2]; // "159.000"

        // Logic xử lý chuỗi nhập vào (Case 1)
        // Regex: Bắt tên Rank (chữ) và Tier (số hoặc La Mã)
        // Ví dụ: "diamond 2" -> match[1]="diamond ", match[2]="2"
        // Ví dụ: "diamond2" -> match[1]="diamond", match[2]="2"
        const rankMatch = from.match(/^([a-zA-Z\s]+?)\s*(\d+|I|II|III|IV)$/i);
        
        let rankName = '';
        let tier = '';

        if (rankMatch) {
          const rawName = rankMatch[1].trim().toUpperCase(); // "DIAMOND"
          const rawTier = rankMatch[2]; // "2" or "II"
          
          // Validate xem Rank Name có tồn tại trong hệ thống không
          const validRank = ranks.find(r => r.name.toUpperCase() === rawName);
          if (validRank) {
            rankName = validRank.name;
            tier = normalizeTier(rawTier);
          }
        }
        
        const key = tier ? `${rankName}_${tier}` : rankName;
        const cleanPrice = priceStr.replace(/[^0-9]/g, '');
        const price = parseInt(cleanPrice);

        if (rankName && !isNaN(price)) {
            newPrices[key] = price;
            count++;
        }
      }
    });

    setSettings(prev => ({ ...prev, rankPrices: newPrices }));
    toast.success(`Đã cập nhật ${count} mục giá`);
    setShowBulkImport(false);
    setBulkImportText('');
  };

  const handleExportConfig = () => {
    const configString = JSON.stringify(settings, null, 2);
    navigator.clipboard.writeText(configString);
    toast.success('Đã sao chép mã cấu hình vào bộ nhớ tạm!');
  };

  const handleImportConfig = () => {
    try {
      if (!importJson.trim()) return;
      const parsed = JSON.parse(importJson);
      
      // Validate sơ bộ
      if (!parsed.rankPrices || !parsed.options) {
        throw new Error('Mã cấu hình không hợp lệ');
      }

      setSettings(prev => ({
        ...prev,
        ...parsed,
        // Merge options cẩn thận để tránh mất field
        options: { ...prev.options, ...parsed.options },
        lpGain: { ...prev.lpGain, ...parsed.lpGain }
      }));
      
      toast.success('Đã nhập cấu hình thành công!');
      setShowConfigTools(false);
      setImportJson('');
    } catch (e) {
      toast.error('Mã cấu hình lỗi hoặc không đúng định dạng JSON');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">Đang tải cấu hình...</div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cấu hình Dịch vụ</h1>
          <p className="text-zinc-400">Thiết lập giá, server và các tùy chọn cày thuê của bạn.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfigTools(!showConfigTools)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl font-medium transition-all"
          >
            <Download className="w-5 h-5" />
            <span className="hidden md:inline">Xuất / Nhập</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Import/Export Tools Panel */}
      {showConfigTools && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-in slide-in-from-top-2">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-500" />
            Công cụ chia sẻ cấu hình
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <h4 className="font-bold text-white mb-2">1. Xuất cấu hình hiện tại</h4>
              <p className="text-xs text-zinc-500 mb-3">Sao chép mã cấu hình này và gửi cho bạn bè.</p>
              <button 
                onClick={handleExportConfig}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg transition-colors border border-zinc-700"
              >
                <Copy className="w-4 h-4" /> Sao chép mã cấu hình
              </button>
            </div>

            {/* Import */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <h4 className="font-bold text-white mb-2">2. Nhập cấu hình</h4>
              <p className="text-xs text-zinc-500 mb-3">Dán mã cấu hình nhận được vào đây.</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='Dán mã JSON vào đây...'
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                />
                <button 
                  onClick={handleImportConfig}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap"
                >
                  <Upload className="w-4 h-4 inline mr-1" /> Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Server Selection */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          Khu vực hoạt động (Server)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {AVAILABLE_SERVERS.map((server) => {
            const isSelected = settings.servers.includes(server.code);
            return (
              <button
                key={server.code}
                onClick={() => toggleServer(server.code)}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-500/10 text-white' 
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold">{server.code}</div>
                <div className="text-sm opacity-80">{server.name}</div>
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Extended Options */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Tùy chọn mở rộng
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Toggles */}
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-bold text-white">Đặt lịch cày</div>
                  <div className="text-xs text-zinc-500">Cho phép khách chọn khung giờ chơi</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.options.schedule}
                onChange={(e) => setSettings({...settings, options: {...settings.options, schedule: e.target.checked}})}
                className="w-6 h-6 accent-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <Crosshair className="w-5 h-5 text-red-500" />
                <div>
                  <div className="font-bold text-white">Tùy chọn vị trí / đường</div>
                  <div className="text-xs text-zinc-500">Chọn các vị trí bạn có thể chơi</div>
                </div>
              </div>
            </div>
            
            {/* Role Selector Grid */}
            <div className="grid grid-cols-2 gap-3 pl-2">
              {AVAILABLE_LANES.map((lane) => (
                <label key={lane.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    settings.options.roles.includes(lane.id) 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-600'
                  }`}>
                    {settings.options.roles.includes(lane.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={settings.options.roles.includes(lane.id)}
                    onChange={() => toggleRole(lane.id)}
                  />
                  <span className={`text-sm ${settings.options.roles.includes(lane.id) ? 'text-white' : 'text-zinc-400'}`}>
                    {lane.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Tướng chỉ định (+%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings.options.specificChamps}
                    onChange={(e) => setSettings({...settings, options: {...settings.options, specificChamps: Number(e.target.value)}})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-zinc-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Cày siêu tốc (+%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings.options.express}
                    onChange={(e) => setSettings({...settings, options: {...settings.options, express: Number(e.target.value)}})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-zinc-500">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Chơi cùng Booster (+%)</label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input 
                    type="number" 
                    value={settings.options.duo}
                    onChange={(e) => setSettings({...settings, options: {...settings.options, duo: Number(e.target.value)}})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-white focus:border-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-zinc-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Xem trực tiếp (Cố định)</label>
                <div className="relative">
                  <Video className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input 
                    type="number" 
                    value={settings.options.streaming}
                    onChange={(e) => setSettings({...settings, options: {...settings.options, streaming: Number(e.target.value)}})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-12 py-2 text-white focus:border-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-zinc-500 text-xs">VNĐ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LP Gain Settings */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-5 h-5 text-blue-500 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-white">Điểm cộng mỗi ván (LP Gain)</h2>
            <p className="text-sm text-zinc-400 mt-1">
              *Ghi chú: điền số phần trăm để tăng/giảm giá. Ví dụ: Khách nhận ít LP (High MMR) -&gt; Tăng giá (+30%).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: 'low', label: 'Nhiều LP (>25 LP/win)', desc: 'Dễ cày, nên giảm giá', color: 'text-green-500' },
            { key: 'medium', label: 'Bình thường (18-24 LP)', desc: 'Giá tiêu chuẩn', color: 'text-yellow-500' },
            { key: 'high', label: 'Ít LP (<17 LP/win)', desc: 'Khó cày, nên tăng giá', color: 'text-red-500' },
          ].map((item) => (
            <div key={item.key} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className={`font-bold ${item.color} mb-1`}>{item.label}</div>
              <div className="text-xs text-zinc-500 mb-3">{item.desc}</div>
              <div className="relative">
                <input
                  type="number"
                  value={settings.lpGain[item.key as keyof typeof settings.lpGain]}
                  onChange={(e) => setSettings({
                    ...settings, 
                    lpGain: { ...settings.lpGain, [item.key]: Number(e.target.value) }
                  })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-center font-bold focus:border-blue-500 outline-none"
                />
                <span className="absolute right-3 top-2 text-zinc-500">%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Rank Pricing (Visual Arrow) */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Bảng giá leo Rank (Theo bậc)</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Nhập giá tiền để cày <strong>TỪ</strong> bậc hiện tại <strong>LÊN</strong> bậc kế tiếp. <br/>
              Hệ thống sẽ <strong>tự động cộng dồn</strong> giá của các bậc trung gian đối với các đơn hàng leo nhiều bậc (Ví dụ: Iron IV -&gt; Challenger).
            </p>
          </div>
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Nhập nhanh
          </button>
        </div>

        {showBulkImport && (
          <div className="mb-6 bg-zinc-950 p-4 rounded-xl border border-zinc-800 animate-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Dán bảng giá theo định dạng: <code>RANK TIER|NEXT RANK TIER|PRICE</code>
              <br/>
              <span className="text-xs text-zinc-500">Ví dụ: diamond 2|diamond 1|159.000 (Hỗ trợ nhập: diamond2, diamond II...)</span>
            </label>
            <textarea
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              placeholder={`IRON IV|IRON III|50.000\nIRON III|IRON II|50.000\n...`}
              className="w-full h-48 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-white font-mono focus:border-blue-500 outline-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowBulkImport(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkImport}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
              >
                Áp dụng
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {Array.isArray(ranks) && ranks.map((rank, rankIndex) => (
            <div key={rank._id} className="space-y-2">
              {Array.isArray(rank.tiers) && rank.tiers.map((tier, tierIndex) => {
                // Logic: Price to climb FROM this tier TO next tier
                // Tiers are sorted ASC (IV, III, II, I)
                const currentTierName = tier ? `${rank.name} ${tier}` : rank.name;
                
                // Determine next tier
                const isLastTier = tierIndex === rank.tiers.length - 1;
                let nextTierName = 'Next Rank';

                if (!isLastTier) {
                  const nextTier = rank.tiers[tierIndex + 1];
                  nextTierName = nextTier ? `${rank.name} ${nextTier}` : rank.name;
                } else {
                  // Nếu là bậc cuối cùng (VD: I), lấy bậc đầu tiên của Rank kế tiếp (VD: Diamond IV)
                  const nextRank = ranks[rankIndex + 1];
                  nextTierName = nextRank ? (nextRank.tiers?.[0] ? `${nextRank.name} ${nextRank.tiers[0]}` : nextRank.name) : `MAX RANK`; // Nếu không còn Rank nào nữa
                }
                
                const key = tier ? `${rank.name}_${tier}` : rank.name;
                const currentPrice = settings.rankPrices[key] || 0;

                // Logic check lỗi hiển thị UI (Realtime validation)
                let prevPrice = 0;
                if (tierIndex > 0) {
                   const prevTier = rank.tiers[tierIndex - 1];
                   prevPrice = settings.rankPrices[`${rank.name}_${prevTier}`] || 0;
                } else if (rankIndex > 0) {
                   const prevRank = ranks[rankIndex - 1];
                   if (prevRank.tiers && prevRank.tiers.length > 0) {
                      const prevTier = prevRank.tiers[prevRank.tiers.length - 1];
                      prevPrice = settings.rankPrices[`${prevRank.name}_${prevTier}`] || 0;
                   }
                }
                
                // Nếu có giá trị và nhỏ hơn bậc trước -> Lỗi
                const isInvalid = currentPrice > 0 && prevPrice > 0 && currentPrice < prevPrice;

                return (
                  <div key={key} className="flex flex-col md:flex-row items-center gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                    {/* From */}
                    <div className="flex items-center gap-3 w-full md:w-1/3">
                      <img src={rank.imageUrl} alt={rank.name} className="w-10 h-10 object-contain" />
                      <span className="font-bold text-zinc-300">{currentTierName}</span>
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:flex justify-center w-10">
                      <ArrowRight className="w-6 h-6 text-zinc-600" />
                    </div>

                    {/* To */}
                    <div className="flex items-center gap-3 w-full md:w-1/3 md:pl-8">
                      <span className="font-bold text-white">{nextTierName}</span>
                    </div>

                    {/* Price Input */}
                    <div className="w-full md:w-1/3 relative">
                      <input
                        type="text"
                        placeholder="Nhập giá tiền..."
                        value={currentPrice ? currentPrice.toLocaleString('en-US') : ''}
                        onChange={(e) => updateRankPrice(rank.name, tier, e.target.value)}
                        className={`w-full bg-zinc-900 border rounded-lg px-4 py-3 text-right font-bold outline-none transition-colors ${
                          isInvalid ? 'border-red-500 text-red-500 focus:border-red-600' : 'border-zinc-700 text-green-400 focus:border-green-500'
                        }`}
                      />
                      <span className="absolute left-3 top-3.5 text-zinc-500 text-sm">VNĐ</span>
                      {isInvalid && <p className="absolute right-0 -bottom-6 text-xs text-red-500">Thấp hơn bậc trước yêu cầu nhập &gt;= ({prevPrice.toLocaleString()})</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
