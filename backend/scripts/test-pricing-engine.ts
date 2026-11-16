import { PricingEngineService } from '../src/modules/pricing/pricing-engine.service';
import { PricingModel, AddonPricingType, CalculationBase } from '../src/database/schemas/GameServiceTemplate';
import { SettlementStatus } from '../src/database/schemas/Order';

const service = new PricingEngineService();

const mockLadder = [
  { id: 'IRON_4', tier: 'IRON', label: 'Sắt IV', stepPrice: 20000 },
  { id: 'IRON_3', tier: 'IRON', label: 'Sắt III', stepPrice: 20000 },
  { id: 'IRON_2', tier: 'IRON', label: 'Sắt II', stepPrice: 20000 },
  { id: 'IRON_1', tier: 'IRON', label: 'Sắt I', stepPrice: 25000 },
  { id: 'BRONZE_4', tier: 'BRONZE', label: 'Đồng IV', stepPrice: 30000 },
];

console.log('--- TEST 1: FIXED_TRANSITION Sắt IV -> Sắt II ---');
const q1 = service.calculateQuote({
  pricingModel: PricingModel.FIXED_TRANSITION,
  initialState: { rankId: 'IRON_4' },
  targetState: { rankId: 'IRON_2' },
  ladderSteps: mockLadder,
  multiplier: 1.0,
});
console.log('Result q1:', {
  basePrice: q1.basePrice,
  expected: 40000,
  pass: q1.basePrice === 40000,
  steps: q1.stepsCount,
});
if (q1.basePrice !== 40000) throw new Error('Test 1 Failed');

console.log('--- TEST 2: Add-on calculation (Prompt Section 6 Example) ---');
const q2 = service.calculateQuote({
  pricingModel: PricingModel.UNIT_BASED,
  initialState: { lp: 42 },
  targetState: { lp: 88 },
  unitPrice: 1000,
  selectedAddons: [
    {
      slug: 'duo',
      name: 'Chơi cùng Booster',
      pricingType: AddonPricingType.PERCENTAGE,
      price: 50,
      calculationBase: CalculationBase.BASE_PRICE,
    },
    {
      slug: 'flash',
      name: 'Cày siêu tốc',
      pricingType: AddonPricingType.PERCENTAGE,
      price: 35,
      calculationBase: CalculationBase.BASE_PRICE,
    },
    {
      slug: 'live',
      name: 'Xem trực tiếp',
      pricingType: AddonPricingType.FIXED_AMOUNT,
      price: 349000,
      calculationBase: CalculationBase.BASE_PRICE,
    },
  ],
  depositPercent: 50,
});
console.log('Result q2:', {
  basePrice: q2.basePrice, // 46000
  addonsCost: q2.addonsCost, // 388100
  totalPrice: q2.totalPrice, // 434100
  depositAmount: q2.depositAmount, // 217050
  pass: q2.totalPrice === 434100 && q2.depositAmount === 217050,
});
if (q2.totalPrice !== 434100 || q2.depositAmount !== 217050) throw new Error('Test 2 Failed');

console.log('--- TEST 3: Settlement Case 8.1 (Hoàn thành đúng mục tiêu 42 -> 88 LP) ---');
const snapshot: any = {
  gameCode: 'LOL',
  serviceSlug: 'net-wins',
  pricingModel: PricingModel.UNIT_BASED,
  initialState: { lp: 42 },
  targetState: { lp: 88 },
  unitPrice: 1000,
  estimatedAmount: 46000,
  depositAmount: 23000,
  depositPercent: 50,
  overTargetPolicySnapshot: {
    allowOverTarget: true,
    maxOverTargetUnits: 20,
    chargeOverTarget: true,
  },
};
const s1 = service.calculateSettlement({
  snapshot,
  actualState: { lp: 88 },
});
console.log('Result s1:', {
  actualAmount: s1.actualAmount,
  additionalPayment: s1.additionalPayment,
  refundAmount: s1.refundAmount,
  status: s1.settlementStatus,
  pass: s1.actualAmount === 46000 && s1.additionalPayment === 23000 && s1.refundAmount === 0,
});
if (s1.actualAmount !== 46000 || s1.additionalPayment !== 23000) throw new Error('Test 3 Failed');

console.log('--- TEST 4: Settlement Case 8.2 (Chưa đạt mục tiêu 42 -> 70 LP) ---');
const s2 = service.calculateSettlement({
  snapshot,
  actualState: { lp: 70 },
});
console.log('Result s2:', {
  actualAmount: s2.actualAmount, // 28000
  additionalPayment: s2.additionalPayment, // 5000
  refundAmount: s2.refundAmount, // 0
  pass: s2.actualAmount === 28000 && s2.additionalPayment === 5000,
});
if (s2.actualAmount !== 28000 || s2.additionalPayment !== 5000) throw new Error('Test 4 Failed');

console.log('--- TEST 5: Settlement Case 8.3 (Cày vượt mục tiêu 42 -> 100 LP, approved) ---');
const s3 = service.calculateSettlement({
  snapshot,
  actualState: { lp: 100 },
  customerApprovedOverTarget: true,
});
console.log('Result s3:', {
  actualAmount: s3.actualAmount, // 58000
  additionalPayment: s3.additionalPayment, // 35000
  pass: s3.actualAmount === 58000 && s3.additionalPayment === 35000,
});
if (s3.actualAmount !== 58000 || s3.additionalPayment !== 35000) throw new Error('Test 5 Failed');

console.log('--- TEST 6: Settlement Case 8.4 (Cày tụt điểm 42 -> 35 LP) ---');
const s4 = service.calculateSettlement({
  snapshot,
  actualState: { lp: 35 },
});
console.log('Result s4:', {
  actualAmount: s4.actualAmount, // 0
  refundAmount: s4.refundAmount, // 23000 (100% cọc)
  additionalPayment: s4.additionalPayment, // 0
  pass: s4.actualAmount === 0 && s4.refundAmount === 23000,
});
if (s4.actualAmount !== 0 || s4.refundAmount !== 23000) throw new Error('Test 6 Failed');

console.log('\n>>> TOÀN BỘ 6 BỘ TEST PRICING & SETTLEMENT ĐỀU THÀNH CÔNG RỰC RỠ 100%! <<<');
