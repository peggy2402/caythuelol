'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// ================= INTERFACES =================

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
  placementPrices: Record<string, number>;
  playingChampions: string[];
  levelingPrices: Record<string, number>;
  netWinPrices: Record<string, number>;
  masteryPrices: Record<string, number>;

  // ✅ CHUẨN HÓA: Chỉ dùng 1 hệ thống modifier
  lpModifiers: {
    low: number;     // LP thấp → khó → tăng giá (+)
    medium: number;  // trung tính
    high: number;    // LP cao → dễ → giảm giá (-)
  };

  options: {
    schedule: boolean;
    roles: string[];
    specificChamps: number;
    streaming: number;
    express: number;
    duo: number;
  };
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
  platformFee: number;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

const DRAFT_KEY =
  'booster_draft_9f4c2a7d8e1b6c3f5a9d0e7b2c4f8a1d6e3c9b7a5f2d1c8e4a6b9d3f0c7e2a1';

const MAX_PRICE_PER_STEP = 10000000;

// ================= PROVIDER =================

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);

  const [settings, _setSettings] = useState<ServiceSettings>({
    servers: ['VN'],
    rankPrices: {},
    promotionPrices: {},
    placementPrices: {},
    playingChampions: [],
    levelingPrices: {},
    netWinPrices: {},
    masteryPrices: {},

    // ✅ Mặc định chuẩn marketplace
    lpModifiers: {
      low: 20,     // tăng giá
      medium: 0,   // chuẩn
      high: -20    // giảm giá
    },

    options: {
      schedule: true,
      roles: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'],
      specificChamps: 30,
      streaming: 349000,
      express: 35,
      duo: 50
    }
  });

  // Wrapper detect chỉnh sửa
  const setSettings: React.Dispatch<React.SetStateAction<ServiceSettings>> = (
    value
  ) => {
    _setSettings((prev) => {
      const next =
        typeof value === 'function' ? (value as Function)(prev) : value;

      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        setIsModified(true);
      }
      return next;
    });
  };

  // ================= FETCH DATA =================

  const fetchData = async () => {
    try {
      const [res, resFee] = await Promise.all([
        fetch('/api/boosters/services'),
        fetch('/api/settings/platform-fee', {
          cache: 'no-store',
          headers: { Pragma: 'no-cache' }
        })
      ]);

      if (resFee.ok) {
        const dataFee = await resFee.json();
        setPlatformFee(Number(dataFee.fee));
      }

      const data = await res.json();

      // ================= RANK PROCESS =================

      if (data.ranks && Array.isArray(data.ranks)) {
        const dbRanks: DBRank[] = data.ranks;
        const groups: Record<
          string,
          { name: string; items: DBRank[]; minOrder: number }
        > = {};

        dbRanks.forEach((r) => {
          if (!groups[r.tier]) {
            groups[r.tier] = { name: r.tier, items: [], minOrder: r.order };
          }
          if (r.order < groups[r.tier].minOrder)
            groups[r.tier].minOrder = r.order;
          groups[r.tier].items.push(r);
        });

        const processedRanks: Rank[] = Object.values(groups)
          .sort((a, b) => a.minOrder - b.minOrder)
          .map((g) => {
            g.items.sort((a, b) => a.order - b.order);
            return {
              _id: g.name,
              name: g.name,
              tiers: g.items.map((i) => i.division || ''),
              imageUrl: `/images/ranks/${g.name.toLowerCase()}.png`
            };
          });

        setRanks(processedRanks);
      }

      // ================= SETTINGS PROCESS =================

      if (data.settings && Object.keys(data.settings).length > 0) {
        _setSettings((prev) => {
          const incoming = data.settings;

          // 🔥 MIGRATION nếu DB cũ còn lpGain
          let migratedModifiers = incoming.lpModifiers;

          if (!migratedModifiers && incoming.lpGain) {
            migratedModifiers = {
              low: incoming.lpGain.low || 0,
              medium: incoming.lpGain.medium || 0,
              high: -(incoming.lpGain.high || 0) // ép high thành âm
            };
          }

          return {
            ...prev,
            ...incoming,
            playingChampions: incoming.playingChampions || [],
            placementPrices: incoming.placementPrices || {},
            levelingPrices: incoming.levelingPrices || {},
            netWinPrices: incoming.netWinPrices || {},
            promotionPrices: incoming.promotionPrices || {},
            options: {
              ...prev.options,
              ...incoming.options,
              roles: Array.isArray(incoming.options?.roles)
                ? incoming.options.roles
                : prev.options.roles
            },
            lpModifiers: {
              ...prev.lpModifiers,
              ...migratedModifiers
            }
          };
        });
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

  // ================= DRAFT AUTO SAVE =================

  useEffect(() => {
    if (!loading && settings && isModified) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(settings));
      setHasDraft(true);
    }
  }, [settings, loading, isModified]);

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      setHasDraft(true);
      toast.info('Bạn có bản nháp chưa lưu', {
        action: {
          label: 'Khôi phục',
          onClick: () => handleRestoreDraft()
        },
        duration: 5000
      });
    }
  }, []);

  const handleRestoreDraft = () => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        _setSettings(JSON.parse(draft));
        setIsModified(true);
        toast.success('Đã khôi phục bản nháp');
      }
    } catch {
      toast.error('Không thể đọc bản nháp');
    }
  };

  // ================= SAVE =================

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/boosters/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        toast.success('Đã lưu cấu hình dịch vụ');
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
        setIsModified(false);
      } else {
        toast.error('Lỗi khi lưu cấu hình');
      }
    } catch {
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
    toast.info('Đã khôi phục cấu hình gốc');
  };

  return (
    <ServiceContext.Provider
      value={{
        loading,
        saving,
        ranks,
        settings,
        setSettings,
        handleSave,
        handleDiscardChanges,
        hasDraft,
        handleRestoreDraft,
        MAX_PRICE_PER_STEP,
        platformFee
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
}

export const useServiceContext = () => {
  const context = useContext(ServiceContext);
  if (!context)
    throw new Error('useServiceContext must be used within a ServiceProvider');
  return context;
};