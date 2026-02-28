import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User, { UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();

    // 1. Xóa các Booster cũ (để tránh trùng lặp khi chạy lại)
    await User.deleteMany({ role: UserRole.BOOSTER });

    // 2. Tạo mật khẩu hash chung cho tất cả (ví dụ: 123456)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    // 3. Danh sách dữ liệu mẫu
    const sampleBoosters = [
      {
        username: 'Faker_Vietnam',
        email: 'booster1@test.com',
        password_hash: passwordHash,
        role: UserRole.BOOSTER,
        isEmailVerified: true,
        profile: {
          avatar: 'https://ui-avatars.com/api/?name=Faker+VN&background=random',
          discord_id: 'faker_vn#1234',
        },
        booster_info: {
          ranks: ['Challenger', 'Grandmaster'],
          services: ['RANK_BOOST', 'PLACEMENT'],
          rating: 5.0,
          completed_orders: 128,
          bio: 'Top 1 Thách Đấu VN mùa 13. Chuyên đi Mid/Jungle. Winrate 90%.',
        },
      },
      {
        username: 'SofM_Junior',
        email: 'booster2@test.com',
        password_hash: passwordHash,
        role: UserRole.BOOSTER,
        isEmailVerified: true,
        profile: {
          avatar: 'https://ui-avatars.com/api/?name=SofM+Jr&background=random',
        },
        booster_info: {
          ranks: ['Challenger'],
          services: ['RANK_BOOST', 'COACHING'],
          rating: 4.9,
          completed_orders: 85,
          bio: 'Chuyên gia đi rừng, kiểm soát bản đồ cực tốt. Nhận Coaching 1-1.',
        },
      },
      {
        username: 'OneChamp_Yasuo',
        email: 'booster3@test.com',
        password_hash: passwordHash,
        role: UserRole.BOOSTER,
        isEmailVerified: true,
        profile: {
          avatar: 'https://ui-avatars.com/api/?name=Yasuo+God&background=random',
        },
        booster_info: {
          ranks: ['Master', 'Grandmaster'],
          services: ['MASTERY', 'RANK_BOOST'],
          rating: 4.7,
          completed_orders: 210,
          bio: 'Thông thạo 7 Yasuo, Yone. Cày thuê siêu tốc rank thấp đến Cao Thủ.',
        },
      },
      {
        username: 'Support_Carry',
        email: 'booster4@test.com',
        password_hash: passwordHash,
        role: UserRole.BOOSTER,
        isEmailVerified: true,
        profile: {
          avatar: 'https://ui-avatars.com/api/?name=Sup+Carry&background=random',
        },
        booster_info: {
          ranks: ['Grandmaster'],
          services: ['RANK_BOOST', 'DUO_QUEUE'],
          rating: 5.0,
          completed_orders: 45,
          bio: 'Hỗ trợ kéo rank bao uy tín. Chuyên Thresh, Pyke, Blitzcrank.',
        },
      },
      {
        username: 'Adc_Mechanics',
        email: 'booster5@test.com',
        password_hash: passwordHash,
        role: UserRole.BOOSTER,
        isEmailVerified: true,
        profile: {
          avatar: 'https://ui-avatars.com/api/?name=ADC+Mech&background=random',
        },
        booster_info: {
          ranks: ['Challenger'],
          services: ['RANK_BOOST', 'PLACEMENT'],
          rating: 4.8,
          completed_orders: 300,
          bio: 'Xạ thủ gánh team. Kiting như tool. Đảm bảo KDA đẹp.',
        },
      },
    ];

    // 4. Insert vào DB
    await User.create(sampleBoosters);

    return NextResponse.json({
      success: true,
      message: `Đã tạo thành công ${sampleBoosters.length} Booster mẫu!`,
    });
  } catch (error) {
    console.error('Seed Error:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo dữ liệu mẫu' }, { status: 500 });
  }
}