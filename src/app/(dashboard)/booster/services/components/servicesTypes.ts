// src/app/(dashboard)/booster/services/components/servicesTypes.ts
import {
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
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
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
