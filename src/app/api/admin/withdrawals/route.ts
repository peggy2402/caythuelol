// src/app/api/admin/withdrawals/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Withdrawal from '@/models/Withdrawal';

export async function GET(req: Request) {
  try {
    const session = await auth();
    // Add role check here (e.g., if (session.user.role !== 'ADMIN'))

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};
    if (status && status !== 'ALL') query.status = status;

    const withdrawals = await Withdrawal.find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Withdrawal.countDocuments(query);

    return NextResponse.json({
      withdrawals,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
  }
}
