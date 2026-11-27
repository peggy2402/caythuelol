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

async function createBooster() {
  console.log('🔄 Đang kết nối tới MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Kết nối thành công!');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not ready');
  }

  const usersCollection = db.collection('users');
  const boosterProfilesCollection = db.collection('boosterprofiles');

  const username = 'booster_pro';
  const email = 'booster.pro@leorank.site';
  const plainPassword = process.env.BOOSTER_DEFAULT_PASSWORD || 'Booster@123456';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);

  const boosterUserData = {
    username,
    email,
    password_hash: passwordHash,
    role: 'BOOSTER',
    isEmailVerified: true,
    platform: 'EMAIL',
    wallet_balance: 500000,
    pending_balance: 0,
    loyalty_points: 1500,
    isBanned: false,
    profile: {
      avatar: '/default-avatar.png',
      bank_info: {
        bankName: 'MBBank',
        accountNumber: '0987654321',
        accountHolder: 'NGUYEN VAN BOOSTER',
      },
    },
    booster_info: {
      bio: 'Booster cày thuê chuyên nghiệp nhiều tựa game (LMHT, Valorant, ĐTCL). Tỉ lệ thắng 85%+, hoàn thành đúng tiến độ, bảo mật tài khoản tuyệt đối.',
      ingame_name: 'BoosterPro#VN2',
      currentRank: 'Cao Thủ',
      highestRank: 'Thách Đấu',
      rating: 5.0,
      completed_orders: 128,
      isReady: true,
      performanceScore: 92,
      tier: 'MASTER',
      tierName: 'Master',
    },
    updatedAt: new Date(),
  };

  const existingUser = await usersCollection.findOne({
    $or: [{ username }, { email }],
  });

  let userId: any;

  if (existingUser) {
    console.log(`ℹ️ Tài khoản ${username} (${email}) đã tồn tại. Đang cập nhật quyền BOOSTER và mật khẩu...`);
    await usersCollection.updateOne(
      { _id: existingUser._id },
      {
        $set: {
          ...boosterUserData,
        },
      }
    );
    userId = existingUser._id;
    console.log(`✅ Đã cập nhật thành công user ID: ${userId}`);
  } else {
    console.log(`✨ Đang tạo mới tài khoản BOOSTER: ${username}...`);
    const insertResult = await usersCollection.insertOne({
      ...boosterUserData,
      createdAt: new Date(),
    });
    userId = insertResult.insertedId;
    console.log(`✅ Đã tạo mới thành công user ID: ${userId}`);
  }

  // Khởi tạo / Cập nhật BoosterProfile
  const boosterProfileData = {
    userId: new mongoose.Types.ObjectId(userId.toString()),
    displayName: 'Booster Pro',
    avatar: '/default-avatar.png',
    bio: 'Booster cày thuê chuyên nghiệp nhiều tựa game (LMHT, Valorant, ĐTCL). Tỉ lệ thắng 85%+, hoàn thành đúng tiến độ, bảo mật tài khoản tuyệt đối.',
    games: [
      {
        gameCode: 'LOL',
        ranks: ['Thách Đấu', 'Cao Thủ'],
        servers: ['VN', 'KR', 'SEA'],
        champions: ['Lee Sin', 'Yasuo', 'Ahri', 'Zed', 'Sylas'],
        roles: ['MID', 'JUNGLE', 'TOP'],
        performanceScore: 94,
        tier: 'MASTER',
        completedOrders: 92,
        successRate: 98,
      },
      {
        gameCode: 'VALORANT',
        ranks: ['Radiant', 'Immortal 3'],
        servers: ['AP', 'VN'],
        champions: ['Jett', 'Reyna', 'Omen', 'Sova'],
        roles: ['Duelist', 'Controller'],
        performanceScore: 90,
        tier: 'DIAMOND',
        completedOrders: 36,
        successRate: 95,
      },
      {
        gameCode: 'TFT',
        ranks: ['Thách Đấu'],
        servers: ['VN'],
        performanceScore: 88,
        tier: 'DIAMOND',
        completedOrders: 20,
        successRate: 92,
      },
    ],
    services: ['rank-boost', 'net-wins', 'placements'],
    rating: 5.0,
    completedOrders: 128,
    performanceScore: 92,
    tier: 'MASTER',
    tierName: 'Master',
    globalRank: 1,
    scoreBreakdown: {
      efficiencyScore: 92,
      qualityScore: 95,
      reliabilityScore: 90,
      experienceScore: 90,
      activityScore: 92,
    },
    lastCalculatedAt: new Date(),
    updatedAt: new Date(),
  };

  await boosterProfilesCollection.updateOne(
    { userId: new mongoose.Types.ObjectId(userId.toString()) },
    {
      $set: boosterProfileData,
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  console.log('✅ Đã đồng bộ BoosterProfile chuyên nghiệp đa tựa game!');
  console.log('\n========================================');
  console.log('🎉 THÔNG TIN TÀI KHOẢN BOOSTER:');
  console.log(`👉 Tên đăng nhập: ${username}`);
  console.log(`👉 Email:         ${email}`);
  console.log(`👉 Mật khẩu:      ${plainPassword}`);
  console.log(`👉 Vai trò:       BOOSTER`);
  console.log(`👉 Cấp bậc:       Master (Score: 92/100)`);
  console.log(`👉 Số dư ví:      500,000 đ`);
  console.log('========================================\n');

  await mongoose.disconnect();
}

createBooster()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Lỗi tạo booster:', err);
    process.exit(1);
  });
