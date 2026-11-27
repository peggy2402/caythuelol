// src/app/(dashboard)/booster/services/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Trophy, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import BarLoader from '@/components/ui/BarLoader';
import ChampionModal from '@/components/champion/ChampionModal';
import {
  GAMES_CATALOG,
  STANDARD_SERVICE_TEMPLATES,
} from '@/lib/games';
import { DEFAULT_AOV_STAR_RATES, resolveAovStarRate } from '@/lib/aov';
import {
  generateWorkingScheduleNote,
  BoosterWorkingSchedule,
} from '@/lib/booster-helpers';

import {
  CustomService,
  BoosterCoupon,
  AddonsConfig,
  TierRates,
  GameSelectorSection,
  GameSelectorPopover,
  ServiceCardItem,
  BoosterScheduleSection,
  AddonsConfigSection,
  BoosterChampionPoolSection,
  BoosterCouponSection,
  RankTableModal,
  ServiceUpsertModal,
  FloatingSaveButton,
} from './components';

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

  // Đồng bộ toàn bộ cài đặt lên DB ngay lập tức
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
      const champs =
        updatedPlayingChampions !== undefined ? updatedPlayingChampions : playingChampions;

      let ws: BoosterWorkingSchedule = workingSchedule;
      let options: { showToast?: boolean; successMessage?: string } | undefined = maybeOptions;

      if (updatedWorkingScheduleOrOptions) {
        if (
          'showToast' in updatedWorkingScheduleOrOptions ||
          'successMessage' in updatedWorkingScheduleOrOptions
        ) {
          options = updatedWorkingScheduleOrOptions as {
            showToast?: boolean;
            successMessage?: string;
          };
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

  // Hàm lưu toàn bộ cài đặt (dùng chung cho Header & Nút nổi Fixed Bottom-Right)
  const handleSaveAll = () => {
    syncAllServices(
      customServices,
      addonsConfig,
      coupon,
      stepOverrides,
      selectedGames,
      workingSchedule,
      {
        showToast: true,
        successMessage: 'Đã lưu toàn bộ cấu hình dịch vụ thành công!',
      },
      playingChampions
    );
  };

  // Cập nhật lịch làm việc của Booster
  const handleUpdateWorkingSchedule = (partial: Partial<BoosterWorkingSchedule>) => {
    const nextDays =
      partial.daysOfWeek ?? workingSchedule.daysOfWeek ?? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const nextFrom = partial.fromTime ?? workingSchedule.fromTime ?? '08:00';
    const nextTo = partial.toTime ?? workingSchedule.toTime ?? '17:30';

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
              s.customServices.filter(
                (svc: any) => svc.serviceType !== 'duo-boost' && svc.slug !== 'duo-boost'
              )
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

          if (
            s.playingChampions ||
            s.service_settings?.playingChampions ||
            s.standardConfig?.playingChampions
          ) {
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
          templatesToUse = json.data.filter(
            (t: any) => t.slug !== 'duo-boost' && t.serviceType !== 'duo-boost'
          );
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

    const configuredServiceTypes = new Set(
      customServices
        .filter((s) => (s.gameCode || 'LOL').toUpperCase().trim() === code)
        .map((s) => (s.serviceType || s.slug || '').toLowerCase().trim())
    );

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
    if (
      isVal &&
      (cleanName.includes('Cao Thủ') ||
        cleanName.includes('LP') ||
        cleanName.toLowerCase() === 'cày điểm ...' ||
        cleanName === 'Cày Điểm')
    ) {
      cleanName = 'Cày Điểm RR (Immortal / Radiant)';
    } else if (
      isAov &&
      svc.serviceType === 'net-wins' &&
      (cleanName.includes('Trận Thắng') ||
        cleanName.includes('LP') ||
        cleanName.includes('RR') ||
        cleanName === 'Cày Rank Cao Cấp')
    ) {
      cleanName = 'Cày Theo Số Sao (Đồng ➔ Chiến Tướng 99★+)';
    }
    let cleanDesc = svc.desc || '';
    if (
      isVal &&
      (cleanDesc.includes('Cao Thủ') || cleanDesc.includes('LP') || cleanDesc.includes('Đại Cao Thủ'))
    ) {
      cleanDesc = 'Cày điểm xếp hạng Rank Rating (RR) bậc Immortal và Radiant theo điểm số.';
    } else if (
      isAov &&
      (cleanDesc.includes('MMR') || cleanDesc.includes('LP') || cleanDesc.includes('RR'))
    ) {
      cleanDesc =
        'Tính tiền theo từng Sao (5k–30k+/sao) từ Đồng–Kim Cương, Tinh Anh, Cao Thủ, Đại Cao Thủ đến Chiến Tướng.';
    }
    const cleanUnit =
      svc.serviceType === 'placements' || svc.serviceType === 'matches'
        ? 'Trận'
        : isVal
          ? 'Điểm RR'
          : isAov
            ? svc.serviceType === 'net-wins'
              ? 'Sao'
              : svc.unitName || 'Sao'
            : svc.unitName || 'Điểm LP';

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

    const tpl = availableServiceTypes.find((t) => (t.serviceType || t.slug) === selectedType);

    if (tpl) {
      const gCode = (tpl.gameCode || formData.gameCode || activeGameCode || '').toUpperCase().trim();
      const isVal = gCode === 'VALORANT';
      const isAov = gCode === 'AOV' || gCode === 'LIENQUAN';

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
        tierRates:
          tpl.tierRates ||
          prev.tierRates ||
          (isVal
            ? {
                immortal1_2: 5000,
                immortal2_3: 7000,
                immortal3_radiant: 10000,
                radiant_top100: 20000,
              }
            : isAov
              ? {
                  ...DEFAULT_AOV_STAR_RATES,
                }
              : {
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
    (s) =>
      (s.gameCode || 'LOL').toUpperCase() === activeGameCode &&
      s.serviceType !== 'duo-boost' &&
      s.slug !== 'duo-boost'
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
    <div className="space-y-8 max-w-7xl mx-auto pb-32">
      {/* HEADER SECTION */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Cấu Hình Dịch Vụ &amp; Bảng Giá
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
            Booster Studio
          </span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Tự do cấu hình từng dịch vụ nhận cày, bảng giá chi tiết từng bậc rank và mức phụ phí tiện ích riêng.
        </p>
      </div>

      {/* SECTION 1: TỰA GAME BẠN CÓ THỂ CÀY */}
      <GameSelectorSection
        selectedGames={selectedGames}
        isSection1Collapsed={isSection1Collapsed}
        setIsSection1Collapsed={setIsSection1Collapsed}
        section1Search={section1Search}
        setSection1Search={setSection1Search}
        onToggleGame={handleToggleGame}
      />

      {/* SECTION 2: DANH MỤC DỊCH VỤ BẠN CUNG CẤP */}
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

        {/* HÀNG 2: BỘ CHỌN TỰA GAME THÔNG MINH */}
        <GameSelectorPopover
          selectedGames={selectedGames}
          activeGameCode={activeGameCode}
          setActiveGameCode={setActiveGameCode}
          currentGameDef={currentGameDef}
          customServices={customServices}
          isGameSelectorOpen={isGameSelectorOpen}
          setIsGameSelectorOpen={setIsGameSelectorOpen}
          gameSearchQuery={gameSearchQuery}
          setGameSearchQuery={setGameSearchQuery}
          gameSelectorRef={gameSelectorRef}
        />

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
              {(activeGameCode.toUpperCase() === 'AOV' ||
                activeGameCode.toUpperCase() === 'LIENQUAN') && (
                <button
                  type="button"
                  onClick={handleInitDefaultAovServices}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles size={15} />
                  <span>Khởi tạo bảng giá Liên Quân mặc định (Theo Bậc &amp; Theo Sao)</span>
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
            {currentServices.map((svc) => (
              <ServiceCardItem
                key={svc.id}
                svc={svc}
                activeGameCode={activeGameCode}
                isExpanded={!!expandedTierServiceIds[svc.id]}
                onToggleExpand={() => toggleExpandTiers(svc.id)}
                onOpenEditModal={handleOpenEditModal}
                onDeleteService={handleDeleteService}
                onToggleService={handleToggleService}
                onOpenRankTableModal={(serviceId) => {
                  setActiveRankEditingServiceId(serviceId);
                  setShowRankTableModal(true);
                }}
              />
            ))}

            {/* Thẻ Thêm Dịch Vụ Nhanh (Dashed Card) */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="p-5 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all flex flex-col items-center justify-center gap-2.5 text-zinc-400 hover:text-cyan-400 min-h-[220px] group cursor-pointer"
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

        {/* SECTION 3: LỊCH TRỰC & THỜI GIAN LÀM VIỆC */}
        <BoosterScheduleSection
          workingSchedule={workingSchedule}
          onUpdateWorkingSchedule={handleUpdateWorkingSchedule}
        />

        {/* SECTION 4: CẤU HÌNH PHỤ PHÍ MỞ RỘNG (ADDONS) */}
        <AddonsConfigSection
          addonsConfig={addonsConfig}
          workingSchedule={workingSchedule}
          onChangeAddons={(updated) => {
            setAddonsConfig(updated);
            syncAllServices(customServices, updated);
          }}
        />
      </div>

      {/* SECTION 5: BỂ TƯỚNG TỦ SỞ TRƯỜNG */}
      <BoosterChampionPoolSection
        playingChampions={playingChampions}
        allChampionsList={allChampionsList}
        onOpenModal={() => setIsBoosterChampionModalOpen(true)}
        onRemoveChampion={(champName) => {
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
      />

      {/* SECTION 6: MÃ GIẢM GIÁ RIÊNG */}
      <BoosterCouponSection
        coupon={coupon}
        isGeneratingCoupon={isGeneratingCoupon}
        onChangeCoupon={(updated) => {
          setCoupon(updated);
        }}
        onGenerateCoupon={handleGenerateCoupon}
        onSaveCoupon={() => syncAllServices(customServices, addonsConfig, coupon)}
      />

      {/* MODAL 1: BẢNG GIÁ BẬC RANK */}
      <RankTableModal
        isOpen={showRankTableModal}
        onClose={() => setShowRankTableModal(false)}
        activeRankEditingServiceId={activeRankEditingServiceId}
        customServices={customServices}
        stepOverrides={stepOverrides}
        activeGameCode={activeGameCode}
        setCustomServices={setCustomServices}
        setStepOverrides={setStepOverrides}
        onResetToDefault={() => {
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
        onSaveAndClose={() => {
          setShowRankTableModal(false);
          syncAllServices(customServices, addonsConfig, coupon, stepOverrides, selectedGames, {
            showToast: true,
            successMessage: 'Đã lưu bảng giá bậc rank thành công!',
          });
        }}
      />

      {/* MODAL 2: THÊM / SỬA DỊCH VỤ 2 BƯỚC */}
      <ServiceUpsertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalStep={modalStep}
        setModalStep={setModalStep}
        editingServiceId={editingServiceId}
        formData={formData}
        setFormData={setFormData}
        activeGameCode={activeGameCode}
        availableServiceTypes={availableServiceTypes}
        customServices={customServices}
        placementQuickPrice={placementQuickPrice}
        setPlacementQuickPrice={setPlacementQuickPrice}
        onGameChangeInModal={handleGameChangeInModal}
        onSelectTemplate={handleSelectTemplate}
        onProceedToStep2={handleProceedToStep2}
        onFinalSubmit={handleFinalSubmit}
        isServiceDuplicate={isServiceDuplicate}
      />

      {/* MODAL CHỌN TƯỚNG TỦ (CHAMPION POOL) */}
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
            { showToast: true, successMessage: `Đã lưu ${names.length} tướng tủ vào hồ sơ Booster!` },
            names
          );
        }}
      />

      {/* NÚT LƯU NỔI GÓC DƯỚI PHẢI */}
      <FloatingSaveButton saving={saving} onSave={handleSaveAll} />
    </div>
  );
}
