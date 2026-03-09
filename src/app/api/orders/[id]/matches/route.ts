import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { champion, result, lp_change, reason, leagueInfo, mode, detail, riotMatchId } = body;

    await dbConnect();
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Only Booster or Admin can add matches
    if (session.user.role !== 'ADMIN' && order.boosterId?.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Add Match to History
    const newMatch = {
        mode: mode || 'Ranked Solo/Duo',
        champion,
        result,
        lp_change: parseInt(lp_change) || 0,
        reason,
        timestamp: new Date(),
        detail, // Save full match details from Riot
        riotMatchId
    };
    
    if (!order.match_history) {
        order.match_history = [];
    }
    order.match_history!.push(newMatch);

    // 2. Update Order Current Rank/LP if leagueInfo is provided (from Riot API)
    if (leagueInfo) {
        order.details.current_rank = `${leagueInfo.tier} ${leagueInfo.rank}`;
        order.details.current_lp = leagueInfo.leaguePoints;
        // Optional: Update wins/losses in details if you have fields for them
    } else if (lp_change) {
        // Fallback: Manual calculation if no API info
        const currentLp = parseInt(order.details.current_lp || '0');
        order.details.current_lp = Math.max(0, currentLp + (parseInt(lp_change) || 0));
    }

    await order.save();

    return NextResponse.json({ success: true, match_history: order.match_history, details: order.details });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { matchId, champion, result, lp_change, reason, mode, detail, riotMatchId } = body;

    await dbConnect();
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (session.user.role !== 'ADMIN' && order.boosterId?.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!order.match_history) {
      return NextResponse.json({ error: 'Match history not found' }, { status: 404 });
    }

    const match = (order.match_history as any).id(matchId);
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    match.champion = champion;
    match.result = result;
    match.lp_change = parseInt(lp_change) || 0;
    match.reason = reason;
    match.mode = mode || match.mode;
    if (detail) match.detail = detail;
    if (riotMatchId) match.riotMatchId = riotMatchId;

    await order.save();

    return NextResponse.json({ success: true, match_history: order.match_history, details: order.details });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId');

    await dbConnect();
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (session.user.role !== 'ADMIN' && order.boosterId?.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.match_history) {
      (order.match_history as any).pull({ _id: matchId });
    }
    await order.save();

    return NextResponse.json({ success: true, match_history: order.match_history, details: order.details });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}