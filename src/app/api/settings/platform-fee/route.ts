import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';

export async function GET() {
  try {
    await dbConnect();
    const setting = await SystemSetting.findOne({ key: 'PLATFORM_FEE' });
    // Mặc định 5% nếu chưa cấu hình
    const fee = setting ? Number(setting.value) : 5;
    return NextResponse.json({ fee });
  } catch (error) {
    console.error('Fetch Platform Fee Error:', error);
    return NextResponse.json({ fee: 5 }); // Fallback an toàn
  }
}
