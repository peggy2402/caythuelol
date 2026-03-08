import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import BoosterProfile from '@/models/BoosterProfile';
import BoosterService from '@/models/BoosterService';

export async function GET() {
  try {
    await dbConnect();
    
    // 1. Lấy toàn bộ user có role BOOSTER
    // Sử dụng lean() để lấy dữ liệu thô (bao gồm cả các trường đã bị xóa khỏi Schema nếu còn trong DB)
    const boosters = await User.find({ role: 'BOOSTER' }).lean();
    
    const results = [];
    
    for (const user of boosters) {
      // 2. Kiểm tra xem đã có Profile chưa
      const existingProfile = await BoosterProfile.findOne({ userId: user._id });
      
      if (!existingProfile) {
        // Lấy thông tin cũ (nếu còn sót lại trong DB) hoặc dùng mặc định
        // @ts-ignore
        const oldInfo = user.booster_info || {};
        
        // Tạo Profile mới theo cấu trúc Multi-game
        await BoosterProfile.create({
          userId: user._id,
          displayName: user.username, // Mặc định lấy username làm tên hiển thị
          bio: oldInfo.bio || 'Chuyên gia cày thuê LMHT uy tín.',
          rating: oldInfo.rating || 5.0,
          completedOrders: oldInfo.completed_orders || 0,
          services: oldInfo.services || ['RANK_BOOST', 'PLACEMENT'],
          games: [{
            gameCode: 'LOL',
            ranks: oldInfo.ranks || ['CHALLENGER'], // Mặc định là Thách Đấu nếu không có dữ liệu
            servers: ['VN'],
            champions: oldInfo.playingChampions || []
          }]
        });
        results.push(`✅ Created Profile for: ${user.username}`);
      } else {
        results.push(`ℹ️ Profile already exists for: ${user.username}`);
      }

      // 3. Kiểm tra và tạo Service Config mặc định (để họ có thể nhận đơn ngay)
      const existingService = await BoosterService.findOne({ userId: user._id, serviceType: 'RANK_BOOST' });
      if (!existingService) {
        await BoosterService.create({
          userId: user._id,
          serviceType: 'RANK_BOOST',
          isEnabled: true,
          prices: {}, // Để trống để dùng giá sàn
          settings: {
            lpModifiers: { low: 20, medium: 0, high: -20 }
          }
        });
        results.push(`✅ Created Service Config for: ${user.username}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: boosters.length,
      results 
    });
  } catch (error: any) {
    console.error("Migration Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
