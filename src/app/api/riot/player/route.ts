import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';

const SERVER_TO_PLATFORM: Record<string, string> = {
  'VN': 'VN2', 'KR': 'KR', 'JP': 'JP1', 'NA': 'NA1', 'EUW': 'EUW1', 'EUNE': 'EUN1', 'OC': 'OC1', 'BR': 'BR1', 'LAS': 'LA2', 'LAN': 'LA1', 'RU': 'RU', 'TR': 'TR1', 'PH': 'PH2', 'SG': 'SG2', 'TH': 'TH2', 'TW': 'TW2'
};

// Mapping cho Account-V1 API (Chỉ có AMERICAS, ASIA, EUROPE)
const PLATFORM_TO_ACCOUNT_REGION: Record<string, string> = {
  'VN2': 'asia', 'SG2': 'asia', 'PH2': 'asia', 'TH2': 'asia', 'TW2': 'asia',
  'KR': 'asia', 'JP1': 'asia',
  'NA1': 'americas', 'BR1': 'americas', 'LA1': 'americas', 'LA2': 'americas', 'OC1': 'americas',
  'EUW1': 'europe', 'EUN1': 'europe', 'TR1': 'europe', 'RU': 'europe'
};

export async function POST(req: Request) {
  try {
    const { server, name } = await req.json();
    if (!server || !name) return NextResponse.json({ error: 'Missing info' }, { status: 400 });

    await dbConnect();
    const setting = await SystemSetting.findOne({ key: 'riot_api_key' });
    const apiKey = setting?.value;
    if (!apiKey) return NextResponse.json({ error: 'System API Key missing' }, { status: 500 });

    const platformId = SERVER_TO_PLATFORM[server] || 'VN2';
    // Account API dùng Region rộng (asia, americas, europe)
    const accountRegion = PLATFORM_TO_ACCOUNT_REGION[platformId] || 'asia';

    // 1. Get PUUID
    // Name format: Name#Tag or Name (default tag based on server if missing)
    let gameName = name;
    let tagLine = platformId === 'VN2' ? 'VN2' : 'RIOT'; 
    
    if (name.includes('#')) {
        const parts = name.split('#');
        gameName = parts[0];
        tagLine = parts[1];
    }

    const accountUrl = `https://${accountRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`;
    const accountRes = await fetch(accountUrl);
    if (!accountRes.ok) return NextResponse.json({ error: 'Không tìm thấy Player này!' }, { status: 404 });
    const accountData = await accountRes.json();

    // 2. Get League Info
    // League API dùng Platform ID cụ thể (vn2, kr, na1...)
    const leagueUrl = `https://${platformId.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${accountData.puuid}?api_key=${apiKey}`;
    const leagueRes = await fetch(leagueUrl);
    const leagues = await leagueRes.json();

    // Return all leagues, frontend will filter
    return NextResponse.json({ success: true, leagues, puuid: accountData.puuid });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}