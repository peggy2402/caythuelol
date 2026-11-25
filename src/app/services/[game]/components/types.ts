// src/app/services/[game]/components/types.ts
import {
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Banknote,
  Gamepad2,
  Crosshair,
  Shield,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Banknote,
  Gamepad2,
  Crosshair,
  Shield,
};

export const AVATAR_BG_COLORS = [
  'bg-white text-zinc-950',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-black',
  'bg-cyan-500 text-black',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
];

export interface MarketplaceService {
  id: string;
  gameCode: string;
  serviceType?: string;
  slug?: string;
  name: string;
  desc?: string;
  pricingType: 'PER_UNIT' | 'FIXED' | 'TIER_MATRIX';
  price: number;
  multiplier?: number;
  unitName?: string;
  depositPercent: number;
  requiredFields?: string[];
  isActive?: boolean;
  booster: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    rating: number;
    completedOrders: number;
    coupon?: {
      code: string;
      discountPercent: number;
      isActive: boolean;
    } | null;
  };
}

export interface BoosterItem {
  _id: string;
  username: string;
  role?: string;
  avatar?: string;
  displayName?: string;
  rating: number;
  completedOrders?: number;
  services: string[];
  selectedGames?: string[];
  games: {
    gameCode: string;
    ranks: string[];
    servers: string[];
  }[];
  booster_info?: {
    isReady?: boolean;
    ranks?: string[];
    services?: string[];
    completed_orders?: number;
    rating?: number;
    service_settings?: {
      selectedGames?: string[];
      customServices?: Array<{
        id: string;
        gameCode?: string;
        serviceType?: string;
        slug?: string;
        name: string;
        desc?: string;
        pricingType: string;
        price?: number;
        unitName?: string;
        depositPercent?: number;
        isActive?: boolean;
      }>;
      enabledServices?: string[];
    };
  };
}

export interface GroupedService {
  serviceType: string;
  name: string;
  desc: string;
  pricingType: string;
  depositPercent: number;
  iconName: string;
  boosters: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    rating: number;
  }[];
  count: number;
}
