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
  ArrowLeft,
  TrendingUp,
  Medal,
  Users,
  type LucideIcon,
  HelpCircle,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  GAMES_CATALOG,
  STANDARD_SERVICE_TEMPLATES,
  getServiceMeta,
  ServiceTemplate,
} from '@/lib/games';
import {
  LOL_RANK_STEPS,
  VALORANT_RANK_STEPS,
  getRankSteps,
  getRankImage,
  getPointBoostTiers,
  PointBoostTierSegment,
} from '@/lib/rank-calculator';

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

export interface TierRates {
  master?: number;
  grandmaster?: number;
  challenger?: number;
  immortal1_2?: number;
  immortal2_3?: number;
  immortal3_radiant?: number;
  radiant_top100?: number;
  [key: string]: number | undefined;
}

export interface CustomService {
  id: string;
  gameCode: string;
  serviceType: string;
  slug: string;
  name: string;
  desc: string;
  pricingType: 'TIER_MATRIX' | 'TIER_PER_POINT' | 'PER_UNIT' | 'FIXED';
  price: number;
  unitName?: string;
  depositPercent: number;
  stepOverrides?: Record<string, number>;
  tierRates?: TierRates;
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

  // 4. Bảng giá rank chi tiết (toàn cục nếu cần override)
  const [stepOverrides, setStepOverrides] = useState<Record<string, number>>({});
  const [showRankTableModal, setShowRankTableModal] = useState(false);
  const [activeRankEditingServiceId, setActiveRankEditingServiceId] = useState<string | null>(null);

  // 5. Mã giảm giá riêng của Booster
  const [coupon, setCoupon] = useState<BoosterCoupon>({
    code: '',
    discountPercent: 10,
    isActive: false,
  });

  // 6. Danh mục loại hình dịch vụ có sẵn lấy từ API
  const [availableServiceTypes, setAvailableServiceTypes] = useState<any[]>([]);

