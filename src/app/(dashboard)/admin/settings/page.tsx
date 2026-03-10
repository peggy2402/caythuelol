'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Settings, DollarSign, Loader2, AlertTriangle, Image as ImageIcon, Power, Key, RefreshCw, Landmark, Check, ChevronsUpDown, Search, FileText } from 'lucide-react';

interface SystemSetting {
  _id: string;
  key: string;
  value: any;
  description: string;
}

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
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
  // State cho Riot API Key
  const [riotApiKey, setRiotApiKey] = useState('');
  // State cho tài khoản ngân hàng Admin
  const [adminBankInfo, setAdminBankInfo] = useState({ bankName: '', accountNumber: '', accountHolder: '' });
  // State danh sách ngân hàng
  const [banks, setBanks] = useState<Bank[]>([]);
  // State cho dropdown tìm kiếm ngân hàng
  const [openBankDropdown, setOpenBankDropdown] = useState(false);
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  // State cấu hình đăng ký Booster
  const [boosterRegConfig, setBoosterRegConfig] = useState({ depositRequired: false, depositAmount: 200000 });

  useEffect(() => {
    fetchSettings();
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch('https://api.vietqr.io/v2/banks');
      const data = await res.json();
      if (data.code === '00') {
        setBanks(data.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách ngân hàng', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const [res, resRiot] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/settings/riot')
      ]);

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

          const abi = data.find((s: SystemSetting) => s.key === 'ADMIN_BANK_INFO');
          if (abi) {
            setAdminBankInfo(abi.value || { bankName: '', accountNumber: '', accountHolder: '' });
          }

          const brc = data.find((s: SystemSetting) => s.key === 'booster_registration_config');
          if (brc) {
            setBoosterRegConfig(brc.value || { depositRequired: false, depositAmount: 200000 });
          }
        }
      }

      if (resRiot.ok) {
        const dataRiot = await resRiot.json();
        if (dataRiot.apiKey) setRiotApiKey(dataRiot.apiKey);
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
        saveSetting('banner_config', bannerConfig, 'Cấu hình Banner trang chủ'),
        saveSetting('ADMIN_BANK_INFO', adminBankInfo, 'Tài khoản ngân hàng của Admin'),
        saveSetting('booster_registration_config', boosterRegConfig, 'Cấu hình đăng ký Booster (Cọc/Free)'),
        fetch('/api/admin/settings/riot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: riotApiKey })
        })
      ]);
      toast.success('Đã lưu tất cả cài đặt');
      fetchSettings();
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  // Lọc danh sách ngân hàng theo từ khóa tìm kiếm
  const filteredBanks = banks.filter(bank => 
    bank.shortName.toLowerCase().includes(bankSearchTerm.toLowerCase()) ||
    bank.name.toLowerCase().includes(bankSearchTerm.toLowerCase()) ||
    bank.bin.includes(bankSearchTerm)
  );

  const selectedBank = banks.find(b => b.shortName === adminBankInfo.bankName);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Cài đặt hệ thống</h1>
          <p className="text-sm text-zinc-400">Quản lý các tham số vận hành của hệ thống.</p>
        </div>
        <button 
          onClick={fetchSettings} 
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all text-sm font-medium disabled:opacity-50 shadow-sm w-full sm:w-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
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

        {/* 3. Booster Registration Config */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500 border border-orange-500/20">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Cấu hình Đăng ký Booster</h3>
                    <p className="text-sm text-zinc-400">Quản lý tiền cọc và quy trình tuyển dụng.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-zinc-300 font-medium">Yêu cầu Đặt cọc (Deposit)</span>
                    <button 
                        onClick={() => setBoosterRegConfig({...boosterRegConfig, depositRequired: !boosterRegConfig.depositRequired})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${boosterRegConfig.depositRequired ? 'bg-orange-500' : 'bg-zinc-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${boosterRegConfig.depositRequired ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {boosterRegConfig.depositRequired && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs text-zinc-500 mb-1">Số tiền cọc (VND)</label>
                        <input 
                            type="number" 
                            value={boosterRegConfig.depositAmount}
                            onChange={(e) => setBoosterRegConfig({...boosterRegConfig, depositAmount: Number(e.target.value)})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none font-bold"
                        />
                        <p className="text-[10px] text-zinc-500 mt-2">
                            Số tiền này sẽ hiển thị ở bước thanh toán khi Booster đăng ký.
                        </p>
                    </div>
                )}
            </div>
        </div>

        {/* 2. Maintenance & System */}
        <div className="space-y-6">
          {/* Admin Bank Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-500 border border-cyan-500/20">
                    <Landmark className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Tài khoản Ngân hàng Admin</h3>
                    <p className="text-sm text-zinc-400">Hiển thị trên trang đăng ký Booster.</p>
                </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Tên ngân hàng</label>
                
                <div className="relative">
                  {/* Backdrop để đóng dropdown khi click ra ngoài */}
                  {openBankDropdown && (
                    <div className="fixed inset-0 z-10" onClick={() => setOpenBankDropdown(false)} />
                  )}

                  {/* Nút Trigger Dropdown */}
                  <button
                    type="button"
                    onClick={() => setOpenBankDropdown(!openBankDropdown)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none flex items-center justify-between hover:bg-zinc-900 transition-colors"
                  >
                    {selectedBank ? (
                      <div className="flex items-center gap-2">
                        <img src={selectedBank.logo} alt={selectedBank.shortName} className="w-6 h-6 object-contain bg-white rounded-full p-0.5" />
                        <span className="font-medium">{selectedBank.shortName}</span>
                        <span className="text-zinc-500 text-xs hidden sm:inline">- {selectedBank.name}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500">-- Chọn ngân hàng --</span>
                    )}
                    <ChevronsUpDown className="w-4 h-4 text-zinc-500" />
                  </button>

                  {/* Dropdown Content */}
                  {openBankDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-20 max-h-80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {/* Search Input */}
                      <div className="p-2 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-30">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 w-4 h-4 text-zinc-500" />
                          <input 
                            type="text"
                            placeholder="Tìm kiếm ngân hàng..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 pl-8 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                            value={bankSearchTerm}
                            onChange={(e) => setBankSearchTerm(e.target.value)}
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* List Items */}
                      <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                        {filteredBanks.map((bank) => (
                          <button
                            key={bank.id}
                            onClick={() => {
                              setAdminBankInfo({...adminBankInfo, bankName: bank.shortName});
                              setOpenBankDropdown(false);
                              setBankSearchTerm('');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 hover:bg-zinc-800 transition-colors ${adminBankInfo.bankName === bank.shortName ? 'bg-cyan-500/10 text-cyan-500' : 'text-zinc-300'}`}
                          >
                            <img src={bank.logo} alt={bank.shortName} className="w-8 h-8 object-contain bg-white rounded-full p-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold truncate">{bank.shortName}</span>
                                <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-mono">BIN: {bank.bin}</span>
                              </div>
                              <p className="text-xs text-zinc-500 truncate">{bank.name}</p>
                            </div>
                            {adminBankInfo.bankName === bank.shortName && <Check className="w-4 h-4 text-cyan-500" />}
                          </button>
                        ))}
                        {filteredBanks.length === 0 && (
                          <div className="p-4 text-center text-zinc-500 text-sm">
                            Không tìm thấy ngân hàng nào.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Tên chủ tài khoản</label>
                <input 
                  type="text" 
                  value={adminBankInfo.accountHolder}
                  onChange={(e) => setAdminBankInfo({...adminBankInfo, accountHolder: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                  placeholder="VD: NGUYEN VAN A"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Số tài khoản</label>
                <input 
                  type="text" 
                  value={adminBankInfo.accountNumber}
                  onChange={(e) => setAdminBankInfo({...adminBankInfo, accountNumber: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                  placeholder="VD: 1903xxxxxxxx"
                />
              </div>
            </div>
          </div>

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

          {/* Riot API Key */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500 border border-purple-500/20">
                    <Key className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Riot API Key</h3>
                    <p className="text-sm text-zinc-400">Kết nối Riot Games API.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs text-zinc-500 mb-1">API Key (RGAPI-...)</label>
                    <input 
                        type="text" 
                        value={riotApiKey}
                        onChange={(e) => setRiotApiKey(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none font-mono"
                        placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    <p className="text-[10px] text-zinc-500 mt-2">
                        Key development hết hạn sau 24h. Dùng để lấy thông tin trận đấu.
                    </p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-40 md:bottom-8 md:right-8">
        <button 
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 md:px-8 rounded-full shadow-2xl shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 active:scale-95"
        >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span className="hidden md:inline">Lưu Cấu Hình</span>
            <span className="md:hidden">Lưu</span>
        </button>
      </div>
    </div>
  );
}
