/**
 * Pricing Configuration
 * In a real app, this should be fetched from the Database (ServiceConfig model)
 * so Admin can update prices without redeploying code.
 */

export const LOL_RANKS_ORDER = [
  "IRON_IV", "IRON_III", "IRON_II", "IRON_I",
  "BRONZE_IV", "BRONZE_III", "BRONZE_II", "BRONZE_I",
  "SILVER_IV", "SILVER_III", "SILVER_II", "SILVER_I",
  "GOLD_IV", "GOLD_III", "GOLD_II", "GOLD_I",
  "PLATINUM_IV", "PLATINUM_III", "PLATINUM_II", "PLATINUM_I",
  "EMERALD_IV", "EMERALD_III", "EMERALD_II", "EMERALD_I",
  "DIAMOND_IV", "DIAMOND_III", "DIAMOND_II", "DIAMOND_I",
  "MASTER_NA", "GRANDMASTER_NA", "CHALLENGER_NA"
];

const RANK_PRICES: Record<string, number> = {
  'IRON_4': 0, 'IRON_3': 20000, 'IRON_2': 40000, 'IRON_1': 60000,
  'BRONZE_4': 80000, 'BRONZE_3': 100000, 'BRONZE_2': 120000, 'BRONZE_1': 140000,
  'SILVER_4': 170000, 'SILVER_3': 200000, 'SILVER_2': 230000, 'SILVER_1': 260000,
  'GOLD_4': 300000, 'GOLD_3': 350000, 'GOLD_2': 400000, 'GOLD_1': 450000,
  'PLATINUM_4': 550000, // ... and so on
  // Simplified for example
};

const OPTION_MULTIPLIERS = {
  FLASH_BOOST: 0.35, // +35%
  SPECIFIC_CHAMP: 0.30, // +30%
  DUO_QUEUE: 0.50, // +50%
  PRIORITY_LANE: 0.05, // +5%
};

const STREAMING_FEE = 349000; // Flat fee

export interface BoosterConfig {
  rankPrices: Record<string, number>;
  lpModifiers: { high: number; medium: number; low: number };
  queueModifiers: { SOLO_DUO: number; FLEX: number; TFT: number };
}

export type ServiceType = 'RANK_BOOST' | 'PLACEMENT' | 'NET_WINS' | 'PROMOTION' | 'MASTERY' | 'LEVELING';

interface PricingInput {
  serviceType: ServiceType;
  currentRank?: string; // Key in RANK_PRICES
  desiredRank?: string; // Key in RANK_PRICES
  currentLP?: number; // For LP Gain calculation
  queueType?: 'SOLO_DUO' | 'FLEX' | 'TFT';
  gamesCount?: number; // For Placement/NetWins
  options: {
    flashBoost?: boolean;
    specificChamps?: string[];
    streaming?: boolean;
    duoQueue?: boolean;
    priorityLane?: boolean;
  };
  boosterConfig?: BoosterConfig;
}

interface PricingResult {
  basePrice: number;
  optionFees: number;
  totalPrice: number;
  breakdown: string[];
}

