import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import BoosterProfile from '@/models/BoosterProfile';

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

    // 2. Build Query
    const query: any = {};

    // Nếu có filter server, kiểm tra xem booster có hỗ trợ server đó không
    // Cấu trúc mới: games.servers (Array)
    if (server) {
      query['games.servers'] = server;
    }

    // Nếu có filter service, kiểm tra xem booster có bật dịch vụ đó không
    if (service) {
      query['services'] = service;
    }

    // 3. Execute Query với Aggregation để Join User
    // Nếu có search text, chúng ta cần tìm User trước hoặc lookup xong mới filter
    
    const pipeline: any[] = [
      { $match: query },
      {
        $lookup: {
          from: 'users', // Tên collection User trong DB (thường là lowercase plural)
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: false } }, // Chỉ lấy profile có user hợp lệ
      // Chỉ lấy user có role BOOSTER (đề phòng data rác)
      { $match: { 'userInfo.role': 'BOOSTER' } }
    ];

    // Filter theo tên (Search)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'userInfo.username': { $regex: search, $options: 'i' } },
            { 'displayName': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Pagination
    pipeline.push(
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: '$userInfo._id', // Trả về ID của User để frontend dùng làm link
          username: '$userInfo.username',
          avatar: '$userInfo.profile.avatar',
          displayName: 1,
          bio: 1,
          games: 1, // Cấu trúc mới
          services: 1,
          rating: 1,
          completedOrders: 1
        }
      }
    );

    const boosters = await BoosterProfile.aggregate(pipeline);
    
    // Đếm tổng số (cần query riêng hoặc dùng facet, ở đây query riêng cho đơn giản)
    // Lưu ý: Count chính xác khi có search text sẽ phức tạp hơn, ở đây tạm tính count theo query gốc
    const total = await BoosterProfile.countDocuments(query);

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