// src/app/(dashboard)/booster/services/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Swords,
  Gamepad2,
  Crosshair,
  Shield,
  Trophy,
  Flame,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  X,
  Tag,
  Percent,
  Coins,
  Loader2,
  Sparkles,
  Target,
  ArrowRight,
  TrendingUp,
  Medal,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  GAMES_CATALOG,
  STANDARD_SERVICE_TEMPLATES,
  getServiceMeta,
  ServiceTemplate,
} from '@/lib/games';
import { LOL_RANK_STEPS } from '@/lib/rank-calculator';

const ICON_MAP: Record<string, LucideIcon> = {
  Swords,
  Gamepad2,
  Crosshair,
  Shield,
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Medal,
  Users,
};

export interface CustomService {
  id: string;
  gameCode: string;
  serviceType?: string;
  slug?: string;
  name: string;
  desc: string;
  pricingType: 'TIER_MATRIX' | 'PER_UNIT' | 'FIXED';
  price: number;
  multiplier?: number;
  unitName?: string;
  depositPercent: number;
  requiredFields?: string[];
  isActive: boolean;
}

export interface BoosterCoupon {
  code: string;
  discountPercent: number;
  isActive: boolean;
}

export interface AddonsConfig {
  specificRole: { enabled: boolean; percent: number };
  schedule: { enabled: boolean; percent: number };
  specificChamps: { enabled: boolean; percent: number };
  livestream: { enabled: boolean; fee: number };
  flash: { enabled: boolean; percent: number };
  duo: { enabled: boolean; percent: number };
}

