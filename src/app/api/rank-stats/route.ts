import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import RankHistory from '@/models/RankHistory';

export async function GET() {
  try {
    await dbConnect();

    const API_URL = 'https://b2c-api-cdn.deeplol.gg/summoner/summoner_rank?platform_id=VN2&lane=All';
    let allData: any[] = [];
    
    // OPTIMIZATION: Fetch song song 10 trang đầu (Top 1000 players) thay vì tuần tự
    // Challenger ~300, GM ~700 -> 1000 là đủ bao phủ Cut-off
    const PAGES_TO_FETCH = 50;
    const pageNumbers = Array.from({ length: PAGES_TO_FETCH }, (_, i) => i + 1);

    const responses = await Promise.all(
      pageNumbers.map(async (page) => {
        try {
          const res = await fetch(`${API_URL}&page=${page}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            next: { revalidate: 300 } 
          });
          if (!res.ok) return [];
          const json = await res.json();
          return Array.isArray(json.summoner_rank_list) ? json.summoner_rank_list : [];
        } catch (e) {
          console.error(`Fetch error page ${page}`, e);
          return [];
        }
      })
    );

    // Gộp dữ liệu từ tất cả các trang
    allData = responses.flat();

    // 2. Process Data
    const challengers = allData.filter((p: any) => p.tier === 'CHALLENGER');
    const grandmasters = allData.filter((p: any) => p.tier === 'GRANDMASTER');

    // Tính Cut-off (Min LP)
    const chalCutoff = challengers.length > 0 
      ? Math.min(...challengers.map((p: any) => p.lp)) 
      : 0;
    
    const gmCutoff = grandmasters.length > 0 
      ? Math.min(...grandmasters.map((p: any) => p.lp)) 
      : 0;

    // 3. Lưu & Lấy lịch sử (Bọc try/catch để không crash nếu lỗi DB)
    let history: any[] = [];
    try {
      const today = new Date().toISOString().split('T')[0];
      if (chalCutoff > 0 && gmCutoff > 0) {
        await RankHistory.findOneAndUpdate(
          { date: today },
          { challengerCutoff: chalCutoff, grandmasterCutoff: gmCutoff },
          { upsert: true, new: true }
        );
      }
      history = await RankHistory.find().sort({ date: -1 }).limit(7).lean();
    } catch (dbError) {
      console.error('Database Error (RankHistory):', dbError);
      // Vẫn tiếp tục trả về dữ liệu hiện tại dù không lưu được lịch sử
    }

    return NextResponse.json({
      challenger: { cutoff: chalCutoff, count: challengers.length },
      grandmaster: { cutoff: gmCutoff, count: grandmasters.length },
      history: Array.isArray(history) ? history.reverse() : []
    });

  } catch (error) {
    console.error('Rank Stats Proxy Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch rank stats', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
