// src/app/(dashboard)/booster/services/page.tsx
'use client';
import BarLoader from '@/components/ui/BarLoader';

import { useState, useEffect, useRef } from 'react';
import {
  Swords,
  Gamepad2,
  Crosshair,
  Shield,
  ShieldCheck,
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
  Zap,
  type LucideIcon,
  HelpCircle,
  Crown,
  ChevronDown,
  Check,
  Search,
  RotateCw,
  AlertTriangle,
  Clock,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ALL_WEEKDAYS,
  formatWorkingDays,
  generateWorkingScheduleNote,
  BoosterWorkingSchedule,
} from '@/lib/booster-helpers';
import {
  GAMES_CATALOG,
  STANDARD_SERVICE_TEMPLATES,
  getServiceMeta,
  ServiceTemplate,
  LOL_MASTERY_STEPS,
  LOL_PROMOTION_SERIES,
  LOL_PLACEMENT_TIERS,
  PlacementTierItem,
} from '@/lib/games';
import {
  LOL_RANK_STEPS,
  VALORANT_RANK_STEPS,
  getRankSteps,
  getRankImage,
  getPointBoostTiers,
  PointBoostTierSegment,
} from '@/lib/rank-calculator';
import {
  AOV_TIER_PACKAGES,
  DEFAULT_AOV_STAR_RATES,
  distributeAovTierPackageToSteps,
  getAovTierPackageCurrentTotal,
  resolveAovStarRate,
} from '@/lib/aov';
import { StarIcon, renderWithStarIcon } from '@/app/services/[game]/[service]/components/StarIcon';
import ChampionModal from '@/components/champion/ChampionModal';

