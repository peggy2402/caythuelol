import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI không được tìm thấy trong backend/.env');
  process.exit(1);
}

const DEFAULT_PASSWORD = process.env.BOOSTER_DEFAULT_PASSWORD || 'Booster@123456';

interface BoosterSeedInput {
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  bio: string;
  ingameName: string;
  currentRank: string;
  highestRank: string;
  rating: number;
  completedOrders: number;
  performanceScore: number;
  tier: string;
  tierName: string;
  globalRank: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  mainGames: string[];
  schedule: {
    daysOfWeek: string[];
    fromTime: string;
    toTime: string;
    allowScheduledBoost: boolean;
    note: string;
  };
  games: any[];
}

const BOOSTERS: BoosterSeedInput[] = [
  {
    username: 'booster_faker',
    email: 'booster.faker@leorank.site',
    displayName: 'Faker Leo Rank',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80',
    bio: 'Huyền thoại đường giữa, cày thuê LMHT & ĐTCL thần tốc. Cam kết tỉ lệ thắng 95%+, giữ KDA cực đẹp, bảo mật tài khoản tuyệt đối.',
    ingameName: 'Hide on bush#KR1',
    currentRank: 'Thách Đấu',
    highestRank: 'Thách Đấu Top 1',
    rating: 5.0,
    completedOrders: 156,
    performanceScore: 98,
    tier: 'GRANDMASTER',
    tierName: 'Grandmaster',
    globalRank: 1,
    bankName: 'Techcombank',
    accountNumber: '19036789123011',
    accountHolder: 'LEE SANG HYEOK',
    mainGames: ['LOL', 'TFT'],
    schedule: {
      daysOfWeek: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      fromTime: '08:00',
      toTime: '17:30',
      allowScheduledBoost: true,
      note: 'T2 – T7 • 08:00 – 17:30 (trừ CN)',
    },
    games: [
      {
        gameCode: 'LOL',
        ranks: ['CHALLENGER', 'MASTER'],
        servers: ['VN', 'KR', 'SEA'],
        champions: ['Ahri', 'Azir', 'Orianna', 'Sylas', 'LeBlanc'],
        roles: ['MID', 'TOP'],
        performanceScore: 99,
        tier: 'GRANDMASTER',
        completedOrders: 124,
        successRate: 98,
      },
      {
        gameCode: 'TFT',
        ranks: ['CHALLENGER'],
        servers: ['VN', 'SEA'],
        performanceScore: 94,
        tier: 'MASTER',
        completedOrders: 32,
        successRate: 96,
      },
    ],
  },
  {
    username: 'booster_chovy',
    email: 'booster.chovy@leorank.site',
    displayName: 'Chovy CS God',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    bio: 'Vua farm lính & outplay đường giữa. Nhận kéo rank LMHT & Liên Quân mọi bậc rank từ Đồng đến Thách Đấu, leo rank nhanh như gió.',
    ingameName: 'Chovy#KR1',
    currentRank: 'Thách Đấu',
    highestRank: 'Thách Đấu 1500 LP',
    rating: 4.9,
    completedOrders: 134,
    performanceScore: 96,
    tier: 'GRANDMASTER',
    tierName: 'Grandmaster',
    globalRank: 2,
    bankName: 'MBBank',
    accountNumber: '098765432101',
    accountHolder: 'JEONG JI HOON',
    mainGames: ['LOL', 'AOV'],
    schedule: {
      daysOfWeek: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      fromTime: '13:00',
      toTime: '22:00',
      allowScheduledBoost: true,
      note: 'T2 – T7 • 13:00 – 22:00',
    },
    games: [
      {
        gameCode: 'LOL',
        ranks: ['CHALLENGER', 'MASTER'],
        servers: ['VN', 'KR'],
        champions: ['Yone', 'Akali', 'Corki', 'Jayce', 'Tristana'],
        roles: ['MID', 'TOP'],
        performanceScore: 97,
        tier: 'GRANDMASTER',
        completedOrders: 102,
        successRate: 97,
      },
      {
        gameCode: 'AOV',
        ranks: ['THACH_DAU', 'CHIEN_TUONG'],
        servers: ['VN'],
        champions: ['Florentino', 'Nakroth', 'Tulen', 'Raz'],
        roles: ['MID', 'JUNGLE'],
        performanceScore: 93,
        tier: 'MASTER',
        completedOrders: 32,
        successRate: 95,
      },
    ],
  },
  {
    username: 'booster_tenz',
    email: 'booster.tenz@leorank.site',
    displayName: 'TenZ Aim Bot',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    bio: 'Chuyên gia FPS & game bắn súng chiến thuật (Valorant, CS2). Headshot rate 45%+, kéo rank Duo/Solo Radiant siêu tốc.',
    ingameName: 'TenZ#SEN',
    currentRank: 'Radiant',
    highestRank: 'Radiant #1',
    rating: 5.0,
    completedOrders: 98,
    performanceScore: 95,
    tier: 'MASTER',
    tierName: 'Master',
    globalRank: 3,
    bankName: 'Vietcombank',
    accountNumber: '0071001234567',
    accountHolder: 'TYSON NGO',
    mainGames: ['VALORANT', 'CS2'],
    schedule: {
      daysOfWeek: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      fromTime: '09:00',
      toTime: '18:00',
      allowScheduledBoost: true,
      note: 'Hàng ngày • 09:00 – 18:00',
    },
    games: [
      {
        gameCode: 'VALORANT',
        ranks: ['Radiant', 'Immortal 3'],
        servers: ['AP', 'VN'],
        champions: ['Jett', 'Reyna', 'Omen', 'Yoru'],
        roles: ['Duelist', 'Controller'],
        performanceScore: 98,
        tier: 'GRANDMASTER',
        completedOrders: 74,
        successRate: 96,
      },
      {
        gameCode: 'CS2',
        ranks: ['Global Elite', 'Faceit Level 10'],
        servers: ['SEA', 'VN'],
        performanceScore: 92,
        tier: 'MASTER',
        completedOrders: 24,
        successRate: 94,
      },
    ],
  },
  {
    username: 'booster_sofm',
    email: 'booster.sofm@leorank.site',
    displayName: 'SofM Jungle King',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Thần rừng Việt Nam, phong cách kiểm soát bản đồ tuyệt đỉnh. Nhận kéo rank LMHT, ĐTCL, Liên Quân, tỷ lệ thắng áp đảo.',
    ingameName: 'SofM#VN1',
    currentRank: 'Thách Đấu',
    highestRank: 'Thách Đấu 1200 LP',
    rating: 5.0,
    completedOrders: 210,
    performanceScore: 99,
    tier: 'GRANDMASTER',
    tierName: 'Grandmaster',
    globalRank: 4,
    bankName: 'VPBank',
    accountNumber: '1988888888',
    accountHolder: 'LE QUANG DUY',
    mainGames: ['LOL', 'TFT', 'AOV'],
    schedule: {
      daysOfWeek: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      fromTime: '08:00',
      toTime: '17:30',
      allowScheduledBoost: true,
      note: 'Hàng ngày • 08:00 – 17:30',
    },
    games: [
      {
        gameCode: 'LOL',
        ranks: ['CHALLENGER', 'MASTER'],
        servers: ['VN', 'KR'],
        champions: ['Lee Sin', 'Nidalee', 'Jarvan IV', 'Graves', 'Viego'],
        roles: ['JUNGLE', 'SUPPORT'],
        performanceScore: 99,
        tier: 'GRANDMASTER',
        completedOrders: 160,
        successRate: 99,
      },
      {
        gameCode: 'TFT',
        ranks: ['CHALLENGER'],
        servers: ['VN'],
        performanceScore: 95,
        tier: 'MASTER',
        completedOrders: 35,
        successRate: 94,
      },
      {
        gameCode: 'AOV',
        ranks: ['THACH_DAU'],
        servers: ['VN'],
        champions: ['Nakroth', 'Kriknak', 'Murad'],
        roles: ['JUNGLE'],
        performanceScore: 94,
        tier: 'MASTER',
        completedOrders: 15,
        successRate: 93,
      },
    ],
  },
];

