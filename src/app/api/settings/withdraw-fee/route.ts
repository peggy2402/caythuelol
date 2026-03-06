import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';
import { auth } from '@/lib/auth';

export async function GET() {
  await dbConnect();
  const setting = await SystemSetting.findOne({ key: 'withdraw_fee' });
  // Default fee is 5000 if not set
  return NextResponse.json({ fee: setting ? Number(setting.value) : 5000 });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    await dbConnect();
    const { fee } = await req.json();
    await SystemSetting.findOneAndUpdate(
      { key: 'withdraw_fee' },
      { value: fee, description: 'Phí rút tiền cố định (VND)' },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, fee });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update fee' }, { status: 500 });
  }
}
