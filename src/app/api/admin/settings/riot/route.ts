import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    await dbConnect();
    const setting = await SystemSetting.findOne({ key: 'riot_api_key' });
    // Chỉ trả về masked key để bảo mật
    const key = setting?.value || '';
    const masked = key.length > 10 ? `${key.substring(0, 5)}...${key.substring(key.length - 5)}` : '';
    
    return NextResponse.json({ apiKey: key, masked });
  } catch (e) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { apiKey } = await req.json();
    await dbConnect();
    
    await SystemSetting.findOneAndUpdate(
      { key: 'riot_api_key' },
      { value: apiKey, description: 'Riot Games API Key (Expires every 24h)' },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
