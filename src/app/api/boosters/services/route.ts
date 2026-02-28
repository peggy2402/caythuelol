import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) return null;
  
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// GET: Fetch Booster's service configuration
export async function GET() {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    
    if (!payload || payload.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = await User.findById(payload.userId).select('booster_config');
    
    return NextResponse.json({
      service_settings: user?.booster_config?.services || [],
      option_settings: user?.booster_config?.options || []
    });
  } catch (error) {
    console.error('Fetch Service Config Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Save Booster's service configuration
export async function POST(req: Request) {
  try {
    await dbConnect();
    const payload = await getAuthUser();

    if (!payload || payload.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { service_settings, option_settings } = await req.json();

    await User.findByIdAndUpdate(payload.userId, {
      $set: {
        'booster_config.services': service_settings,
        'booster_config.options': option_settings
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update Service Config Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}