'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// --- INTERFACES ---
export interface DBRank {
  _id: string;
  gameCode: string;
  tier: string;
  division: string | null;
  order: number;
}

export interface Rank {
  _id: string;
  name: string;
  tiers: string[];
  imageUrl: string;
}

export interface ServiceSettings {
  servers: string[];
  rankPrices: Record<string, number>;
  promotionPrices: Record<string, number>;
  placementPrices: Record<string, number>; // Added for Placements
  playingChampions: string[];
  levelingPrices: Record<string, number>; // Added for Leveling
  netWinPrices: Record<string, number>; // Added for Net Wins (High Elo)
  masteryPrices: Record<string, number>;
  lpGain: {
    low: number;
    medium: number;
    high: number;
  };
  options: {
    schedule: boolean;
    roles: string[];
    specificChamps: number;
    streaming: number;
    express: number;
    duo: number;
  }
}

interface ServiceContextType {
  loading: boolean;
  saving: boolean;
  ranks: Rank[];
  settings: ServiceSettings;
  setSettings: React.Dispatch<React.SetStateAction<ServiceSettings>>;
  handleSave: () => Promise<void>;
  handleDiscardChanges: () => Promise<void>;
  hasDraft: boolean;
  handleRestoreDraft: () => void;
  MAX_PRICE_PER_STEP: number;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

const DRAFT_KEY = 'booster_services_draft';
const MAX_PRICE_PER_STEP = 10000000;

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const [isModified, setIsModified] = useState(false);
  
  const [settings, _setSettings] = useState<ServiceSettings>({
    servers: ['VN'],
    rankPrices: {},
    promotionPrices: {},
    placementPrices: {}, // Initialized
    playingChampions: [],
    levelingPrices: {}, // Initialized
    netWinPrices: {}, // Initialized
    masteryPrices: {},
    lpGain: { low: 30, medium: 0, high: -20 },
    options: {
      schedule: true,
      roles: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'],
      specificChamps: 30,
      streaming: 349000,
      express: 35,
      duo: 50
    }
  });

  // Wrapper để đánh dấu là đã chỉnh sửa khi người dùng thay đổi settings
  const setSettings: React.Dispatch<React.SetStateAction<ServiceSettings>> = (value) => {
    _setSettings((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        setIsModified(true);
      }
      return next;
    });
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/boosters/services');
      const data = await res.json();
      
      if (data.ranks && Array.isArray(data.ranks)) {
        const dbRanks: DBRank[] = data.ranks;
        const groups: Record<string, { name: string, items: DBRank[], minOrder: number }> = {};

        dbRanks.forEach(r => {
          if (!groups[r.tier]) {
            groups[r.tier] = { name: r.tier, items: [], minOrder: r.order };
          }
          if (r.order < groups[r.tier].minOrder) groups[r.tier].minOrder = r.order;
          groups[r.tier].items.push(r);
        });

        const processedRanks: Rank[] = Object.values(groups)
          .sort((a, b) => a.minOrder - b.minOrder)
          .map(g => {
            g.items.sort((a, b) => a.order - b.order);
            return {
              _id: g.name,
              name: g.name,
              tiers: g.items.map(i => i.division || ''),
              imageUrl: `/images/ranks/${g.name.toLowerCase()}.png`
            };
          });
        setRanks(processedRanks);
      }

      if (data.settings && Object.keys(data.settings).length > 0) {
        _setSettings(prev => ({
          ...prev,
          ...data.settings,
          playingChampions: data.settings.playingChampions || [],
          placementPrices: data.settings.placementPrices || {}, // Load from DB
          levelingPrices: data.settings.levelingPrices || {}, // Load from DB
          netWinPrices: data.settings.netWinPrices || {}, // Load from DB
          promotionPrices: data.settings.promotionPrices || {},
          options: { 
            ...prev.options, 
            ...data.settings.options,
            roles: Array.isArray(data.settings.options?.roles) ? data.settings.options.roles : prev.options.roles
          },
          lpGain: { ...prev.lpGain, ...data.settings.lpGain }
        }));
      }
    } catch (error) {
      toast.error('Lỗi tải cấu hình dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-save Draft
  useEffect(() => {
    if (!loading && settings && isModified) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(settings));
      setHasDraft(true);
    }
  }, [settings, loading, isModified]);

  // Check Draft on Mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      setHasDraft(true);
      toast.info('Vui lòng lưu  thay đổi hoặc ', {
        action: { label: 'Khôi phục ngay', onClick: () => handleRestoreDraft() },
        duration: 5000,
      });
    }
  }, []);

  const handleRestoreDraft = () => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        _setSettings(JSON.parse(draft));
        setIsModified(true); // Đánh dấu là đã sửa để tiếp tục lưu nháp nếu có thay đổi sau này
        toast.success('Đã khôi phục bản nháp gần nhất');
      }
    } catch (e) {
      toast.error('Không thể đọc bản nháp');
    }
  };

  const validatePrices = () => {
    for (let r = 0; r < ranks.length; r++) {
      const rank = ranks[r];
      if (!Array.isArray(rank.tiers)) continue;

      for (let t = 0; t < rank.tiers.length; t++) {
        const tier = rank.tiers[t];
        const key = `${rank.name}_${tier}`;
        const currentPrice = settings.rankPrices[key] || 0;

        let prevPrice = 0;
        let prevName = '';

        if (t > 0) {
          const prevTier = rank.tiers[t - 1];
          prevPrice = settings.rankPrices[`${rank.name}_${prevTier}`] || 0;
          prevName = `${rank.name} ${prevTier}`;
        } else if (r > 0) {
          const prevRank = ranks[r - 1];
          if (prevRank.tiers && prevRank.tiers.length > 0) {
            const prevTier = prevRank.tiers[prevRank.tiers.length - 1];
            prevPrice = settings.rankPrices[`${prevRank.name}_${prevTier}`] || 0;
            prevName = `${prevRank.name} ${prevTier}`;
          }
        }

        if (currentPrice < prevPrice && prevPrice > 0 && currentPrice > 0) {
          toast.error(`Lỗi logic: Giá ${rank.name} ${tier} thấp hơn bậc trước ${prevName}`);
          return false;
        }
        if (currentPrice > MAX_PRICE_PER_STEP) {
          toast.error(`Giá ${rank.name} ${tier} quá cao (> 10tr). Vui lòng kiểm tra lại.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validatePrices()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/boosters/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        toast.success('Đã lưu cấu hình dịch vụ');
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
        setIsModified(false);
      } else {
        toast.error('Lỗi khi lưu cấu hình');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = async () => {
    await fetchData();
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setIsModified(false);
    toast.info('Đã khôi phục cấu hình gốc từ hệ thống');
  };

  return (
    <ServiceContext.Provider value={{
      loading, saving, ranks, settings, setSettings,
      handleSave, handleDiscardChanges, hasDraft, handleRestoreDraft, MAX_PRICE_PER_STEP
    }}>
      {children}
    </ServiceContext.Provider>
  );
}

export const useServiceContext = () => {
  const context = useContext(ServiceContext);
  if (!context) throw new Error('useServiceContext must be used within a ServiceProvider');
  return context;
};