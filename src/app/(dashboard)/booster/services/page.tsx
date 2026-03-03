'use client';

import { useServiceContext } from './ServiceContext';
import { Globe, Zap, Clock, Crosshair, CheckCircle2, Users, Video, Download, Copy, Upload } from 'lucide-react';
import { useState } from 'react';
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

export default function GeneralSettingsPage() {
  const { settings, setSettings, loading } = useServiceContext();
  const [showConfigTools, setShowConfigTools] = useState(false);
  const [importJson, setImportJson] = useState('');

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
    </div>
  );
}
