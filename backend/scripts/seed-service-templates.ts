import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import GameServiceTemplate, { PricingModel, AddonPricingType, CalculationBase } from '../src/database/schemas/GameServiceTemplate';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI không tồn tại');
  process.exit(1);
}

const LOL_LADDER_STEPS = [
  // SẮT
  { id: 'IRON_4', tier: 'IRON', division: 'IV', label: 'Sắt IV', stepPrice: 20000 },
  { id: 'IRON_3', tier: 'IRON', division: 'III', label: 'Sắt III', stepPrice: 20000 },
  { id: 'IRON_2', tier: 'IRON', division: 'II', label: 'Sắt II', stepPrice: 20000 },
  { id: 'IRON_1', tier: 'IRON', division: 'I', label: 'Sắt I', stepPrice: 25000 },
  // ĐỒNG
  { id: 'BRONZE_4', tier: 'BRONZE', division: 'IV', label: 'Đồng IV', stepPrice: 25000 },
  { id: 'BRONZE_3', tier: 'BRONZE', division: 'III', label: 'Đồng III', stepPrice: 25000 },
  { id: 'BRONZE_2', tier: 'BRONZE', division: 'II', label: 'Đồng II', stepPrice: 25000 },
  { id: 'BRONZE_1', tier: 'BRONZE', division: 'I', label: 'Đồng I', stepPrice: 30000 },
  // BẠC
  { id: 'SILVER_4', tier: 'SILVER', division: 'IV', label: 'Bạc IV', stepPrice: 30000 },
  { id: 'SILVER_3', tier: 'SILVER', division: 'III', label: 'Bạc III', stepPrice: 30000 },
  { id: 'SILVER_2', tier: 'SILVER', division: 'II', label: 'Bạc II', stepPrice: 30000 },
  { id: 'SILVER_1', tier: 'SILVER', division: 'I', label: 'Bạc I', stepPrice: 35000 },
  // VÀNG
  { id: 'GOLD_4', tier: 'GOLD', division: 'IV', label: 'Vàng IV', stepPrice: 40000 },
  { id: 'GOLD_3', tier: 'GOLD', division: 'III', label: 'Vàng III', stepPrice: 40000 },
  { id: 'GOLD_2', tier: 'GOLD', division: 'II', label: 'Vàng II', stepPrice: 40000 },
  { id: 'GOLD_1', tier: 'GOLD', division: 'I', label: 'Vàng I', stepPrice: 50000 },
  // BẠCH KIM
  { id: 'PLATINUM_4', tier: 'PLATINUM', division: 'IV', label: 'Bạch Kim IV', stepPrice: 55000 },
  { id: 'PLATINUM_3', tier: 'PLATINUM', division: 'III', label: 'Bạch Kim III', stepPrice: 55000 },
  { id: 'PLATINUM_2', tier: 'PLATINUM', division: 'II', label: 'Bạch Kim II', stepPrice: 55000 },
  { id: 'PLATINUM_1', tier: 'PLATINUM', division: 'I', label: 'Bạch Kim I', stepPrice: 65000 },
  // LỤC BẢO
  { id: 'EMERALD_4', tier: 'EMERALD', division: 'IV', label: 'Lục Bảo IV', stepPrice: 75000 },
  { id: 'EMERALD_3', tier: 'EMERALD', division: 'III', label: 'Lục Bảo III', stepPrice: 75000 },
  { id: 'EMERALD_2', tier: 'EMERALD', division: 'II', label: 'Lục Bảo II', stepPrice: 75000 },
  { id: 'EMERALD_1', tier: 'EMERALD', division: 'I', label: 'Lục Bảo I', stepPrice: 95000 },
  // KIM CƯƠNG
  { id: 'DIAMOND_4', tier: 'DIAMOND', division: 'IV', label: 'Kim Cương IV', stepPrice: 120000 },
  { id: 'DIAMOND_3', tier: 'DIAMOND', division: 'III', label: 'Kim Cương III', stepPrice: 140000 },
  { id: 'DIAMOND_2', tier: 'DIAMOND', division: 'II', label: 'Kim Cương II', stepPrice: 170000 },
  { id: 'DIAMOND_1', tier: 'DIAMOND', division: 'I', label: 'Kim Cương I', stepPrice: 220000 },
  // CAO THỦ
  { id: 'MASTER', tier: 'MASTER', label: 'Cao Thủ', stepPrice: 0 },
];

