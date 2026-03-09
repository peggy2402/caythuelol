import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';

const SERVER_TO_PLATFORM: Record<string, string> = {
  'VN': 'VN2', 'KR': 'KR', 'JP': 'JP1', 'NA': 'NA1', 'EUW': 'EUW1', 'EUNE': 'EUN1', 'OC': 'OC1', 'BR': 'BR1', 'LAS': 'LA2', 'LAN': 'LA1', 'RU': 'RU', 'TR': 'TR1', 'PH': 'PH2', 'SG': 'SG2', 'TH': 'TH2', 'TW': 'TW2'
};

const PLATFORM_TO_REGION: Record<string, string> = {
  'VN2': 'sea', 'SG2': 'sea', 'PH2': 'sea', 'TH2': 'sea', 'TW2': 'sea', 'OC1': 'sea',
  'KR': 'asia', 'JP1': 'asia',
  'NA1': 'americas', 'BR1': 'americas', 'LA1': 'americas', 'LA2': 'americas',
  'EUW1': 'europe', 'EUN1': 'europe', 'TR1': 'europe', 'RU': 'europe'
};

export async function POST(req: Request) {
  try {
    const { matchId, server, targetName } = await req.json();
    if (!matchId) return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });

    await dbConnect();
    const setting = await SystemSetting.findOne({ key: 'riot_api_key' });
    const apiKey = setting?.value;

    if (!apiKey) return NextResponse.json({ error: 'Bạn chờ chút nhé! Đợi hệ thống cập nhật.' }, { status: 500 });

    // 1. Xác định Platform và Region
    let platformId = 'VN2'; // Default
    if (server && SERVER_TO_PLATFORM[server]) {
        platformId = SERVER_TO_PLATFORM[server];
    } else if (matchId.includes('_')) {
        platformId = matchId.split('_')[0];
    }

    const region = PLATFORM_TO_REGION[platformId] || 'sea';
    
    // 2. Format Match ID (Nếu chỉ nhập số -> thêm prefix)
    const formattedMatchId = matchId.includes('_') ? matchId : `${platformId}_${matchId}`;

    // 3. Fetch Match Details (Match V5)
    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${formattedMatchId}?api_key=${apiKey}`;
    const res = await fetch(url);
    
    if (!res.ok) return NextResponse.json({ error: 'Vui lòng điền đúng ID trận đấu Đơn/đôi hoặc Linh hoạt' }, { status: res.status });

    const data = await res.json();

    // 4. Fetch Current Rank/LP (League V4)
    let leagueInfo = null;
    let participant = null;

    if (targetName && data.info?.participants) {
        // Tìm người chơi trong match
        const cleanTarget = targetName.toLowerCase().replace(/\s/g, '').replace('#', '');
        
        participant = data.info.participants.find((p: any) => {
            const pName = (p.riotIdGameName || '').toLowerCase().replace(/\s/g, '');
            const pTag = (p.riotIdTagline || '').toLowerCase();
            const fullName = pName + pTag;
            
            // So sánh tương đối
            return fullName.includes(cleanTarget) || cleanTarget.includes(pName);
        });

        if (participant && participant.puuid) {
            // Gọi League V4 bằng PUUID
            const leagueUrl = `https://${platformId.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${participant.puuid}?api_key=${apiKey}`;
            const leagueRes = await fetch(leagueUrl);
            
            if (leagueRes.ok) {
                const leagues = await leagueRes.json();
                // Lấy Rank Solo/Duo hoặc Flex tùy match
                const queueType = data.info.queueId === 440 ? 'RANKED_FLEX_SR' : 'RANKED_SOLO_5x5';
                leagueInfo = leagues.find((l: any) => l.queueType === queueType);
            }
        }
    }

    return NextResponse.json({ 
        success: true, 
        match: data,
        leagueInfo: leagueInfo, // Trả về Rank + LP hiện tại
        participant: participant ? {
            championName: participant.championName,
            win: participant.win,
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists
        } : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}