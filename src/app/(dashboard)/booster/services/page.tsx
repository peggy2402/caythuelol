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
  HelpCircle,
  Sparkles,
  Layers,
  Clock,
  Radio,
  Calendar,
  Compass,
  Zap,
  Target,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { GAMES_CATALOG } from '@/lib/games';
import { LOL_RANK_STEPS } from '@/lib/rank-calculator';

const ICON_MAP: Record<string, LucideIcon> = {
  Swords,
  Gamepad2,
  Crosshair,
  Shield,
  Trophy,
  Flame,
  Target,
  Zap,
  Clock,
};

export interface CustomService {
  id: string;
  gameCode: string;
  name: string;
  desc: string;
  pricingType: 'PER_UNIT' | 'FIXED';
  price: number;
  unitName?: string;
  depositPercent: number;
  requiredFields: string[];
  isActive: boolean;
}

export interface BoosterCoupon {
  code: string;
  discountPercent: number;
  isActive: boolean;
}

export interface ServiceConfigItem {
  isEnabled: boolean;
  price?: number;
  multiplier?: number;
  depositPercent: number;
}

export default function BoosterServicesStudio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Tựa game nhận cày
  const [selectedGames, setSelectedGames] = useState<string[]>(['LOL']);
  const [activeGameCode, setActiveGameCode] = useState<string>('LOL');

  // 2. Cấu hình dịch vụ (hệ thống dynamic theo từng service slug)
  const [servicesConfig, setServicesConfig] = useState<Record<string, ServiceConfigItem>>({
    'rank-boost': { isEnabled: true, multiplier: 1.0, depositPercent: 100 },
    'net-wins': { isEnabled: true, price: 1500, depositPercent: 30 },
    'placements': { isEnabled: true, price: 150000, depositPercent: 100 },
    'promotion': { isEnabled: true, price: 80000, depositPercent: 100 },
    'coaching': { isEnabled: true, price: 100000, depositPercent: 100 },
    'leveling': { isEnabled: true, price: 120000, depositPercent: 100 },
    'mastery': { isEnabled: true, price: 60000, depositPercent: 100 },
  });

  // 3. Cấu hình phụ phí Addons (đầy đủ 6 tiện ích)
  const [addonsConfig, setAddonsConfig] = useState({
    specificRole: { enabled: true, percent: 25 }, // Tùy chọn vị trí / đường
    schedule: { enabled: true, percent: 20 }, // Đặt lịch cày (giờ chơi)
    specificChamps: { enabled: true, percent: 30 }, // Tùy chọn tướng
    livestream: { enabled: true, fee: 349000 }, // Xem trực tiếp
    flash: { enabled: true, percent: 35 }, // Cày siêu tốc
    duo: { enabled: true, percent: 50 }, // Chơi cùng Booster (Duo)
  });

  // 4. Bảng giá rank chi tiết (step overrides)
  const [stepOverrides, setStepOverrides] = useState<Record<string, number>>({});
  const [showRankTableModal, setShowRankTableModal] = useState(false);

  // 5. Dịch vụ tùy chỉnh riêng của Booster
  const [customServices, setCustomServices] = useState<CustomService[]>([]);

  // 6. Mã giảm giá riêng của Booster
  const [coupon, setCoupon] = useState<BoosterCoupon>({
    code: '',
    discountPercent: 10,
    isActive: false,
  });

  // Modal Thêm / Sửa dịch vụ tùy chỉnh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CustomService>>({
    gameCode: 'LOL',
    name: '',
    desc: '',
    pricingType: 'PER_UNIT',
    price: 1500,
    unitName: 'Điểm LP',
    depositPercent: 30,
    requiredFields: ['current_rank', 'desired_rank', 'account_credentials'],
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

          if (s.standardConfig) {
            const sc = s.standardConfig;
            // Map legacy standardConfig fields to dynamic servicesConfig
            setServicesConfig((prev) => ({
              ...prev,
              ...(sc.servicesConfig || {}),
              'rank-boost': {
                isEnabled: sc.rankBoostEnabled ?? prev['rank-boost']?.isEnabled ?? true,
                multiplier: sc.rankPriceMultiplier ?? prev['rank-boost']?.multiplier ?? 1.0,
                depositPercent: sc.rankDepositPercent ?? prev['rank-boost']?.depositPercent ?? 100,
              },
              'net-wins': {
                isEnabled: sc.netWinsEnabled ?? prev['net-wins']?.isEnabled ?? true,
                price: sc.netWinsPricePerLp ?? prev['net-wins']?.price ?? 1500,
                depositPercent: 30,
              },
              'placements': {
                isEnabled: sc.placementsEnabled ?? prev['placements']?.isEnabled ?? true,
                price: 150000,
                depositPercent: 100,
              },
              'coaching': {
                isEnabled: sc.coachingEnabled ?? prev['coaching']?.isEnabled ?? true,
                price: sc.coachingPricePerHour ?? prev['coaching']?.price ?? 100000,
                depositPercent: 100,
              },
            }));

            if (sc.addonsConfig) {
              setAddonsConfig((prev) => ({
                ...prev,
                ...sc.addonsConfig,
                specificRole: sc.addonsConfig.specificRole || prev.specificRole,
                schedule: sc.addonsConfig.schedule || prev.schedule,
              }));
            }

            if (sc.stepOverrides) {
              setStepOverrides(sc.stepOverrides);
            }
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

  // Lưu toàn bộ cài đặt lên máy chủ
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Chuẩn hóa standardConfig để tương thích 100% với backend cũ và mới
      const standardConfig = {
        rankBoostEnabled: servicesConfig['rank-boost']?.isEnabled ?? true,
        rankPriceMultiplier: servicesConfig['rank-boost']?.multiplier ?? 1.0,
        rankDepositPercent: servicesConfig['rank-boost']?.depositPercent ?? 100,
        netWinsEnabled: servicesConfig['net-wins']?.isEnabled ?? true,
        netWinsPricePerLp: servicesConfig['net-wins']?.price ?? 1500,
        placementsEnabled: servicesConfig['placements']?.isEnabled ?? true,
        coachingEnabled: servicesConfig['coaching']?.isEnabled ?? true,
        coachingPricePerHour: servicesConfig['coaching']?.price ?? 100000,
        addonsConfig,
        stepOverrides,
        servicesConfig, // Lưu cấu hình chi tiết theo slug
      };

      const payload = {
        selectedGames,
        standardConfig,
        customServices,
        coupon,
        enabledServices: Object.entries(servicesConfig)
          .filter(([_, cfg]) => cfg.isEnabled)
          .map(([slug]) => slug),
      };

      const res = await fetch('/api/boosters/services', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Không thể lưu cài đặt');
      toast.success('Đã lưu cấu hình dịch vụ, bảng giá và phụ phí thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi lưu cài đặt.');
    } finally {
      setSaving(false);
    }
  };

  // Bật/tắt tựa game
  const handleToggleGame = (gameId: string) => {
    const code = gameId.toUpperCase();
    if (selectedGames.includes(code)) {
      if (selectedGames.length === 1) {
        toast.warning('Bạn cần chọn ít nhất một tựa game');
        return;
      }
      const updated = selectedGames.filter((g) => g !== code);
      setSelectedGames(updated);
      if (activeGameCode === code) {
        setActiveGameCode(updated[0] || 'LOL');
      }
    } else {
      setSelectedGames([...selectedGames, code]);
      setActiveGameCode(code);
    }
  };

  // Bật/tắt một dịch vụ chuẩn
  const handleToggleService = (slug: string) => {
    setServicesConfig((prev) => {
      const current = prev[slug] || { isEnabled: false, depositPercent: 100 };
      return {
        ...prev,
        [slug]: {
          ...current,
          isEnabled: !current.isEnabled,
        },
      };
    });
  };

  // Cập nhật giá / thuộc tính một dịch vụ chuẩn
  const handleUpdateServiceConfig = (slug: string, field: string, value: any) => {
    setServicesConfig((prev) => {
      const current = prev[slug] || { isEnabled: true, depositPercent: 100 };
      return {
        ...prev,
        [slug]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  // Mở modal thêm dịch vụ tùy chỉnh
  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setFormData({
      id: `srv_${Date.now()}`,
      gameCode: activeGameCode,
      name: '',
      desc: '',
      pricingType: 'PER_UNIT',
      price: 1500,
      unitName: 'Điểm LP',
      depositPercent: 30,
      requiredFields: ['current_rank', 'desired_rank', 'account_credentials'],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Mở modal sửa dịch vụ tùy chỉnh
  const handleOpenEditModal = (service: CustomService) => {
    setEditingServiceId(service.id);
    setFormData({ ...service });
    setIsModalOpen(true);
  };

  // Đồng bộ dịch vụ tùy chỉnh lên server ngay lập tức
  const syncCustomServices = async (updatedList: CustomService[]) => {
    try {
      const standardConfig = {
        rankBoostEnabled: servicesConfig['rank-boost']?.isEnabled ?? true,
        rankPriceMultiplier: servicesConfig['rank-boost']?.multiplier ?? 1.0,
        rankDepositPercent: servicesConfig['rank-boost']?.depositPercent ?? 100,
        netWinsEnabled: servicesConfig['net-wins']?.isEnabled ?? true,
        netWinsPricePerLp: servicesConfig['net-wins']?.price ?? 1500,
        placementsEnabled: servicesConfig['placements']?.isEnabled ?? true,
        coachingEnabled: servicesConfig['coaching']?.isEnabled ?? true,
        coachingPricePerHour: servicesConfig['coaching']?.price ?? 100000,
        addonsConfig,
        stepOverrides,
        servicesConfig,
      };

      const payload = {
        selectedGames,
        standardConfig,
        customServices: updatedList,
        coupon,
        enabledServices: Object.entries(servicesConfig)
          .filter(([_, cfg]) => cfg.isEnabled)
          .map(([slug]) => slug),
      };

      await fetch('/api/boosters/services', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Lỗi khi đồng bộ dịch vụ tùy chỉnh lên server:', err);
    }
  };

  // Lưu modal dịch vụ tùy chỉnh
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Vui lòng nhập tên dịch vụ');
      return;
    }

    let updatedList: CustomService[] = [];
    if (editingServiceId) {
      updatedList = customServices.map((s) =>
        s.id === editingServiceId ? ({ ...s, ...formData } as CustomService) : s
      );
      setCustomServices(updatedList);
      toast.success('Đã cập nhật dịch vụ tùy chỉnh');
    } else {
      updatedList = [...customServices, formData as CustomService];
      setCustomServices(updatedList);
      toast.success('Đã thêm dịch vụ tùy chỉnh mới');
    }
    setIsModalOpen(false);

    // Gửi ngay lên server để API xuất hiện trong tab Network và lưu DB tức thì
    await syncCustomServices(updatedList);
  };

  const handleDeleteCustomService = async (id: string) => {
    const updatedList = customServices.filter((s) => s.id !== id);
    setCustomServices(updatedList);
    toast.success('Đã xóa dịch vụ tùy chỉnh');
    await syncCustomServices(updatedList);
  };

  // Lấy danh mục dịch vụ chuẩn của game đang xem
  const currentGameDef =
    GAMES_CATALOG.find((g) => g.id.toUpperCase() === activeGameCode) || GAMES_CATALOG[0];

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-cyan-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
          Đang tải Studio Dịch Vụ & Bảng Giá...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto pt-2 pb-24 px-2 sm:px-4 text-white font-sans space-y-8 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Studio Dịch Vụ & Bảng Giá
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
              Booster Studio
            </span>
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Bật/tắt các gói dịch vụ bạn nhận cày, định giá theo điểm LP hoặc trọn gói, và thiết lập phụ phí Addons minh bạch.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>Lưu Toàn Bộ Thay Đổi</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: LỰA CHỌN TỰA GAME BẠN CÓ THỂ CÀY                               */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
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
      {/* SECTION 2: DANH MỤC DỊCH VỤ & THIẾT LẬP ĐƠN GIÁ (THEO TỰA GAME ĐANG CHỌN)  */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" />
              <span>2. Danh mục dịch vụ bạn cung cấp ({currentGameDef.name})</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Gạt công tắc bật/tắt dịch vụ bạn hỗ trợ. Mỗi loại dịch vụ có cơ chế tính giá tương ứng (Theo bậc Rank, Theo điểm LP hoặc Trọn gói).
            </p>
          </div>

          {/* Game Switcher Tabs if multiple games selected */}
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

        {/* Lưới các dịch vụ chuẩn theo Game */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentGameDef.defaultServices.map((svc) => {
            const config = servicesConfig[svc.slug] || {
              isEnabled: true,
              price: svc.defaultPrice,
              multiplier: 1.0,
              depositPercent: svc.depositPercent || 100,
            };
            const isEnabled = config.isEnabled ?? true;
            const isRankTier = svc.slug === 'rank-boost' || svc.pricingType === 'TIER_MATRIX';
            const isPerUnit = svc.pricingType === 'PER_UNIT' || svc.slug === 'net-wins';

            return (
              <div
                key={svc.slug}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  isEnabled
                    ? 'bg-zinc-950/80 border-zinc-700/80 shadow-md'
                    : 'bg-zinc-950/40 border-zinc-850 opacity-60'
                }`}
              >
                <div>
                  {/* Service Header + Toggle Switch */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{svc.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isRankTier
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            : isPerUnit
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        {isRankTier ? 'Theo Bậc Rank' : isPerUnit ? 'Theo Điểm LP/Đơn Vị' : 'Trọn Gói'}
                      </span>
                    </div>

                    {/* Switch Toggle Button */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      onClick={() => handleToggleService(svc.slug)}
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

                  <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                    {svc.desc}
                  </p>
                </div>

                {/* Service Config Controls */}
                <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                  {/* TRƯỜNG HỢP 1: CÀY RANK THEO BẬC (TIER MATRIX) */}
                  {isRankTier && (
                    <>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-zinc-400 font-semibold uppercase text-[10px]">
                            Hệ số giá Booster của bạn
                          </label>
                          <span className="text-cyan-400 font-mono font-bold text-xs">
                            x{config.multiplier ?? 1.0}
                          </span>
                        </div>
                        <select
                          disabled={!isEnabled}
                          value={config.multiplier ?? 1.0}
                          onChange={(e) =>
                            handleUpdateServiceConfig(svc.slug, 'multiplier', parseFloat(e.target.value))
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

                  {/* TRƯỜNG HỢP 2: CÀY THEO ĐIỂM / THEO ĐƠN VỊ (UNIT BASED) */}
                  {isPerUnit && (
                    <div>
                      <label className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">
                        Đơn giá trên 1 {svc.unitName || 'điểm LP'} (VNĐ)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="100"
                          min="500"
                          max="10000"
                          disabled={!isEnabled}
                          value={config.price ?? 1500}
                          onChange={(e) =>
                            handleUpdateServiceConfig(svc.slug, 'price', parseInt(e.target.value) || 1000)
                          }
                          className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-2 text-xs text-white font-bold font-mono outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[11px] font-bold">
                          đ / {svc.unitName || 'LP'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TRƯỜNG HỢP 3: TRỌN GÓI CỐ ĐỊNH (FIXED PACKAGE) */}
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
                          max="5000000"
                          disabled={!isEnabled}
                          value={config.price ?? svc.defaultPrice}
                          onChange={(e) =>
                            handleUpdateServiceConfig(svc.slug, 'price', parseInt(e.target.value) || 10000)
                          }
                          className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-2 text-xs text-white font-bold font-mono outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[11px] font-bold">
                          VNĐ
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tỷ lệ cọc giữ chỗ */}
                  <div>
                    <label className="text-zinc-400 font-semibold uppercase text-[10px] block mb-1">
                      Tỷ lệ cọc Escrow giữ chỗ
                    </label>
                    <select
                      disabled={!isEnabled}
                      value={config.depositPercent ?? 100}
                      onChange={(e) =>
                        handleUpdateServiceConfig(svc.slug, 'depositPercent', parseInt(e.target.value))
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
        </div>

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
                  onClick={() =>
                    setAddonsConfig({
                      ...addonsConfig,
                      specificRole: {
                        ...addonsConfig.specificRole,
                        enabled: !addonsConfig.specificRole.enabled,
                      },
                    })
                  }
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
                    onChange={(e) =>
                      setAddonsConfig({
                        ...addonsConfig,
                        specificRole: {
                          ...addonsConfig.specificRole,
                          percent: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-cyan-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* 2. Đặt lịch cày */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Đặt lịch cày (Giờ chơi)</span>
                  <span className="text-[10px] text-zinc-400">Khách yêu cầu khung giờ chơi</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addonsConfig.schedule.enabled}
                  onClick={() =>
                    setAddonsConfig({
                      ...addonsConfig,
                      schedule: {
                        ...addonsConfig.schedule,
                        enabled: !addonsConfig.schedule.enabled,
                      },
                    })
                  }
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
                    onChange={(e) =>
                      setAddonsConfig({
                        ...addonsConfig,
                        schedule: {
                          ...addonsConfig.schedule,
                          percent: Number(e.target.value) || 0,
                        },
                      })
                    }
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
                  <span className="text-xs font-bold text-white block">Tùy chọn tướng tủ</span>
                  <span className="text-[10px] text-zinc-400">Đánh theo tướng khách chỉ định</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addonsConfig.specificChamps.enabled}
                  onClick={() =>
                    setAddonsConfig({
                      ...addonsConfig,
                      specificChamps: {
                        ...addonsConfig.specificChamps,
                        enabled: !addonsConfig.specificChamps.enabled,
                      },
                    })
                  }
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
                    onChange={(e) =>
                      setAddonsConfig({
                        ...addonsConfig,
                        specificChamps: {
                          ...addonsConfig.specificChamps,
                          percent: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-cyan-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* 4. Xem trực tiếp */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Xem trực tiếp (Livestream)</span>
                  <span className="text-[10px] text-zinc-400">Phát sóng kín qua Discord</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addonsConfig.livestream.enabled}
                  onClick={() =>
                    setAddonsConfig({
                      ...addonsConfig,
                      livestream: {
                        ...addonsConfig.livestream,
                        enabled: !addonsConfig.livestream.enabled,
                      },
                    })
                  }
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
                    disabled={!addonsConfig.livestream.enabled}
                    value={addonsConfig.livestream.fee}
                    onChange={(e) =>
                      setAddonsConfig({
                        ...addonsConfig,
                        livestream: {
                          ...addonsConfig.livestream,
                          fee: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[11px] font-bold">
                    VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Cày siêu tốc */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Cày siêu tốc (Flash)</span>
                  <span className="text-[10px] text-zinc-400">Ưu tiên đánh liên tục 24/7</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addonsConfig.flash.enabled}
                  onClick={() =>
                    setAddonsConfig({
                      ...addonsConfig,
                      flash: {
                        ...addonsConfig.flash,
                        enabled: !addonsConfig.flash.enabled,
                      },
                    })
                  }
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
                    onChange={(e) =>
                      setAddonsConfig({
                        ...addonsConfig,
                        flash: {
                          ...addonsConfig.flash,
                          percent: Number(e.target.value) || 0,
                        },
                      })
                    }
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
                  <span className="text-xs font-bold text-white block">Chơi cùng Booster (Duo 1-1)</span>
                  <span className="text-[10px] text-zinc-400">Khách tự đánh acc của mình</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addonsConfig.duo.enabled}
                  onClick={() =>
                    setAddonsConfig({
                      ...addonsConfig,
                      duo: {
                        ...addonsConfig.duo,
                        enabled: !addonsConfig.duo.enabled,
                      },
                    })
                  }
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
                    onChange={(e) =>
                      setAddonsConfig({
                        ...addonsConfig,
                        duo: {
                          ...addonsConfig.duo,
                          percent: Number(e.target.value) || 0,
                        },
                      })
                    }
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
      {/* SECTION 3: DỊCH VỤ TÙY CHỈNH RIÊNG & MÃ GIẢM GIÁ                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom Services Section */}
        <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Layers size={18} className="text-blue-400" />
                <span>3. Gói Dịch Vụ Tùy Chỉnh Riêng</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tự thiết kế thêm gói dịch vụ riêng ngoài danh mục chuẩn để thu hút khách hàng độc quyền.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all"
            >
              <Plus size={14} />
              <span>+ Thêm Gói Riêng</span>
            </button>
          </div>

          <div className="space-y-3">
            {customServices.length === 0 ? (
              <div className="text-center py-10 bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800">
                <p className="text-xs text-zinc-500">Chưa có gói dịch vụ tùy chỉnh nào.</p>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="mt-2 text-xs text-cyan-400 hover:underline font-bold"
                >
                  Tạo gói tùy chỉnh đầu tiên
                </button>
              </div>
            ) : (
              customServices.map((svc) => (
                <div
                  key={svc.id}
                  className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white truncate">{svc.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-300">
                        {svc.gameCode}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
                        {svc.pricingType === 'PER_UNIT' ? `Theo ${svc.unitName || 'điểm'}` : 'Trọn gói'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">{svc.desc || 'Không có mô tả'}</p>
                    <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                      {svc.price?.toLocaleString('vi-VN')} đ {svc.pricingType === 'PER_UNIT' ? `/ ${svc.unitName || 'LP'}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(svc)}
                      className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomService(svc.id)}
                      className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-red-400 hover:text-red-300 hover:border-red-500/30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Booster Coupon Section */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Tag size={18} className="text-amber-400" />
                <span>Mã Giảm Giá Của Bạn</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Tạo mã ưu đãi riêng gửi khách quen</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={coupon.isActive}
              onClick={() => setCoupon({ ...coupon, isActive: !coupon.isActive })}
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

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                Ký hiệu mã giảm giá
              </label>
              <input
                type="text"
                placeholder="VD: PRO10, CHAOCHIEN"
                value={coupon.code}
                onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })}
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
                  onChange={(e) => setCoupon({ ...coupon, discountPercent: Number(e.target.value) || 10 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 text-xs font-bold">
                  %
                </span>
              </div>
            </div>

            <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl text-[11px] text-zinc-400">
              *Mã giảm giá sẽ được tự động gợi ý cho khách hàng khi họ chọn bạn làm tuyển thủ cày chính.
            </div>
          </div>
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
                onClick={() => setStepOverrides({})}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Đặt lại về giá mặc định
              </button>
              <button
                type="button"
                onClick={() => setShowRankTableModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-black text-xs"
              >
                Xong & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: THÊM / SỬA DỊCH VỤ TÙY CHỈNH                                     */}
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
              <div>
                <label className="text-zinc-400 font-bold uppercase block mb-1">Tên Dịch Vụ (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cày Thông Thạo Tướng Yasuo, Huấn Luyện Voice 1-1"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-semibold outline-none focus:border-cyan-500"
                />
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold uppercase block mb-1">Tựa Game</label>
                  <select
                    value={formData.gameCode || 'LOL'}
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
                    value={formData.pricingType || 'PER_UNIT'}
                    onChange={(e) =>
                      setFormData({ ...formData, pricingType: e.target.value as any })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none"
                  >
                    <option value="PER_UNIT">Theo Điểm / Số Lượng (LP, Trận)</option>
                    <option value="FIXED">Trọn Gói Cố Định</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Giá (VNĐ)</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={formData.price || 1000}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 font-mono font-bold text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-bold uppercase block mb-1">
                    {formData.pricingType === 'PER_UNIT' ? 'Tên Đơn Vị' : 'Tỷ Lệ Cọc (%)'}
                  </label>
                  {formData.pricingType === 'PER_UNIT' ? (
                    <input
                      type="text"
                      placeholder="Điểm LP, Trận, Giờ"
                      value={formData.unitName || 'Điểm LP'}
                      onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  ) : (
                    <select
                      value={formData.depositPercent || 100}
                      onChange={(e) =>
                        setFormData({ ...formData, depositPercent: Number(e.target.value) })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none"
                    >
                      <option value="30">Cọc 30%</option>
                      <option value="50">Cọc 50%</option>
                      <option value="100">Trọn gói 100%</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs shadow-md"
                >
                  Lưu Gói Dịch Vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
