import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';

export const dynamic = 'force-dynamic'; // Đảm bảo luôn lấy dữ liệu mới nhất

export async function GET() {
  try {
    await dbConnect();
    
    const settings = await SystemSetting.find({
      key: { $in: ['maintenance_mode', 'banner_config'] }
    });

    const maintenanceSetting = settings.find(s => s.key === 'maintenance_mode');
    const bannerSetting = settings.find(s => s.key === 'banner_config');

    const config = {
      maintenanceMode: maintenanceSetting ? Boolean(maintenanceSetting.value) : false,
      banner: bannerSetting ? bannerSetting.value : { active: false, imageUrl: '', link: '' }
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to fetch system config:', error);
    return NextResponse.json({ maintenanceMode: false, banner: { active: false } }, { status: 500 });
  }
}