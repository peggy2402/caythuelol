import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BoosterProfile from '@/models/BoosterProfile';
import BoosterService from '@/models/BoosterService';
import Rank from '@/models/Rank';
import { auth } from '@/lib/auth';

// GET: Lấy cấu hình để hiển thị lên ServiceContext
export async function GET() {
  try {
    await dbConnect();
    const session = await auth();
    if (!session || session.user.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Lấy Profile và Services từ DB mới
    const [profile, services, ranks] = await Promise.all([
      BoosterProfile.findOne({ userId }),
      BoosterService.find({ userId }),
      Rank.find({}).sort({ order: 1 }).lean()
    ]);

    if (!profile) {
      return NextResponse.json({ settings: {}, services: [], ranks: ranks || [] });
    }

    // 2. Gom nhóm dữ liệu từ các BoosterService documents thành 1 object "settings" khổng lồ
    // để ServiceContext ở frontend có thể đọc được mà không cần sửa code frontend.
    
    const rankBoostConfig = services.find(s => s.serviceType === 'RANK_BOOST');
    const netWinsConfig = services.find(s => s.serviceType === 'NET_WINS');
    const placementsConfig = services.find(s => s.serviceType === 'PLACEMENTS');
    const promotionConfig = services.find(s => s.serviceType === 'PROMOTION');
    const levelingConfig = services.find(s => s.serviceType === 'LEVELING');
    const masteryConfig = services.find(s => s.serviceType === 'MASTERY');
    const coachingConfig = services.find(s => s.serviceType === 'COACHING');

    // Lấy thông tin chung từ Profile (Game LOL mặc định là phần tử đầu tiên hoặc tìm theo code)
    const lolProfile = profile.games.find(g => g.gameCode === 'LOL');
    const metadata = lolProfile?.metadata || {};

    const settings = {
      // General
      servers: lolProfile?.servers || ['VN'],
      playingChampions: lolProfile?.champions || [],
      
      // Options (Lưu trong metadata của Profile)
      options: metadata.options || {
        schedule: true,
        scheduleFee: 0,
        roles: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'],
        specificChamps: 30,
        streaming: 349000,
        express: 35,
        duo: 50
      },

      // Rank Boost
      rankPrices: rankBoostConfig?.prices?.rankPrices || {},
      rankPricesFlex: rankBoostConfig?.prices?.rankPricesFlex || {},
      rankPricesDuo: rankBoostConfig?.prices?.rankPricesDuo || {},
      lpModifiers: rankBoostConfig?.settings?.lpModifiers || { low: 20, medium: 0, high: -20 },
      queueModifiers: rankBoostConfig?.settings?.queueModifiers || { SOLO_DUO: 0, FLEX: 0, TFT: 0 },

      // Net Wins
      netWinPrices: netWinsConfig?.prices?.netWinPrices || {},
      netWinPricesFlex: netWinsConfig?.prices?.netWinPricesFlex || {},
      netWinPricesDuo: netWinsConfig?.prices?.netWinPricesDuo || {},
      netWinDepositPercent: netWinsConfig?.settings?.netWinDepositPercent || 50,

      // Placements
      placementPrices: placementsConfig?.prices?.placementPrices || {},
      placementPricesFlex: placementsConfig?.prices?.placementPricesFlex || {},
      placementPricesDuo: placementsConfig?.prices?.placementPricesDuo || {},

      // Promotion
      promotionPrices: promotionConfig?.prices?.promotionPrices || {},
      promotionPricesFlex: promotionConfig?.prices?.promotionPricesFlex || {},
      promotionPricesDuo: promotionConfig?.prices?.promotionPricesDuo || {},

      // Leveling & Mastery
      levelingPrices: levelingConfig?.prices?.levelingPrices || {},
      masteryPrices: masteryConfig?.prices?.masteryPrices || {},
      coachingPrices: coachingConfig?.prices?.coachingPrices || {},
    };

    return NextResponse.json({
      settings,
      services: profile.services || [], // Danh sách các dịch vụ đang bật
      ranks: ranks || []
    });

  } catch (error) {
    console.error('Get Service Config Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Lưu toàn bộ cấu hình (Save All)
export async function POST(req: Request) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session || session.user.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json(); // Đây là object settings khổng lồ từ ServiceContext

    // 1. Cập nhật BoosterProfile (Thông tin chung)
    const profile = await BoosterProfile.findOne({ userId });
    if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Tìm game LOL để update, nếu chưa có thì thêm mới
    let gameIndex = profile.games.findIndex(g => g.gameCode === 'LOL');
    if (gameIndex === -1) {
        profile.games.push({
            gameCode: 'LOL',
            ranks: [],
            servers: body.servers || ['VN'],
            champions: body.playingChampions || [],
            roles: [],
            metadata: { options: body.options || {} }
        });
    } else {
        const game = profile.games[gameIndex] as any;
        game.servers = body.servers || ['VN'];
        game.champions = body.playingChampions || [];
        if (!game.metadata) game.metadata = {};
        game.metadata.options = body.options || {};
        
        profile.markModified('games');
    }
    await profile.save();

    // 2. Cập nhật từng BoosterService riêng biệt

    // --- RANK BOOST ---
    await BoosterService.findOneAndUpdate(
      { userId, serviceType: 'RANK_BOOST' },
      {
        $set: {
          prices: {
            rankPrices: body.rankPrices,
            rankPricesFlex: body.rankPricesFlex,
            rankPricesDuo: body.rankPricesDuo,
          },
          settings: {
            lpModifiers: body.lpModifiers,
            queueModifiers: body.queueModifiers
          }
        }
      },
      { upsert: true }
    );

    // --- NET WINS ---
    await BoosterService.findOneAndUpdate(
      { userId, serviceType: 'NET_WINS' },
      {
        $set: {
          prices: {
            netWinPrices: body.netWinPrices,
            netWinPricesFlex: body.netWinPricesFlex,
            netWinPricesDuo: body.netWinPricesDuo,
          },
          settings: {
            netWinDepositPercent: body.netWinDepositPercent
          }
        }
      },
      { upsert: true }
    );

    // --- PLACEMENTS ---
    await BoosterService.findOneAndUpdate(
      { userId, serviceType: 'PLACEMENTS' },
      { $set: { prices: { placementPrices: body.placementPrices, placementPricesFlex: body.placementPricesFlex, placementPricesDuo: body.placementPricesDuo } } },
      { upsert: true }
    );

    // --- PROMOTION ---
    await BoosterService.findOneAndUpdate(
      { userId, serviceType: 'PROMOTION' },
      { $set: { prices: { promotionPrices: body.promotionPrices, promotionPricesFlex: body.promotionPricesFlex, promotionPricesDuo: body.promotionPricesDuo } } },
      { upsert: true }
    );

    // --- LEVELING ---
    await BoosterService.findOneAndUpdate(
      { userId, serviceType: 'LEVELING' },
      { $set: { prices: { levelingPrices: body.levelingPrices } } },
      { upsert: true }
    );

    // --- MASTERY ---
    await BoosterService.findOneAndUpdate(
      { userId, serviceType: 'MASTERY' },
      { $set: { prices: { masteryPrices: body.masteryPrices } } },
      { upsert: true }
    );

    // --- COACHING ---
    await BoosterService.findOneAndUpdate(
      { userId, serviceType: 'COACHING' },
      { $set: { prices: { coachingPrices: body.coachingPrices } } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Save Service Config Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Toggle Service ON/OFF (MỚI)
export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session || session.user.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceKey, enabled } = await req.json();
    if (!serviceKey) return NextResponse.json({ error: 'Missing serviceKey' }, { status: 400 });

    const userId = session.user.id;

    // 1. Cập nhật danh sách services trong BoosterProfile (để hiển thị nhanh ở frontend)
    const updateQuery = enabled
      ? { $addToSet: { services: serviceKey } }
      : { $pull: { services: serviceKey } };

    const updatedProfile = await BoosterProfile.findOneAndUpdate(
      { userId },
      updateQuery,
      { new: true }
    );

    // 2. Cập nhật trạng thái isEnabled trong BoosterService tương ứng
    await BoosterService.findOneAndUpdate(
      { userId, serviceType: serviceKey },
      { isEnabled: enabled },
      { upsert: true } // Tạo mới nếu chưa có để tránh lỗi
    );

    return NextResponse.json({ 
      success: true, 
      services: updatedProfile?.services || [] 
    });

  } catch (error) {
    console.error('Toggle Service Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}