// src/app/(dashboard)/booster/services/lol/page.tsx
'use client';

import { useServiceContext } from '@/components/ServiceContext'; // Cập nhật đường dẫn import
import { Globe, Zap, Clock, Crosshair, CheckCircle2, Users, Video, Download, Copy, Upload, Swords, Search, X, Shield, Target, Heart, Filter, Sparkles, Calculator, Trophy, TrendingUp, Medal, Power, Info, TicketPercent, Plus, Trash2, RefreshCw, Banknote } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

const AVAILABLE_SERVERS = [
  { code: 'VN', name: 'Việt Nam' },
  { code: 'KR', name: 'Hàn Quốc' },
  { code: 'JP', name: 'Nhật Bản' },
  { code: 'NA', name: 'Bắc Mỹ' },
  { code: 'EUW', name: 'Tây Âu' },
  { code: 'EUNE', name: 'Đông – Bắc Âu' },
  { code: 'OCE', name: 'Châu Đại Dương' },
  { code: 'RU', name: 'Nga' },
  { code: 'TR', name: 'Thổ Nhĩ Kỳ' },
  { code: 'BR', name: 'Brasil' },
  { code: 'LAN', name: 'Bắc Mỹ La-tinh' },
  { code: 'LAS', name: 'Nam Mỹ La-tinh' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SG', name: 'Singapore, Malaysia, Indonesia' },
  { code: 'TH', name: 'Thái Lan' },
  { code: 'TW', name: 'Đài Bắc Trung Hoa' },
  { code: 'ME', name: 'Trung Đông' },
];

const AVAILABLE_LANES = [
  { id: 'TOP', label: 'Đường Trên (Top)' },
  { id: 'JUNGLE', label: 'Đi Rừng (Jungle)' },
  { id: 'MID', label: 'Đường Giữa (Mid)' },
  { id: 'ADC', label: 'Xạ Thủ (Adc)' },
  { id: 'SUPPORT', label: 'Hỗ Trợ (Support)' },
];

const ROLE_STYLES: Record<string, { label: string, icon: any, color: string, bg: string }> = {
  'Fighter': { label: 'Đấu sĩ', icon: Swords, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
  'Tank': { label: 'Đỡ đòn', icon: Shield, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  'Mage': { label: 'Pháp sư', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'Assassin': { label: 'Sát thủ', icon: Target, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  'Marksman': { label: 'Xạ thủ', icon: Crosshair, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'Support': { label: 'Hỗ trợ', icon: Heart, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

// Danh sách dịch vụ hỗ trợ
const SUPPORTED_SERVICES = [
    { key: 'RANK_BOOST', label: 'Cày Rank/Elo', icon: Trophy, desc: 'Leo rank từ Sắt đến Thách Đấu' },
    { key: 'NET_WINS', label: 'Cày Điểm Cao Thủ/ Thách Đấu', icon: Target, desc: 'Đảm bảo số trận thắng (Net Wins)' },
    { key: 'PLACEMENTS', label: 'Phân Hạng Đầu Mùa', icon: Swords, desc: 'Cày 5 trận đầu mùa giải' },
    { key: 'PROMOTION', label: 'Chuỗi Thăng Hạng', icon: TrendingUp, desc: 'Vượt qua chuỗi BO3/BO5' },
    { key: 'LEVELING', label: 'Cày Cấp Độ (Level)', icon: Zap, desc: 'Cày level 1-30 hoặc farm Tinh Hoa' },
    { key: 'MASTERY', label: 'Cày Thông Thạo', icon: Medal, desc: 'Cày điểm thông thạo tướng' },
    { key: 'COACHING', label: 'Coaching 1-1', icon: Users, desc: 'Huấn luyện kỹ năng, tư duy chiến thuật' },
    { key: 'ONBET', label: 'Cày Sự Kiện', icon: Banknote, desc: 'Cày số trận để nhận thưởng Sự kiện' },
];

export default function GeneralSettingsPage() {
  const { settings, setSettings, loading, toggleService } = useServiceContext();
  const [showConfigTools, setShowConfigTools] = useState(false);
  const [importJson, setImportJson] = useState('');
  
  // Champion Selection State
  const [champions, setChampions] = useState<any[]>([]);
  const [isChampModalOpen, setIsChampModalOpen] = useState(false);
  const [searchChamp, setSearchChamp] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [activeRoleTab, setActiveRoleTab] = useState<string>('Fighter'); // Mặc định ưu tiên Đấu sĩ
  const [modifierInputs, setModifierInputs] = useState<Record<string, string>>({});
  
  // Coupon State
  const [couponPercent, setCouponPercent] = useState<number>(10);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  useEffect(() => {
    fetch('/api/champions')
      .then(res => res.json())
      .then(data => setChampions(data || []))
      .catch(err => console.error('Failed to load champions', err));
  }, []);

  // Sync settings to local inputs when loaded
  useEffect(() => {
    if (settings.lpModifiers) {
        const newInputs: Record<string, string> = {};
        Object.entries(settings.lpModifiers).forEach(([k, v]) => newInputs[k] = v.toString());
        setModifierInputs(newInputs);
    }
  }, [settings.lpModifiers]);

  // Extract unique roles from loaded champions
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    champions.forEach(c => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach((t: string) => roles.add(t));
      }
    });
    return Array.from(roles).sort();
  }, [champions]);

  const filteredChampions = useMemo(() => {
    let result = champions;
    if (selectedRoleFilter) {
      result = result.filter(c => c.tags && c.tags.includes(selectedRoleFilter));
    }
    if (searchChamp) {
      result = result.filter(c => c.name.toLowerCase().includes(searchChamp.toLowerCase()));
    }
    return result;
  }, [champions, searchChamp, selectedRoleFilter]);

  const groupedSelectedChampions = useMemo(() => {
    const selected = champions.filter(c => settings.playingChampions?.includes(c.id));
    const groups: Record<string, any[]> = {};
    selected.forEach(c => {
      const role = c.tags && c.tags[0] ? c.tags[0] : 'Other';
      if (!groups[role]) groups[role] = [];
      groups[role].push(c);
    });
    return groups;
  }, [settings.playingChampions, champions]);

  const toggleChampion = (champId: string) => {
    setSettings(prev => {
      const current = prev.playingChampions || [];
      if (current.includes(champId)) {
        return { ...prev, playingChampions: current.filter(c => c !== champId) };
      } else {
        return { ...prev, playingChampions: [...current, champId] };
      }
    });
  };

  const selectAllChampions = () => {
    // Nếu đang chọn tất cả -> Bỏ chọn hết
    // Nếu chưa chọn hết -> Chọn tất cả (theo filter hiện tại)
    const allIds = filteredChampions.map(c => c.id);
    const currentIds = settings.playingChampions || [];
    const isAllSelected = allIds.every(id => currentIds.includes(id));

    if (isAllSelected) {
        setSettings(prev => ({
            ...prev,
            playingChampions: prev.playingChampions.filter(id => !allIds.includes(id))
        }));
    } else {
        // Merge unique IDs
        const newSet = new Set([...currentIds, ...allIds]);
        setSettings(prev => ({ ...prev, playingChampions: Array.from(newSet) }));
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

  const handleExportConfig = () => {
    const configString = JSON.stringify(settings, null, 2);
    navigator.clipboard.writeText(configString);
    toast.success('Đã sao chép mã cấu hình!');
  };

  const handleImportConfig = () => {
    try {
      if (!importJson.trim()) return;
      const parsed = JSON.parse(importJson);
      if (!parsed.rankPrices || !parsed.options) throw new Error('Mã không hợp lệ');
      
      setSettings(prev => ({
        ...prev,
        ...parsed,
        options: { ...prev.options, ...parsed.options },
        lpModifiers: { ...prev.lpModifiers, ...parsed.lpModifiers }
      }));
      toast.success('Đã nhập cấu hình thành công!');
      setShowConfigTools(false);
      setImportJson('');
    } catch (e) {
      toast.error('Mã cấu hình lỗi');
    }
  };

  // --- COUPON LOGIC ---
  const handleGenerateCode = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(`SALE-${random}`);
  };

  const handleAddCoupon = () => {
    if (!generatedCode.trim()) return toast.error('Vui lòng nhập mã code');
    if (couponPercent <= 0 || couponPercent > 100) return toast.error('Phần trăm không hợp lệ');
    
    const newCoupon = {
        code: generatedCode.toUpperCase(),
        value: couponPercent,
        type: 'PERCENTAGE' as const,
        isActive: true
    };

    setSettings(prev => ({
        ...prev,
        coupons: [...(prev.coupons || []), newCoupon]
    }));
    setGeneratedCode('');
    toast.success('Đã thêm mã giảm giá');
  };

  const removeCoupon = (code: string) => {
     setSettings(prev => ({ ...prev, coupons: (prev.coupons || []).filter(c => c.code !== code) }));
  };

  const toggleCoupon = (code: string) => {
    setSettings(prev => ({
        ...prev, coupons: (prev.coupons || []).map(c => c.code === code ? { ...c, isActive: !c.isActive } : c)
    }));
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Đang tải...</div>;

  return (
    <div className="space-y-8 bg-zinc-900">
      {/* SERVICE MANAGEMENT (TOGGLE ON/OFF) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Power className="w-5 h-5 text-green-500" />
          Quản lý Dịch vụ
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
            Bật/Tắt các dịch vụ mà bạn muốn cung cấp. Chỉ những dịch vụ đang bật (ON) mới hiển thị cho khách hàng thuê.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUPPORTED_SERVICES.map((svc) => {
                const isEnabled = settings.enabledServices?.includes(svc.key);
                const Icon = svc.icon;
                
                return (
                    <div 
                        key={svc.key}
                        className={`relative p-4 rounded-xl border transition-all ${
                            isEnabled 
                                ? 'bg-zinc-950 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                                : 'bg-zinc-950/50 border-zinc-800 opacity-70 hover:opacity-100'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-green-500/10 text-green-400' : 'bg-zinc-900 text-zinc-500'}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={isEnabled}
                                    onChange={(e) => toggleService(svc.key, e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                        <h3 className={`font-bold ${isEnabled ? 'text-white' : 'text-zinc-400'}`}>{svc.label}</h3>
                        <p className="text-xs text-zinc-500 mt-1">{svc.desc}</p>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Import/Export Tools */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowConfigTools(!showConfigTools)}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl font-medium transition-all text-sm"
        >
          <Download className="w-4 h-4" />
          Công cụ Xuất / Nhập
        </button>
      </div>

      {showConfigTools && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-in slide-in-from-top-2">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-500" />
            Công cụ chia sẻ cấu hình
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <h4 className="font-bold text-white mb-2">1. Xuất cấu hình</h4>
              <button onClick={handleExportConfig} className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg border border-zinc-700">
                <Copy className="w-4 h-4" /> Sao chép mã
              </button>
            </div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <h4 className="font-bold text-white mb-2">2. Nhập cấu hình</h4>
              <div className="flex gap-2">
                <input type="text" value={importJson} onChange={(e) => setImportJson(e.target.value)} placeholder='Dán mã JSON...' className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                <button onClick={handleImportConfig} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm"><Upload className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Server Selection */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          Khu vực (Server) có thể chơi
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {AVAILABLE_SERVERS.map((server) => {
            const isSelected = settings.servers.includes(server.code);
            return (
              <button
                key={server.code}
                onClick={() => toggleServer(server.code)}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold">{server.code}</div>
                <div className="text-sm opacity-80">{server.name}</div>
                {isSelected && <div className="absolute top-3 right-3"><CheckCircle2 className="w-5 h-5 text-blue-500" /></div>}
              </button>
            );
          })}
        </div>
      </div>
      {/* Config LP Gain */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-500" />
            Cấu hình LP Modifiers 
            <span className="text-sm font-medium text-zinc-400">
              (Điều chỉnh giá theo LP Gain)
            </span>
          </h2>

        <div className="mt-4 bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 border border-zinc-700 rounded-xl p-5 text-sm leading-relaxed shadow-lg">

          {/* Tiêu đề nhỏ */}
          <div className="mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-white font-semibold">
              Quy tắc nhập % hệ số Elo (Tăng/Giảm giá theo LP Gain)
            </span>
          </div>

          {/* Nội dung chính */}
          <p className="text-zinc-300">
            Bạn có thể nhập giá trị phần trăm để điều chỉnh giá theo LP thực tế mỗi trận.
          </p>

          {/* Rule Box */}
          <div className="mt-3 bg-zinc-900/70 border border-zinc-800 rounded-lg p-4 space-y-3">

            <div className="flex items-start gap-3">
              <span className="text-red-400 font-bold text-lg">▲</span>
              <div>
                <p className="text-red-400 font-semibold">Tăng giá</p>
                <p className="text-zinc-400 text-xs">
                  Chỉ cần nhập <span className="text-white font-semibold">10</span> 
                  (không cần dấu +) → hệ thống hiểu là <span className="text-red-400 font-semibold">+10%</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-green-400 font-bold text-lg">▼</span>
              <div>
                <p className="text-green-400 font-semibold">Giảm giá</p>
                <p className="text-zinc-400 text-xs">
                  Phải nhập dấu âm. Ví dụ: <span className="text-white font-semibold">-10</span> 
                  → hệ thống hiểu là <span className="text-green-400 font-semibold">-10%</span>
                </p>
              </div>
            </div>

          </div>
        </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: 'low', label: 'Ít LP (<19 LP/win)', desc: 'Khó cày, nên tăng giá (+)', color: 'text-red-500' },
            { key: 'medium', label: 'Bình thường (19-21 LP)', desc: 'Giá tiêu chuẩn', color: 'text-yellow-500' },
            { key: 'high', label: 'Nhiều LP (>21 LP/win)', desc: 'Dễ cày, nên giảm giá (-)', color: 'text-green-500' },
          ].map((item) => (
            <div key={item.key} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className={`font-bold ${item.color} mb-1`}>{item.label}</div>
              <div className="text-xs text-zinc-500 mb-3">{item.desc}</div>
              <div className="relative">
                <input
                  type="text"
                  value={modifierInputs[item.key] || ''}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value;
                    // Chỉ cho phép nhập số, dấu trừ, dấu cộng
                    if (/^[-+]?[0-9]*$/.test(val)) {
                        setModifierInputs({ ...modifierInputs, [item.key]: val });
                        const num = Number(val);
                        if (!isNaN(num)) setSettings({ ...settings, lpModifiers: { ...settings.lpModifiers, [item.key]: num } });
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-2 text-zinc-500">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Champion Selection */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Tướng sở trường (Champions)
                </h2>
                <p className="text-sm text-zinc-400 mt-1">Chọn các tướng bạn có thể chơi tốt. Để trống = Chơi được tất cả.</p>
            </div>
            <button 
                onClick={() => setIsChampModalOpen(true)}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
            >
                <Search className="w-4 h-4" />
                {settings.playingChampions?.length > 0 ? `Đã chọn ${settings.playingChampions.length} tướng` : 'Chọn tướng'}
            </button>
        </div>
        
        {/* Role Filters - Always Visible */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-4 mt-2">
            <button
                onClick={() => setActiveRoleTab('All')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                    activeRoleTab === 'All' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                }`}
            >
                <Filter className="w-3 h-3" /> Tất cả
            </button>
            {availableRoles.map(role => {
                const style = ROLE_STYLES[role] || { label: role, icon: Filter, color: 'text-zinc-400', bg: 'bg-zinc-900 border-zinc-800' };
                const Icon = style.icon;
                return (
                    <button
                        key={role}
                        onClick={() => setActiveRoleTab(role)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                            activeRoleTab === role ? `${style.bg} ${style.color} border-current` : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                        }`}
                    >
                        <Icon className="w-3 h-3" /> {style.label}
                    </button>
                );
            })}
        </div>

        {settings.playingChampions?.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedSelectedChampions).map(([role, champs]) => {
                    if (activeRoleTab !== 'All' && role !== activeRoleTab) return null;

                    const roleInfo = ROLE_STYLES[role] || { label: role, icon: Filter, color: 'text-zinc-400' };
                    const Icon = roleInfo.icon;
                    return (
                        <div key={role} className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800/50">
                                <Icon className={`w-4 h-4 ${roleInfo.color}`} />
                                <span className={`text-xs font-bold uppercase tracking-wider ${roleInfo.color}`}>{roleInfo.label}</span>
                                <span className="text-xs text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded-md">{champs.length}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {champs.map(champ => (
                                    <div key={champ.id} className="group relative flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-lg p-1 pr-2 transition-all">
                                        <img src={champ.imageUrl} alt={champ.name} className="w-8 h-8 rounded-md object-cover" loading="lazy" />
                                        <span className="text-xs font-medium text-zinc-300">{champ.name}</span>
                                        <button onClick={() => toggleChampion(champ.id)} className="absolute -top-1.5 -right-1.5 bg-zinc-800 text-zinc-500 hover:text-red-500 hover:bg-zinc-700 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-700">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
                
                {activeRoleTab !== 'All' && !groupedSelectedChampions[activeRoleTab] && (
                     <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                        <p className="text-zinc-500 text-sm">Chưa chọn tướng <span className={ROLE_STYLES[activeRoleTab]?.color}>{ROLE_STYLES[activeRoleTab]?.label || activeRoleTab}</span> nào</p>
                     </div>
                )}
              </div>
        ) : (
            <div className="p-4 bg-zinc-950/50 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500 text-sm">
                Bạn chưa chọn tướng nào. Hệ thống sẽ hiển thị là "Đa dạng tướng (All Champions)".
            </div>
        )}
      </div>

      {/* Extended Options */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Tùy chọn mở rộng
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Schedule & Roles */}
          <div className="space-y-6">
            
            {/* Schedule Boosting */}
            <div
              className={`p-4 rounded-xl border transition-all duration-300
              ${
                settings.options.schedule
                  ? "bg-blue-900/10 border-blue-500/30"
                  : "bg-zinc-950 border-zinc-800"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3">

                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg transition-colors
                    ${
                      settings.options.schedule
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>

                  <div className="leading-tight">
                    <div className="font-semibold text-white text-sm">
                      Đặt lịch cày
                    </div>
                    <div className="text-xs text-zinc-500">
                      Cho phép khách chọn khung giờ chơi
                    </div>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      options: {
                        ...settings.options,
                        schedule: !settings.options.schedule,
                      },
                    })
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300
                  ${
                    settings.options.schedule
                      ? "bg-blue-500"
                      : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300
                    ${
                      settings.options.schedule
                        ? "translate-x-5"
                        : ""
                    }`}
                  />
                </button>
              </div>

              {/* Schedule Fee */}
              <div
                className={`overflow-hidden transition-all duration-300
                ${
                  settings.options.schedule
                    ? "max-h-40 opacity-100 mt-4"
                    : "max-h-0 opacity-0"
                }`}
              >
                <label className="block text-sm font-semibold text-zinc-400 mb-2">
                  Phí đặt lịch (+%)
                </label>

                <div className="relative">
                  <input
                    type="number"
                    value={settings.options.scheduleFee || 0}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        options: {
                          ...settings.options,
                          scheduleFee: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />

                  <span className="absolute right-3 top-2 text-zinc-500 font-semibold">
                    %
                  </span>
                </div>

                <p className="text-xs text-zinc-500 mt-1">
                  Thu thêm phí khi khách yêu cầu tránh giờ chơi (Blackout).
                </p>

                {/* Info */}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-start gap-2 text-xs text-blue-200/70">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      Tính năng <strong>Time Slots</strong> (Khung giờ rảnh) sẽ giúp bạn
                      quản lý lịch trình tốt hơn.
                      <br />
                      <span className="opacity-60 italic">
                        Hiện tại hệ thống sẽ hiển thị trạng thái "Đã kích hoạt" cho
                        khách hàng và đang trong giai đoạn update.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Roles Selection */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                  <Crosshair className="w-5 h-5" />
                </div>

                <div>
                  <div className="font-semibold text-white">
                    Vị trí / Đường
                  </div>
                  <div className="text-xs text-zinc-500">
                    Chọn lane bạn chơi tốt
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_LANES.map((lane) => {
                  const active = settings.options.roles.includes(lane.id);

                  return (
                    <button
                      key={lane.id}
                      onClick={() => toggleRole(lane.id)}
                      className={`
                        flex items-center justify-center
                        px-3 py-3 rounded-xl
                        text-sm font-medium
                        border transition-all

                        ${active
                          ? "bg-blue-600/20 border-blue-500 text-blue-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"}
                      `}
                    >
                      {lane.label}
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Right Column: Pricing Options */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <label className="block text-sm font-bold text-zinc-400 mb-2">Tướng chỉ định (+%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings.options.specificChamps} 
                    onChange={(e) => setSettings({...settings, options: {...settings.options, specificChamps: Number(e.target.value)}})} 
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-white focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                  <span className="absolute right-3 top-3 text-zinc-500 font-bold">%</span>
                </div>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <label className="block text-sm font-bold text-zinc-400 mb-2">Cày siêu tốc (+%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings.options.express} 
                    onChange={(e) => setSettings({...settings, options: {...settings.options, express: Number(e.target.value)}})} 
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-white focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                  <span className="absolute right-3 top-3 text-zinc-500 font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <label className="block text-sm font-bold text-zinc-400 mb-2">Chơi cùng Booster (+%)</label>
                <div className="relative">
                  <Users className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input 
                    type="number" 
                    value={settings.options.duo} 
                    onChange={(e) => setSettings({...settings, options: {...settings.options, duo: Number(e.target.value)}})} 
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-8 py-3 text-white focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                  <span className="absolute right-3 top-3 text-zinc-500 font-bold">%</span>
                </div>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <label className="block text-sm font-bold text-zinc-400 mb-2">Xem trực tiếp (Cố định)</label>
                <div className="relative">
                  <Video className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input 
                    type="number" 
                    value={settings.options.streaming} 
                    onChange={(e) => setSettings({...settings, options: {...settings.options, streaming: Number(e.target.value)}})} 
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-12 py-3 text-white focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                  <span className="absolute right-3 top-3 text-zinc-500 text-xs font-bold">VNĐ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coupon Management */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <TicketPercent className="w-6 h-6 text-pink-500" />
          Mã giảm giá (Coupons)
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Generator */}
            <div className="lg:col-span-1 space-y-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <h3 className="font-bold text-white">Tạo mã mới</h3>
                
                <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase">Mã Code</label>
                    <div className="flex gap-2 mt-1">
                        <input 
                            type="text" 
                            value={generatedCode}
                            onChange={(e) => setGeneratedCode(e.target.value.toUpperCase())}
                            placeholder="Nhập hoặc tạo tự động"
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-pink-500 outline-none"
                        />
                        <button onClick={handleGenerateCode} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Tạo ngẫu nhiên">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase">Giảm giá (%)</label>
                    <div className="relative mt-1">
                        <input 
                            type="number" 
                            value={couponPercent}
                            onChange={(e) => setCouponPercent(Number(e.target.value))}
                            min="1" max="100"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-pink-500 outline-none"
                        />
                        <span className="absolute right-3 top-2 text-zinc-500">%</span>
                    </div>
                </div>

                <button 
                    onClick={handleAddCoupon}
                    disabled={!generatedCode}
                    className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={18} /> Thêm mã
                </button>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-3">
                <h3 className="font-bold text-white flex justify-between items-center">
                    Danh sách mã
                    <span className="text-xs font-normal text-zinc-500">({settings.coupons?.length || 0})</span>
                </h3>
                
                {!settings.coupons || settings.coupons.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                        Chưa có mã giảm giá nào.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {settings.coupons.map((coupon, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${coupon.isActive ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-950 border-zinc-800 opacity-60'}`}>
                                <div>
                                    <div className="font-mono font-bold text-white text-lg">{coupon.code}</div>
                                    <div className="text-pink-500 font-bold text-sm">Giảm {coupon.value}%</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={coupon.isActive}
                                            onChange={() => toggleCoupon(coupon.code)}
                                        />
                                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                                    </label>
                                    <button onClick={() => removeCoupon(coupon.code)} className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </section>

      {/* Champion Selection Modal */}
      {isChampModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 rounded-t-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Chọn tướng sở trường
              </h3>
              <button onClick={() => setIsChampModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900 space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                            type="text" 
                            value={searchChamp}
                            onChange={(e) => setSearchChamp(e.target.value)}
                            placeholder="Tìm kiếm tướng..." 
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <button onClick={selectAllChampions} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium whitespace-nowrap border border-zinc-700">
                        {filteredChampions.length > 0 && filteredChampions.every(c => settings.playingChampions?.includes(c.id)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                </div>
                
                {/* Role Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={() => setSelectedRoleFilter(null)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                            !selectedRoleFilter ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                        }`}
                    >
                        <Filter className="w-3 h-3" /> Tất cả
                    </button>
                    {availableRoles.map(role => {
                        const style = ROLE_STYLES[role] || { label: role, icon: Filter, color: 'text-zinc-400', bg: 'bg-zinc-900 border-zinc-800' };
                        const Icon = style.icon;
                        return (
                            <button
                                key={role}
                                onClick={() => setSelectedRoleFilter(role === selectedRoleFilter ? null : role)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                                    selectedRoleFilter === role ? `${style.bg} ${style.color} border-current` : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                                }`}
                            >
                                <Icon className="w-3 h-3" /> {style.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Champions Grid */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-zinc-950/50">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {filteredChampions.map((champ) => {
                        const isSelected = settings.playingChampions?.includes(champ.id);
                        return (
                            <button 
                                key={champ.id}
                                onClick={() => toggleChampion(champ.id)}
                                className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                    isSelected 
                                        ? 'border-blue-500 ring-2 ring-blue-500/30' 
                                        : 'border-zinc-800 hover:border-zinc-600 opacity-60 hover:opacity-100'
                                }`}
                            >
                                <img src={champ.imageUrl} alt={champ.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                                <div className={`absolute inset-x-0 bottom-0 p-1 text-[10px] font-bold text-center truncate ${isSelected ? 'bg-blue-600 text-white' : 'bg-black/70 text-zinc-300'}`}>
                                    {champ.name}
                                </div>
                                {isSelected && (
                                    <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                {filteredChampions.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">Không tìm thấy tướng nào</div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-2xl flex justify-between items-center">
                <span className="text-sm text-zinc-400">Đã chọn: <span className="text-white font-bold">{settings.playingChampions?.length || 0}</span> tướng</span>
                <button onClick={() => setIsChampModalOpen(false)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-colors">
                    Xong
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
