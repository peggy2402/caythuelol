'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Settings, DollarSign, Loader2, AlertTriangle, Image as ImageIcon, Power } from 'lucide-react';

interface SystemSetting {
  _id: string;
  key: string;
  value: any;
  description: string;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State cho Phí sàn (Mặc định 5%)
  const [platformFee, setPlatformFee] = useState<number>(5);
  // State cho Phí rút tiền (Mặc định 5000)
  const [withdrawFee, setWithdrawFee] = useState<number>(5000);
  // State cho Bảo trì
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  // State cho Banner
  const [bannerConfig, setBannerConfig] = useState({ imageUrl: '', link: '', active: false });


  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        
        if (Array.isArray(data)) {
          // Tìm setting phí sàn trong DB
          const pf = data.find((s: SystemSetting) => s.key === 'PLATFORM_FEE');
          if (pf) setPlatformFee(Number(pf.value));

          // Tìm setting phí rút tiền
          const wf = data.find((s: SystemSetting) => s.key === 'withdraw_fee');
          if (wf) setWithdrawFee(Number(wf.value));

          // Tìm setting bảo trì
          const mm = data.find((s: SystemSetting) => s.key === 'maintenance_mode');
          if (mm) setMaintenanceMode(Boolean(mm.value));

          // Tìm setting banner
          const bc = data.find((s: SystemSetting) => s.key === 'banner_config');
          if (bc) {
            setBannerConfig(bc.value || { imageUrl: '', link: '', active: false });
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any, description: string) => {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, description })
    });
    if (!res.ok) throw new Error('Failed to save');
    return res.json();
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting('PLATFORM_FEE', platformFee, 'Phí sàn (%) áp dụng cho các đơn hàng'),
        saveSetting('withdraw_fee', withdrawFee, 'Phí rút tiền cố định (VND)'),
        saveSetting('maintenance_mode', maintenanceMode, 'Chế độ bảo trì hệ thống'),
        saveSetting('banner_config', bannerConfig, 'Cấu hình Banner trang chủ')
      ]);
      toast.success('Đã lưu tất cả cài đặt');
      fetchSettings();
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Cài đặt hệ thống</h1>
        <p className="text-zinc-400">Quản lý các tham số vận hành của hệ thống.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Fees Configuration */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-500/10 rounded-xl text-green-500 border border-green-500/20">
                    <DollarSign className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Cấu hình Phí & Tài chính</h3>
                    <p className="text-sm text-zinc-400">Quản lý phí sàn và phí rút tiền.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Phí sàn (%) - Booster nhận (100 - phí)</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={platformFee}
                            onChange={(e) => setPlatformFee(Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none transition-all font-bold text-lg"
                            min="0"
                            max="100"
                        />
                        <span className="absolute right-4 top-4 text-zinc-500 font-bold">%</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                        ℹ️ Ví dụ: Nhập <span className="text-white font-bold">5</span> nghĩa là hệ thống thu 5%, Booster nhận 95%.
                    </p>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Phí rút tiền cố định (VND)</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={withdrawFee}
                            onChange={(e) => setWithdrawFee(Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none transition-all font-bold text-lg"
                            min="0"
                        />
                        <span className="absolute right-4 top-4 text-zinc-500 font-bold">VND</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. Maintenance & System */}
        <div className="space-y-6">
          {/* Maintenance Mode */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Chế độ Bảo trì</h3>
                    <p className="text-sm text-zinc-400">Tạm dừng hệ thống để nâng cấp.</p>
                </div>
            </div>
            
            <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <span className="text-zinc-300 font-medium">Kích hoạt bảo trì</span>
              <button 
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-red-500' : 'bg-zinc-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {maintenanceMode && <p className="text-xs text-red-400 mt-2">⚠️ Người dùng sẽ không thể truy cập Dashboard khi bật chế độ này.</p>}
          </div>

          {/* Banner Config */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20">
                    <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Banner Thông báo</h3>
                    <p className="text-sm text-zinc-400">Hiển thị banner quảng cáo/thông báo ở trang chủ.</p>
                </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">Hiển thị Banner</span>
                <button 
                  onClick={() => setBannerConfig({...bannerConfig, active: !bannerConfig.active})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bannerConfig.active ? 'bg-blue-500' : 'bg-zinc-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bannerConfig.active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Đường dẫn ảnh (URL)</label>
                <input 
                  type="text" 
                  value={bannerConfig.imageUrl}
                  onChange={(e) => setBannerConfig({...bannerConfig, imageUrl: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Liên kết khi click (Optional)</label>
                <input 
                  type="text" 
                  value={bannerConfig.link}
                  onChange={(e) => setBannerConfig({...bannerConfig, link: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                  placeholder="/services"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-2xl shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
        >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu Cấu Hình
        </button>
      </div>
    </div>
  );
}
