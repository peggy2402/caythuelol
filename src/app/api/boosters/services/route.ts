import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

async function getBoosterId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    // @ts-ignore
    if (payload.role !== 'BOOSTER') return null;
    return payload.userId as string;
  } catch { return null; }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = await getBoosterId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(userId).select('booster_info.service_settings');
    return NextResponse.json(user?.booster_info?.service_settings || {});
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const userId = await getBoosterId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    
    // Validate body structure if needed
    
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Ensure booster_info exists
    if (!user.booster_info) {
      user.booster_info = {};
    }

    user.booster_info.service_settings = body;
    user.markModified('booster_info'); // Important for Mixed types to be detected as changed
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}