const STANDARD_ADDONS = [
  {
    slug: 'schedule',
    name: 'Đặt lịch cày',
    desc: 'Chọn khung giờ cày cụ thể tránh trùng giờ bạn online',
    pricingType: AddonPricingType.FIXED_AMOUNT,
    defaultPrice: 0,
    calculationBase: CalculationBase.BASE_PRICE,
    isRequired: false,
    isActive: true,
  },
  {
    slug: 'specificRole',
    name: 'Tùy chọn vị trí / đường',
    desc: 'Chỉ định Top, Rừng, Mid, AD hoặc SP theo ý muốn',
    pricingType: AddonPricingType.FIXED_AMOUNT,
    defaultPrice: 0,
    calculationBase: CalculationBase.BASE_PRICE,
    isRequired: false,
    isActive: true,
  },
  {
    slug: 'specificChamps',
    name: 'Tùy chọn tướng',
    desc: 'Chỉ cày bằng danh sách tướng bạn chỉ định',
    pricingType: AddonPricingType.PERCENTAGE,
    defaultPrice: 30,
    calculationBase: CalculationBase.BASE_PRICE,
    isRequired: false,
    isActive: true,
  },
  {
    slug: 'livestream',
    name: 'Xem trực tiếp',
    desc: 'Booster live màn hình stream riêng (Discord/YouTube private)',
    pricingType: AddonPricingType.FIXED_AMOUNT,
    defaultPrice: 349000,
    calculationBase: CalculationBase.BASE_PRICE,
    isRequired: false,
    isActive: true,
  },
  {
    slug: 'flash',
    name: 'Cày siêu tốc',
    desc: 'Ưu tiên cày liên tục full ca để hoàn thành nhanh nhất',
    pricingType: AddonPricingType.PERCENTAGE,
    defaultPrice: 35,
    calculationBase: CalculationBase.BASE_PRICE,
    isRequired: false,
    isActive: true,
  },
  {
    slug: 'duo',
    name: 'Chơi cùng Booster (Duo)',
    desc: 'Đánh cùng Booster, không giao tài khoản mật khẩu',
    pricingType: AddonPricingType.PERCENTAGE,
    defaultPrice: 50,
    calculationBase: CalculationBase.BASE_PRICE,
    isRequired: false,
    isActive: true,
  },
];

