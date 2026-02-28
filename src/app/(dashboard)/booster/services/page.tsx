'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { Loader2, Save, Check, X, Settings2 } from 'lucide-react';

const SERVICE_TYPES = [
  { id: 'RANK_BOOST', label: 'Rank Boost' },
  { id: 'PROMOTION', label: 'Promotion' },
  { id: 'MASTERY', label: 'Mastery' },
  { id: 'LEVELING', label: 'Leveling' },
  { id: 'NET_WINS', label: 'Net Wins' },
  { id: 'PLACEMENTS', label: 'Placements' },
];

const OPTION_TYPES = [
  { id: 'flash_boost', label: 'Flash Boost (Siêu tốc)' },
  { id: 'streaming', label: 'Streaming' },
  { id: 'duo_queue', label: 'Duo Queue' },
  { id: 'specific_champs', label: 'Specific Champions' },
];

interface ServiceSetting {
  type: string;
  enabled: boolean;
  price: number;
  modifier: number;
}

interface OptionSetting {
  key: string;
  enabled: boolean;
  price: number;
  modifier: number;
}

export default function BoosterServicesPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ServiceSetting[]>([]);
  const [options, setOptions] = useState<OptionSetting[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/boosters/services');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        if (data) {
          // Merge with defaults to ensure all types exist
          const mergedServices = SERVICE_TYPES.map(type => {
            const existing = data.service_settings?.find((s: any) => s.type === type.id);
            return existing || { type: type.id, enabled: false, price: 0, modifier: 100 };
          });
          
          const mergedOptions = OPTION_TYPES.map(opt => {
            const existing = data.option_settings?.find((o: any) => o.key === opt.id);
            return existing || { key: opt.id, enabled: false, price: 0, modifier: 100 };
          });

          setServices(mergedServices);
          setOptions(mergedOptions);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/boosters/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_settings: services,
          option_settings: options
        }),
      });
      
      if (res.ok) {
        toast.success('Cập nhật thành công!');
      } else {
        toast.error('Cập nhật thất bại');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  const updateService = (index: number, field: keyof ServiceSetting, value: any) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

  const updateOption = (index: number, field: keyof OptionSetting, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{t('manageServices')}</h1>
          <p className="text-zinc-400 text-sm">{t('manageServicesDesc')}</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu thay đổi
        </button>
      </div>

      {/* Services Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-white">Dịch vụ cung cấp</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {services.map((service, idx) => (
            <div key={service.type} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <input 
                  type="checkbox" 
                  checked={service.enabled} 
                  onChange={(e) => updateService(idx, 'enabled', e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                />
                <span className={`font-medium ${service.enabled ? 'text-white' : 'text-zinc-500'}`}>
                  {SERVICE_TYPES.find(t => t.id === service.type)?.label}
                </span>
              </div>
              
              {service.enabled && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-left-5">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Giá cơ bản (VNĐ)</label>
                    <input 
                      type="number" 
                      value={service.price} 
                      onChange={(e) => updateService(idx, 'price', Number(e.target.value))}
                      className="w-32 bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Điều chỉnh (%)</label>
                    <input 
                      type="number" 
                      value={service.modifier} 
                      onChange={(e) => updateService(idx, 'modifier', Number(e.target.value))}
                      className="w-24 bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                      placeholder="100"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Options Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-yellow-500" />
          <h3 className="font-bold text-white">Tùy chọn mở rộng</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {options.map((option, idx) => (
            <div key={option.key} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <input 
                  type="checkbox" 
                  checked={option.enabled} 
                  onChange={(e) => updateOption(idx, 'enabled', e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-yellow-600 focus:ring-yellow-500"
                />
                <span className={`font-medium ${option.enabled ? 'text-white' : 'text-zinc-500'}`}>
                  {OPTION_TYPES.find(t => t.id === option.key)?.label}
                </span>
              </div>
              
              {option.enabled && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-left-5">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Phụ phí (VNĐ)</label>
                    <input 
                      type="number" 
                      value={option.price} 
                      onChange={(e) => updateOption(idx, 'price', Number(e.target.value))}
                      className="w-32 bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-yellow-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Điều chỉnh (%)</label>
                    <input 
                      type="number" 
                      value={option.modifier} 
                      onChange={(e) => updateOption(idx, 'modifier', Number(e.target.value))}
                      className="w-24 bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-yellow-500 outline-none"
                      placeholder="100"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