const ICON_MAP: Record<string, LucideIcon> = {
  Swords,
  Gamepad2,
  Crosshair,
  Shield,
  ShieldCheck,
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
  schedule: {
    enabled: boolean;
    percent: number;
    shifts?: string[];
    daysOfWeek?: string[];
    fromTime?: string;
    toTime?: string;
    customHours?: string;
  };
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
  const [isGameSelectorOpen, setIsGameSelectorOpen] = useState(false);
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const gameSelectorRef = useRef<HTMLDivElement>(null);

  // Trạng thái thu gọn Mục 1 trên mobile và tìm kiếm game
  const [isSection1Collapsed, setIsSection1Collapsed] = useState(false);
  const [section1Search, setSection1Search] = useState('');

  // Trạng thái tự sinh mã coupon
  const [isGeneratingCoupon, setIsGeneratingCoupon] = useState(false);

  // Đóng dropdown chọn game khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gameSelectorRef.current && !gameSelectorRef.current.contains(e.target as Node)) {
        setIsGameSelectorOpen(false);
      }
    };
    if (isGameSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGameSelectorOpen]);

  // 2. Danh sách dịch vụ thực tế của Booster (Khởi tạo rỗng, hoàn toàn từ DB)
  const [customServices, setCustomServices] = useState<CustomService[]>([]);

  // 3. Cấu hình phụ phí Addons (6 tiện ích)
  const [addonsConfig, setAddonsConfig] = useState<AddonsConfig>({
    specificRole: { enabled: true, percent: 25 },
    schedule: { enabled: true, percent: 20, shifts: ['19:00 - 23:00', '23:00 - 04:00'] },
    specificChamps: { enabled: true, percent: 30 },
    livestream: { enabled: true, fee: 349000 },
    flash: { enabled: true, percent: 35 },
    duo: { enabled: true, percent: 50 },
  });

  // 3b. Lịch trực & Khung giờ làm việc của Booster
  const [workingSchedule, setWorkingSchedule] = useState<BoosterWorkingSchedule>({
    enabled: true,
    daysOfWeek: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    fromTime: '08:00',
    toTime: '17:30',
    shifts: ['morning', 'afternoon'],
    note: 'Làm từ 8:00 -> 17:30 các ngày trong tuần trừ CN',
    allowScheduledBoost: true,
    scheduleSurchargePercent: 20,
  });

  // 4. Bảng giá rank chi tiết (toàn cục nếu cần override)
  const [stepOverrides, setStepOverrides] = useState<Record<string, number>>({});
  const [showRankTableModal, setShowRankTableModal] = useState(false);
  const [activeRankEditingServiceId, setActiveRankEditingServiceId] = useState<string | null>(null);

  // Quản lý việc đóng/mở danh sách chi tiết các mốc điểm/sao trên từng thẻ dịch vụ
  const [expandedTierServiceIds, setExpandedTierServiceIds] = useState<Record<string, boolean>>({});
  const toggleExpandTiers = (serviceId: string) => {
    setExpandedTierServiceIds((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  // 5. Mã giảm giá riêng của Booster
  const [coupon, setCoupon] = useState<BoosterCoupon>({
    code: '',
    discountPercent: 10,
    isActive: false,
  });

  // 5b. Danh sách Tướng tủ sở trường (Champion Pool)
  const [playingChampions, setPlayingChampions] = useState<string[]>([]);
  const [allChampionsList, setAllChampionsList] = useState<any[]>([]);
  const [isBoosterChampionModalOpen, setIsBoosterChampionModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/champions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAllChampionsList(data);
      })
      .catch((err) => console.error('Failed to load champions:', err));
  }, []);

  // 6. Danh mục loại hình dịch vụ có sẵn lấy từ API
  const [availableServiceTypes, setAvailableServiceTypes] = useState<any[]>([]);

  // Modal Thêm / Sửa dịch vụ 2 bước
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [placementQuickPrice, setPlacementQuickPrice] = useState<number>(30000);

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
    updatedWorkingScheduleOrOptions?:
      | BoosterWorkingSchedule
      | { showToast?: boolean; successMessage?: string },
    maybeOptions?: { showToast?: boolean; successMessage?: string },
    updatedPlayingChampions?: string[]
  ) => {
    try {
      setSaving(true);
      const addons = updatedAddonsConfig || addonsConfig;
      const cpn = updatedCoupon || coupon;
      const steps = updatedStepOverrides || stepOverrides;
      const games = updatedSelectedGames || selectedGames;
      const champs = updatedPlayingChampions !== undefined ? updatedPlayingChampions : playingChampions;

      let ws: BoosterWorkingSchedule = workingSchedule;
      let options: { showToast?: boolean; successMessage?: string } | undefined = maybeOptions;

      if (updatedWorkingScheduleOrOptions) {
        if ('showToast' in updatedWorkingScheduleOrOptions || 'successMessage' in updatedWorkingScheduleOrOptions) {
          options = updatedWorkingScheduleOrOptions as { showToast?: boolean; successMessage?: string };
        } else {
          ws = updatedWorkingScheduleOrOptions as BoosterWorkingSchedule;
        }
      }

      // Đảm bảo những dịch vụ thuộc tựa game không được chọn sẽ tự động chuyển sang isActive: false
      const sanitizedServices = updatedCustomServices.map((s) => {
        const sGame = (s.gameCode || 'LOL').toUpperCase();
        const isGameSelected = games.some((g) => {
          const cg = g.toUpperCase();
          return (
            cg === sGame ||
            (sGame === 'LOL' && (cg === 'LMHT' || cg === 'LEAGUE')) ||
            (sGame === 'TFT' && cg === 'DTCL') ||
            (sGame === 'AOV' && cg === 'LIENQUAN')
          );
        });
        return {
          ...s,
          isActive: isGameSelected ? s.isActive !== false : false,
        };
      });

      const payload = {
        selectedGames: games,
        customServices: sanitizedServices,
        coupon: cpn,
        enabledServices: sanitizedServices
          .filter((s) => s.isActive)
          .map((s) => s.slug || s.serviceType || s.name),
        addonsConfig: addons,
        workingSchedule: ws,
        playingChampions: champs,
        standardConfig: {
          addonsConfig: addons,
          stepOverrides: steps,
          workingSchedule: ws,
          playingChampions: champs,
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

  // Cập nhật lịch làm việc của Booster
  const handleUpdateWorkingSchedule = (partial: Partial<BoosterWorkingSchedule>) => {
    const nextDays = partial.daysOfWeek ?? workingSchedule.daysOfWeek ?? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const nextFrom = partial.fromTime ?? workingSchedule.fromTime ?? '08:00';
    const nextTo = partial.toTime ?? workingSchedule.toTime ?? '17:30';

    // Tự động sinh ghi chú nếu người dùng bấm chọn ngày/giờ/preset (chưa gõ đè ghi chú)
    const nextNote =
      partial.note !== undefined
        ? partial.note
        : generateWorkingScheduleNote(nextFrom, nextTo, nextDays);

    const updatedSchedule: BoosterWorkingSchedule = {
      ...workingSchedule,
      ...partial,
      daysOfWeek: nextDays,
      fromTime: nextFrom,
      toTime: nextTo,
      note: nextNote,
    };
    setWorkingSchedule(updatedSchedule);

    // Đồng bộ đồng thời sang addonsConfig.schedule
    const updatedAddons: AddonsConfig = {
      ...addonsConfig,
      schedule: {
        ...addonsConfig.schedule,
        enabled: updatedSchedule.allowScheduledBoost ?? true,
        percent: updatedSchedule.scheduleSurchargePercent ?? addonsConfig.schedule.percent,
        shifts: updatedSchedule.shifts,
        daysOfWeek: nextDays,
        fromTime: nextFrom,
        toTime: nextTo,
        customHours: nextNote,
      },
    };
    setAddonsConfig(updatedAddons);

    syncAllServices(
      customServices,
      updatedAddons,
      coupon,
      stepOverrides,
      selectedGames,
      updatedSchedule
    );
  };

  // 1. Tải danh mục Loại Hình Dịch Vụ từ API
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const res = await fetch(`/api/boosters/service-types?gameCode=${activeGameCode}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            setAvailableServiceTypes(
              json.data.filter((t: any) => t.slug !== 'duo-boost' && t.serviceType !== 'duo-boost')
            );
            return;
          }
        }
      } catch (err) {
        console.error('Lỗi tải service types:', err);
      }
      // Fallback nếu API chưa trả về
      const fallback = (
        STANDARD_SERVICE_TEMPLATES[activeGameCode] || STANDARD_SERVICE_TEMPLATES['LOL'] || []
      ).filter((t: any) => t.slug !== 'duo-boost' && t.serviceType !== 'duo-boost');
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
            setCustomServices(
              s.customServices.filter((svc: any) => svc.serviceType !== 'duo-boost' && svc.slug !== 'duo-boost')
            );
          }

          const addons = s.addonsConfig || s.standardConfig?.addonsConfig;
          if (addons) {
            setAddonsConfig((prev) => ({
              ...prev,
              ...addons,
            }));
          }

          if (s.workingSchedule) {
            setWorkingSchedule((prev) => ({
              ...prev,
              ...s.workingSchedule,
            }));
          } else if (addons?.schedule) {
            setWorkingSchedule((prev) => ({
              ...prev,
              allowScheduledBoost: addons.schedule.enabled ?? true,
              scheduleSurchargePercent: addons.schedule.percent ?? 20,
              shifts: addons.schedule.shifts || prev.shifts,
              note: addons.schedule.customHours || prev.note,
              daysOfWeek: addons.schedule.daysOfWeek || prev.daysOfWeek,
              fromTime: addons.schedule.fromTime || prev.fromTime,
              toTime: addons.schedule.toTime || prev.toTime,
            }));
          }

          const steps = s.stepOverrides || s.standardConfig?.stepOverrides;
          if (steps) {
            setStepOverrides(steps);
          }

          if (s.coupon) {
            setCoupon(s.coupon);
          }

          if (s.playingChampions || s.service_settings?.playingChampions || s.standardConfig?.playingChampions) {
            setPlayingChampions(
              s.playingChampions ||
              s.service_settings?.playingChampions ||
              s.standardConfig?.playingChampions ||
              []
            );
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
    let updatedServices = customServices;

    if (selectedGames.includes(code)) {
      if (selectedGames.length === 1) {
        toast.warning('Bạn cần chọn ít nhất một tựa game');
        return;
      }
      updated = selectedGames.filter((g) => g !== code);
      // Tự động tắt (isActive = false) các dịch vụ của tựa game vừa bỏ chọn
      updatedServices = customServices.map((s) => {
        const sGame = (s.gameCode || 'LOL').toUpperCase();
        if (sGame === code || (code === 'LOL' && sGame === 'LMHT')) {
          return { ...s, isActive: false };
        }
        return s;
      });
      setCustomServices(updatedServices);
      setSelectedGames(updated);
      if (activeGameCode === code) {
        setActiveGameCode(updated[0] || 'LOL');
      }
    } else {
      updated = [...selectedGames, code];
      setSelectedGames(updated);
      setActiveGameCode(code);
    }
    await syncAllServices(updatedServices, addonsConfig, coupon, stepOverrides, updated);
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

  // Helper kiểm tra trùng lặp dịch vụ trong cùng một tựa game
  const isServiceDuplicate = (
    candidate: Partial<CustomService>,
    serviceList: CustomService[],
    excludeId?: string | null
  ) => {
    const candidateGame = (candidate.gameCode || activeGameCode || 'LOL').toUpperCase().trim();
    const candidateType = (candidate.serviceType || candidate.slug || '').toLowerCase().trim();
    const candidateName = (candidate.name || '').toLowerCase().trim();

    return serviceList.some((s) => {
      if (excludeId && s.id === excludeId) return false;
      const sGame = (s.gameCode || 'LOL').toUpperCase().trim();
      if (sGame !== candidateGame) return false;

      const sType = (s.serviceType || s.slug || '').toLowerCase().trim();
      const sName = (s.name || '').toLowerCase().trim();

      // Nếu là dịch vụ chuẩn (không phải custom), kiểm tra trùng serviceType / slug
      if (candidateType && candidateType !== 'custom' && sType && sType !== 'custom') {
        if (candidateType === sType) return true;
      }

      // Nếu trùng tên chính xác trong cùng tựa game
      if (candidateName && sName && candidateName === sName) {
        return true;
      }

      return false;
    });
  };

  // Khi đổi tựa game trong Modal thêm/sửa dịch vụ
  const handleGameChangeInModal = async (newGameCode: string) => {
    const code = newGameCode.toUpperCase();
    const fallbackTemplates = (
      STANDARD_SERVICE_TEMPLATES[code] || STANDARD_SERVICE_TEMPLATES['UNIVERSAL'] || []
    ).filter((t: any) => t.slug !== 'duo-boost' && t.serviceType !== 'duo-boost');
    setAvailableServiceTypes(fallbackTemplates);

    let templatesToUse = fallbackTemplates;
    try {
      const res = await fetch(`/api/boosters/service-types?gameCode=${code}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          templatesToUse = json.data.filter((t: any) => t.slug !== 'duo-boost' && t.serviceType !== 'duo-boost');
          setAvailableServiceTypes(templatesToUse);
        }
      }
    } catch (e) {
      // fallback already set
    }

    if (!editingServiceId) {
      // Tìm template chưa từng được cấu hình cho tựa game mới
      const configuredTypes = new Set(
        customServices
          .filter((s) => (s.gameCode || 'LOL').toUpperCase().trim() === code)
          .map((s) => (s.serviceType || s.slug || '').toLowerCase().trim())
      );

      const firstAvailableTpl = templatesToUse.find(
        (t) => !configuredTypes.has((t.serviceType || t.slug || '').toLowerCase().trim())
      );

      const chosenTpl = firstAvailableTpl || {
        slug: 'custom',
        serviceType: 'custom',
        name: 'Gói Cày Tùy Chỉnh',
        desc: 'Gói cày thuê đặc thù theo yêu cầu khách hàng.',
        pricingType: 'FIXED',
        defaultPrice: 150000,
        depositPercent: 100,
      };

      const isVal = code === 'VALORANT';
      const isAov = code === 'AOV' || code === 'LIENQUAN';

      setFormData((prev) => ({
        ...prev,
        gameCode: code,
        serviceType: chosenTpl.serviceType || chosenTpl.slug || 'custom',
        slug: chosenTpl.slug || chosenTpl.serviceType || 'custom',
        name: chosenTpl.name,
        desc: chosenTpl.desc || '',
        pricingType: chosenTpl.pricingType || 'FIXED',
        price: chosenTpl.defaultPrice || 0,
        unitName: (chosenTpl as any).unitName || (isVal ? 'Điểm RR' : isAov ? 'Sao' : 'Điểm LP'),
        depositPercent: chosenTpl.depositPercent ?? (chosenTpl.serviceType === 'net-wins' ? 40 : 100),
        stepOverrides: {},
        tierRates: isVal
          ? { immortal1_2: 5000, immortal2_3: 7000, immortal3_radiant: 10000, radiant_top100: 20000 }
          : isAov
            ? { ...DEFAULT_AOV_STAR_RATES }
            : { master: 1000, grandmaster: 1500, challenger: 2000 },
      }));
    } else {
      setFormData((prev) => ({ ...prev, gameCode: code }));
    }
  };

  // Khởi tạo nhanh bộ 2 dịch vụ chuẩn Liên Quân (Cày theo Bậc Rank + Cày theo Số Sao)
  const handleInitDefaultAovServices = async () => {
    const now = Date.now();
    const existingAov = customServices.filter((s) => {
      const g = (s.gameCode || '').toUpperCase();
      return g === 'AOV' || g === 'LIENQUAN';
    });
    const hasRankBoost = existingAov.some((s) => s.serviceType === 'rank-boost');
    const hasStarBoost = existingAov.some((s) => s.serviceType === 'net-wins');

    const toAdd: CustomService[] = [];
    if (!hasRankBoost) {
      toAdd.push({
        id: `srv_aov_rank-boost_${now}`,
        gameCode: 'AOV',
        serviceType: 'rank-boost',
        slug: 'rank-boost',
        name: 'Cày Rank Liên Quân (Theo Bậc)',
        desc: 'Leo rank từ Đồng đến Cao Thủ (25k–160k/bậc) & tùy chỉnh từ Cao Thủ lên Đại Cao Thủ, Chiến Tướng, Huyền Thoại.',
        pricingType: 'TIER_MATRIX',
        price: 0,
        unitName: 'Bậc',
        depositPercent: 100,
        stepOverrides: {},
        isActive: true,
      });
    }
    if (!hasStarBoost) {
      toAdd.push({
        id: `srv_aov_net-wins_${now + 1}`,
        gameCode: 'AOV',
        serviceType: 'net-wins',
        slug: 'net-wins',
        name: 'Cày Theo Số Sao (Đồng ➔ Chiến Tướng 99★+)',
        desc: 'Tính tiền theo từng Sao (5k–30k+/sao) từ Đồng–Kim Cương, Tinh Anh, Cao Thủ, Đại Cao Thủ đến Chiến Tướng.',
        pricingType: 'TIER_PER_POINT',
        price: 5000,
        unitName: 'Sao',
        depositPercent: 40,
        tierRates: { ...DEFAULT_AOV_STAR_RATES },
        isActive: true,
      });
    }

    if (toAdd.length === 0) {
      toast.info('Bạn đã có đủ dịch vụ Cày Rank & Cày Sao Liên Quân.');
      return;
    }

    const updated = [...customServices, ...toAdd];
    setCustomServices(updated);
    await syncAllServices(updated, addonsConfig, coupon, stepOverrides, selectedGames, {
      showToast: true,
      successMessage: 'Đã khởi tạo bộ dịch vụ Liên Quân mặc định (Theo Bậc & Theo Sao)!',
    });
  };

  // Mở modal Thêm Dịch Vụ Mới
  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setModalStep(1);

    const code = (activeGameCode || 'LOL').toUpperCase().trim();
    const templates = (
      STANDARD_SERVICE_TEMPLATES[code] || STANDARD_SERVICE_TEMPLATES['UNIVERSAL'] || []
    ).filter((t: any) => t.slug !== 'duo-boost' && t.serviceType !== 'duo-boost');
    setAvailableServiceTypes(templates);

    // Lọc các loại dịch vụ đã được thêm cho tựa game này
    const configuredServiceTypes = new Set(
      customServices
        .filter((s) => (s.gameCode || 'LOL').toUpperCase().trim() === code)
        .map((s) => (s.serviceType || s.slug || '').toLowerCase().trim())
    );

    // Tìm template đầu tiên CHƯA được cấu hình cho tựa game này
    const firstAvailableTpl = templates.find(
      (t) => !configuredServiceTypes.has((t.serviceType || t.slug || '').toLowerCase().trim())
    );

    if (!firstAvailableTpl) {
      toast.info(
        `Tựa game ${code} đã cấu hình đầy đủ các gói dịch vụ chuẩn! Bạn có thể chỉnh sửa gói hiện có hoặc tạo thêm "Gói Dịch Vụ Tùy Chỉnh Khác".`
      );
    }

    const firstTpl = firstAvailableTpl || {
      serviceType: 'custom',
      slug: 'custom',
      name: 'Gói Cày Tùy Chỉnh',
      desc: 'Gói cày thuê đặc thù theo yêu cầu khách hàng.',
      pricingType: 'FIXED',
      defaultPrice: 150000,
      depositPercent: 100,
    };

    const isVal = code === 'VALORANT';
    const isAov = code === 'AOV' || code === 'LIENQUAN';
    const initialTierRates: TierRates = isVal
      ? { immortal1_2: 5000, immortal2_3: 7000, immortal3_radiant: 10000, radiant_top100: 20000 }
      : isAov
        ? { ...DEFAULT_AOV_STAR_RATES }
        : { master: 1000, grandmaster: 1500, challenger: 2000 };

    setFormData({
      id: `srv_${code.toLowerCase()}_${firstTpl.serviceType || 'custom'}_${Date.now()}`,
      gameCode: code,
      serviceType: firstTpl.serviceType || firstTpl.slug || 'custom',
      slug: firstTpl.slug || firstTpl.serviceType || 'custom',
      name: firstTpl.name || 'Gói Cày Tùy Chỉnh',
      desc: firstTpl.desc || '',
      pricingType: firstTpl.pricingType || 'FIXED',
      price: firstTpl.defaultPrice || 0,
      unitName: (firstTpl as any).unitName || (isVal ? 'Điểm RR' : isAov ? 'Sao' : 'Điểm LP'),
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
    const isAov = svcGame === 'AOV' || svcGame === 'LIENQUAN';
    const templates = (
      STANDARD_SERVICE_TEMPLATES[svcGame] || STANDARD_SERVICE_TEMPLATES['UNIVERSAL'] || []
    ).filter((t: any) => t.slug !== 'duo-boost' && t.serviceType !== 'duo-boost');
    setAvailableServiceTypes(templates);

    let cleanName = svc.name;
    if (isVal && (cleanName.includes('Cao Thủ') || cleanName.includes('LP') || cleanName.toLowerCase() === 'cày điểm ...' || cleanName === 'Cày Điểm')) {
      cleanName = 'Cày Điểm RR (Immortal / Radiant)';
    } else if (isAov && (svc.serviceType === 'net-wins' && (cleanName.includes('Trận Thắng') || cleanName.includes('LP') || cleanName.includes('RR') || cleanName === 'Cày Rank Cao Cấp'))) {
      cleanName = 'Cày Theo Số Sao (Đồng ➔ Chiến Tướng 99★+)';
    }
    let cleanDesc = svc.desc || '';
    if (isVal && (cleanDesc.includes('Cao Thủ') || cleanDesc.includes('LP') || cleanDesc.includes('Đại Cao Thủ'))) {
      cleanDesc = 'Cày điểm xếp hạng Rank Rating (RR) bậc Immortal và Radiant theo điểm số.';
    } else if (isAov && (cleanDesc.includes('MMR') || cleanDesc.includes('LP') || cleanDesc.includes('RR'))) {
      cleanDesc = 'Tính tiền theo từng Sao (5k–30k+/sao) từ Đồng–Kim Cương, Tinh Anh, Cao Thủ, Đại Cao Thủ đến Chiến Tướng.';
    }
    const cleanUnit = (svc.serviceType === 'placements' || svc.serviceType === 'matches')
      ? 'Trận'
      : isVal
        ? 'Điểm RR'
        : isAov
          ? (svc.serviceType === 'net-wins' ? 'Sao' : (svc.unitName || 'Sao'))
          : (svc.unitName || 'Điểm LP');

    // Chuẩn hóa tierRates cũ cho AOV nếu có
    let normalizedTierRates = svc.tierRates;
    if (isAov && svc.serviceType === 'net-wins') {
      normalizedTierRates = {
        bronze_diamond: resolveAovStarRate('bronze_diamond', svc.tierRates),
        diamond_veteran: resolveAovStarRate('diamond_veteran', svc.tierRates),
        veteran_master: resolveAovStarRate('veteran_master', svc.tierRates),
        master_0_19: resolveAovStarRate('master_0_19', svc.tierRates),
        gm_20_49: resolveAovStarRate('gm_20_49', svc.tierRates),
        conqueror_50_99: resolveAovStarRate('conqueror_50_99', svc.tierRates),
        legend_100_plus: resolveAovStarRate('legend_100_plus', svc.tierRates),
      };
    }

    setFormData({
      ...svc,
      gameCode: svcGame,
      name: cleanName,
      desc: cleanDesc,
      unitName: cleanUnit,
      tierRates: normalizedTierRates,
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
      const gCode = (tpl.gameCode || formData.gameCode || activeGameCode || '').toUpperCase().trim();
      const isVal = gCode === 'VALORANT';
      const isAov = gCode === 'AOV' || gCode === 'LIENQUAN';

      // Cảnh báo nếu chọn trúng dịch vụ đã có trong tựa game này
      const candType = (tpl.serviceType || tpl.slug || '').toLowerCase().trim();
      const isAlreadyConfigured = customServices.some((s) => {
        if (editingServiceId && s.id === editingServiceId) return false;
        const sGame = (s.gameCode || 'LOL').toUpperCase().trim();
        if (sGame !== gCode) return false;
        const sType = (s.serviceType || s.slug || '').toLowerCase().trim();
        return sType === candType;
      });

      if (isAlreadyConfigured) {
        toast.error(`Tựa game ${gCode} đã có gói "${tpl.name}". Bạn không thể thêm dịch vụ trùng lặp!`);
      }

      setFormData((prev) => ({
        ...prev,
        serviceType: tpl.serviceType || tpl.slug,
        slug: tpl.slug || tpl.serviceType,
        name: tpl.name,
        desc: tpl.desc,
        pricingType: tpl.pricingType,
        price: tpl.defaultPrice || 0,
        unitName: tpl.unitName || (isVal ? 'Điểm RR' : isAov ? 'Sao' : 'Điểm LP'),
        depositPercent: tpl.depositPercent ?? (tpl.serviceType === 'net-wins' ? 40 : 100),
        tierRates: tpl.tierRates || prev.tierRates || (isVal ? {
          immortal1_2: 5000,
          immortal2_3: 7000,
          immortal3_radiant: 10000,
          radiant_top100: 20000,
        } : isAov ? {
          ...DEFAULT_AOV_STAR_RATES,
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

    const targetGame = (formData.gameCode || activeGameCode || 'LOL').toUpperCase().trim();
    if (isServiceDuplicate(formData, customServices, editingServiceId)) {
      const gameMeta = GAMES_CATALOG.find((g) => g.id.toUpperCase() === targetGame);
      const gameName = gameMeta?.name || targetGame;
      toast.error(
        `Tựa game ${gameName} đã có dịch vụ "${formData.name}" (${formData.serviceType || formData.slug}). Không được phép thêm lặp dịch vụ!`
      );
      return;
    }

    setModalStep(2);
  };

  // Hoàn tất lưu Modal ở Bước 2
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetGame = (formData.gameCode || activeGameCode || 'LOL').toUpperCase().trim();
    if (isServiceDuplicate(formData, customServices, editingServiceId)) {
      const gameMeta = GAMES_CATALOG.find((g) => g.id.toUpperCase() === targetGame);
      const gameName = gameMeta?.name || targetGame;
      toast.error(
        `Tựa game ${gameName} đã có dịch vụ "${formData.name}" (${formData.serviceType || formData.slug}). Không được phép thêm lặp dịch vụ!`
      );
      return;
    }

    if (formData.serviceType === 'promotion') {
      if (!formData.price || formData.price <= 0) {
        formData.price = 40000;
      }
    }
    if (formData.serviceType === 'placements') {
      formData.unitName = 'Trận';
      if (!formData.price || formData.price <= 0) {
        formData.price = formData.stepOverrides?.['IRON'] || 30000;
      }
    }
    if (
      formData.serviceType !== 'rank-boost' &&
      formData.serviceType !== 'promotion' &&
      formData.serviceType !== 'placements' &&
      (!formData.price || formData.price <= 0)
    ) {
      toast.error('Vui lòng nhập đơn giá hợp lệ (> 0 VNĐ)');
      return;
    }
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

  // Tự sinh mã giảm giá độc quyền không trùng lặp trên DB
  const handleGenerateCoupon = async () => {
    setIsGeneratingCoupon(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/boosters/generate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code) {
          const updated = { ...coupon, code: data.code, isActive: true };
          setCoupon(updated);
          toast.success(`Đã tự sinh mã ưu đãi duy nhất: ${data.code}`);
          await syncAllServices(customServices, addonsConfig, updated);
        }
      } else {
        const randomCode = 'LEO' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const updated = { ...coupon, code: randomCode, isActive: true };
        setCoupon(updated);
        toast.success(`Đã tạo mã ngẫu nhiên: ${randomCode}`);
        await syncAllServices(customServices, addonsConfig, updated);
      }
    } catch (error) {
      console.error('Lỗi khi sinh mã coupon', error);
      toast.error('Không thể tạo mã tự động. Vui lòng thử lại!');
    } finally {
      setIsGeneratingCoupon(false);
    }
  };

  // Lọc các dịch vụ thuộc tựa game đang chọn
  const currentGameDef =
    GAMES_CATALOG.find((g) => g.id.toUpperCase() === activeGameCode) || GAMES_CATALOG[0];

  const currentServices = customServices.filter(
    (s) => (s.gameCode || 'LOL').toUpperCase() === activeGameCode && s.serviceType !== 'duo-boost' && s.slug !== 'duo-boost'
  );

  if (loading) {
    return (
      <BarLoader
        className="min-h-[450px]"
        label="Đang tải cấu hình dịch vụ của bạn..."
      />
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Cấu Hình Dịch Vụ & Bảng Giá
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
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Gamepad2 size={20} className="text-cyan-400" />
              <span>1. Tựa game bạn có thể cày</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Bật các game bạn nhận đơn. Khách hàng sẽ thấy bạn trong danh sách tuyển thủ của tựa game đó.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-zinc-400 font-semibold bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
              Đã chọn: <b className="text-cyan-400">{selectedGames.length}</b> game
            </span>
            <button
              type="button"
              onClick={() => setIsSection1Collapsed(!isSection1Collapsed)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-300 transition-all cursor-pointer active:scale-95"
            >
              <span>{isSection1Collapsed ? 'Mở rộng' : 'Thu gọn'}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isSection1Collapsed ? '' : 'rotate-180'}`}
              />
            </button>
          </div>
        </div>

        {/* Chế độ thu gọn: Chỉ hiển thị các game đã chọn dạng chips gọn gàng */}
        {isSection1Collapsed ? (
          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Danh sách game đang nhận cày:</span>
              <button
                type="button"
                onClick={() => setIsSection1Collapsed(false)}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                + Chọn thêm game
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {selectedGames.map((gCode) => {
                const gObj = GAMES_CATALOG.find((g) => g.id.toUpperCase() === gCode);
                return (
                  <span
                    key={gCode}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono"
                  >
                    <Gamepad2 size={13} className="text-cyan-400" />
                    <span>{gObj?.name || gCode}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          /* Chế độ mở rộng: Có ô tìm kiếm và khung cuộn gọn gàng trên mobile */
          <div className="space-y-2.5">
            {GAMES_CATALOG.length > 8 && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={section1Search}
                  onChange={(e) => setSection1Search(e.target.value)}
                  placeholder="Tìm nhanh tựa game trong 20+ game..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 max-h-[320px] sm:max-h-none overflow-y-auto pr-1 custom-dark-scrollbar">
              {GAMES_CATALOG.filter((game) => {
                if (!section1Search.trim()) return true;
                const q = section1Search.toLowerCase().trim();
                return (
                  game.name.toLowerCase().includes(q) ||
                  game.shortName.toLowerCase().includes(q) ||
                  game.id.toLowerCase().includes(q)
                );
              }).map((game) => {
                const isSelected = selectedGames.includes(game.id.toUpperCase());
                const GameIcon = ICON_MAP[game.iconName] || Gamepad2;

                return (
                  <div
                    key={game.id}
                    onClick={() => handleToggleGame(game.id)}
                    className={`p-2.5 sm:p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.12)]'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`p-1.5 sm:p-2 rounded-xl border shrink-0 ${isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                          }`}
                      >
                        <GameIcon size={14} />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{game.name}</div>
                        <div className="text-[10px] text-zinc-500">{game.shortName}</div>
                      </div>
                    </div>

                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ml-1.5 ${isSelected ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-zinc-700 bg-zinc-900'
                        }`}
                    >
                      {isSelected && <CheckCircle2 size={11} className="stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: DANH MỤC DỊCH VỤ BẠN CUNG CẤP                                   */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-5">
        {/* HÀNG 1: HEADER & NÚT THÊM DỊCH VỤ ĐỘC LẬP */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
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

          {/* Chỉ hiển thị nút thêm dịch vụ ở góc trên khi ĐÃ CÓ ít nhất 1 dịch vụ (Tránh trùng lặp với nút giữa khối khi empty) */}
          {currentServices.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-md shadow-cyan-500/20 transition-all active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Plus size={15} className="stroke-[3]" />
              <span>+ Thêm Dịch Vụ Mới</span>
            </button>
          )}
        </div>

        {/* HÀNG 2: BỘ CHỌN TỰA GAME THÔNG MINH (DROPDOWN POPOVER + QUICK CHIPS) */}
        {selectedGames.length > 1 && (
          <div className="space-y-3 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
                  <Gamepad2 size={20} />
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span>Đang cấu hình dịch vụ</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-400 font-mono font-normal">
                      {selectedGames.length} tựa game đã chọn
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-white flex items-center gap-2 mt-0.5">
                    <span className="text-cyan-400">{currentGameDef.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {currentServices.length} dịch vụ
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút bấm mở Dropdown chọn nhanh Tựa Game */}
              <div className="relative" ref={gameSelectorRef}>
                <button
                  type="button"
                  onClick={() => setIsGameSelectorOpen(!isGameSelectorOpen)}
                  className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${isGameSelectorOpen
                    ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/20'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-cyan-500/40 hover:border-cyan-400 text-white'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-black">Chọn tựa game:</span>
                    <span className="text-zinc-200 max-w-[130px] sm:max-w-[180px] truncate font-extrabold">
                      {currentGameDef.shortName || currentGameDef.name}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {selectedGames.length} game
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-zinc-400 transition-transform duration-200 ${isGameSelectorOpen ? 'rotate-180 text-cyan-400' : ''
                      }`}
                  />
                </button>

                {/* Popover Dropdown Chọn Nhanh Tựa Game */}
                {isGameSelectorOpen && (
                  <>
                    {/* Backdrop mờ trên mobile */}
                    <div
                      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
                      onClick={() => setIsGameSelectorOpen(false)}
                    />
                    <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-20 sm:top-full mt-2 w-auto sm:w-80 md:w-96 p-3 rounded-2xl bg-[#0b0f19] border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl max-w-sm sm:max-w-none mx-auto sm:mx-0">
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Gamepad2 size={16} className="text-cyan-400" />
                          <span className="text-xs font-black text-white">
                            Chọn tựa game muốn cấu hình
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsGameSelectorOpen(false)}
                          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Ô tìm kiếm nhanh nếu có từ 4 game trở lên */}
                      {selectedGames.length > 3 && (
                        <div className="relative mb-2.5">
                          <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                          />
                          <input
                            type="text"
                            value={gameSearchQuery}
                            onChange={(e) => setGameSearchQuery(e.target.value)}
                            placeholder="Tìm nhanh tựa game..."
                            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60"
                          />
                        </div>
                      )}

                      {/* Danh sách các tựa game dạng cuộn dọc gọn gàng */}
                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 custom-dark-scrollbar">
                        {selectedGames
                          .filter((gCode) => {
                            if (!gameSearchQuery.trim()) return true;
                            const gObj = GAMES_CATALOG.find((g) => g.id.toUpperCase() === gCode);
                            const q = gameSearchQuery.toLowerCase().trim();
                            return (
                              gCode.toLowerCase().includes(q) ||
                              (gObj?.name || '').toLowerCase().includes(q) ||
                              (gObj?.shortName || '').toLowerCase().includes(q)
                            );
                          })
                          .map((gCode) => {
                            const gObj = GAMES_CATALOG.find((g) => g.id.toUpperCase() === gCode);
                            const isCurrentActive = activeGameCode === gCode;
                            const serviceCount = customServices.filter(
                              (s) => (s.gameCode || 'LOL').toUpperCase() === gCode && s.serviceType !== 'duo-boost' && s.slug !== 'duo-boost'
                            ).length;

                            return (
                              <button
                                key={gCode}
                                type="button"
                                onClick={() => {
                                  setActiveGameCode(gCode);
                                  setIsGameSelectorOpen(false);
                                  setGameSearchQuery('');
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${isCurrentActive
                                  ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-extrabold shadow-sm'
                                  : 'hover:bg-zinc-900/90 border border-transparent text-zinc-300 hover:text-white'
                                  }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isCurrentActive
                                      ? 'bg-cyan-500 text-black font-black text-xs'
                                      : 'bg-zinc-800 text-zinc-400'
                                      }`}
                                  >
                                    <Gamepad2 size={15} />
                                  </div>
                                  <div className="min-w-0 truncate">
                                    <div className="text-xs font-bold truncate">
                                      {gObj?.name || gCode}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-mono">
                                      {gObj?.shortName || gCode}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${serviceCount > 0
                                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                                      : 'bg-zinc-800 text-zinc-500'
                                      }`}
                                  >
                                    {serviceCount} dịch vụ
                                  </span>
                                  {isCurrentActive && (
                                    <Check size={16} className="text-cyan-400 shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Chips Bar: Tự động xuống dòng gọn gàng để không bị cắt mất tựa game */}
            <div className="p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-wrap items-center gap-2">
              {selectedGames.map((gCode) => {
                const gObj = GAMES_CATALOG.find((g) => g.id.toUpperCase() === gCode);
                const isActive = activeGameCode === gCode;
                const serviceCount = customServices.filter(
                  (s) => (s.gameCode || 'LOL').toUpperCase() === gCode && s.serviceType !== 'duo-boost' && s.slug !== 'duo-boost'
                ).length;

                return (
                  <button
                    key={gCode}
                    type="button"
                    onClick={() => setActiveGameCode(gCode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${isActive
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-300'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 hover:border-zinc-700'
                      }`}
                  >
                    <span>{gObj?.shortName || gCode}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isActive
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
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
              {(activeGameCode.toUpperCase() === 'AOV' || activeGameCode.toUpperCase() === 'LIENQUAN') && (
                <button
                  type="button"
                  onClick={handleInitDefaultAovServices}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles size={15} />
                  <span>Khởi tạo bảng giá Liên Quân mặc định (Theo Bậc & Theo Sao)</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Thêm Dịch Vụ Mới Ngay</span>
              </button>
            </div>
          </div>
        ) : (
          /* NẾU CÓ DỊCH VỤ: HIỂN THỊ LƯỚI CARD DỊCH VỤ */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentServices.map((svc) => {
              const svcGame = (svc.gameCode || activeGameCode || 'LOL').toUpperCase();
              const isVal = svcGame === 'VALORANT';
              const isAov = svcGame === 'AOV' || svcGame === 'LIENQUAN';

              // Phân loại hình thức tính giá chuẩn xác và loại trừ lẫn nhau
              const isRankBoost = svc.serviceType === 'rank-boost' || svc.pricingType === 'TIER_MATRIX';
              const isPointBoost = !isRankBoost && (svc.serviceType === 'net-wins' || svc.pricingType === 'TIER_PER_POINT');
              const isPerUnit = !isRankBoost && !isPointBoost && (svc.pricingType === 'PER_UNIT' || svc.serviceType === 'placements' || svc.serviceType === 'matches');
              const isFixedPrice = !isRankBoost && !isPointBoost && !isPerUnit;
              const isEnabled = svc.isActive;

              // Tên hiển thị chuẩn xác (chuẩn hóa tên phù hợp với game)
              let displayName = svc.name;
              if (isVal && (displayName.includes('Cao Thủ') || displayName.includes('Thách Đấu') || displayName.includes('LP') || displayName === 'Cày Điểm ...' || displayName === 'Cày Điểm')) {
                displayName = 'Cày Điểm RR (Immortal / Radiant)';
              } else if (isAov && svc.serviceType === 'net-wins' && (displayName.includes('Trận Thắng') || displayName.includes('LP') || displayName.includes('RR') || displayName === 'Cày Rank Cao Cấp')) {
                displayName = 'Cày Theo Số Sao (Đồng ➔ Chiến Tướng 99★+)';
              }

              // Đơn vị điểm (RR đối với Valorant, Sao đối với Liên Quân, LP đối với LOL)
              const pointUnit = isVal ? 'Điểm RR' : isAov ? 'Sao' : 'Điểm LP';
              const badgeText = isRankBoost
                ? 'Bậc Rank'
                : isPointBoost
                  ? `Theo ${isAov ? 'Số Sao' : pointUnit}`
                  : isPerUnit
                    ? `Theo ${svc.unitName || 'Trận'}`
                    : 'Trọn Gói';

              // Mô tả hiển thị phù hợp game
              let displayDesc = svc.desc || 'Dịch vụ do bạn tự cấu hình.';
              if (isVal && (displayDesc.includes('Cao Thủ') || displayDesc.includes('LP') || displayDesc.includes('Đại Cao Thủ'))) {
                displayDesc = 'Cày điểm xếp hạng Rank Rating (RR) bậc Immortal và Radiant theo điểm số.';
              } else if (isAov && (isPointBoost || displayDesc.includes('MMR') || displayDesc.includes('LP') || displayDesc.includes('RR'))) {
                displayDesc = 'Tính tiền theo từng Sao (5k–30k+/sao) từ Đồng–Kim Cương, Tinh Anh, Cao Thủ, Đại Cao Thủ đến Chiến Tướng.';
              }

              return (
                <div
                  key={svc.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isEnabled
                      ? 'bg-zinc-950/80 border-zinc-700/80 hover:border-zinc-600 shadow-lg shadow-black/40'
                      : 'bg-zinc-950/40 border-zinc-850 opacity-60'
                  }`}
                >
                  <div>
                    {/* HÀNG 1: BADGE LOẠI HÌNH + TRẠNG THÁI (BÊN TRÁI) | HÀNG NÚT THAO TÁC + SWITCH (BÊN PHẢI) */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border shadow-sm flex items-center gap-1.5 shrink-0 ${
                            isRankBoost
                              ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                              : isPointBoost
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                : isPerUnit
                                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{badgeText}</span>
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 bg-zinc-800/60'
                          }`}
                        >
                          {isEnabled ? 'Đang bật' : 'Tạm tắt'}
                        </span>
                      </div>

                      {/* Nhóm nút thao tác: Sửa, Xóa, Bật/Tắt */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(svc)}
                          title="Chỉnh sửa dịch vụ & giá"
                          className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors shadow-sm cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteService(svc.id, svc.name)}
                          title="Xóa dịch vụ khỏi danh mục của bạn"
                          className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 transition-colors shadow-sm cursor-pointer"
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

                    {/* HÀNG 2: TIÊU ĐỀ FULL-WIDTH KHÔNG BỊ BẺ DÒNG NÁT + MÔ TẢ DỊCH VỤ */}
                    <div className="mb-3.5">
                      <h3 className="font-extrabold text-white text-base sm:text-[17px] tracking-tight leading-snug mb-1.5 line-clamp-2">
                        {renderWithStarIcon(displayName, 15)}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed min-h-[34px]">
                        {renderWithStarIcon(displayDesc, 11)}
                      </p>
                    </div>

                    {/* BODY KHU VỰC GIỮA: THÔNG TIN CHI TIẾT TỪNG LOẠI HÌNH (ĐẢM BẢO CHIỀU CAO ĐỒNG ĐỀU) */}
                    {/* TRƯỜNG HỢP 1: CÀY RANK THEO BẬC (SẮT -> CAO THỦ / VALORANT) */}
                    {isRankBoost && (
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 font-medium">Bảng giá thiết lập:</span>
                          <span className="text-white font-extrabold font-mono">
                            {getRankSteps(svc.gameCode).length} bậc Rank
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 font-medium">Hình thức cày:</span>
                          <span className="text-blue-300 font-bold">Trọn gói từng đoàn</span>
                        </div>
                      </div>
                    )}

                    {/* TRƯỜNG HỢP 2: CÀY ĐIỂM / SAO (AOV / VALORANT / LOL) */}
                    {isPointBoost && (() => {
                      const pointTiers = getPointBoostTiers(svc.gameCode);
                      const rates = pointTiers.map((t) =>
                        isAov ? resolveAovStarRate(t.id, svc.tierRates) : (svc.tierRates?.[t.id] ?? t.defaultPrice)
                      );
                      const minRate = rates.length > 0 ? Math.min(...rates) : 5000;
                      const maxRate = rates.length > 0 ? Math.max(...rates) : 45000;
                      const isExpanded = !!expandedTierServiceIds[svc.id];

                      return (
                        <div className="space-y-2 mb-3">
                          {/* Box tổng quan khoảng giá đẹp mắt */}
                          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] text-zinc-400 font-medium">
                                Đơn giá cày {pointUnit}:
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleExpandTiers(svc.id)}
                                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>{isExpanded ? 'Thu gọn' : `Chi tiết ${pointTiers.length} mốc`}</span>
                                <ChevronDown
                                  size={12}
                                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </button>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base sm:text-lg font-black font-mono text-amber-400">
                                {minRate.toLocaleString('vi-VN')} – {maxRate.toLocaleString('vi-VN')}
                              </span>
                              <span className="text-xs text-zinc-400 font-medium font-sans">
                                đ / {pointUnit}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500 block mt-0.5">
                              Áp dụng lũy tiến qua {pointTiers.length} mốc Rank từ thấp đến cao
                            </span>
                          </div>

                          {/* Danh sách các mốc rank nếu người dùng bấm mở rộng */}
                          {isExpanded && (
                            <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs max-h-48 overflow-y-auto scrollbar-thin animate-in fade-in duration-200">
                              {pointTiers.map((tier) => {
                                const rate = isAov
                                  ? resolveAovStarRate(tier.id, svc.tierRates)
                                  : (svc.tierRates?.[tier.id] ?? tier.defaultPrice);
                                return (
                                  <div key={tier.id} className="flex justify-between items-center gap-2 py-0.5">
                                    <span className="text-zinc-300 font-medium flex items-center gap-1.5 min-w-0 truncate">
                                      {tier.image && (
                                        <img
                                          src={tier.image}
                                          alt={tier.shortLabel}
                                          className="w-4 h-4 object-contain shrink-0"
                                        />
                                      )}
                                      <span className="truncate">
                                        {renderWithStarIcon(
                                          tier.label + (tier.shortLabel && tier.shortLabel !== tier.label ? ` (${tier.shortLabel})` : ''),
                                          11
                                        )}:
                                      </span>
                                    </span>
                                    <span className="text-amber-400 font-mono font-bold shrink-0">
                                      {rate.toLocaleString('vi-VN')} đ / {tier.unit}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* TRƯỜNG HỢP 3: THEO ĐƠN VỊ (CÀY TRẬN / COACHING / THÔNG THẠO) */}
                    {isPerUnit && (
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 font-medium">Hình thức tính giá:</span>
                          <span className="text-purple-300 font-bold">Theo từng {svc.unitName || 'Trận'}</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-0.5">
                          <span className="text-[11px] text-zinc-400">Đơn giá niêm yết:</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base sm:text-lg font-black font-mono text-purple-400">
                              {(svc.price || 0).toLocaleString('vi-VN')}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium font-sans">
                              đ / {svc.unitName || 'Trận'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TRƯỜNG HỢP 4: TRỌN GÓI CỐ ĐỊNH (PHÂN HẠNG / CHUỖI / CẤP ĐỘ) */}
                    {isFixedPrice && (
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 font-medium">Hình thức cày:</span>
                          <span className="text-emerald-300 font-bold">Trọn gói hoàn thành</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-0.5">
                          <span className="text-[11px] text-zinc-400">Chi phí trọn gói:</span>
                          <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                            {(svc.price || 0).toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PHẦN ĐÁY FOOTER: CHỈ 1 DÒNG TỶ LỆ CỌC + NÚT BẤM CALL-TO-ACTION ĐỒNG BỘ */}
                  <div className="pt-3.5 border-t border-zinc-800/80 space-y-2.5 mt-auto">
                    {/* Dòng hiển thị thanh toán / tỷ lệ cọc duy nhất */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">
                        {isRankBoost || isFixedPrice ? 'Hình thức thanh toán:' : 'Tỷ lệ cọc giữ chỗ:'}
                      </span>
                      <span
                        className={`font-bold font-mono ${
                          isRankBoost || isFixedPrice
                            ? 'text-emerald-400'
                            : isPointBoost
                              ? 'text-cyan-400'
                              : 'text-amber-400'
                        }`}
                      >
                        {isRankBoost || isFixedPrice
                          ? 'Trọn gói 100% Escrow'
                          : svc.depositPercent === 100
                            ? 'Trọn gói 100%'
                            : `Cọc ${svc.depositPercent || 40}%`}
                      </span>
                    </div>

                    {/* Nút bấm hành động tương ứng từng loại hình */}
                    {isRankBoost ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRankEditingServiceId(svc.id);
                          setShowRankTableModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 hover:border-blue-500/60 text-blue-300 text-xs font-bold transition-all shadow-sm group cursor-pointer"
                      >
                        <Trophy size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
                        <span>Xem &amp; Sửa bảng giá {getRankSteps(svc.gameCode).length} bậc Rank</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ) : isPointBoost ? (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(svc)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-300 text-xs font-bold transition-all shadow-sm group cursor-pointer"
                      >
                        <Sparkles size={14} className="text-amber-400 group-hover:rotate-12 transition-transform" />
                        <span>Xem &amp; Sửa bảng giá theo {isAov ? 'Sao' : pointUnit}</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ) : isPerUnit ? (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(svc)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 text-xs font-bold transition-all shadow-sm group cursor-pointer"
                      >
                        <Edit2 size={13} className="text-purple-400 group-hover:scale-110 transition-transform" />
                        <span>Chỉnh sửa đơn giá {svc.unitName || 'Trận'}</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(svc)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 text-xs font-bold transition-all shadow-sm group cursor-pointer"
                      >
                        <Edit2 size={13} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>Chỉnh sửa gói cày trọn gói</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
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
        {/* MỤC 3: LỊCH TRỰC & THỜI GIAN LÀM VIỆC (WORKING HOURS & SLA)               */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-800">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Clock className="text-cyan-400 w-4 h-4" />
                <span>3. Lịch trực & Thời gian làm việc (Working Hours)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Thiết lập khung giờ và các ngày trong tuần bạn sẵn sàng cày rank để hiển thị công khai cho khách hàng.
              </p>
            </div>
            <span className="text-[11px] text-cyan-400 font-bold bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 w-fit">
              Hiển thị trên Thẻ tuyển thủ & Hồ sơ
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Cột trái: Chọn ngày & Khung giờ (8 cột) */}
            <div className="lg:col-span-8 space-y-3.5">
              {/* Chọn các ngày làm việc trong tuần */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Calendar size={14} className="text-cyan-400" />
                    <span>Các ngày nhận cày trong tuần:</span>
                  </label>
                  {/* Phím chọn nhanh */}
                  {(() => {
                    const cDays = workingSchedule.daysOfWeek || [];
                    const isAllWeek = cDays.length === 7;
                    const isWeekdaysNoSunday =
                      cDays.length === 6 &&
                      !cDays.includes('CN') &&
                      ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'].every((d) => cDays.includes(d));
                    const isWeekendOnly =
                      cDays.length === 2 && cDays.includes('T7') && cDays.includes('CN');

                    return (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const newDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
                            handleUpdateWorkingSchedule({ daysOfWeek: newDays });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isAllWeek
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                          }`}
                        >
                          Cả tuần (T2-CN)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                            handleUpdateWorkingSchedule({ daysOfWeek: newDays });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isWeekdaysNoSunday
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                          }`}
                        >
                          T2 - T7 (Trừ CN)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newDays = ['T7', 'CN'];
                            handleUpdateWorkingSchedule({ daysOfWeek: newDays });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isWeekendOnly
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                          }`}
                        >
                          Chỉ cuối tuần
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Nút bấm 7 ngày */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {ALL_WEEKDAYS.map((day) => {
                    const isSelected = (workingSchedule.daysOfWeek || []).includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          const currentDays = workingSchedule.daysOfWeek || [];
                          const newDays = isSelected
                            ? currentDays.filter((d) => d !== day.id)
                            : [...currentDays, day.id];
                          if (newDays.length === 0) {
                            toast.warning('Bạn cần chọn ít nhất 1 ngày làm việc');
                            return;
                          }
                          handleUpdateWorkingSchedule({ daysOfWeek: newDays });
                        }}
                        className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Khung giờ hàng ngày */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock size={14} className="text-cyan-400" />
                    <span>Khung giờ làm việc hàng ngày:</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-cyan-400">
                    {workingSchedule.fromTime} → {workingSchedule.toTime}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                      Giờ bắt đầu
                    </label>
                    <input
                      type="time"
                      value={workingSchedule.fromTime || '08:00'}
                      onChange={(e) => handleUpdateWorkingSchedule({ fromTime: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-cyan-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                      Giờ kết thúc
                    </label>
                    <input
                      type="time"
                      value={workingSchedule.toTime || '17:30'}
                      onChange={(e) => handleUpdateWorkingSchedule({ toTime: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Phím chọn nhanh ca */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                    Chọn nhanh khung giờ phổ biến:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: 'Hành chính (08:00 – 17:30)', from: '08:00', to: '17:30' },
                      { label: 'Ca Sáng (08:00 – 12:00)', from: '08:00', to: '12:00' },
                      { label: 'Ca Chiều (13:30 – 17:30)', from: '13:30', to: '17:30' },
                      { label: 'Ca Tối (19:00 – 23:00)', from: '19:00', to: '23:00' },
                      { label: 'Ca Đêm (23:00 – 04:00)', from: '23:00', to: '04:00' },
                    ].map((item, idx) => {
                      const isActive =
                        workingSchedule.fromTime === item.from &&
                        workingSchedule.toTime === item.to;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            handleUpdateWorkingSchedule({ fromTime: item.from, toTime: item.to })
                          }
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Ghi chú hiển thị công khai & Xem trước Huy hiệu (4 cột) */}
            <div className="lg:col-span-4 space-y-3.5">
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white block">
                      Ghi chú hiển thị công khai:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const autoNote = generateWorkingScheduleNote(
                          workingSchedule.fromTime,
                          workingSchedule.toTime,
                          workingSchedule.daysOfWeek
                        );
                        handleUpdateWorkingSchedule({ note: autoNote });
                        toast.success('Đã cập nhật câu ghi chú theo lịch hiện tại!');
                      }}
                      className="text-xs text-cyan-400 hover:underline font-bold cursor-pointer"
                    >
                      Tự tạo ghi chú
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="VD: Làm từ 8:00 -> 17:30 các ngày trong tuần trừ CN..."
                    value={workingSchedule.note || ''}
                    onChange={(e) => handleUpdateWorkingSchedule({ note: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500 resize-none font-medium"
                  />

                  {/* Thẻ xem trước Preview */}
                  <div className="p-3 rounded-xl bg-zinc-900/90 border border-cyan-500/20 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Khách hàng sẽ nhìn thấy:
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1.5 rounded-lg">
                      <Clock size={13} className="text-cyan-400 shrink-0" />
                      <span className="truncate">
                        {workingSchedule.note ||
                          generateWorkingScheduleNote(
                            workingSchedule.fromTime,
                            workingSchedule.toTime,
                            workingSchedule.daysOfWeek
                          )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trạng thái Bật/Tắt nhận đơn theo lịch */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Nhận đơn đặt lịch</span>
                    <span className="text-[10px] text-zinc-400">Cho phép khách hẹn giờ</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={workingSchedule.allowScheduledBoost}
                    onClick={() =>
                      handleUpdateWorkingSchedule({
                        allowScheduledBoost: !workingSchedule.allowScheduledBoost,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      workingSchedule.allowScheduledBoost
                        ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                        workingSchedule.allowScheduledBoost ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MỤC 4: CẤU HÌNH PHỤ PHÍ MỞ RỘNG (ADDONS) - ĐẦY ĐỦ 6 TIỆN ÍCH              */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Sparkles className="text-amber-400 w-4 h-4" />
                <span>4. Cấu hình mức phụ phí mở rộng (Addons)</span>
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
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${addonsConfig.specificRole.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${addonsConfig.specificRole.enabled ? 'translate-x-5' : 'translate-x-0'
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
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${addonsConfig.schedule.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${addonsConfig.schedule.enabled ? 'translate-x-5' : 'translate-x-0'
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

              {/* Thông tin lịch áp dụng từ Mục 3 */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                  Lịch áp dụng (từ Mục 3):
                </span>
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-cyan-300 font-medium">
                  <Clock size={12} className="text-cyan-400 shrink-0" />
                  <span className="truncate">
                    {workingSchedule.note ||
                      `${formatWorkingDays(workingSchedule.daysOfWeek)}: ${workingSchedule.fromTime} – ${workingSchedule.toTime}`}
                  </span>
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
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${addonsConfig.specificChamps.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${addonsConfig.specificChamps.enabled ? 'translate-x-5' : 'translate-x-0'
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
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${addonsConfig.livestream.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${addonsConfig.livestream.enabled ? 'translate-x-5' : 'translate-x-0'
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
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${addonsConfig.flash.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${addonsConfig.flash.enabled ? 'translate-x-5' : 'translate-x-0'
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
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${addonsConfig.duo.enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${addonsConfig.duo.enabled ? 'translate-x-5' : 'translate-x-0'
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
      {/* SECTION 5: CẤU HÌNH TƯỚNG TỦ SỞ TRƯỜNG (CHAMPION POOL)                     */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Shield size={18} className="text-cyan-400" />
              <span>5. Bể Tướng Tủ Sở Trường (Champion Pool)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Chọn các tướng bạn tự tin đạt tỷ lệ thắng cao nhất (3 – 10 tướng). Khách hàng sẽ nhìn thấy danh sách này trên hồ sơ cá nhân và được gợi ý ưu tiên chọn khi đặt gói &quot;Tùy chọn tướng (+30%)&quot;.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsBoosterChampionModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
          >
            <Plus size={15} />
            <span>{playingChampions.length > 0 ? 'Thêm / Đổi tướng tủ' : '+ Chọn tướng tủ'}</span>
          </button>
        </div>

        {/* Danh sách tướng tủ hiện tại */}
        {playingChampions.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">
                Đang cấu hình: <strong className="text-white font-bold">{playingChampions.length}/10</strong> tướng tủ
              </span>
              <span className="text-[11px] text-cyan-400 font-bold">
                ✓ Đã đồng bộ lên hồ sơ công khai &amp; gợi ý khi khách đặt đơn
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {playingChampions.map((champName) => {
                const champObj = allChampionsList.find(
                  (c) =>
                    c.name?.toLowerCase() === champName?.toLowerCase() ||
                    c.id?.toLowerCase() === champName?.toLowerCase()
                );
                return (
                  <div
                    key={champName}
                    className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-cyan-500/40 flex items-center gap-3 transition-colors group relative"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-cyan-400/40 shrink-0 bg-zinc-900 shadow-inner">
                      {champObj?.imageUrl ? (
                        <img
                          src={champObj.imageUrl}
                          alt={champName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-cyan-400 bg-zinc-800">
                          {champName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black text-white block truncate">
                        {champObj?.name || champName}
                      </span>
                      <span className="text-[10px] text-zinc-400 block truncate">
                        {champObj?.tags?.join(', ') || 'Tướng tủ'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = playingChampions.filter((c) => c !== champName);
                        setPlayingChampions(updated);
                        syncAllServices(
                          customServices,
                          addonsConfig,
                          coupon,
                          stepOverrides,
                          selectedGames,
                          workingSchedule,
                          { showToast: true, successMessage: `Đã bỏ tướng ${champName} khỏi danh sách tủ!` },
                          updated
                        );
                      }}
                      className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Xóa tướng này"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsBoosterChampionModalOpen(true)}
            className="p-8 border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 text-center cursor-pointer bg-zinc-950/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield size={24} />
            </div>
            <span className="text-sm font-bold text-white group-hover:text-cyan-300">
              Bạn chưa cấu hình Tướng tủ nào
            </span>
            <span className="text-xs text-zinc-400 max-w-md">
              Bấm vào đây để chọn các vị tướng bạn có kỹ năng cao nhất. Tướng tủ sẽ được hiển thị với huy hiệu nổi bật trên hồ sơ tuyển thủ và được gợi ý cho khách hàng.
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: MÃ GIẢM GIÁ RIÊNG CỦA TUYỂN THỦ                                */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4 max-w-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Tag size={18} className="text-amber-400" />
              <span>6. Mã Giảm Giá Riêng Của Bạn</span>
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
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${coupon.isActive ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${coupon.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-zinc-400 uppercase font-semibold block">
                Ký hiệu mã giảm giá
              </label>
              <span className="text-[10px] text-zinc-500 font-medium">Mã riêng không trùng</span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="VD: PRO10, CHAOCHIEN"
                value={coupon.code}
                onChange={(e) => {
                  const updated = { ...coupon, code: e.target.value.toUpperCase() };
                  setCoupon(updated);
                }}
                onBlur={() => syncAllServices(customServices, addonsConfig, coupon)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-28 py-2 text-xs font-mono font-bold text-white uppercase outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleGenerateCoupon}
                disabled={isGeneratingCoupon}
                title="Tự động sinh mã ngẫu nhiên không trùng lặp trên toàn hệ thống"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RotateCw size={12} className={isGeneratingCoupon ? 'animate-spin' : ''} />
                <span>Tự sinh mã</span>
              </button>
            </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-[#0e1017] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800/90 flex justify-between items-center bg-zinc-950/90 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      Bảng Giá Bậc Rank {gameDef?.name || modalGameCode}
                      <span className="text-zinc-400 font-semibold text-sm ml-2">
                        ({currentRankSteps[0]?.label} → {currentRankSteps[currentRankSteps.length - 1]?.label})
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Tùy chỉnh số tiền thực tế nhận cho từng bậc hoặc từng bước nhảy rank (để trống để dùng giá sàn mặc định).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRankTableModal(false)}
                  className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-dark-scrollbar space-y-6 flex-1">
                {/* CẤU HÌNH NHANH THEO BẬC LỚN CHO LIÊN QUÂN (AOV) */}
                {(modalGameCode === 'AOV' || modalGameCode === 'LIENQUAN') && (() => {
                  const activeOverrides = activeRankEditingServiceId
                    ? (customServices.find((s) => s.id === activeRankEditingServiceId)?.stepOverrides || {})
                    : stepOverrides;

                  const applyTierPackageChange = (pkg: typeof AOV_TIER_PACKAGES[number], val: number) => {
                    if (activeRankEditingServiceId) {
                      const updated = customServices.map((s) => {
                        if (s.id === activeRankEditingServiceId) {
                          return {
                            ...s,
                            stepOverrides: distributeAovTierPackageToSteps(pkg, val, s.stepOverrides || {}),
                          };
                        }
                        return s;
                      });
                      setCustomServices(updated);
                    } else {
                      setStepOverrides((prev) => distributeAovTierPackageToSteps(pkg, val, prev));
                    }
                  };

                  return (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/25 via-zinc-950/90 to-zinc-950 border border-amber-500/30 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles size={15} className="text-amber-400" />
                            <span>Cấu hình nhanh trọn từng bậc Liên Quân</span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Nhập giá trọn bậc — hệ thống tự chia đều cho từng đoàn bên dưới. Từ Cao Thủ trở lên tự do tùy chỉnh.
                          </p>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 w-fit shrink-0">
                          {AOV_TIER_PACKAGES.length} mốc bậc lớn
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {AOV_TIER_PACKAGES.map((pkg) => {
                          const currentTotal = getAovTierPackageCurrentTotal(pkg, activeOverrides);
                          const hasCustom = pkg.stepIds.some((id) => typeof activeOverrides[id] === 'number' && activeOverrides[id] > 0);
                          return (
                            <div
                              key={pkg.id}
                              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${pkg.isHighRank
                                ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-400/50'
                                : 'bg-zinc-900/70 border-zinc-800 hover:border-amber-500/40'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-xl px-1.5 py-1 shrink-0">
                                    <img src={pkg.fromImage} alt={pkg.fromTier} className="w-6 h-6 object-contain" />
                                    <ArrowRight size={11} className="text-zinc-500" />
                                    <img src={pkg.toImage} alt={pkg.toTier} className="w-6 h-6 object-contain" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-extrabold text-white truncate" title={pkg.label}>
                                      {pkg.shortLabel}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                                      {pkg.desc}
                                    </div>
                                  </div>
                                </div>
                                {pkg.isHighRank && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0">
                                    Cao Thủ+
                                  </span>
                                )}
                              </div>

                              <div className="relative">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  placeholder={pkg.defaultTotalPrice.toLocaleString('vi-VN')}
                                  value={hasCustom ? currentTotal : ''}
                                  onChange={(e) => {
                                    const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                    const val = clean ? parseInt(clean, 10) : 0;
                                    applyTierPackageChange(pkg, val);
                                  }}
                                  className={`w-full bg-zinc-950 border rounded-xl pr-7 pl-3 py-2 text-sm font-mono font-extrabold text-right outline-none transition-colors ${hasCustom
                                    ? 'border-amber-400/70 text-amber-300 focus:border-amber-400'
                                    : 'border-zinc-700/80 text-amber-300 placeholder:text-amber-300/60 focus:border-amber-400'
                                    }`}
                                />
                                <span className="text-xs font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                  đ
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                      Tinh chỉnh chi tiết từng nấc bậc ({currentRankSteps.length - 1} bước nhảy)
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Để trống = dùng giá sàn mặc định
                    </span>
                  </div>

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
                          className={`px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${currentOverride
                            ? 'bg-cyan-950/15 border-cyan-500/40'
                            : 'bg-zinc-950/90 border-zinc-800/90 hover:border-zinc-700'
                            }`}
                        >
                          <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-zinc-200 min-w-0">
                            <img src={stepImg} alt={step.label} className="w-7 h-7 object-contain shrink-0 drop-shadow" />
                            <span className="truncate">{step.label}</span>
                            <ArrowRight size={13} className="text-zinc-500 shrink-0" />
                            <img src={nextImg} alt={nextStep.label} className="w-7 h-7 object-contain shrink-0 drop-shadow" />
                            <span className="truncate">{nextStep.label}</span>
                          </div>

                          <div className="relative w-32 shrink-0">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder={step.stepPrice.toLocaleString('vi-VN')}
                              value={currentOverride || ''}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                const val = clean ? parseInt(clean, 10) : 0;
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
                              className="w-full bg-zinc-900 border border-zinc-700/90 rounded-xl pr-7 pl-3 py-1.5 text-xs sm:text-[13px] text-white placeholder:text-zinc-500 font-mono font-bold text-right outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[11px] font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                              đ
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-950/95 border-t border-zinc-800/90 flex justify-between items-center shrink-0">
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
                  className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
          <div
            className={`bg-[#0e1017] border border-white/10 rounded-3xl w-full shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh] transition-all duration-200 ${modalStep === 2 && ['rank-boost', 'net-wins', 'mastery', 'promotion'].includes(formData.serviceType || '')
              ? 'max-w-5xl'
              : 'max-w-2xl'
              }`}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800/90 flex justify-between items-center bg-zinc-950/90 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black text-sm shrink-0">
                  {modalStep}/2
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    {editingServiceId ? 'Sửa Gói Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {modalStep === 1
                      ? 'Bước 1: Cấu hình thông tin dịch vụ cơ bản'
                      : 'Bước 2: Cấu hình bảng giá chi tiết cho từng bậc'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* BƯỚC 1: CẤU HÌNH DỊCH VỤ CƠ BẢN */}
            {modalStep === 1 && (
              <form onSubmit={handleProceedToStep2} className="p-6 space-y-5 text-xs overflow-y-auto custom-dark-scrollbar">
                {/* 1. Tựa Game áp dụng */}
                <div>
                  <label className="text-zinc-300 font-bold uppercase block mb-1.5">
                    Tựa Game Áp Dụng <span className="text-cyan-400 font-normal normal-case">(*Mẫu dịch vụ sẽ tự động thích ứng)</span>
                  </label>
                  <select
                    value={formData.gameCode || activeGameCode}
                    onChange={(e) => handleGameChangeInModal(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-cyan-500 shadow-inner"
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
                  <label className="text-zinc-300 font-bold uppercase mb-1.5 flex items-center justify-between">
                    <span>Chọn Loại Hình Dịch Vụ</span>
                    {isServiceDuplicate(formData, customServices, editingServiceId) && (
                      <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                        Đã tồn tại trong game này
                      </span>
                    )}
                  </label>
                  <select
                    value={formData.serviceType || 'rank-boost'}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className={`w-full bg-zinc-950 border rounded-xl px-4 py-3 text-sm text-white font-bold outline-none shadow-inner transition-colors ${
                      isServiceDuplicate(formData, customServices, editingServiceId)
                        ? 'border-red-500/70 focus:border-red-500 text-red-200'
                        : 'border-cyan-500/40 focus:border-cyan-400'
                    }`}
                  >
                    <optgroup
                      label={`Danh mục dịch vụ chuẩn (${GAMES_CATALOG.find(
                        (g) => g.id.toUpperCase() === (formData.gameCode || activeGameCode).toUpperCase()
                      )?.shortName || (formData.gameCode || activeGameCode)
                        })`}
                    >
                      {availableServiceTypes.map((tpl) => {
                        const tplKey = (tpl.serviceType || tpl.slug || '').toLowerCase().trim();
                        const isConfigured = customServices.some((s) => {
                          if (editingServiceId && s.id === editingServiceId) return false;
                          const sGame = (s.gameCode || 'LOL').toUpperCase().trim();
                          const curGame = (formData.gameCode || activeGameCode).toUpperCase().trim();
                          if (sGame !== curGame) return false;
                          const sType = (s.serviceType || s.slug || '').toLowerCase().trim();
                          return sType === tplKey;
                        });

                        return (
                          <option
                            key={tpl.serviceType || tpl.slug}
                            value={tpl.serviceType || tpl.slug}
                            disabled={isConfigured}
                            className={isConfigured ? 'text-zinc-500 bg-zinc-900/90 font-normal italic' : 'text-white font-bold'}
                          >
                            {tpl.name} {isConfigured ? '✓ (Đã cấu hình)' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                    <option value="custom">-- Gói Dịch Vụ Tùy Chỉnh Khác --</option>
                  </select>

                  {isServiceDuplicate(formData, customServices, editingServiceId) && (
                    <div className="mt-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-red-200">
                          Dịch vụ này đã tồn tại trong tựa game {(formData.gameCode || activeGameCode).toUpperCase()}!
                        </p>
                        <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                          Mỗi tựa game chỉ được cấu hình duy nhất 1 gói của từng loại dịch vụ để tránh trùng lặp. Vui lòng chọn loại dịch vụ khác hoặc quay lại chỉnh sửa gói đã có.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tên Dịch Vụ (*) */}
                <div>
                  <label className="text-zinc-300 font-bold uppercase block mb-1.5">
                    Tên Dịch Vụ <span className="text-red-500 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cày Rank Liên Quân, Cày Theo Số Sao..."
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-semibold outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Mô Tả */}
                <div>
                  <label className="text-zinc-300 font-bold uppercase block mb-1.5">Mô Tả Gói Cày</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả cam kết thời gian hoàn thành, chất lượng và hỗ trợ..."
                    value={formData.desc || ''}
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isServiceDuplicate(formData, customServices, editingServiceId)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Tiếp tục: Cấu hình giá</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            )}

            {/* BƯỚC 2: CẤU HÌNH GIÁ CHO TỪNG BẬC CỦA DỊCH VỤ */}
            {modalStep === 2 && (
              <form onSubmit={handleFinalSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-dark-scrollbar p-6 space-y-5 text-xs">
                  {/* Banner Thông tin gói + Escrow gọn gàng trên 1 hàng */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-zinc-950 to-zinc-950 border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-extrabold text-white text-sm sm:text-base">{formData.name}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Thiết lập mức giá cụ thể cho từng bậc rank hoặc đơn giá sao của gói dịch vụ này.
                      </div>
                    </div>
                    {formData.serviceType === 'rank-boost' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0 self-start sm:self-auto">
                        <ShieldCheck size={14} />
                        <span>Trọn gói 100% Escrow</span>
                      </div>
                    )}
                  </div>

                  {/* TRƯỜNG HỢP 1: CÀY RANK / ELO SIÊU TỐC (THEO NẤC RANK CỦA TỰA GAME) */}
                  {formData.serviceType === 'rank-boost' && (() => {
                    const modalGameCode = (formData.gameCode || activeGameCode || 'LOL').toUpperCase();
                    const isAovModal = modalGameCode === 'AOV' || modalGameCode === 'LIENQUAN';
                    const currentRankSteps = getRankSteps(modalGameCode);

                    return (
                      <div className="space-y-6">
                        {isAovModal && (
                          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/25 via-zinc-950/90 to-zinc-950 border border-amber-500/30 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                                  <Sparkles size={15} className="text-amber-400" />
                                  <span>Cấu hình nhanh theo Bậc lớn (Đồng → Cao Thủ &amp; Cao Thủ trở lên)</span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  Nhập giá trọn bậc, hệ thống tự động chia đều xuống từng đoàn bên dưới. Từ Cao Thủ trở lên tự do tùy chỉnh.
                                </p>
                              </div>
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 w-fit shrink-0">
                                {AOV_TIER_PACKAGES.length} mốc bậc lớn
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {AOV_TIER_PACKAGES.map((pkg) => {
                                const currentTotal = getAovTierPackageCurrentTotal(pkg, formData.stepOverrides);
                                const hasCustom = pkg.stepIds.some(
                                  (id) => typeof formData.stepOverrides?.[id] === 'number' && (formData.stepOverrides?.[id] ?? 0) > 0
                                );
                                return (
                                  <div
                                    key={pkg.id}
                                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${pkg.isHighRank
                                      ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-400/50'
                                      : 'bg-zinc-900/70 border-zinc-800 hover:border-amber-500/40'
                                      }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-xl px-1.5 py-1 shrink-0">
                                          <img src={pkg.fromImage} alt={pkg.fromTier} className="w-6 h-6 object-contain" />
                                          <ArrowRight size={11} className="text-zinc-500" />
                                          <img src={pkg.toImage} alt={pkg.toTier} className="w-6 h-6 object-contain" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-xs font-extrabold text-white truncate" title={pkg.label}>
                                            {pkg.shortLabel}
                                          </div>
                                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                                            {pkg.desc}
                                          </div>
                                        </div>
                                      </div>
                                      {pkg.isHighRank && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0">
                                          Cao Thủ+
                                        </span>
                                      )}
                                    </div>

                                    <div className="relative">
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder={pkg.defaultTotalPrice.toLocaleString('vi-VN')}
                                        value={hasCustom ? currentTotal : ''}
                                        onChange={(e) => {
                                          const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                          const val = clean ? parseInt(clean, 10) : 0;
                                          setFormData((prev) => ({
                                            ...prev,
                                            stepOverrides: distributeAovTierPackageToSteps(pkg, val, prev.stepOverrides || {}),
                                          }));
                                        }}
                                        className={`w-full bg-zinc-950 border rounded-xl pr-7 pl-3 py-2 text-sm font-mono font-extrabold text-right outline-none transition-colors ${hasCustom
                                          ? 'border-amber-400/70 text-amber-300 focus:border-amber-400'
                                          : 'border-zinc-700/80 text-amber-300 placeholder:text-amber-300/60 focus:border-amber-400'
                                          }`}
                                      />
                                      <span className="text-xs font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        đ
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="text-xs sm:text-sm text-zinc-200 font-extrabold uppercase tracking-wide flex items-center gap-2">
                              <Trophy size={15} className="text-cyan-400" />
                              <span>
                                Bảng Giá Chi Tiết {currentRankSteps.length} Bậc Rank ({currentRankSteps[0]?.label} → {currentRankSteps[currentRankSteps.length - 1]?.label})
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, stepOverrides: {} })}
                              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 hover:border-cyan-400/50 transition-colors cursor-pointer"
                            >
                              Dùng giá sàn mặc định
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {currentRankSteps.slice(0, -1).map((step, idx) => {
                              const nextStep = currentRankSteps[idx + 1];
                              const overrideVal = formData.stepOverrides?.[step.id];
                              const stepImg = getRankImage(modalGameCode, step);
                              const nextImg = getRankImage(modalGameCode, nextStep);

                              return (
                                <div
                                  key={step.id}
                                  className={`px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${overrideVal
                                    ? 'bg-cyan-950/15 border-cyan-500/40'
                                    : 'bg-zinc-950/90 border-zinc-800/90 hover:border-zinc-700'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-zinc-200 min-w-0">
                                    <img src={stepImg} alt={step.label} className="w-7 h-7 object-contain shrink-0 drop-shadow" />
                                    <span className="truncate">{step.label}</span>
                                    <ArrowRight size={13} className="text-zinc-500 shrink-0" />
                                    <img src={nextImg} alt={nextStep.label} className="w-7 h-7 object-contain shrink-0 drop-shadow" />
                                    <span className="truncate">{nextStep.label}</span>
                                  </div>
                                  <div className="relative w-32 shrink-0">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      placeholder={step.stepPrice.toLocaleString('vi-VN')}
                                      value={overrideVal || ''}
                                      onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                        const val = clean ? parseInt(clean, 10) : 0;
                                        const steps = { ...(formData.stepOverrides || {}) };
                                        if (!val || val <= 0) {
                                          delete steps[step.id];
                                        } else {
                                          steps[step.id] = val;
                                        }
                                        setFormData({ ...formData, stepOverrides: steps });
                                      }}
                                      className="w-full bg-zinc-900 border border-zinc-700/90 rounded-xl pr-7 pl-3 py-1.5 text-xs sm:text-[13px] text-white placeholder:text-zinc-500 font-mono font-bold text-right outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="text-[11px] font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
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

                  {/* TRƯỜNG HỢP 2: CÀY ĐIỂM (LP HOẶC RR HOẶC SAO LIÊN QUÂN + CỌC) */}
                  {formData.serviceType === 'net-wins' && (() => {
                    const modalGameCode = (formData.gameCode || activeGameCode || 'LOL').toUpperCase();
                    const isVal = modalGameCode === 'VALORANT';
                    const isAov = modalGameCode === 'AOV' || modalGameCode === 'LIENQUAN';
                    const pointTiers = getPointBoostTiers(modalGameCode);
                    const oddStarTiers = isAov ? pointTiers.filter((t) => t.category === 'ODD_STAR' || !t.isHighEloRange) : [];
                    const highEloTiers = isAov ? pointTiers.filter((t) => t.category === 'HIGH_ELO' || t.isHighEloRange) : [];

                    const renderTierItem = (tier: typeof pointTiers[number]) => {
                      const currentVal = isAov
                        ? (formData.tierRates?.[tier.id] ?? resolveAovStarRate(tier.id, formData.tierRates))
                        : (formData.tierRates?.[tier.id] ?? tier.defaultPrice);
                      return (
                        <div key={tier.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 hover:border-cyan-500/40 transition-colors gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-black/50 border border-white/10 p-1.5 flex items-center justify-center shrink-0">
                              {tier.image ? (
                                <img
                                  src={tier.image}
                                  alt={tier.label}
                                  className="w-full h-full object-contain drop-shadow"
                                />
                              ) : (
                                <Crown size={18} className="text-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-white text-xs sm:text-sm block truncate">
                                {renderWithStarIcon(
                                  tier.label + (tier.shortLabel && tier.shortLabel !== tier.label ? ` (${tier.shortLabel})` : ''),
                                  13
                                )}
                              </span>
                              <span className="text-[11px] text-zinc-400 block truncate mt-0.5">
                                {renderWithStarIcon(tier.desc, 11)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={currentVal === 0 ? '' : currentVal}
                              placeholder={tier.defaultPrice.toLocaleString('vi-VN')}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                const parsed = clean ? parseInt(clean, 10) : 0;
                                setFormData((prev) => ({
                                  ...prev,
                                  tierRates: {
                                    ...(prev.tierRates || {}),
                                    [tier.id]: parsed,
                                  },
                                }));
                              }}
                              className="w-28 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono font-extrabold text-right outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-zinc-400 text-xs font-bold whitespace-nowrap">đ/{tier.unit}</span>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-5">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="text-zinc-200 font-extrabold uppercase block text-xs sm:text-sm">
                              Đơn Giá Cày {isVal ? 'Điểm RR Valorant' : isAov ? 'Sao Liên Quân' : 'Điểm LP Liên Minh'} Từng Mức Rank
                            </label>
                            <span className="text-xs text-cyan-400 font-bold">
                              Đơn vị: {isVal ? 'đ / RR' : isAov ? 'đ / Sao' : 'đ / LP'}
                            </span>
                          </div>

                          {isAov ? (
                            <div className="space-y-6">
                              {/* NHÓM 1: SAO LẺ DƯỚI CAO THỦ */}
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                                  <div className="flex items-center gap-2">
                                    <Sparkles size={15} className="text-cyan-400" />
                                    <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wide">
                                      1. Phân Khúc Cày Sao Lẻ (Bậc Dưới Cao Thủ)
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                                    Áp dụng khách cày 1 – 5 sao lẻ/đoàn
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {oddStarTiers.map(renderTierItem)}
                                </div>
                              </div>

                              {/* NHÓM 2: SAO TÍCH LŨY CAO THỦ+ */}
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                                  <div className="flex items-center gap-2">
                                    <Crown size={15} className="text-amber-400" />
                                    <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                                      2. Phân Khúc Cày Sao Tích Lũy (Cao Thủ Trở Lên)
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-0.5">
                                    {renderWithStarIcon('Áp dụng khách cày 0★ ➔ 100★+', 11)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {highEloTiers.map(renderTierItem)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {pointTiers.map(renderTierItem)}
                            </div>
                          )}
                        </div>

                        {/* Tỷ lệ cọc riêng cho dịch vụ cày theo điểm / sao */}
                        <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-zinc-300 font-bold uppercase block text-xs">
                              Tỷ Lệ Cọc Escrow Giữ Chỗ
                            </label>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono">
                              Khuyên dùng
                            </span>
                          </div>
                          <select
                            value={formData.depositPercent ?? (isVal || isAov ? 40 : 30)}
                            onChange={(e) => setFormData({ ...formData, depositPercent: parseInt(e.target.value) })}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white font-semibold outline-none focus:border-cyan-500 text-xs sm:text-sm"
                          >
                            <option value="30">Cọc 30% giữ chỗ</option>
                            <option value="40">Cọc 40% giữ chỗ (Khuyên dùng)</option>
                            <option value="50">Cọc 50%</option>
                            <option value="100">Thanh toán trọn gói 100%</option>
                          </select>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TRƯỜNG HỢP 3: HUẤN LUYỆN COACHING */}
                  {formData.serviceType === 'coaching' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-zinc-300">
                        <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                          <Target size={15} />
                          <span>Huấn Luyện Coaching 1-1</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Dạy kèm kỹ năng, phân tích replay ván đấu hoặc duo kèm cặp trực tiếp theo thời gian.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                          <select
                            value={formData.unitName || 'Giờ'}
                            onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs cursor-pointer"
                          >
                            <option value="Giờ">Giờ (Khuyên dùng)</option>
                            <option value="Ngày">Ngày</option>
                            <option value="Tuần">Tuần</option>
                            <option value="Tháng">Tháng</option>
                            <option value="Buổi học (2 giờ)">Buổi học (2 giờ)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-zinc-400 font-bold uppercase block mb-1">
                            Đơn Giá (VNĐ / {formData.unitName || 'Giờ'})
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="VD: 100000"
                            value={formData.price || ''}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                        >
                          <option value="50">Cọc 50% giữ chỗ</option>
                          <option value="100">Thanh toán trọn gói 100% (Khuyên dùng)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* TRƯỜNG HỢP 4: CÀY THÔNG THẠO TƯỚNG (CHUẨN RIOT CẤP 1 ĐẾN 10+) */}
                  {formData.serviceType === 'mastery' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-zinc-300">
                        <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                          <Swords size={15} />
                          <span>Cơ Chế Thông Thạo Riot Games Mới (Cấp 1 ➔ Cấp 10+)</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Cày điểm thông thạo và tích lũy dấu ấn từ Cấp 1 đến Cấp 10+ (mở khóa vĩnh viễn Danh hiệu tướng).
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                          <input
                            type="text"
                            value={formData.unitName || 'Cấp thông thạo'}
                            onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 font-bold uppercase block mb-1">
                            Đơn Giá Bình Quân / Cấp (VNĐ)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="VD: 50000"
                            value={formData.price || ''}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>

                      {/* Bảng giá từng mốc cấp độ thông thạo */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-zinc-200 font-extrabold uppercase block text-xs sm:text-sm">
                            Bảng Giá Chi Tiết Theo Nấc Thông Thạo (Cấp 1 ➔ Cấp 10+)
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, stepOverrides: {} })}
                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 hover:border-cyan-400/50 transition-colors cursor-pointer"
                          >
                            Dùng giá mặc định
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {LOL_MASTERY_STEPS.map((mStep) => {
                            const overrideVal = formData.stepOverrides?.[mStep.id] ?? mStep.defaultPrice;
                            return (
                              <div
                                key={mStep.id}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 hover:border-cyan-500/40 transition-colors gap-3"
                              >
                                <div className="min-w-0">
                                  <div className="font-extrabold text-white text-xs sm:text-sm">{mStep.label}</div>
                                  <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                                    {mStep.pointsReq} {mStep.marksReq !== 'Không có' ? `+ ${mStep.marksReq}` : ''}
                                  </div>
                                </div>
                                <div className="relative w-32 shrink-0">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={overrideVal || ''}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                      const val = clean ? parseInt(clean, 10) : 0;
                                      const steps = { ...(formData.stepOverrides || {}) };
                                      if (val <= 0) {
                                        delete steps[mStep.id];
                                      } else {
                                        steps[mStep.id] = val;
                                      }
                                      setFormData({ ...formData, stepOverrides: steps });
                                    }}
                                    className="w-full bg-zinc-900 border border-zinc-700/90 rounded-xl pr-7 pl-3 py-2 text-xs sm:text-sm text-white font-mono font-bold text-right outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-xs font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    đ
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TRƯỜNG HỢP 5: CÀY CẤP ĐỘ (LEVELING) */}
                  {formData.serviceType === 'leveling' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-zinc-300">
                        <div className="flex items-center gap-2 font-bold text-blue-300 mb-1">
                          <Users size={15} />
                          <span>Cày Cấp Độ Tài Khoản (Từ Cấp Này ➔ Cấp Khác)</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Khách hàng chọn cấp độ bắt đầu và cấp độ đích. Giá được tính tự động theo số cấp chênh lệch.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                          <input
                            type="text"
                            value={formData.unitName || 'Cấp độ'}
                            onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 font-bold uppercase block mb-1">
                            Đơn Giá / 1 Cấp Độ (VNĐ)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="VD: 10000"
                            value={formData.price || ''}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>

                      {formData.price > 0 && (
                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-between">
                          <span>Ví dụ cày từ Cấp 1 lên 30 (29 cấp):</span>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            {new Intl.NumberFormat('vi-VN').format((formData.price || 0) * 29)} đ
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TRƯỜNG HỢP 6: PHÂN HẠNG ĐẦU MÙA (PLACEMENTS: 8 RANK TỪ SẮT ĐẾN CAO THỦ) */}
                  {formData.serviceType === 'placements' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs text-zinc-300">
                        <div className="flex items-center gap-2 font-bold text-purple-300 mb-1">
                          <Medal size={16} />
                          <span>Phân Hạng Đầu Mùa (Tối Đa 5 Trận · 8 Mốc Rank Mùa Trước)</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Tương ứng với góc nhìn khách hàng (chọn Rank mùa trước từ <strong>Sắt đến Cao Thủ</strong> và chọn từ <strong>1 đến 5 trận</strong>). Thiết lập đơn giá / 1 trận phân hạng cho từng bậc rank dưới đây:
                        </p>
                      </div>

                      {/* Thanh công cụ áp dụng giá nhanh */}
                      <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-purple-400" />
                            <span>Công Cụ Thiết Lập Giá Nhanh</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const defaultSteps: Record<string, number> = {};
                              LOL_PLACEMENT_TIERS.forEach((t) => {
                                defaultSteps[t.id] = t.defaultPrice;
                              });
                              setFormData({
                                ...formData,
                                price: 30000,
                                unitName: 'Trận',
                                stepOverrides: defaultSteps,
                              });
                              toast.success('Đã khôi phục bảng giá mặc định theo hệ thống');
                            }}
                            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 transition-colors cursor-pointer"
                          >
                            Dùng giá mặc định hệ thống
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="VD: 30000"
                              value={placementQuickPrice || ''}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                setPlacementQuickPrice(clean ? parseInt(clean, 10) : 0);
                              }}
                              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-mono font-bold outline-none focus:border-purple-500"
                            />
                            <span className="text-xs text-zinc-500 font-mono absolute right-3 top-1/2 -translate-y-1/2">
                              đ / trận
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (placementQuickPrice <= 0) {
                                toast.error('Vui lòng nhập số tiền hợp lệ');
                                return;
                              }
                              const newSteps: Record<string, number> = {};
                              LOL_PLACEMENT_TIERS.forEach((t) => {
                                newSteps[t.id] = Math.round(placementQuickPrice * t.multiplier);
                              });
                              setFormData({
                                ...formData,
                                price: placementQuickPrice,
                                unitName: 'Trận',
                                stepOverrides: newSteps,
                              });
                              toast.success('Đã tự động tính giá theo hệ số rank cho 8 mốc');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Tự động nhân hệ số Rank</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (placementQuickPrice <= 0) {
                                toast.error('Vui lòng nhập số tiền hợp lệ');
                                return;
                              }
                              const newSteps: Record<string, number> = {};
                              LOL_PLACEMENT_TIERS.forEach((t) => {
                                newSteps[t.id] = placementQuickPrice;
                              });
                              setFormData({
                                ...formData,
                                price: placementQuickPrice,
                                unitName: 'Trận',
                                stepOverrides: newSteps,
                              });
                              toast.success(`Đã áp dụng ${placementQuickPrice.toLocaleString('vi-VN')} đ cho tất cả 8 rank`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Áp dụng giá này cho tất cả</span>
                          </button>
                        </div>
                      </div>

                      {/* Bảng giá chi tiết 8 mức Rank từ Sắt đến Cao Thủ */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-zinc-200 font-extrabold uppercase block text-xs sm:text-sm">
                            Bảng Giá Theo Từng Mức Rank Mùa Trước (8 Mốc)
                          </label>
                          <span className="text-[11px] text-zinc-400">
                            Đơn vị: <strong>VNĐ / 1 trận</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {LOL_PLACEMENT_TIERS.map((tier) => {
                            const overrideVal = formData.stepOverrides?.[tier.id] ?? tier.defaultPrice;
                            return (
                              <div
                                key={tier.id}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 hover:border-purple-500/40 transition-colors gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center p-1 shrink-0">
                                    <img
                                      src={tier.icon}
                                      alt={tier.name}
                                      className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-extrabold text-white text-xs sm:text-sm">
                                      Rank {tier.name}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                      Gói 5 trận: <span className="text-purple-400 font-bold font-mono">{(overrideVal * 5).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="relative w-36 shrink-0">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={overrideVal || ''}
                                    placeholder="VD: 30000"
                                    onChange={(e) => {
                                      const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                      const val = clean ? parseInt(clean, 10) : 0;
                                      const steps = { ...(formData.stepOverrides || {}) };
                                      if (val <= 0) {
                                        delete steps[tier.id];
                                      } else {
                                        steps[tier.id] = val;
                                      }
                                      setFormData({
                                        ...formData,
                                        unitName: 'Trận',
                                        price: steps['IRON'] || formData.price || tier.defaultPrice,
                                        stepOverrides: steps,
                                      });
                                    }}
                                    className="w-full bg-zinc-900 border border-zinc-700/90 rounded-xl pr-14 pl-3 py-2 text-xs sm:text-sm text-white font-mono font-bold text-right outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-[11px] font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    đ/trận
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TRƯỜNG HỢP 7: CÀY THEO SỐ TRẬN THẮNG (MATCHES) */}
                  {formData.serviceType === 'matches' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/25 text-xs text-zinc-300 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-emerald-300">
                          <Gamepad2 size={15} />
                          <span>Cày Theo Số Trận Thắng (1 – 10 trận thắng)</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          Khách hàng chọn số lượng trận thắng mong muốn (1–10 trận). Tiến độ đơn hàng chỉ tính theo{' '}
                          <strong className="text-white">số trận Thắng đạt được</strong>.
                        </p>
                        <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                          • Trường hợp phát sinh trận thua, Booster <strong>chủ động đánh bù miễn phí</strong> để hoàn thành đủ số trận thắng cam kết cho khách.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                          <input
                            type="text"
                            value={formData.unitName || 'Trận thắng'}
                            onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-emerald-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 font-bold uppercase block mb-1">
                            Đơn Giá / 1 Trận Thắng (VNĐ)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="VD: 35000"
                            value={formData.price || ''}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-emerald-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>

                      {Number(formData.price || 0) > 0 && (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {[3, 5, 10].map((qty) => (
                            <div
                              key={qty}
                              className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5 text-center"
                            >
                              <div className="text-[10px] text-zinc-500 font-semibold uppercase">
                                Gói {qty} trận thắng
                              </div>
                              <div className="text-xs font-extrabold text-emerald-400 font-mono mt-0.5">
                                {(Number(formData.price || 0) * qty).toLocaleString('vi-VN')} đ
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TRƯỜNG HỢP: CHUỖI THĂNG HẠNG (PROMOTION) */}
                  {formData.serviceType === 'promotion' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-zinc-300">
                        <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                          <Zap size={15} />
                          <span>Cấu Hình Giá Cho Từng Chuỗi Thăng Hạng (Bậc I ➔ Bậc Tiếp Theo)</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Khách hàng sẽ chọn rank hiện tại (Sắt I, Đồng I, Bạc I, Vàng I, Bạch Kim I, Lục Bảo I, Kim Cương I) để bạn cày thăng hạng lên bậc kế tiếp (ví dụ: Lục Bảo I ➔ Kim Cương IV). Bạn có thể tùy chỉnh đơn giá cho từng chuỗi dưới đây.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-zinc-200 font-extrabold uppercase block text-xs sm:text-sm">
                            Bảng Giá Chi Tiết Theo Từng Chuỗi (7 Nấc)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                price: 40000,
                                stepOverrides: {},
                              });
                            }}
                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 hover:border-cyan-400/50 transition-colors cursor-pointer"
                          >
                            Dùng giá mặc định
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {LOL_PROMOTION_SERIES.map((promoStep) => {
                            const overrideVal = formData.stepOverrides?.[promoStep.id] ?? promoStep.defaultPrice;
                            return (
                              <div
                                key={promoStep.id}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 hover:border-amber-500/40 transition-colors gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-xl px-2 py-1.5 shrink-0">
                                    <img
                                      src={promoStep.icon}
                                      alt={promoStep.fromLabel}
                                      className="w-7 h-7 object-contain"
                                    />
                                    <ArrowRight size={12} className="text-zinc-500" />
                                    <img
                                      src={promoStep.targetIcon}
                                      alt={promoStep.toLabel}
                                      className="w-7 h-7 object-contain"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-extrabold text-white text-xs sm:text-sm truncate">
                                      {promoStep.fromLabel} ➔ {promoStep.toLabel}
                                    </div>
                                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                                      Chuỗi BO3/BO5 · Cam kết thăng hạng
                                    </div>
                                  </div>
                                </div>
                                <div className="relative w-32 shrink-0">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={overrideVal || ''}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                      const val = clean ? parseInt(clean, 10) : 0;
                                      const steps = { ...(formData.stepOverrides || {}) };
                                      if (val <= 0) {
                                        delete steps[promoStep.id];
                                      } else {
                                        steps[promoStep.id] = val;
                                      }
                                      setFormData({
                                        ...formData,
                                        price: formData.price || promoStep.defaultPrice,
                                        stepOverrides: steps,
                                      });
                                    }}
                                    className="w-full bg-zinc-900 border border-zinc-700/90 rounded-xl pr-7 pl-3 py-2 text-xs sm:text-sm text-white font-mono font-bold text-right outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-xs font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    đ
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TRƯỜNG HỢP 8: GÓI TÙY CHỈNH (CUSTOM) */}
                  {formData.serviceType === 'custom' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-300">
                        <div className="font-bold text-white text-xs mb-1">Cấu Hình Mô Hình Giá Gói Tùy Chỉnh</div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Chọn rõ hình thức tính giá cho gói dịch vụ riêng của bạn để khách hàng hiểu chính xác khi đặt hàng.
                        </p>
                      </div>

                      <div>
                        <label className="text-zinc-400 font-bold uppercase block mb-1.5">Hình Thức Tính Giá</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, pricingType: 'PER_UNIT', unitName: 'Trận thắng' })}
                            className={`p-2.5 rounded-xl border text-center transition-all ${formData.pricingType === 'PER_UNIT' && (formData.unitName === 'Trận' || formData.unitName === 'Trận thắng')
                              ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-md'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                          >
                            Theo Số Trận Thắng
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, pricingType: 'PER_UNIT', unitName: 'Giờ' })}
                            className={`p-2.5 rounded-xl border text-center transition-all ${formData.pricingType === 'PER_UNIT' && formData.unitName !== 'Trận'
                              ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-md'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                          >
                            Theo Thời Gian
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, pricingType: 'FIXED', unitName: 'Gói' })}
                            className={`p-2.5 rounded-xl border text-center transition-all ${formData.pricingType === 'FIXED'
                              ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-md'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                          >
                            Trọn Gói Cố Định
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                          <input
                            type="text"
                            placeholder="VD: Trận, Giờ, Nhiệm vụ"
                            value={formData.unitName || ''}
                            onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Giá (VNĐ)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Nhập giá VNĐ"
                            value={formData.price || ''}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TRƯỜNG HỢP 9: CÁC DỊCH VỤ TRỌN GÓI CỐ ĐỊNH KHÁC (BATTLE-PASS,...) */}
                  {formData.serviceType !== 'rank-boost' &&
                    formData.serviceType !== 'net-wins' &&
                    formData.serviceType !== 'coaching' &&
                    formData.serviceType !== 'mastery' &&
                    formData.serviceType !== 'leveling' &&
                    formData.serviceType !== 'placements' &&
                    formData.serviceType !== 'matches' &&
                    formData.serviceType !== 'promotion' &&
                    formData.serviceType !== 'custom' &&
                    formData.pricingType === 'FIXED' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-zinc-400 font-bold uppercase block mb-1">
                            Giá Trọn Gói Dịch Vụ (VNĐ)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Nhập đơn giá (VNĐ)"
                            value={formData.price || ''}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400">
                          <span>Hình thức thanh toán:</span>
                          <span className="text-emerald-400 font-bold">Trọn gói 100% Escrow</span>
                        </div>
                      </div>
                    )}

                  {/* TRƯỜNG HỢP 10: CÁC DỊCH VỤ PER_UNIT CHUNG KHÁC */}
                  {formData.serviceType !== 'rank-boost' &&
                    formData.serviceType !== 'net-wins' &&
                    formData.serviceType !== 'coaching' &&
                    formData.serviceType !== 'mastery' &&
                    formData.serviceType !== 'leveling' &&
                    formData.serviceType !== 'placements' &&
                    formData.serviceType !== 'matches' &&
                    formData.serviceType !== 'promotion' &&
                    formData.serviceType !== 'custom' &&
                    formData.pricingType === 'PER_UNIT' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                            <input
                              type="text"
                              placeholder="VD: Trận, Giờ"
                              value={formData.unitName || ''}
                              onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Giá (VNĐ)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="Nhập đơn giá (VNĐ)"
                              value={formData.price || ''}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                          >
                            <option value="30">Cọc 30% giữ chỗ</option>
                            <option value="50">Cọc 50%</option>
                            <option value="100">Thanh toán trọn gói 100%</option>
                          </select>
                        </div>
                      </div>
                    )}

                </div>

                {/* Sticky Footer cố định ở đáy Modal */}
                <div className="shrink-0 px-6 py-4 bg-zinc-950/95 border-t border-zinc-800/90 flex justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={15} />
                    <span>Quay lại Bước 1</span>
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Save size={16} />
                    <span>{editingServiceId ? 'Lưu Thay Đổi' : 'Lưu & Kích Hoạt Dịch Vụ'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Chọn Tướng Tủ của Booster (Champion Pool) */}
      <ChampionModal
        isOpen={isBoosterChampionModalOpen}
        onClose={() => setIsBoosterChampionModalOpen(false)}
        champions={allChampionsList}
        multiSelect={true}
        maxSelect={10}
        selectedIds={playingChampions}
        title="Chọn danh sách Tướng tủ sở trường (Champion Pool)"
        onSelectMultiple={(selectedChamps) => {
          const names = selectedChamps.map((c) => c.name || c.id);
          setPlayingChampions(names);
          syncAllServices(
            customServices,
            addonsConfig,
            coupon,
            stepOverrides,
            selectedGames,
            workingSchedule,
            { showToast: true, successMessage: `Đã lưu ${names.length} tướng tủ vào hồ sơ tuyển thủ!` },
            names
          );
        }}
      />
    </div>
  );
}
