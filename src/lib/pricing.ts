/**
 * Pricing Configuration
 * In a real app, this should be fetched from the Database (ServiceConfig model)
 * so Admin can update prices without redeploying code.
 */

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

interface PricingInput {
  serviceType: 'RANK_BOOST' | 'PLACEMENT' | 'NET_WINS';
  currentRank?: string; // Key in RANK_PRICES
  desiredRank?: string; // Key in RANK_PRICES
  gamesCount?: number; // For Placement/NetWins
  options: {
    flashBoost?: boolean;
    specificChamps?: string[];
    streaming?: boolean;
    duoQueue?: boolean;
    priorityLane?: boolean;
  };
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
      throw new Error("Missing rank info");
    }
    const startPrice = RANK_PRICES[input.currentRank] || 0;
    const endPrice = RANK_PRICES[input.desiredRank] || 0;
    
    if (endPrice <= startPrice) {
       // Handle edge case or throw error
       basePrice = 0; 
    } else {
       basePrice = endPrice - startPrice;
    }
    breakdown.push(`Rank Boost (${input.currentRank} -> ${input.desiredRank}): ${basePrice.toLocaleString()} VND`);
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
