import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    
    // 1. Parse Query Params
    const search = searchParams.get('search'); // Filter theo tên booster
    const server = searchParams.get('server'); // Filter theo server (VN, KR...)
    const service = searchParams.get('service'); // Filter theo loại dịch vụ (RANK_BOOST, NET_WINS...)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      // 1. Bắt đầu từ User có role BOOSTER
      { $match: { role: 'BOOSTER' } },
      
      // 2. Lookup BoosterProfile (để lấy thông tin chi tiết nếu có)
      {
        $lookup: {
          from: 'boosterprofiles', // Tên collection trong MongoDB (lowercase plural)
          localField: '_id',
          foreignField: 'userId',
          as: 'profileDoc'
        }
      },
      { $unwind: { path: '$profileDoc', preserveNullAndEmptyArrays: true } }, // Giữ lại User kể cả khi chưa có Profile

      // 3. Chuẩn hóa dữ liệu (Ưu tiên lấy từ ProfileDoc, nếu không có lấy từ User)
      {
        $addFields: {
          displayName: { $ifNull: ['$profileDoc.displayName', '$username'] },
          // Lấy avatar từ user profile gốc
          avatar: '$profile.avatar',
          // Merge data từ profileDoc và legacy booster_info
          services: { 
            $setUnion: [
              { $ifNull: ['$profileDoc.services', []] }, 
              { $ifNull: ['$booster_info.services', []] },
              { $ifNull: ['$booster_info.service_settings.enabledServices', []] }
            ] 
          },
          rating: { $ifNull: ['$profileDoc.rating', '$booster_info.rating', 5.0] },
          completedOrders: { $ifNull: ['$profileDoc.completedOrders', '$booster_info.completed_orders', 0] },
          games: { $ifNull: ['$profileDoc.games', []] },
          bio: { $ifNull: ['$profileDoc.bio', '$booster_info.bio', ''] },
          // Giữ lại booster_info để check isReady
          booster_info: '$booster_info'
        }
      }
    ];

    // 4. Apply Filters
    const matchStage: any = {};

    if (server) {
      matchStage['games.servers'] = server;
    }

    if (service) {
      matchStage['services'] = service;
    }

    // Filter theo tên (Search)
    if (search) {
      matchStage['$or'] = [
        { 'username': { $regex: search, $options: 'i' } },
        { 'displayName': { $regex: search, $options: 'i' } }
      ];
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // 5. Facet for Pagination & Data
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
              displayName: 1,
              bio: 1,
              games: 1,
              services: 1,
              rating: 1,
              completedOrders: 1,
              booster_info: 1
            }
          }
        ]
      }
    });
    
    const result = await User.aggregate(pipeline);
    const boosters = result[0].data;
    const total = result[0].metadata[0]?.total || 0;

    return NextResponse.json({
      success: true,
      boosters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Boosters Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}