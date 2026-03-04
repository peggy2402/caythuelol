import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    
    // 1. Parse Query Params
    const server = searchParams.get('server'); // Filter theo server (VN, KR...)
    const service = searchParams.get('service'); // Filter theo loại dịch vụ (RANK_BOOST, NET_WINS...)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // 2. Build Query
    const query: any = { role: 'BOOSTER' };

    // Nếu có filter server, kiểm tra xem booster có hỗ trợ server đó không
    if (server) {
      query['booster_info.service_settings.servers'] = server;
    }

    // Nếu có filter service, kiểm tra xem booster có bật dịch vụ đó không
    if (service) {
      query['booster_info.services'] = service;
    }

    // 3. Execute Query (Select fields tối ưu)
    const boosters = await User.find(query)
      .select('_id username profile.avatar booster_info.ranks booster_info.rating booster_info.completed_orders booster_info.bio booster_info.services booster_info.service_settings')
      .skip(skip)
      .limit(limit)
      .lean(); // Dùng lean() để tăng tốc độ query

    const total = await User.countDocuments(query);

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