import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import BoosterProfile from '@/models/BoosterProfile';
import BoosterService from '@/models/BoosterService';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // 1. Xác định User (Hỗ trợ tìm theo @username hoặc _id)
    let user;
    const decodedId = decodeURIComponent(id); // Giải mã %40 -> @

    if (decodedId.startsWith('@')) {
      // Tìm theo username (bỏ dấu @ ở đầu)
      const username = decodedId.substring(1);
      user = await User.findOne({ username }).select('username profile createdAt role');
    } else if (mongoose.Types.ObjectId.isValid(decodedId)) {
      // Tìm theo ID (cho các trang dịch vụ dùng ID)
      user = await User.findById(decodedId).select('username profile createdAt role');
    }

    if (!user) {
      return NextResponse.json({ error: 'Booster not found' }, { status: 404 });
    }

    // 2. Lấy Profile và Services từ DB mới (Dùng user._id đã tìm được)
    const userId = user._id;
    const [profile, services, reviews, ratingStats] = await Promise.all([
      BoosterProfile.findOne({ userId }),
      BoosterService.find({ userId }),
      // Lấy đánh giá từ các đơn đã hoàn thành (Optional)
      Order.find({ boosterId: userId, status: 'COMPLETED', 'rating.stars': { $exists: true } })
           .select('rating customerId serviceType details createdAt')
           .populate('customerId', 'username profile.avatar')
           .sort({ createdAt: -1 })
           .limit(5),
      // Tính điểm trung bình theo từng loại dịch vụ
      Order.aggregate([
        { $match: { boosterId: userId, status: 'COMPLETED', 'rating.stars': { $exists: true } } },
        { $group: {
            _id: '$serviceType',
            avgRating: { $avg: '$rating.stars' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Convert ratingStats array to object map
    const statsMap: Record<string, { avg: number, count: number }> = {};
    ratingStats.forEach((stat: any) => {
        statsMap[stat._id] = { avg: stat.avgRating, count: stat.count };
    });

    // Helper để lấy giá của từng dịch vụ
    const getServicePrices = (type: string) => {
        const s = services.find(s => s.serviceType === type);
        return s ? { ...s.prices, ...s.settings } : {};
    };

    const rankBoost = services.find(s => s.serviceType === 'RANK_BOOST');
    const netWins = services.find(s => s.serviceType === 'NET_WINS');
    
    // Lấy thông tin game LOL (Mặc định)
    const lolProfile = profile?.games?.find(g => g.gameCode === 'LOL');
    const metadata = lolProfile?.metadata || {};

    // 3. Cấu trúc lại service_settings để khớp với Frontend cũ
    // Đây là bước quan trọng nhất để Frontend hiển thị được giá
    const service_settings = {
      // General
      servers: lolProfile?.servers || ['VN'],
      playingChampions: lolProfile?.champions || [],
      options: metadata.options || {},

      // Rank Boost
      rankPrices: rankBoost?.prices?.rankPrices || {},
      rankPricesFlex: rankBoost?.prices?.rankPricesFlex || {},
      rankPricesDuo: rankBoost?.prices?.rankPricesDuo || {},
      lpModifiers: rankBoost?.settings?.lpModifiers || {},
      queueModifiers: rankBoost?.settings?.queueModifiers || {},

      // Net Wins
      netWinPrices: netWins?.prices?.netWinPrices || {},
      netWinPricesFlex: netWins?.prices?.netWinPricesFlex || {},
      netWinPricesDuo: netWins?.prices?.netWinPricesDuo || {},
      netWinDepositPercent: netWins?.settings?.netWinDepositPercent || 50,

      // Others
      placementPrices: getServicePrices('PLACEMENTS').placementPrices || {},
      placementPricesFlex: getServicePrices('PLACEMENTS').placementPricesFlex || {},
      placementPricesDuo: getServicePrices('PLACEMENTS').placementPricesDuo || {},

      promotionPrices: getServicePrices('PROMOTION').promotionPrices || {},
      promotionPricesFlex: getServicePrices('PROMOTION').promotionPricesFlex || {},
      promotionPricesDuo: getServicePrices('PROMOTION').promotionPricesDuo || {},

      levelingPrices: getServicePrices('LEVELING').levelingPrices || {},
      masteryPrices: getServicePrices('MASTERY').masteryPrices || {},
      coachingPrices: getServicePrices('COACHING').coachingPrices || {},
    };

    // 4. Tạo object response đầy đủ
    const booster = {
      _id: user._id,
      username: user.username,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
      booster_info: {
        rating: profile?.rating || 5,
        completed_orders: profile?.completedOrders || 0,
        bio: profile?.bio || '',
        services: profile?.services || [],
        ranks: lolProfile?.ranks || [],
        service_settings, // <-- Frontend cần cái này để tính giá
        rating_stats: statsMap // <-- Thống kê đánh giá theo dịch vụ
      }
    };

    return NextResponse.json({ 
      booster, 
      reviews: reviews || [] 
    });

  } catch (error) {
    console.error('Get Booster Detail Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}