export default function BoosterServicesStudio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Tựa game nhận cày (Mặc định LOL)
  const [selectedGames, setSelectedGames] = useState<string[]>(['LOL']);
  const [activeGameCode, setActiveGameCode] = useState<string>('LOL');

  // 2. Danh sách dịch vụ thực tế của Booster (Khởi tạo rỗng, hoàn toàn từ DB)
  const [customServices, setCustomServices] = useState<CustomService[]>([]);

  // 3. Cấu hình phụ phí Addons (6 tiện ích)
  const [addonsConfig, setAddonsConfig] = useState<AddonsConfig>({
    specificRole: { enabled: true, percent: 25 },
    schedule: { enabled: true, percent: 20 },
    specificChamps: { enabled: true, percent: 30 },
    livestream: { enabled: true, fee: 349000 },
    flash: { enabled: true, percent: 35 },
    duo: { enabled: true, percent: 50 },
  });

  // 4. Bảng giá rank chi tiết (step overrides)
  const [stepOverrides, setStepOverrides] = useState<Record<string, number>>({});
  const [showRankTableModal, setShowRankTableModal] = useState(false);

  // 5. Mã giảm giá riêng của Booster
  const [coupon, setCoupon] = useState<BoosterCoupon>({
    code: '',
    discountPercent: 10,
    isActive: false,
  });

  // Modal Thêm / Sửa dịch vụ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<string>('rank-boost');
  const [formData, setFormData] = useState<Partial<CustomService>>({
    gameCode: 'LOL',
    serviceType: 'rank-boost',
    slug: 'rank-boost',
    name: '',
    desc: '',
    pricingType: 'TIER_MATRIX',
    price: 0,
    multiplier: 1.0,
    unitName: 'Điểm LP',
    depositPercent: 100,
    isActive: true,
  });

  // Helper lấy headers kèm Bearer token
  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Đồng bộ toàn bộ cài đặt lên DB ngay lập tức (hiển thị rõ ở tab Network)
  const syncAllServices = async (
    updatedCustomServices: CustomService[],
    updatedAddonsConfig?: AddonsConfig,
    updatedCoupon?: BoosterCoupon,
    updatedStepOverrides?: Record<string, number>,
    updatedSelectedGames?: string[]
  ) => {
    try {
      const addons = updatedAddonsConfig || addonsConfig;
      const cpn = updatedCoupon || coupon;
      const steps = updatedStepOverrides || stepOverrides;
      const games = updatedSelectedGames || selectedGames;

      const payload = {
        selectedGames: games,
        customServices: updatedCustomServices,
        coupon: cpn,
        enabledServices: updatedCustomServices
          .filter((s) => s.isActive)
          .map((s) => s.slug || s.serviceType || s.name),
        standardConfig: {
          addonsConfig: addons,
          stepOverrides: steps,
        },
      };

      const res = await fetch('/api/boosters/services', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Lỗi đồng bộ dịch vụ');
      }
    } catch (err) {
      console.error('Lỗi sync service settings:', err);
      toast.error('Không thể đồng bộ dữ liệu lên máy chủ');
    }
  };

  // Load cài đặt hiện tại từ backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/boosters/services', {
          headers: getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          const s = data.settings || {};

          if (Array.isArray(s.selectedGames) && s.selectedGames.length > 0) {
            setSelectedGames(s.selectedGames);
            setActiveGameCode(s.selectedGames[0]);
          }

          if (Array.isArray(s.customServices)) {
            setCustomServices(s.customServices);
          }

          if (s.standardConfig?.addonsConfig) {
            setAddonsConfig((prev) => ({
              ...prev,
              ...s.standardConfig.addonsConfig,
            }));
          }

          if (s.standardConfig?.stepOverrides) {
            setStepOverrides(s.standardConfig.stepOverrides);
          }

          if (s.coupon) {
            setCoupon(s.coupon);
          }
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Bật/tắt tựa game
  const handleToggleGame = async (gameId: string) => {
    const code = gameId.toUpperCase();
    let updated: string[];
    if (selectedGames.includes(code)) {
      if (selectedGames.length === 1) {
        toast.warning('Bạn cần chọn ít nhất một tựa game');
        return;
      }
      updated = selectedGames.filter((g) => g !== code);
      setSelectedGames(updated);
      if (activeGameCode === code) {
        setActiveGameCode(updated[0] || 'LOL');
      }
    } else {
      updated = [...selectedGames, code];
      setSelectedGames(updated);
      setActiveGameCode(code);
    }
    await syncAllServices(customServices, addonsConfig, coupon, stepOverrides, updated);
  };

  // Bật/Tắt một dịch vụ
  const handleToggleService = async (serviceId: string) => {
    const updated = customServices.map((s) => {
      if (s.id === serviceId) {
        return { ...s, isActive: !s.isActive };
      }
      return s;
    });
    setCustomServices(updated);
    await syncAllServices(updated);
  };

  // Cập nhật giá / thuộc tính một dịch vụ trực tiếp từ card
  const handleUpdateServiceField = async (serviceId: string, field: keyof CustomService, value: any) => {
    const updated = customServices.map((s) => {
      if (s.id === serviceId) {
        return { ...s, [field]: value };
      }
      return s;
    });
    setCustomServices(updated);
    await syncAllServices(updated);
  };

  // Xóa dịch vụ khỏi danh mục của Booster (vĩnh viễn khỏi DB)
  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    const updated = customServices.filter((s) => s.id !== serviceId);
    setCustomServices(updated);
    toast.success(`Đã xóa dịch vụ "${serviceName}"!`);
    await syncAllServices(updated);
  };

  // Mở modal Thêm Dịch Vụ Mới
  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    const templates = STANDARD_SERVICE_TEMPLATES[activeGameCode] || STANDARD_SERVICE_TEMPLATES['LOL'] || [];
    const firstTpl = templates[0];

    setSelectedTemplateSlug(firstTpl ? firstTpl.slug : 'custom');
    setFormData({
      id: `srv_${activeGameCode.toLowerCase()}_${firstTpl?.slug || 'custom'}_${Date.now()}`,
      gameCode: activeGameCode,
      serviceType: firstTpl?.slug || 'custom',
      slug: firstTpl?.slug || 'custom',
      name: firstTpl?.name || 'Gói Cày Mới',
      desc: firstTpl?.desc || '',
      pricingType: firstTpl?.pricingType || 'FIXED',
      price: firstTpl?.defaultPrice || 100000,
      multiplier: 1.0,
      unitName: firstTpl?.unitName || '',
      depositPercent: firstTpl?.depositPercent || 100,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Mở modal Sửa Dịch Vụ
  const handleOpenEditModal = (svc: CustomService) => {
    setEditingServiceId(svc.id);
    setSelectedTemplateSlug(svc.serviceType || svc.slug || 'custom');
    setFormData({ ...svc });
    setIsModalOpen(true);
  };

  // Xử lý khi chọn một Mẫu Dịch Vụ trong Modal
  const handleSelectTemplate = (slug: string) => {
    setSelectedTemplateSlug(slug);
    if (slug === 'custom') {
      setFormData((prev) => ({
        ...prev,
        serviceType: 'custom',
        slug: 'custom',
        name: prev.name || 'Gói Dịch Vụ Tùy Chỉnh',
        desc: prev.desc || 'Gói cày thuê đặc thù theo yêu cầu khách hàng.',
        pricingType: 'FIXED',
        price: prev.price || 150000,
        unitName: '',
        depositPercent: 100,
      }));
      return;
    }

    const tpl = getServiceMeta(activeGameCode, slug);
    if (tpl) {
      setFormData((prev) => ({
        ...prev,
        serviceType: tpl.slug,
        slug: tpl.slug,
        name: tpl.name,
        desc: tpl.desc,
        pricingType: tpl.pricingType,
        price: tpl.defaultPrice,
        multiplier: 1.0,
        unitName: tpl.unitName || '',
        depositPercent: tpl.depositPercent,
      }));
    }
  };

  // Lưu Form Modal (Thêm hoặc Sửa)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Vui lòng nhập tên dịch vụ');
      return;
    }

    let updatedList: CustomService[];

    if (editingServiceId) {
      // Sửa dịch vụ có sẵn
      updatedList = customServices.map((s) => {
        if (s.id === editingServiceId) {
          return {
            ...s,
            ...(formData as CustomService),
            name: formData.name!.trim(),
            desc: formData.desc?.trim() || '',
          };
        }
        return s;
      });
      toast.success(`Đã cập nhật dịch vụ "${formData.name}"!`);
    } else {
      // Thêm dịch vụ mới
      const newService: CustomService = {
        id: `srv_${activeGameCode.toLowerCase()}_${formData.slug || 'custom'}_${Date.now()}`,
        gameCode: activeGameCode,
        serviceType: formData.serviceType || formData.slug || 'custom',
        slug: formData.slug || 'custom',
        name: formData.name.trim(),
        desc: formData.desc?.trim() || '',
        pricingType: formData.pricingType || 'FIXED',
        price: Number(formData.price) || 0,
        multiplier: Number(formData.multiplier) || 1.0,
        unitName: formData.unitName || '',
        depositPercent: Number(formData.depositPercent) || 100,
        isActive: true,
      };

      updatedList = [...customServices, newService];
      toast.success(`Đã thêm dịch vụ "${newService.name}" vào danh mục!`);
    }

    setCustomServices(updatedList);
    setIsModalOpen(false);
    await syncAllServices(updatedList);
  };

  // Lọc các dịch vụ thuộc tựa game đang chọn
  const currentGameDef =
    GAMES_CATALOG.find((g) => g.id.toUpperCase() === activeGameCode) || GAMES_CATALOG[0];

  const currentServices = customServices.filter(
    (s) => (s.gameCode || 'LOL').toUpperCase() === activeGameCode
  );

  const availableTemplates =
    STANDARD_SERVICE_TEMPLATES[activeGameCode] || STANDARD_SERVICE_TEMPLATES['LOL'] || [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-sm font-semibold">Đang tải cấu hình dịch vụ của bạn...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Studio Dịch Vụ & Bảng Giá
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
              Booster Studio
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Tự do cấu hình các tựa game, tự đặt tên dịch vụ, định giá theo điểm hoặc trọn gói, và quản lý mã khuyến mãi riêng.
          </p>
        </div>

        <button
          type="button"
          onClick={() => syncAllServices(customServices)}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95 shrink-0"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span>{saving ? 'Đang lưu...' : 'Lưu toàn bộ thay đổi'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TỰA GAME BẠN CÓ THỂ CÀY                                        */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Gamepad2 size={20} className="text-cyan-400" />
              <span>1. Tựa game bạn có thể cày</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Bật các game bạn nhận đơn. Khách hàng sẽ thấy bạn trong danh sách tuyển thủ của tựa game đó.
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-semibold bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-800">
            Đã chọn: <b className="text-cyan-400">{selectedGames.length}</b> game
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {GAMES_CATALOG.map((game) => {
            const isSelected = selectedGames.includes(game.id.toUpperCase());
            const GameIcon = ICON_MAP[game.iconName] || Gamepad2;

            return (
              <div
                key={game.id}
                onClick={() => handleToggleGame(game.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-xl border shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <GameIcon size={16} />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">{game.name}</div>
                    <div className="text-[10px] text-zinc-500">{game.shortName}</div>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1.5 ${
                    isSelected ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-zinc-700 bg-zinc-900'
                  }`}
                >
                  {isSelected && <CheckCircle2 size={12} className="stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: DANH MỤC DỊCH VỤ BẠN CUNG CẤP (THEO GAME ĐANG CHỌN)            */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" />
              <span>2. Danh mục dịch vụ bạn cung cấp ({currentGameDef.name})</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Bật/Tắt và tự do cấu hình bảng giá, tỷ lệ cọc cho từng dịch vụ bạn nhận cày.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 shrink-0"
            >
              <Plus size={15} />
              <span>+ Thêm Dịch Vụ Mới</span>
            </button>

            {selectedGames.length > 1 && (
              <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-x-auto">
                {selectedGames.map((gCode) => {
                  const gObj = GAMES_CATALOG.find((g) => g.id.toUpperCase() === gCode);
                  const isActive = activeGameCode === gCode;
                  return (
                    <button
                      key={gCode}
                      type="button"
                      onClick={() => setActiveGameCode(gCode)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-cyan-500 text-black shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {gObj?.shortName || gCode}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* NẾU CHƯA CÓ DỊCH VỤ NÀO: HIỂN THỊ EMPTY STATE */}
        {currentServices.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-zinc-800/80 bg-zinc-950/40 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
              <Sparkles size={28} />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-white mb-1">
                Chưa có dịch vụ nào cho {currentGameDef.name}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Bạn chưa cấu hình gói dịch vụ nào cho tựa game này. Hãy nhấn nút bên dưới để chọn loại dịch vụ mẫu hoặc tạo gói cày riêng của bạn!
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Plus size={16} />
              <span>+ Thêm Dịch Vụ Mới Ngay</span>
            </button>
          </div>
        ) : (
          /* NẾU CÓ DỊCH VỤ: HIỂN THỊ LƯỚI CARD DỊCH VỤ */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentServices.map((svc) => {
              const isRankTier = svc.pricingType === 'TIER_MATRIX' || svc.slug === 'rank-boost';
              const isPerUnit = svc.pricingType === 'PER_UNIT';
              const isEnabled = svc.isActive;

              return (
                <div
                  key={svc.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isEnabled
                      ? 'bg-zinc-950/80 border-zinc-700/80 shadow-md'
                      : 'bg-zinc-950/40 border-zinc-850 opacity-60'
                  }`}
                >
                  <div>
                    {/* Header: Title + Badges + Edit/Trash/Switch */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-extrabold text-white text-sm truncate">{svc.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                            isRankTier
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                              : isPerUnit
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }`}
                        >
                          {isRankTier ? 'Theo Bậc Rank' : isPerUnit ? `Theo ${svc.unitName || 'Điểm'}` : 'Trọn Gói'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(svc)}
                          title="Chỉnh sửa dịch vụ"
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteService(svc.id, svc.name)}
                          title="Xóa dịch vụ khỏi danh mục của bạn"
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-zinc-800 hover:border-red-500/40 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={isEnabled}
                          onClick={() => handleToggleService(svc.id)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            isEnabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed min-h-[32px]">
                      {svc.desc || 'Dịch vụ do bạn tự cấu hình.'}
                    </p>
                  </div>

                  {/* Body: Config Inputs */}
                  <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                    {/* 1. Trường hợp theo bậc Rank */}
                    {isRankTier && (
                      <>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-zinc-400 font-semibold uppercase text-[10px]">
                              Hệ số giá Booster của bạn
                            </label>
                            <span className="text-cyan-400 font-mono font-bold text-xs">
                              x{svc.multiplier ?? 1.0}
                            </span>
                          </div>
                          <select
                            disabled={!isEnabled}
                            value={svc.multiplier ?? 1.0}
                            onChange={(e) =>
                              handleUpdateServiceField(svc.id, 'multiplier', parseFloat(e.target.value))
                            }
                            className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none"
                          >
                            <option value="0.85">85% (Cạnh tranh - Giá rẻ nhất)</option>
                            <option value="0.9">90% (Giảm 10% - Hút khách đặt)</option>
                            <option value="1.0">100% (Giá chuẩn Sàn - Đề xuất)</option>
                            <option value="1.1">110% (Tăng 10% - Tuyển thủ cao cấp)</option>
                            <option value="1.2">120% (Tăng 20% - Thách Đấu Top đầu)</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowRankTableModal(true)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all"
                        >
                          <span>Tùy chỉnh bảng giá 29 bậc Rank</span>
                          <ArrowRight size={13} />
                        </button>
                      </>
                    )}

                    {/* 2. Trường hợp theo đơn vị / Điểm LP */}
                    {isPerUnit && (
                      <div>
                        <label className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">
                          Đơn giá trên 1 {svc.unitName || 'điểm'} (VNĐ)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="100"
                            min="100"
                            disabled={!isEnabled}
                            value={svc.price || 0}
                            onChange={(e) =>
                              handleUpdateServiceField(svc.id, 'price', parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-2 text-xs text-white font-bold font-mono outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[11px] font-bold">
                            đ / {svc.unitName || 'LP'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 3. Trường hợp trọn gói */}
                    {!isRankTier && !isPerUnit && (
                      <div>
                        <label className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">
                          Giá trọn gói dịch vụ (VNĐ)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="10000"
                            min="10000"
                            disabled={!isEnabled}
                            value={svc.price || 0}
                            onChange={(e) =>
                              handleUpdateServiceField(svc.id, 'price', parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-2 text-xs text-white font-bold font-mono outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[11px] font-bold">
                            VNĐ
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tỷ lệ cọc Escrow giữ chỗ */}
                    <div>
                      <label className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">
                        Tỷ lệ cọc Escrow giữ chỗ
                      </label>
                      <select
                        disabled={!isEnabled}
                        value={svc.depositPercent ?? 100}
                        onChange={(e) =>
                          handleUpdateServiceField(svc.id, 'depositPercent', parseInt(e.target.value))
                        }
                        className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-medium outline-none"
                      >
                        <option value="30">Cọc 30%</option>
                        <option value="50">Cọc 50%</option>
                        <option value="100">Trọn gói 100%</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Thẻ Thêm Dịch Vụ Nhanh (Dashed Card) */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="p-5 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all flex flex-col items-center justify-center gap-2.5 text-zinc-400 hover:text-cyan-400 min-h-[220px] group"
            >
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 group-hover:bg-cyan-500/20 border border-zinc-800 group-hover:border-cyan-500/40 flex items-center justify-center text-zinc-400 group-hover:text-cyan-400 transition-colors shadow-inner">
                <Plus size={22} />
              </div>
              <span className="font-extrabold text-sm text-white group-hover:text-cyan-300">
                + Thêm Dịch Vụ Mới
              </span>
              <span className="text-xs text-zinc-500 text-center max-w-[200px] leading-relaxed">
                Tạo gói cày đặc thù mang dấu ấn riêng của bạn
              </span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CẤU HÌNH PHỤ PHÍ MỞ RỘNG (ADDONS) - ĐẦY ĐỦ 6 TIỆN ÍCH                      */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Sparkles className="text-amber-400 w-4 h-4" />
                <span>Cấu hình mức phụ phí mở rộng (Addons)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bật / Tắt tiện ích bạn hỗ trợ và tùy chỉnh tỷ lệ % phụ phí khi khách đặt cày.
              </p>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 w-fit">
              Tự động áp dụng cho khách hàng
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {/* 1. Tùy chọn vị trí / đường */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Tùy chọn vị trí / đường</span>
                  <span className="text-[10px] text-zinc-400">Top, Rừng, Mid, AD, SP</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addonsConfig.specificRole.enabled}
                  onClick={() => {
                    const updated = {
                      ...addonsConfig,
                      specificRole: {
                        ...addonsConfig.specificRole,
                        enabled: !addonsConfig.specificRole.enabled,
                      },
                    };
                    setAddonsConfig(updated);
                    syncAllServices(customServices, updated);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    addonsConfig.specificRole.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      addonsConfig.specificRole.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Phụ phí cộng thêm
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!addonsConfig.specificRole.enabled}
                    value={addonsConfig.specificRole.percent}
                    onChange={(e) => {
                      const updated = {
                        ...addonsConfig,
                        specificRole: {
                          ...addonsConfig.specificRole,
                          percent: Number(e.target.value) || 0,
                        },
                      };
                      setAddonsConfig(updated);
                      syncAllServices(customServices, updated);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-cyan-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* 2. Đặt lịch cày (Giờ chơi) */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Đặt lịch cày (Giờ chơi)</span>
                  <span className="text-[10px] text-zinc-400">Khung giờ khách chỉ định</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addonsConfig.schedule.enabled}
                  onClick={() => {
                    const updated = {
                      ...addonsConfig,
                      schedule: {
                        ...addonsConfig.schedule,
                        enabled: !addonsConfig.schedule.enabled,
                      },
                    };
                    setAddonsConfig(updated);
                    syncAllServices(customServices, updated);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    addonsConfig.schedule.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      addonsConfig.schedule.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Phụ phí cộng thêm
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!addonsConfig.schedule.enabled}
                    value={addonsConfig.schedule.percent}
                    onChange={(e) => {
                      const updated = {
                        ...addonsConfig,
                        schedule: {
                          ...addonsConfig.schedule,
                          percent: Number(e.target.value) || 0,
                        },
                      };
                      setAddonsConfig(updated);
                      syncAllServices(customServices, updated);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-cyan-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* 3. Tùy chọn tướng */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Tùy chọn tướng</span>
                  <span className="text-[10px] text-zinc-400">Chỉ chơi các tướng khách yêu cầu</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addonsConfig.specificChamps.enabled}
                  onClick={() => {
                    const updated = {
                      ...addonsConfig,
                      specificChamps: {
                        ...addonsConfig.specificChamps,
                        enabled: !addonsConfig.specificChamps.enabled,
                      },
                    };
                    setAddonsConfig(updated);
                    syncAllServices(customServices, updated);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    addonsConfig.specificChamps.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      addonsConfig.specificChamps.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Phụ phí cộng thêm
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!addonsConfig.specificChamps.enabled}
                    value={addonsConfig.specificChamps.percent}
                    onChange={(e) => {
                      const updated = {
                        ...addonsConfig,
                        specificChamps: {
                          ...addonsConfig.specificChamps,
                          percent: Number(e.target.value) || 0,
                        },
                      };
                      setAddonsConfig(updated);
                      syncAllServices(customServices, updated);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-cyan-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* 4. Xem trực tiếp (Livestream) */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Xem trực tiếp</span>
                  <span className="text-[10px] text-zinc-400">Stream riêng tư qua Discord</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addonsConfig.livestream.enabled}
                  onClick={() => {
                    const updated = {
                      ...addonsConfig,
                      livestream: {
                        ...addonsConfig.livestream,
                        enabled: !addonsConfig.livestream.enabled,
                      },
                    };
                    setAddonsConfig(updated);
                    syncAllServices(customServices, updated);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    addonsConfig.livestream.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      addonsConfig.livestream.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Phí dịch vụ cố định (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    disabled={!addonsConfig.livestream.enabled}
                    value={addonsConfig.livestream.fee}
                    onChange={(e) => {
                      const updated = {
                        ...addonsConfig,
                        livestream: {
                          ...addonsConfig.livestream,
                          fee: Number(e.target.value) || 0,
                        },
                      };
                      setAddonsConfig(updated);
                      syncAllServices(customServices, updated);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[11px] font-bold">
                    đ
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Cày siêu tốc */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Cày siêu tốc</span>
                  <span className="text-[10px] text-zinc-400">Ưu tiên hàng đầu, hoàn thành gấp</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addonsConfig.flash.enabled}
                  onClick={() => {
                    const updated = {
                      ...addonsConfig,
                      flash: {
                        ...addonsConfig.flash,
                        enabled: !addonsConfig.flash.enabled,
                      },
                    };
                    setAddonsConfig(updated);
                    syncAllServices(customServices, updated);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    addonsConfig.flash.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      addonsConfig.flash.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Phụ phí cộng thêm
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!addonsConfig.flash.enabled}
                    value={addonsConfig.flash.percent}
                    onChange={(e) => {
                      const updated = {
                        ...addonsConfig,
                        flash: {
                          ...addonsConfig.flash,
                          percent: Number(e.target.value) || 0,
                        },
                      };
                      setAddonsConfig(updated);
                      syncAllServices(customServices, updated);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-cyan-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* 6. Chơi cùng Booster (Duo) */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Chơi cùng Booster</span>
                  <span className="text-[10px] text-zinc-400">Duo trực tiếp, không đưa tài khoản</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addonsConfig.duo.enabled}
                  onClick={() => {
                    const updated = {
                      ...addonsConfig,
                      duo: {
                        ...addonsConfig.duo,
                        enabled: !addonsConfig.duo.enabled,
                      },
                    };
                    setAddonsConfig(updated);
                    syncAllServices(customServices, updated);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    addonsConfig.duo.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      addonsConfig.duo.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Phụ phí cộng thêm
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!addonsConfig.duo.enabled}
                    value={addonsConfig.duo.percent}
                    onChange={(e) => {
                      const updated = {
                        ...addonsConfig,
                        duo: {
                          ...addonsConfig.duo,
                          percent: Number(e.target.value) || 0,
                        },
                      };
                      setAddonsConfig(updated);
                      syncAllServices(customServices, updated);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-cyan-400 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: MÃ GIẢM GIÁ RIÊNG CỦA TUYỂN THỦ (BOOSTER VOUCHER)              */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4 max-w-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Tag size={18} className="text-amber-400" />
              <span>3. Mã Giảm Giá Riêng Của Bạn</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tạo mã ưu đãi độc quyền dành riêng cho khách hàng quen khi chỉ định bạn làm tuyển thủ cày chính.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={coupon.isActive}
            onClick={() => {
              const updated = { ...coupon, isActive: !coupon.isActive };
              setCoupon(updated);
              syncAllServices(customServices, addonsConfig, updated);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
              coupon.isActive ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                coupon.isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
              Ký hiệu mã giảm giá
            </label>
            <input
              type="text"
              placeholder="VD: PRO10, CHAOCHIEN"
              value={coupon.code}
              onChange={(e) => {
                const updated = { ...coupon, code: e.target.value.toUpperCase() };
                setCoupon(updated);
              }}
              onBlur={() => syncAllServices(customServices, addonsConfig, coupon)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
              Tỷ lệ giảm giá (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="50"
                value={coupon.discountPercent}
                onChange={(e) => {
                  const updated = { ...coupon, discountPercent: Number(e.target.value) || 10 };
                  setCoupon(updated);
                }}
                onBlur={() => syncAllServices(customServices, addonsConfig, coupon)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-cyan-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 text-xs font-bold">
                %
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl text-[11px] text-zinc-400">
          💡 Mã giảm giá này sẽ được tự động gợi ý và áp dụng cho khách hàng khi họ chọn bạn làm tuyển thủ cày trong bước đặt đơn.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: BẢNG GIÁ 29 BẬC RANK (OVERRIDE STEP PRICES)                       */}
      {/* ========================================================================= */}
      {showRankTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Trophy size={18} className="text-amber-400" />
                  <span>Bảng Giá 29 Bậc Rank LMHT (Sắt IV → Cao Thủ)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Bạn có thể để trống để dùng giá chuẩn sàn nhân hệ số, hoặc nhập số tiền để tùy chỉnh từng bước.
                </p>
              </div>
              <button
                onClick={() => setShowRankTableModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LOL_RANK_STEPS.slice(0, -1).map((step, idx) => {
                  const nextStep = LOL_RANK_STEPS[idx + 1];
                  const currentOverride = stepOverrides[step.id];

                  return (
                    <div
                      key={step.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                    >
                      <div className="text-xs font-semibold text-zinc-300">
                        {step.label} → {nextStep.label}
                      </div>

                      <div className="relative w-28">
                        <input
                          type="number"
                          placeholder={step.stepPrice.toLocaleString('vi-VN')}
                          value={currentOverride || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setStepOverrides((prev) => {
                              const updated = { ...prev };
                              if (isNaN(val) || val <= 0) {
                                delete updated[step.id];
                              } else {
                                updated[step.id] = val;
                              }
                              return updated;
                            });
                          }}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold text-right outline-none focus:border-cyan-500"
                        />
                        <span className="text-[10px] text-zinc-500 absolute right-8 top-1/2 -translate-y-1/2">
                          đ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setStepOverrides({});
                  syncAllServices(customServices, addonsConfig, coupon, {});
                }}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Đặt lại về giá mặc định
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRankTableModal(false);
                  syncAllServices(customServices, addonsConfig, coupon, stepOverrides);
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-black text-xs"
              >
                Xong & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: THÊM / SỬA GÓI DỊCH VỤ                                          */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-cyan-400" />
                <span>{editingServiceId ? 'Sửa Gói Dịch Vụ' : 'Thêm Gói Dịch Vụ Mới'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs">
              {/* Dropdown Mẫu Dịch Vụ (Service Type) */}
              <div>
                <label className="text-zinc-400 font-bold uppercase block mb-1">
                  Chọn Loại Hình Dịch Vụ
                </label>
                <select
                  value={selectedTemplateSlug}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full bg-zinc-950 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none focus:border-cyan-400 shadow-inner"
                >
                  <optgroup label={`Mẫu gợi ý cho ${currentGameDef.name}`}>
                    {availableTemplates.map((tpl) => (
                      <option key={tpl.slug} value={tpl.slug}>
                        {tpl.name} ({tpl.pricingType === 'TIER_MATRIX' ? 'Theo Bậc Rank' : tpl.pricingType === 'PER_UNIT' ? `Theo ${tpl.unitName || 'Điểm'}` : 'Trọn Gói'})
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">-- Gói Dịch Vụ Tùy Chỉnh Khác --</option>
                </select>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Chọn mẫu để tự động điền cấu hình chuẩn, bạn có thể chỉnh sửa lại tên và giá bên dưới.
                </p>
              </div>

              {/* Tên Dịch Vụ */}
              <div>
                <label className="text-zinc-400 font-bold uppercase block mb-1">Tên Dịch Vụ (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cày Rank / Elo Siêu Tốc, Cày Cấp Độ 1-30..."
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-semibold outline-none focus:border-cyan-500"
                />
              </div>

              {/* Mô Tả */}
              <div>
                <label className="text-zinc-400 font-bold uppercase block mb-1">Mô Tả Gói Cày</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả cam kết thời gian, tỷ lệ thắng, hỗ trợ..."
                  value={formData.desc || ''}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-cyan-500"
                />
              </div>

              {/* Tựa Game & Kiểu tính giá */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold uppercase block mb-1">Tựa Game</label>
                  <select
                    value={formData.gameCode || activeGameCode}
                    onChange={(e) => setFormData({ ...formData, gameCode: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none"
                  >
                    {GAMES_CATALOG.map((g) => (
                      <option key={g.id} value={g.id.toUpperCase()}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 font-bold uppercase block mb-1">Hình Thức Tính Giá</label>
                  <select
                    value={formData.pricingType || 'FIXED'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricingType: e.target.value as any,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500"
                  >
                    <option value="TIER_MATRIX">Theo Bậc Rank (Sắt → Cao Thủ)</option>
                    <option value="PER_UNIT">Theo Điểm / Số Trận / Theo Giờ</option>
                    <option value="FIXED">Trọn Gói Cố Định</option>
                  </select>
                </div>
              </div>

              {/* Cấu hình giá tùy theo hình thức */}
              {formData.pricingType === 'TIER_MATRIX' ? (
                <div>
                  <label className="text-zinc-400 font-bold uppercase block mb-1">Hệ Số Giá Của Bạn</label>
                  <select
                    value={formData.multiplier ?? 1.0}
                    onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white font-bold outline-none focus:border-cyan-500"
                  >
                    <option value="0.85">85% (Cạnh tranh - Giá rẻ nhất)</option>
                    <option value="0.9">90% (Giảm 10% - Hút khách)</option>
                    <option value="1.0">100% (Giá chuẩn Sàn - Đề xuất)</option>
                    <option value="1.1">110% (Tăng 10% - Tuyển thủ cao cấp)</option>
                    <option value="1.2">120% (Tăng 20% - Thách Đấu Top đầu)</option>
                  </select>
                </div>
              ) : formData.pricingType === 'PER_UNIT' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                    <input
                      type="text"
                      placeholder="VD: Điểm LP, Giờ học, Trận"
                      value={formData.unitName || ''}
                      onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Giá (VNĐ)</label>
                    <input
                      type="number"
                      min="100"
                      value={formData.price || 0}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-zinc-400 font-bold uppercase block mb-1">Giá Trọn Gói (VNĐ)</label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Tỷ lệ cọc giữ chỗ */}
              <div>
                <label className="text-zinc-400 font-bold uppercase block mb-1">Tỷ Lệ Cọc Escrow</label>
                <select
                  value={formData.depositPercent ?? 100}
                  onChange={(e) => setFormData({ ...formData, depositPercent: parseInt(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500"
                >
                  <option value="30">Cọc 30% giữ chỗ</option>
                  <option value="50">Cọc 50%</option>
                  <option value="100">Thanh toán trọn gói 100%</option>
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold shadow-md transition-all active:scale-95"
                >
                  {editingServiceId ? 'Cập Nhật Gói' : 'Tạo Dịch Vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
