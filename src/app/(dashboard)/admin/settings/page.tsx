'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Settings, DollarSign, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        
        // Tìm setting phí sàn trong DB
        const feeSetting = data.find((s: SystemSetting) => s.key === 'PLATFORM_FEE');
        if (feeSetting) {
            setPlatformFee(Number(feeSetting.value));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            key: 'PLATFORM_FEE',
            value: platformFee,
            description: 'Phí sàn (%) áp dụng cho các đơn hàng'
        })
      });

      if (res.ok) {
        toast.success('Đã lưu cài đặt phí sàn');
        fetchSettings(); // Refresh lại để đảm bảo đồng bộ
      } else {
        toast.error('Lỗi khi lưu');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform Fee Config Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-500/10 rounded-xl text-green-500 border border-green-500/20">
                    <DollarSign className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Phí sàn (Platform Fee)</h3>
                    <p className="text-sm text-zinc-400">Phần trăm doanh thu giữ lại từ Booster.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Mức phí (%)</label>
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

                <button 
                    onClick={handleSaveFee}
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-green-600/20"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Lưu thay đổi
                </button>
            </div>
        </div>

        {/* Placeholder for future settings */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 opacity-60 pointer-events-none border-dashed">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                    <Settings className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Cấu hình khác</h3>
                    <p className="text-sm text-zinc-400">Tính năng đang phát triển...</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
