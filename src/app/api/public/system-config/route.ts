import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    await dbConnect();
    const settings = await SystemSetting.find({});
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    await dbConnect();
    const body = await req.json();
    const { key, value, description } = body;

    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { value, description },
      { upsert: true, new: true }
    );

    return NextResponse.json(setting);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}