const TEMPLATES = [
  {
    gameCode: 'LOL',
    slug: 'rank-boost',
    name: 'Cày Rank / Elo Siêu Tốc',
    desc: 'Leo rank từ Sắt đến Cao Thủ, Thách Đấu với tỉ lệ thắng cao và hoàn thành nhanh chóng.',
    iconName: 'Trophy',
    pricingModel: PricingModel.FIXED_TRANSITION,
    defaultPrice: 50000,
    depositPercent: 100,
    allowedAddons: STANDARD_ADDONS,
    defaultLadderSteps: LOL_LADDER_STEPS,
    requiredFields: ['current_rank', 'desired_rank', 'server', 'account_credentials'],
    isActive: true,
  },
  {
    gameCode: 'LOL',
    slug: 'net-wins',
    name: 'Cày Trận Thắng & LP Cao Thủ',
    desc: 'Đảm bảo số trận thắng ròng hoặc cày điểm LP Cao Thủ/Thách Đấu tính theo điểm.',
    iconName: 'Target',
    pricingModel: PricingModel.UNIT_BASED,
    unitName: 'Điểm LP',
    defaultPrice: 1000,
    depositPercent: 30,
    allowedAddons: STANDARD_ADDONS,
    requiredFields: ['current_rank', 'current_lp', 'target_lp', 'server', 'account_credentials'],
    isActive: true,
  },
  {
    gameCode: 'LOL',
    slug: 'placements',
    name: 'Phân Hạng Đầu Mùa (5 Trận)',
    desc: 'Đảm bảo kết quả 5 trận phân hạng cao nhất để khởi đầu mùa giải thuận lợi.',
    iconName: 'Swords',
    pricingModel: PricingModel.PACKAGE_BASED,
    defaultPrice: 150000,
    depositPercent: 100,
    allowedAddons: STANDARD_ADDONS,
    requiredFields: ['prev_rank', 'server', 'account_credentials'],
    isActive: true,
  },
  {
    gameCode: 'LOL',
    slug: 'promotion',
    name: 'Chuỗi Thăng Hạng',
    desc: 'Vượt chuỗi thăng hạng BO3/BO5 an toàn và nhanh gọn mà không lo rớt bậc.',
    iconName: 'TrendingUp',
    pricingModel: PricingModel.PACKAGE_BASED,
    defaultPrice: 80000,
    depositPercent: 100,
    allowedAddons: STANDARD_ADDONS,
    requiredFields: ['promo_tier', 'server', 'account_credentials'],
    isActive: true,
  },
  {
    gameCode: 'LOL',
    slug: 'leveling',
    name: 'Cày Cấp Độ 1-30',
    desc: 'Cày cấp tài khoản lên cấp 30 nhanh nhất, tối đa Tinh Hoa Lam để mở xếp hạng.',
    iconName: 'Zap',
    pricingModel: PricingModel.PACKAGE_BASED,
    defaultPrice: 120000,
    depositPercent: 100,
    allowedAddons: STANDARD_ADDONS,
    requiredFields: ['current_level', 'desired_level', 'account_credentials'],
    isActive: true,
  },
  {
    gameCode: 'LOL',
    slug: 'mastery',
    name: 'Cày Thông Thạo Tướng',
    desc: 'Cày điểm thông thạo & nâng cấp mốc biểu cảm cho vị tướng bạn yêu thích.',
    iconName: 'Medal',
    pricingModel: PricingModel.UNIT_BASED,
    unitName: 'Mốc cấp',
    defaultPrice: 20000,
    depositPercent: 50,
    allowedAddons: STANDARD_ADDONS,
    requiredFields: ['champion_name', 'current_mastery', 'desired_mastery', 'account_credentials'],
    isActive: true,
  },
  {
    gameCode: 'LOL',
    slug: 'coaching',
    name: 'Huấn Luyện & Duo 1-1',
    desc: 'Phân tích replay, hướng dẫn tư duy macro/micro và leo rank duo cùng Booster.',
    iconName: 'Users',
    pricingModel: PricingModel.UNIT_BASED,
    unitName: 'Giờ học',
    defaultPrice: 100000,
    depositPercent: 100,
    allowedAddons: STANDARD_ADDONS,
    requiredFields: ['current_rank', 'coaching_type', 'hours', 'discord_tag'],
    isActive: true,
  },
  {
    gameCode: 'LOL',
    slug: 'onbet',
    name: 'Cày Rank Sự Kiện / Battle Pass',
    desc: 'Cày số trận và hoàn thành nhiệm vụ sự kiện để nhận toàn bộ phần thưởng.',
    iconName: 'Banknote',
    pricingModel: PricingModel.PACKAGE_BASED,
    defaultPrice: 90000,
    depositPercent: 50,
    allowedAddons: STANDARD_ADDONS,
    requiredFields: ['event_name', 'account_credentials'],
    isActive: true,
  },
];

async function seed() {
  console.log('🔄 Đang kết nối MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Đã kết nối thành công.');

  console.log(`🚀 Đang khởi tạo ${TEMPLATES.length} Service Templates mẫu vào database...`);
  for (const t of TEMPLATES) {
    await GameServiceTemplate.findOneAndUpdate(
      { gameCode: t.gameCode, slug: t.slug },
      { $set: t },
      { upsert: true, new: true }
    );
    console.log(`   + [${t.gameCode}] ${t.name} (${t.slug}) -> ${t.pricingModel}`);
  }

  console.log('\n✨ Đã hoàn thành nạp 8 Service Templates vào database MongoDB an toàn!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