  // Modal Thêm / Sửa dịch vụ 2 bước
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CustomService>({
    id: '',
    gameCode: 'LOL',
    serviceType: 'rank-boost',
    slug: 'rank-boost',
    name: 'Cày Rank / Elo Siêu Tốc',
    desc: 'Leo rank bước nhảy từ Sắt IV đến Cao Thủ với tỷ lệ thắng cao và hoàn thành nhanh chóng.',
    pricingType: 'TIER_MATRIX',
    price: 0,
    unitName: 'Điểm LP',
    depositPercent: 100,
    stepOverrides: {},
    tierRates: {
      master: 1000,
      grandmaster: 1500,
      challenger: 2000,
    },
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
    updatedSelectedGames?: string[],
    options?: { showToast?: boolean; successMessage?: string }
  ) => {
    try {
      setSaving(true);
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
        addonsConfig: addons,
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

      const resJson = await res.json().catch(() => null);

      if (options?.showToast) {
        toast.success(
          options.successMessage || resJson?.message || 'Đã lưu cấu hình dịch vụ thành công!'
        );
      }
    } catch (err) {
      console.error('Lỗi sync service settings:', err);
      toast.error('Không thể đồng bộ dữ liệu lên máy chủ');
    } finally {
      setSaving(false);
    }
  };

  // 1. Tải danh mục Loại Hình Dịch Vụ từ API
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const res = await fetch(`/api/boosters/service-types?gameCode=${activeGameCode}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            setAvailableServiceTypes(json.data);
            return;
          }
        }
      } catch (err) {
        console.error('Lỗi tải service types:', err);
      }
      // Fallback nếu API chưa trả về
      const fallback = STANDARD_SERVICE_TEMPLATES[activeGameCode] || STANDARD_SERVICE_TEMPLATES['LOL'] || [];
      setAvailableServiceTypes(fallback);
    };

    fetchServiceTypes();
  }, [activeGameCode]);

  // 2. Load cài đặt hiện tại của Booster từ backend
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

          const addons = s.addonsConfig || s.standardConfig?.addonsConfig;
          if (addons) {
            setAddonsConfig((prev) => ({
              ...prev,
              ...addons,
            }));
          }

          const steps = s.stepOverrides || s.standardConfig?.stepOverrides;
          if (steps) {
            setStepOverrides(steps);
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

  // Xóa dịch vụ khỏi danh mục của Booster (vĩnh viễn khỏi DB)
  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    const updated = customServices.filter((s) => s.id !== serviceId);
    setCustomServices(updated);
    toast.success(`Đã xóa dịch vụ "${serviceName}"!`);
    await syncAllServices(updated);
  };

  // Khi đổi tựa game trong Modal thêm/sửa dịch vụ
  const handleGameChangeInModal = async (newGameCode: string) => {
    const code = newGameCode.toUpperCase();
    const fallbackTemplates =
      STANDARD_SERVICE_TEMPLATES[code] || STANDARD_SERVICE_TEMPLATES['UNIVERSAL'] || [];
    setAvailableServiceTypes(fallbackTemplates);

    try {
      const res = await fetch(`/api/boosters/service-types?gameCode=${code}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          setAvailableServiceTypes(json.data);
        }
      }
    } catch (e) {
      // fallback already set
    }

    const firstTpl = fallbackTemplates[0] || {
      slug: 'rank-boost',
      name: 'Cày Rank Xếp Hạng',
      desc: 'Dịch vụ leo rank',
      pricingType: 'TIER_MATRIX',
      defaultPrice: 0,
      depositPercent: 100,
      iconName: 'Trophy',
    };

    setFormData((prev) => ({
      ...prev,
      gameCode: code,
      serviceType: firstTpl.serviceType || firstTpl.slug || 'rank-boost',
      slug: firstTpl.slug || firstTpl.serviceType || 'rank-boost',
      name: firstTpl.name,
      desc: firstTpl.desc,
      pricingType: firstTpl.pricingType || 'TIER_MATRIX',
      price: firstTpl.defaultPrice || 0,
      unitName: firstTpl.unitName || (code === 'VALORANT' ? 'Điểm RR' : 'Điểm LP'),
      depositPercent: firstTpl.depositPercent ?? (firstTpl.serviceType === 'net-wins' ? 40 : 100),
      stepOverrides: {},
    }));
  };

  // Mở modal Thêm Dịch Vụ Mới
  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setModalStep(1);

    const templates =
      STANDARD_SERVICE_TEMPLATES[activeGameCode] || STANDARD_SERVICE_TEMPLATES['UNIVERSAL'] || [];
    setAvailableServiceTypes(templates);

    const firstTpl = templates[0] || {
      serviceType: 'rank-boost',
      slug: 'rank-boost',
      name: 'Cày Rank / Elo Siêu Tốc',
      desc: 'Leo rank bước nhảy với tỷ lệ thắng cao và hoàn thành nhanh chóng.',
      pricingType: 'TIER_MATRIX',
      depositPercent: 100,
    };

    const isVal = activeGameCode.toUpperCase() === 'VALORANT';
    const initialTierRates: TierRates = isVal
      ? { immortal1_2: 5000, immortal2_3: 7000, immortal3_radiant: 10000, radiant_top100: 20000 }
      : { master: 1000, grandmaster: 1500, challenger: 2000 };

    setFormData({
      id: `srv_${activeGameCode.toLowerCase()}_${firstTpl.serviceType || 'rank-boost'}_${Date.now()}`,
      gameCode: activeGameCode,
      serviceType: firstTpl.serviceType || firstTpl.slug || 'rank-boost',
      slug: firstTpl.slug || firstTpl.serviceType || 'rank-boost',
      name: firstTpl.name || 'Cày Rank / Elo Siêu Tốc',
      desc: firstTpl.desc || '',
      pricingType: firstTpl.pricingType || 'TIER_MATRIX',
      price: firstTpl.defaultPrice || 0,
      unitName: firstTpl.unitName || (isVal ? 'Điểm RR' : 'Điểm LP'),
      depositPercent: firstTpl.depositPercent ?? (firstTpl.serviceType === 'net-wins' ? 40 : 100),
      stepOverrides: {},
      tierRates: initialTierRates,
      isActive: true,
    });

    setIsModalOpen(true);
  };

  // Mở modal Sửa Dịch Vụ
  const handleOpenEditModal = (svc: CustomService) => {
    setEditingServiceId(svc.id);
    setModalStep(1);
    const svcGame = (svc.gameCode || activeGameCode).toUpperCase();
    const isVal = svcGame === 'VALORANT';
    const templates = STANDARD_SERVICE_TEMPLATES[svcGame] || STANDARD_SERVICE_TEMPLATES['UNIVERSAL'] || [];
    setAvailableServiceTypes(templates);

    let cleanName = svc.name;
    if (isVal && (cleanName.includes('Cao Thủ') || cleanName.includes('LP') || cleanName.toLowerCase() === 'cày điểm ...' || cleanName === 'Cày Điểm')) {
      cleanName = 'Cày Điểm RR (Immortal / Radiant)';
    }
    let cleanDesc = svc.desc || '';
    if (isVal && (cleanDesc.includes('Cao Thủ') || cleanDesc.includes('LP') || cleanDesc.includes('Đại Cao Thủ'))) {
      cleanDesc = 'Cày điểm xếp hạng Rank Rating (RR) bậc Immortal và Radiant theo điểm số.';
    }
    const cleanUnit = isVal ? 'Điểm RR' : (svc.unitName || 'Điểm LP');

    setFormData({
      ...svc,
      gameCode: svcGame,
      name: cleanName,
      desc: cleanDesc,
      unitName: cleanUnit,
    });
    setIsModalOpen(true);
  };

  // Xử lý khi chọn một Mẫu Dịch Vụ trong Bước 1
  const handleSelectTemplate = (selectedType: string) => {
    if (selectedType === 'custom') {
      setFormData((prev) => ({
        ...prev,
        serviceType: 'custom',
        slug: 'custom',
        name: prev.name || 'Gói Cày Tùy Chỉnh',
        desc: prev.desc || 'Gói cày thuê đặc thù theo yêu cầu khách hàng.',
        pricingType: 'FIXED',
        price: prev.price || 150000,
        depositPercent: 100,
      }));
      return;
    }

    const tpl = availableServiceTypes.find(
      (t) => (t.serviceType || t.slug) === selectedType
    );

    if (tpl) {
      setFormData((prev) => ({
        ...prev,
        serviceType: tpl.serviceType || tpl.slug,
        slug: tpl.slug || tpl.serviceType,
        name: tpl.name,
        desc: tpl.desc,
        pricingType: tpl.pricingType,
        price: tpl.defaultPrice || 0,
        unitName: tpl.unitName || (prev.gameCode === 'VALORANT' ? 'Điểm RR' : 'Điểm LP'),
        depositPercent: tpl.depositPercent ?? (tpl.serviceType === 'net-wins' ? 40 : 100),
        tierRates: tpl.tierRates || prev.tierRates || (prev.gameCode === 'VALORANT' ? {
          immortal1_2: 5000,
          immortal2_3: 7000,
          immortal3_radiant: 10000,
          radiant_top100: 20000,
        } : {
          master: 1000,
          grandmaster: 1500,
          challenger: 2000,
        }),
      }));
    }
  };

  // Chuyển sang Bước 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Vui lòng nhập tên dịch vụ');
      return;
    }
    setModalStep(2);
  };

  // Hoàn tất lưu Modal ở Bước 2
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList: CustomService[];

    if (editingServiceId) {
      // Sửa dịch vụ
      updatedList = customServices.map((s) => {
        if (s.id === editingServiceId) {
          return {
            ...s,
            ...formData,
            name: formData.name.trim(),
            desc: formData.desc?.trim() || '',
          };
        }
        return s;
      });
      toast.success(`Đã cập nhật dịch vụ "${formData.name}"!`);
    } else {
      // Thêm mới dịch vụ
      const newService: CustomService = {
        ...formData,
        id: `srv_${activeGameCode.toLowerCase()}_${formData.serviceType}_${Date.now()}`,
        name: formData.name.trim(),
        desc: formData.desc?.trim() || '',
        isActive: true,
      };

      updatedList = [...customServices, newService];
      toast.success(`Đã tạo và kích hoạt dịch vụ "${newService.name}"!`);
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
            Tự do cấu hình từng dịch vụ nhận cày, bảng giá chi tiết từng bậc rank và mức phụ phí tiện ích riêng.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            syncAllServices(customServices, addonsConfig, coupon, stepOverrides, selectedGames, {
              showToast: true,
              successMessage: 'Đã lưu toàn bộ cấu hình dịch vụ thành công!',
            })
          }
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
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
      {/* SECTION 2: DANH MỤC DỊCH VỤ BẠN CUNG CẤP                                   */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-6">
        {/* HÀNG 1: HEADER & NÚT THÊM DỊCH VỤ ĐỘC LẬP */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" />
              <span>2. Danh mục dịch vụ bạn cung cấp</span>
              <span className="text-cyan-400 font-bold">({currentGameDef.name})</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Bật/Tắt và tự do cấu hình bảng giá, tỷ lệ cọc cho từng dịch vụ bạn nhận cày.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-md shadow-cyan-500/20 transition-all active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Plus size={15} className="stroke-[3]" />
            <span>+ Thêm Dịch Vụ Mới</span>
          </button>
        </div>

        {/* HÀNG 2: GAME SWITCHER BAR KHI BOOSTER CHỌN NHIỀU GAME */}
        {selectedGames.length > 1 && (
          <div className="space-y-2 pb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                <span>Chọn tựa game để cấu hình dịch vụ:</span>
                <strong className="text-cyan-300 font-bold font-mono">
                  {currentGameDef.name}
                </strong>
              </span>
              <span className="text-zinc-500 font-mono text-[11px]">
                {selectedGames.length} tựa game đã chọn
              </span>
            </div>

            <div className="p-1.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {selectedGames.map((gCode) => {
                const gObj = GAMES_CATALOG.find((g) => g.id.toUpperCase() === gCode);
                const isActive = activeGameCode === gCode;
                const serviceCount = customServices.filter(
                  (s) => (s.gameCode || 'LOL').toUpperCase() === gCode
                ).length;

                return (
                  <button
                    key={gCode}
                    type="button"
                    onClick={() => setActiveGameCode(gCode)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-300'
                        : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <span>{gObj?.shortName || gCode}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive
                          ? 'bg-black/20 text-black font-black'
                          : serviceCount > 0
                          ? 'bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {serviceCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                Bạn chưa cấu hình gói dịch vụ nào cho tựa game này. Bấm nút bên dưới để chọn loại dịch vụ và cấu hình giá chi tiết!
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
              const svcGame = (svc.gameCode || activeGameCode || 'LOL').toUpperCase();
              const isVal = svcGame === 'VALORANT';
              const isRankBoost = svc.serviceType === 'rank-boost' || svc.pricingType === 'TIER_MATRIX';
              const isPointBoost = svc.serviceType === 'net-wins' || svc.pricingType === 'TIER_PER_POINT';
              const isPerUnit = svc.pricingType === 'PER_UNIT';
              const isEnabled = svc.isActive;

              // Tên hiển thị chuẩn xác (chuẩn hóa tên phù hợp với game)
              let displayName = svc.name;
              if (isVal && (displayName.includes('Cao Thủ') || displayName.includes('Thách Đấu') || displayName.includes('LP') || displayName === 'Cày Điểm ...' || displayName === 'Cày Điểm')) {
                displayName = 'Cày Điểm RR (Immortal / Radiant)';
              }

              // Đơn vị điểm (RR đối với Valorant, LP đối với LOL)
              const pointUnit = isVal ? 'Điểm RR' : 'Điểm LP';
              const badgeText = isRankBoost
                ? 'Bậc Rank'
                : isPointBoost
                ? `Theo ${pointUnit}`
                : isPerUnit
                ? `Theo ${svc.unitName || 'Đơn vị'}`
                : 'Trọn Gói';

              // Mô tả hiển thị phù hợp game
              let displayDesc = svc.desc || 'Dịch vụ do bạn tự cấu hình.';
              if (isVal && (displayDesc.includes('Cao Thủ') || displayDesc.includes('LP') || displayDesc.includes('Đại Cao Thủ'))) {
                displayDesc = 'Cày điểm xếp hạng Rank Rating (RR) bậc Immortal và Radiant theo điểm số.';
              }

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
                        <span className="font-extrabold text-white text-sm" title={displayName}>{displayName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                            isRankBoost
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                              : isPointBoost
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : isPerUnit
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }`}
                        >
                          {badgeText}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(svc)}
                          title="Chỉnh sửa dịch vụ & giá"
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
                      {displayDesc}
                    </p>
                  </div>

                  {/* Body: Hiển thị bảng giá chi tiết tương ứng */}
                  <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                    {/* TRƯỜNG HỢP 1: CÀY RANK THEO BẬC (SẮT -> CAO THỦ / VALORANT) */}
                    {isRankBoost && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Hình thức thanh toán:</span>
                          <span className="text-emerald-400 font-bold">Trọn gói 100% Escrow</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRankEditingServiceId(svc.id);
                            setShowRankTableModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-950/40 hover:bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all shadow-inner"
                        >
                          <Trophy size={14} className="text-amber-400" />
                          <span>Xem & Sửa bảng giá {getRankSteps(svc.gameCode).length} bậc Rank</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    )}

                    {/* TRƯỜNG HỢP 2: CÀY ĐIỂM (LP HOẶC RR THEO TỪNG PHÂN KHÚC) */}
                    {isPointBoost && (() => {
                      const pointTiers = getPointBoostTiers(svc.gameCode);
                      return (
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5 text-xs">
                            {pointTiers.map((tier) => {
                              const rate = svc.tierRates?.[tier.id] ?? tier.defaultPrice;
                              return (
                                <div key={tier.id} className="flex justify-between items-center">
                                  <span className="text-zinc-400 font-medium">{tier.label}:</span>
                                  <span className="text-amber-400 font-mono font-bold">
                                    {rate.toLocaleString('vi-VN')} đ / {tier.unit}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-zinc-400">Tỷ lệ cọc giữ chỗ:</span>
                            <span className="text-cyan-400 font-bold font-mono">
                              {svc.depositPercent === 100 ? 'Trọn gói 100%' : `Cọc ${svc.depositPercent}%`}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* TRƯỜNG HỢP 3: TRỌN GÓI CỐ ĐỊNH (PHÂN HẠNG / CHUỖI / CẤP ĐỘ) */}
                    {!isRankBoost && !isPointBoost && !isPerUnit && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                          <span className="text-xs text-zinc-400">Giá trọn gói:</span>
                          <span className="text-sm font-extrabold font-mono text-emerald-400">
                            {(svc.price || 0).toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Thanh toán:</span>
                          <span className="text-zinc-300 font-semibold">Trọn gói 100%</span>
                        </div>
                      </div>
                    )}

                    {/* TRƯỜNG HỢP 4: THEO ĐƠN VỊ (COACHING / THÔNG THẠO) */}
                    {isPerUnit && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                          <span className="text-xs text-zinc-400">Đơn giá:</span>
                          <span className="text-sm font-extrabold font-mono text-purple-400">
                            {(svc.price || 0).toLocaleString('vi-VN')} đ / {svc.unitName || 'Giờ'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Tỷ lệ cọc:</span>
                          <span className="text-amber-400 font-bold">
                            {svc.depositPercent === 100 ? 'Trọn gói 100%' : `Cọc ${svc.depositPercent}%`}
                          </span>
                        </div>
                      </div>
                    )}
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
                Thêm Dịch Vụ Mới
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
      {/* SECTION 3: MÃ GIẢM GIÁ RIÊNG CỦA TUYỂN THỦ                                */}
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
      {/* MODAL 1: BẢNG GIÁ BẬC RANK CHO DỊCH VỤ CÀY RANK                             */}
      {/* ========================================================================= */}
      {showRankTableModal && (() => {
        const activeEditingService = activeRankEditingServiceId
          ? customServices.find((s) => s.id === activeRankEditingServiceId)
          : null;
        const modalGameCode = (activeEditingService?.gameCode || activeGameCode || 'LOL').toUpperCase();
        const currentRankSteps = getRankSteps(modalGameCode);
        const gameDef = GAMES_CATALOG.find((g) => g.id.toUpperCase() === modalGameCode);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy size={18} className="text-amber-400" />
                    <span>
                      Bảng Giá Bậc Rank {gameDef?.name || modalGameCode} ({currentRankSteps[0]?.label} → {currentRankSteps[currentRankSteps.length - 1]?.label})
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Tùy chỉnh số tiền thực tế nhận cho từng bước nhảy rank (để trống để dùng giá sàn đề xuất).
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {currentRankSteps.slice(0, -1).map((step, idx) => {
                    const nextStep = currentRankSteps[idx + 1];
                    const currentOverride = activeRankEditingServiceId
                      ? customServices.find((s) => s.id === activeRankEditingServiceId)?.stepOverrides?.[step.id]
                      : stepOverrides[step.id];
                    const stepImg = getRankImage(modalGameCode, step);
                    const nextImg = getRankImage(modalGameCode, nextStep);

                    return (
                      <div
                        key={step.id}
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2.5 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 min-w-0 whitespace-nowrap overflow-hidden">
                          <img src={stepImg} alt={step.label} className="w-5 h-5 object-contain shrink-0" />
                          <span className="whitespace-nowrap shrink-0">{step.label}</span>
                          <span className="text-zinc-500 shrink-0 mx-0.5">➔</span>
                          <img src={nextImg} alt={nextStep.label} className="w-5 h-5 object-contain shrink-0" />
                          <span className="whitespace-nowrap shrink-0">{nextStep.label}</span>
                        </div>

                        <div className="relative w-24 shrink-0">
                          <input
                            type="number"
                            placeholder={step.stepPrice.toLocaleString('vi-VN')}
                            value={currentOverride || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (activeRankEditingServiceId) {
                                const updated = customServices.map((s) => {
                                  if (s.id === activeRankEditingServiceId) {
                                    const steps = { ...(s.stepOverrides || {}) };
                                    if (isNaN(val) || val <= 0) {
                                      delete steps[step.id];
                                    } else {
                                      steps[step.id] = val;
                                    }
                                    return { ...s, stepOverrides: steps };
                                  }
                                  return s;
                                });
                                setCustomServices(updated);
                              } else {
                                setStepOverrides((prev) => {
                                  const updated = { ...prev };
                                  if (isNaN(val) || val <= 0) {
                                    delete updated[step.id];
                                  } else {
                                    updated[step.id] = val;
                                  }
                                  return updated;
                                });
                              }
                            }}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pr-5 pl-2 py-1 text-xs text-white font-mono font-bold text-right outline-none focus:border-cyan-500"
                          />
                          <span className="text-[10px] text-zinc-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
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
                    if (activeRankEditingServiceId) {
                      const updated = customServices.map((s) => {
                        if (s.id === activeRankEditingServiceId) {
                          return { ...s, stepOverrides: {} };
                        }
                        return s;
                      });
                      setCustomServices(updated);
                      syncAllServices(updated);
                    } else {
                      setStepOverrides({});
                      syncAllServices(customServices, addonsConfig, coupon, {});
                    }
                    toast.success('Đã đặt lại về bảng giá chuẩn sàn!');
                  }}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Đặt lại về giá sàn mặc định
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRankTableModal(false);
                    syncAllServices(customServices, addonsConfig, coupon, stepOverrides, selectedGames, {
                      showToast: true,
                      successMessage: 'Đã lưu bảng giá bậc rank thành công!',
                    });
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-black text-xs cursor-pointer"
                >
                  Xong & Lưu Bảng Giá
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 2: THÊM / SỬA DỊCH VỤ - QUY TRÌNH 2 BƯỚC MẠCH LẠC                   */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs">
                  {modalStep}/2
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingServiceId ? 'Sửa Gói Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {modalStep === 1
                      ? 'Bước 1: Cấu hình thông tin dịch vụ cơ bản'
                      : 'Bước 2: Cấu hình bảng giá chi tiết cho từng bậc'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* BƯỚC 1: CẤU HÌNH DỊCH VỤ CƠ BẢN */}
            {modalStep === 1 && (
              <form onSubmit={handleProceedToStep2} className="p-6 space-y-4 text-xs overflow-y-auto">
                {/* 1. Tựa Game áp dụng */}
                <div>
                  <label className="text-zinc-400 font-bold uppercase block mb-1">
                    Tựa Game Áp Dụng <span className="text-cyan-400 font-normal">(*Mẫu dịch vụ sẽ tự động thích ứng)</span>
                  </label>
                  <select
                    value={formData.gameCode || activeGameCode}
                    onChange={(e) => handleGameChangeInModal(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none focus:border-cyan-500 shadow-inner"
                  >
                    {GAMES_CATALOG.map((g) => (
                      <option key={g.id} value={g.id.toUpperCase()}>
                        {g.name} ({g.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Chọn loại hình dịch vụ lấy từ API/chuẩn sàn theo từng game */}
                <div>
                  <label className="text-zinc-400 font-bold uppercase block mb-1">
                    Chọn Loại Hình Dịch Vụ
                  </label>
                  <select
                    value={formData.serviceType || 'rank-boost'}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="w-full bg-zinc-950 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none focus:border-cyan-400 shadow-inner"
                  >
                    <optgroup
                      label={`Danh mục dịch vụ chuẩn (${
                        GAMES_CATALOG.find(
                          (g) => g.id.toUpperCase() === (formData.gameCode || activeGameCode).toUpperCase()
                        )?.shortName || (formData.gameCode || activeGameCode)
                      })`}
                    >
                      {availableServiceTypes.map((tpl) => (
                        <option key={tpl.serviceType || tpl.slug} value={tpl.serviceType || tpl.slug}>
                          {tpl.name}
                        </option>
                      ))}
                    </optgroup>
                    <option value="custom">-- Gói Dịch Vụ Tùy Chỉnh Khác --</option>
                  </select>
                </div>

                {/* Tên Dịch Vụ (*) */}
                <div>
                  <label className="text-zinc-400 font-bold uppercase block mb-1">
                    Tên Dịch Vụ <span className="text-red-500 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cày Rank Valorant, Cày Điểm RR..."
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
                    placeholder="Mô tả cam kết thời gian hoàn thành, chất lượng và hỗ trợ..."
                    value={formData.desc || ''}
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-colors cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Tiếp tục: Cấu hình giá</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}

            {/* BƯỚC 2: CẤU HÌNH GIÁ CHO TỪNG BẬC CỦA DỊCH VỤ */}
            {modalStep === 2 && (
              <form onSubmit={handleFinalSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
                <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-zinc-300">
                  <div className="font-bold text-white text-xs mb-0.5">{formData.name}</div>
                  <div className="text-[11px] text-zinc-400">
                    Thiết lập mức giá cụ thể cho từng bậc rank hoặc hình thức cọc của gói dịch vụ này.
                  </div>
                </div>

                {/* TRƯỜNG HỢP 1: CÀY RANK / ELO SIÊU TỐC (THEO NẤC RANK CỦA TỰA GAME) */}
                {formData.serviceType === 'rank-boost' && (() => {
                  const modalGameCode = (formData.gameCode || activeGameCode || 'LOL').toUpperCase();
                  const currentRankSteps = getRankSteps(modalGameCode);

                  return (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>Thanh toán đơn hàng:</span>
                        <span className="text-emerald-400 font-bold">Trọn gói 100% Escrow (Không cọc)</span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-zinc-400 font-bold uppercase block">
                            Bảng Giá {currentRankSteps.length} Bậc Rank ({currentRankSteps[0]?.label} → {currentRankSteps[currentRankSteps.length - 1]?.label})
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, stepOverrides: {} })}
                            className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                          >
                            Dùng giá sàn mặc định
                          </button>
                        </div>

                        <div className="max-h-56 overflow-y-auto border border-zinc-800 rounded-xl p-3 bg-zinc-950 space-y-2">
                          {currentRankSteps.slice(0, -1).map((step, idx) => {
                            const nextStep = currentRankSteps[idx + 1];
                            const overrideVal = formData.stepOverrides?.[step.id];
                            const stepImg = getRankImage(modalGameCode, step);
                            const nextImg = getRankImage(modalGameCode, nextStep);

                            return (
                              <div
                                key={step.id}
                                className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-900 last:border-none gap-2"
                              >
                                <div className="flex items-center gap-2 text-zinc-300 font-medium truncate">
                                  <img src={stepImg} alt={step.label} className="w-5 h-5 object-contain shrink-0" />
                                  <span>{step.label}</span>
                                  <span className="text-zinc-600">➔</span>
                                  <img src={nextImg} alt={nextStep.label} className="w-5 h-5 object-contain shrink-0" />
                                  <span>{nextStep.label}</span>
                                </div>
                                <div className="relative w-28 shrink-0">
                                  <input
                                    type="number"
                                    placeholder={step.stepPrice.toLocaleString('vi-VN')}
                                    value={overrideVal || ''}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      const steps = { ...(formData.stepOverrides || {}) };
                                      if (isNaN(val) || val <= 0) {
                                        delete steps[step.id];
                                      } else {
                                        steps[step.id] = val;
                                      }
                                      setFormData({ ...formData, stepOverrides: steps });
                                    }}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold text-right outline-none focus:border-cyan-500"
                                  />
                                  <span className="text-[10px] text-zinc-500 absolute right-7 top-1/2 -translate-y-1/2">
                                    đ
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TRƯỜNG HỢP 2: CÀY ĐIỂM (LP HOẶC RR THEO TỪNG MỨC RANK + CỌC) */}
                {formData.serviceType === 'net-wins' && (() => {
                  const pointTiers = getPointBoostTiers(formData.gameCode);
                  const isVal = (formData.gameCode || '').toUpperCase() === 'VALORANT';
                  return (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-zinc-400 font-bold uppercase block text-xs">
                            Đơn Giá Cày Điểm {isVal ? 'RR Valorant' : 'LP Liên Minh'} Từng Mức Rank
                          </label>
                          <span className="text-[11px] text-zinc-500">
                            Đơn vị: {isVal ? 'đ / RR' : 'đ / LP'}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {pointTiers.map((tier) => {
                            const currentVal = formData.tierRates?.[tier.id] ?? tier.defaultPrice;
                            return (
                              <div key={tier.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                                <div className="flex items-center gap-2">
                                  <Crown size={15} className="text-amber-400 shrink-0" />
                                  <div>
                                    <span className="font-bold text-white text-xs block">{tier.label}</span>
                                    <span className="text-[10px] text-zinc-500">{tier.desc}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <input
                                    type="number"
                                    min="500"
                                    step="500"
                                    value={currentVal}
                                    onChange={(e) => {
                                      const parsed = parseInt(e.target.value) || 0;
                                      setFormData((prev) => ({
                                        ...prev,
                                        tierRates: {
                                          ...(prev.tierRates || {}),
                                          [tier.id]: parsed,
                                        },
                                      }));
                                    }}
                                    className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold text-right outline-none focus:border-cyan-500"
                                  />
                                  <span className="text-zinc-500 text-[11px] font-bold">đ / {tier.unit}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tỷ lệ cọc riêng cho dịch vụ cày theo điểm */}
                      <div>
                        <label className="text-zinc-400 font-bold uppercase block mb-1 text-xs">
                          Tỷ Lệ Cọc Escrow Giữ Chỗ
                        </label>
                        <select
                          value={formData.depositPercent ?? (isVal ? 40 : 30)}
                          onChange={(e) => setFormData({ ...formData, depositPercent: parseInt(e.target.value) })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                        >
                          <option value="30">Cọc 30% giữ chỗ</option>
                          <option value="40">Cọc 40% giữ chỗ (Khuyên dùng cho cày RR/LP)</option>
                          <option value="50">Cọc 50%</option>
                          <option value="100">Thanh toán trọn gói 100%</option>
                        </select>
                      </div>
                    </div>
                  );
                })()}

                {/* TRƯỜNG HỢP 3: CÁC GÓI TRỌN GÓI CỐ ĐỊNH (PHÂN HẠNG / CHUỖI / CẤP ĐỘ) */}
                {formData.serviceType !== 'rank-boost' && formData.serviceType !== 'net-wins' && formData.pricingType === 'FIXED' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">
                        Giá Trọn Gói Dịch Vụ (VNĐ)
                      </label>
                      <input
                        type="number"
                        min="10000"
                        step="10000"
                        value={formData.price || 0}
                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400">
                      <span>Hình thức thanh toán:</span>
                      <span className="text-emerald-400 font-bold">Trọn gói 100% Escrow</span>
                    </div>
                  </div>
                )}

                {/* TRƯỜNG HỢP 4: THEO ĐƠN VỊ (COACHING / THÔNG THẠO) */}
                {formData.serviceType !== 'rank-boost' && formData.serviceType !== 'net-wins' && formData.pricingType === 'PER_UNIT' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                        <input
                          type="text"
                          placeholder="VD: Giờ học, Cấp độ"
                          value={formData.unitName || ''}
                          onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Giá (VNĐ)</label>
                        <input
                          type="number"
                          min="1000"
                          step="5000"
                          value={formData.price || 0}
                          onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">
                        Tỷ Lệ Cọc Escrow
                      </label>
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
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-800 flex justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Quay lại Bước 1</span>
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold shadow-md transition-all active:scale-95"
                  >
                    <Save size={15} />
                    <span>{editingServiceId ? 'Lưu Thay Đổi' : 'Lưu & Kích Hoạt Dịch Vụ'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
