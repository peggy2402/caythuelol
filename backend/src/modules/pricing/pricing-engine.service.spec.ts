import { PricingEngineService } from './pricing-engine.service';
import { PricingModel, AddonPricingType, CalculationBase } from '../../database/schemas/GameServiceTemplate';
import { SettlementStatus } from '../../database/schemas/Order';

describe('PricingEngineService', () => {
  let service: PricingEngineService;

  beforeEach(() => {
    service = new PricingEngineService();
  });

  const mockLadder = [
    { id: 'IRON_4', tier: 'IRON', label: 'Sắt IV', stepPrice: 20000 },
    { id: 'IRON_3', tier: 'IRON', label: 'Sắt III', stepPrice: 20000 },
    { id: 'IRON_2', tier: 'IRON', label: 'Sắt II', stepPrice: 20000 },
    { id: 'IRON_1', tier: 'IRON', label: 'Sắt I', stepPrice: 25000 },
    { id: 'BRONZE_4', tier: 'BRONZE', label: 'Đồng IV', stepPrice: 30000 },
  ];

  describe('1. FIXED_TRANSITION Calculations', () => {
    it('should calculate 1 step accurately: Sắt IV -> Sắt III = 20.000 VNĐ', () => {
      const res = service.calculateQuote({
        pricingModel: PricingModel.FIXED_TRANSITION,
        initialState: { rankId: 'IRON_4' },
        targetState: { rankId: 'IRON_3' },
        ladderSteps: mockLadder,
        multiplier: 1.0,
      });

      expect(res.basePrice).toBe(20000);
      expect(res.totalPrice).toBe(20000);
      expect(res.stepsCount).toBe(1);
    });

    it('should calculate multi-steps: Sắt IV -> Sắt II = 20.000 + 20.000 = 40.000 VNĐ', () => {
      const res = service.calculateQuote({
        pricingModel: PricingModel.FIXED_TRANSITION,
        initialState: { rankId: 'IRON_4' },
        targetState: { rankId: 'IRON_2' },
        ladderSteps: mockLadder,
        multiplier: 1.0,
      });

      expect(res.basePrice).toBe(40000);
      expect(res.stepsCount).toBe(2);
      expect(res.stepsBreakdown).toHaveLength(2);
    });

    it('should apply booster multiplier: Sắt IV -> III with 1.2 multiplier = 24.000 VNĐ', () => {
      const res = service.calculateQuote({
        pricingModel: PricingModel.FIXED_TRANSITION,
        initialState: { rankId: 'IRON_4' },
        targetState: { rankId: 'IRON_3' },
        ladderSteps: mockLadder,
        multiplier: 1.2,
      });

      expect(res.basePrice).toBe(24000);
    });

    it('should apply specific step override if booster configured it', () => {
      const res = service.calculateQuote({
        pricingModel: PricingModel.FIXED_TRANSITION,
        initialState: { rankId: 'IRON_4' },
        targetState: { rankId: 'IRON_3' },
        ladderSteps: mockLadder,
        stepOverrides: { IRON_4: 28000 },
      });

      expect(res.basePrice).toBe(28000);
    });

    it('should throw error when target rank <= current rank', () => {
      expect(() =>
        service.calculateQuote({
          pricingModel: PricingModel.FIXED_TRANSITION,
          initialState: { rankId: 'IRON_2' },
          targetState: { rankId: 'IRON_4' },
          ladderSteps: mockLadder,
        }),
      ).toThrow('Rank mong muốn phải cao hơn Rank hiện tại');
    });
  });

  describe('2. Add-on Calculations (Prompt Section 6 Example)', () => {
    it('should calculate multiple addons correctly on Base Price: Base 46k, Duo +50%, Flash +35%, Live 349k', () => {
      // Base: 46.000
      // Duo +50% = 23.000
      // Flash +35% = 16.100
      // Live = 349.000
      // Total Addons = 388.100
      // Total Price = 46.000 + 388.100 = 434.100 VNĐ
      const res = service.calculateQuote({
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

      expect(res.basePrice).toBe(46000);
      expect(res.addonsCost).toBe(388100);
      expect(res.totalPrice).toBe(434100);
      expect(res.depositAmount).toBe(217050); // 50% của 434.100
    });
  });

  describe('3. Actual Settlement (Prompt Section 8 Cases)', () => {
    const baseSnapshot: any = {
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

    it('Case 8.1: Booster hoàn thành đúng mục tiêu (42 -> 88 LP)', () => {
      const res = service.calculateSettlement({
        snapshot: baseSnapshot,
        actualState: { lp: 88 },
      });

      expect(res.actualAmount).toBe(46000);
      expect(res.additionalPayment).toBe(23000);
      expect(res.refundAmount).toBe(0);
      expect(res.settlementStatus).toBe(SettlementStatus.CUSTOMER_OWES);
    });

    it('Case 8.2: Booster hoàn thành chưa đạt mục tiêu (42 -> 70 LP)', () => {
      // (70 - 42) * 1000 = 28.000 VNĐ
      // Đã cọc 23.000 -> Customer thanh toán thêm 5.000 VNĐ
      const res = service.calculateSettlement({
        snapshot: baseSnapshot,
        actualState: { lp: 70 },
      });

      expect(res.actualAmount).toBe(28000);
      expect(res.additionalPayment).toBe(5000);
      expect(res.refundAmount).toBe(0);
      expect(res.settlementStatus).toBe(SettlementStatus.CUSTOMER_OWES);
    });

    it('Case 8.3: Booster cày vượt mục tiêu có sự đồng ý của khách (42 -> 100 LP, max 20)', () => {
      // (100 - 42) * 1000 = 58.000 VNĐ
      // Cọc 23.000 -> Customer thanh toán thêm 35.000 VNĐ
      const res = service.calculateSettlement({
        snapshot: baseSnapshot,
        actualState: { lp: 100 },
        customerApprovedOverTarget: true,
      });

      expect(res.actualAmount).toBe(58000);
      expect(res.additionalPayment).toBe(35000);
      expect(res.refundAmount).toBe(0);
    });

    it('Case 8.3b: Booster cày vượt mục tiêu NHƯNG khách chưa đồng ý tính thêm', () => {
      // Không được tính vượt quá target 88 LP
      // (88 - 42) * 1000 = 46.000 VNĐ
      const res = service.calculateSettlement({
        snapshot: baseSnapshot,
        actualState: { lp: 100 },
        customerApprovedOverTarget: false,
      });

      expect(res.actualAmount).toBe(46000);
      expect(res.additionalPayment).toBe(23000);
    });

    it('Case 8.4: Booster cày tụt điểm (42 -> 35 LP)', () => {
      // Delta LP = -7 <= 0 -> Actual = 0, hoàn 100% tiền cọc 23.000 VNĐ
      const res = service.calculateSettlement({
        snapshot: baseSnapshot,
        actualState: { lp: 35 },
      });

      expect(res.actualAmount).toBe(0);
      expect(res.refundAmount).toBe(23000);
      expect(res.additionalPayment).toBe(0);
      expect(res.settlementStatus).toBe(SettlementStatus.REFUND_NEEDED);
    });
  });
});