async function seedBoosters() {
  console.log('🔄 Đang kết nối tới MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Kết nối thành công!');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not ready');
  }

  const usersCollection = db.collection('users');
  const boosterProfilesCollection = db.collection('boosterprofiles');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

  console.log(`\n🚀 Bắt đầu khởi tạo / cập nhật 4 tài khoản Booster...\n`);

  for (const b of BOOSTERS) {
    const serviceSettings = {
      selectedGames: b.mainGames,
      workingSchedule: b.schedule,
      enabledServices: ['RANK_BOOST', 'PROMOTION', 'NET_WINS', 'PLACEMENTS', 'LEVELING', 'COACHING'],
      servers: ['VN', 'KR', 'SEA', 'AP'],
    };

    const userData = {
      username: b.username,
      email: b.email,
      password_hash: passwordHash,
      role: 'BOOSTER',
      isEmailVerified: true,
      platform: 'EMAIL',
      wallet_balance: 1000000,
      pending_balance: 0,
      loyalty_points: 3000,
      isBanned: false,
      profile: {
        avatar: b.avatar,
        bank_info: {
          bankName: b.bankName,
          accountNumber: b.accountNumber,
          accountHolder: b.accountHolder,
        },
      },
      booster_info: {
        bio: b.bio,
        ingame_name: b.ingameName,
        currentRank: b.currentRank,
        highestRank: b.highestRank,
        rating: b.rating,
        completed_orders: b.completedOrders,
        isReady: true,
        performanceScore: b.performanceScore,
        tier: b.tier,
        tierName: b.tierName,
        main_games: b.mainGames,
        services: ['rank-boost', 'net-wins', 'placements', 'promotion'],
        service_settings: serviceSettings,
      },
      workingSchedule: b.schedule,
      updatedAt: new Date(),
    };

    const existingUser = await usersCollection.findOne({
      $or: [{ username: b.username }, { email: b.email }],
    });

    let userId: any;

    if (existingUser) {
      console.log(`ℹ️ [${b.username}] đã tồn tại. Đang cập nhật quyền BOOSTER, thông tin và mật khẩu...`);
      await usersCollection.updateOne(
        { _id: existingUser._id },
        {
          $set: userData,
        }
      );
      userId = existingUser._id;
      console.log(`   ✅ Đã cập nhật user ID: ${userId}`);
    } else {
      console.log(`✨ [${b.username}] Đang tạo mới tài khoản BOOSTER...`);
      const insertResult = await usersCollection.insertOne({
        ...userData,
        createdAt: new Date(),
      });
      userId = insertResult.insertedId;
      console.log(`   ✅ Đã tạo mới user ID: ${userId}`);
    }

    // Cập nhật BoosterProfile
    const profileData = {
      userId: new mongoose.Types.ObjectId(userId.toString()),
      displayName: b.displayName,
      avatar: b.avatar,
      bio: b.bio,
      games: b.games,
      services: ['rank-boost', 'net-wins', 'placements', 'promotion'],
      rating: b.rating,
      completedOrders: b.completedOrders,
      performanceScore: b.performanceScore,
      tier: b.tier,
      tierName: b.tierName,
      globalRank: b.globalRank,
      service_settings: serviceSettings,
      scoreBreakdown: {
        efficiencyScore: b.performanceScore,
        qualityScore: b.performanceScore,
        reliabilityScore: b.performanceScore,
        experienceScore: b.performanceScore,
        activityScore: b.performanceScore,
      },
      lastCalculatedAt: new Date(),
      updatedAt: new Date(),
    };

    await boosterProfilesCollection.updateOne(
      { userId: new mongoose.Types.ObjectId(userId.toString()) },
      {
        $set: profileData,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    console.log(`   ✅ Đã đồng bộ BoosterProfile cho ${b.displayName} (@${b.username})\n`);
  }

  console.log('================================================================');
  console.log('🎉 ĐÃ KHỞI TẠO XONG 4 TÀI KHOẢN BOOSTER THÀNH CÔNG!');
  console.log(`👉 Mật khẩu chung: ${DEFAULT_PASSWORD}`);
  console.log('================================================================\n');

  await mongoose.disconnect();
}

seedBoosters()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Lỗi tạo boosters:', err);
    process.exit(1);
  });