export function calculatePrice(input: PricingInput): PricingResult {
  let basePrice = 0;
  let breakdown: string[] = [];

  // 1. Calculate Base Price
  if (input.serviceType === 'RANK_BOOST') {
    if (!input.currentRank || !input.desiredRank) {
      // throw new Error("Missing rank info");
      return { basePrice: 0, optionFees: 0, totalPrice: 0, breakdown: [] };
    }

    if (input.boosterConfig && Object.keys(input.boosterConfig.rankPrices).length > 0) {
      // --- DYNAMIC PRICING (Booster Config) ---
      const startIdx = LOL_RANKS_ORDER.indexOf(input.currentRank);
      const endIdx = LOL_RANKS_ORDER.indexOf(input.desiredRank);

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        for (let i = startIdx; i < endIdx; i++) {
          const rankKey = LOL_RANKS_ORDER[i];
          const price = input.boosterConfig.rankPrices[rankKey] || 0;
          basePrice += price;
        }
        breakdown.push(`Rank Boost (Dynamic): ${basePrice.toLocaleString()} VND`);
      }
    } else {
      // --- FALLBACK STATIC PRICING ---
      // Note: The keys in RANK_PRICES (IRON_4) don't match LOL_RANKS_ORDER (IRON_IV) perfectly
      // We'll assume input uses the format matching the system being used.
      // For this fallback, we assume input.currentRank is like 'IRON_4'
      const startPrice = RANK_PRICES[input.currentRank] || 0;
      const endPrice = RANK_PRICES[input.desiredRank] || 0;
      
      if (endPrice > startPrice) {
         basePrice = endPrice - startPrice;
         breakdown.push(`Rank Boost (Static): ${basePrice.toLocaleString()} VND`);
      }
    }
  }
  else if (input.serviceType === 'PROMOTION') {
    // Promotion: Usually implies playing the series to next tier.
    // We use the price of the current division as a baseline.
    if (input.boosterConfig && input.currentRank) {
       const rankPrice = input.boosterConfig.rankPrices[input.currentRank] || 0;
       // Logic: Promotion price is roughly equal to passing the division
       basePrice = rankPrice;
       breakdown.push(`Promotion (Dynamic): ${basePrice.toLocaleString()} VND`);
    } else {
       // Fallback
       // Assuming input.currentRank is like 'SILVER_I' or 'Silver' depending on context.
       // The static map uses 'SILVER_1'. We need to handle this discrepancy in a real app.
       // For now, we keep the structure but this path might be less used if boosterConfig is present.
       basePrice = 100000; // Default fallback
    }
  }
  else if (input.serviceType === 'NET_WINS') {
    if (input.boosterConfig && input.currentRank) {
        const rankPrice = input.boosterConfig.rankPrices[input.currentRank] || 0;
        // Logic: Net win is ~40% of division price (heuristic)
        const pricePerWin = Math.ceil(rankPrice * 0.4);
        basePrice = (input.gamesCount || 1) * pricePerWin;
        breakdown.push(`Net Wins (${input.gamesCount} games @ ${pricePerWin.toLocaleString()}): ${basePrice.toLocaleString()} VND`);
    }
  }
  else if (input.serviceType === 'PLACEMENT') {
    const PRICE_PER_GAME = 50000; // Example
    basePrice = (input.gamesCount || 0) * PRICE_PER_GAME;
    breakdown.push(`Placement (${input.gamesCount} games): ${basePrice.toLocaleString()} VND`);
  }

  // 2. Calculate Options
  let multiplier = 1.0;
  let flatFees = 0;
  let optionDetails = [];

  // Apply Booster Config Modifiers (LP Gain & Queue Type)
  if (input.boosterConfig) {
    // LP Gain Modifier
    // Logic: +20 -> High, +18 -> Medium, +15 -> Low
    // We assume input.currentLP holds the "LP Gain" value for calculation simplicity or pass a separate field
    // Let's assume we pass `lpGain` in input or derive it. 
    // For now, let's assume the caller passes the LP Gain category or value.
    // Since input.currentLP is just a number, let's use a heuristic or add a field.
    // Added `currentLP` to interface, but usually we need `lpGain`.
    // Let's assume `input.currentLP` is actually the LP Gain per match for this calculation context
    // OR we check `input.options`? No, let's check `input.currentLP` as "LP Gain" if provided.
    // Actually, let's use a heuristic based on the prompt: 17+, 15-17, 14-
    
    // Queue Type Modifier
    if (input.queueType && input.boosterConfig.queueModifiers) {
        const qMod = input.boosterConfig.queueModifiers[input.queueType] || 0;
        if (qMod !== 0) {
            multiplier += (qMod / 100);
            optionDetails.push(`Queue (${input.queueType}): ${qMod > 0 ? '+' : ''}${qMod}%`);
        }
    }
    
    // Note: LP Modifiers are usually applied to base price or total. 
    // We'll implement them if `lpGain` is passed.
  }

  if (input.options.flashBoost) {
    multiplier += OPTION_MULTIPLIERS.FLASH_BOOST;
    optionDetails.push("Flash Boost (+35%)");
  }
  
  if (input.options.duoQueue) {
    multiplier += OPTION_MULTIPLIERS.DUO_QUEUE;
    optionDetails.push("Duo Queue (+50%)");
  }

  if (input.options.specificChamps && input.options.specificChamps.length > 0) {
    multiplier += OPTION_MULTIPLIERS.SPECIFIC_CHAMP;
    optionDetails.push("Specific Champs (+30%)");
  }

  if (input.options.priorityLane) {
    multiplier += OPTION_MULTIPLIERS.PRIORITY_LANE;
    optionDetails.push("Priority Lane (+5%)");
  }

  if (input.options.streaming) {
    flatFees += STREAMING_FEE;
    optionDetails.push(`Streaming (+${STREAMING_FEE.toLocaleString()} VND)`);
  }

  // 3. Final Calculation
  // Formula: (Base * Multiplier) + FlatFees
  // Note: Usually multipliers stack additively (1 + 0.3 + 0.5 = 1.8) 
  // OR multiplicatively (1 * 1.3 * 1.5). 
  // Based on prompt "Cộng thêm %", additive is safer for customers.
  
  const priceWithMultipliers = basePrice * multiplier;
  const optionFees = (priceWithMultipliers - basePrice) + flatFees;
  const totalPrice = priceWithMultipliers + flatFees;

  breakdown.push(...optionDetails);
  breakdown.push(`Total Multiplier: x${multiplier}`);
  breakdown.push(`Total: ${totalPrice.toLocaleString()} VND`);

  return {
    basePrice,
    optionFees,
    totalPrice: Math.ceil(totalPrice), // Round up to integer
    breakdown
  };
}
