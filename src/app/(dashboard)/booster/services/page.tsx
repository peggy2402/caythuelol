'use client';

import { useServiceContext } from './ServiceContext';
import { Globe, Zap, Clock, Crosshair, CheckCircle2, Users, Video, Download, Copy, Upload, Swords, Search, X, Shield, Target, Heart, Filter, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

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

const ROLE_STYLES: Record<string, { label: string, icon: any, color: string, bg: string }> = {
  'Fighter': { label: 'Đấu sĩ', icon: Swords, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
  'Tank': { label: 'Đỡ đòn', icon: Shield, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  'Mage': { label: 'Pháp sư', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'Assassin': { label: 'Sát thủ', icon: Target, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  'Marksman': { label: 'Xạ thủ', icon: Crosshair, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'Support': { label: 'Hỗ trợ', icon: Heart, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

export default function GeneralSettingsPage() {
  const { settings, setSettings, loading } = useServiceContext();
  const [showConfigTools, setShowConfigTools] = useState(false);
  const [importJson, setImportJson] = useState('');
  
  // Champion Selection State
  const [champions, setChampions] = useState<any[]>([]);
  const [isChampModalOpen, setIsChampModalOpen] = useState(false);
  const [searchChamp, setSearchChamp] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [activeRoleTab, setActiveRoleTab] = useState<string>('Fighter'); // Mặc định ưu tiên Đấu sĩ

  useEffect(() => {
    fetch('/api/champions')
      .then(res => res.json())
      .then(data => setChampions(data || []))
      .catch(err => console.error('Failed to load champions', err));
  }, []);

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
        lpGain: { ...prev.lpGain, ...parsed.lpGain }
      }));
      toast.success('Đã nhập cấu hình thành công!');
      setShowConfigTools(false);
      setImportJson('');
    } catch (e) {
      toast.error('Mã cấu hình lỗi');
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Đang tải...</div>;

  return (
    <div className="space-y-8">
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
          <Zap className="w-6 h-6" />
          Tùy chọn mở rộng
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-bold text-white">Đặt lịch cày</div>
                  <div className="text-xs text-zinc-500">Cho phép khách chọn khung giờ chơi</div>
                </div>
              </div>
              <input type="checkbox" checked={settings.options.schedule} onChange={(e) => setSettings({...settings, options: {...settings.options, schedule: e.target.checked}})} className="w-6 h-6 accent-blue-600" />
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
            
            <div className="grid grid-cols-2 gap-3 pl-2">
              {AVAILABLE_LANES.map((lane) => (
                <label key={lane.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.options.roles.includes(lane.id) ? 'bg-blue-600 border-blue-600' : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-600'}`}>
                    {settings.options.roles.includes(lane.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={settings.options.roles.includes(lane.id)} onChange={() => toggleRole(lane.id)} />
                  <span className={`text-sm ${settings.options.roles.includes(lane.id) ? 'text-white' : 'text-zinc-400'}`}>{lane.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Tướng chỉ định (+%)</label>
                <div className="relative">
                  <input type="number" value={settings.options.specificChamps} onChange={(e) => setSettings({...settings, options: {...settings.options, specificChamps: Number(e.target.value)}})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" />
                  <span className="absolute right-3 top-2 text-zinc-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Cày siêu tốc (+%)</label>
                <div className="relative">
                  <input type="number" value={settings.options.express} onChange={(e) => setSettings({...settings, options: {...settings.options, express: Number(e.target.value)}})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" />
                  <span className="absolute right-3 top-2 text-zinc-500">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Chơi cùng Booster (+%)</label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input type="number" value={settings.options.duo} onChange={(e) => setSettings({...settings, options: {...settings.options, duo: Number(e.target.value)}})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-white focus:border-blue-500 outline-none" />
                  <span className="absolute right-3 top-2 text-zinc-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Xem trực tiếp (Cố định)</label>
                <div className="relative">
                  <Video className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input type="number" value={settings.options.streaming} onChange={(e) => setSettings({...settings, options: {...settings.options, streaming: Number(e.target.value)}})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-12 py-2 text-white focus:border-blue-500 outline-none" />
                  <span className="absolute right-3 top-2 text-zinc-500 text-xs">VNĐ</span>
                </div>
              </div>
            </div>
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
