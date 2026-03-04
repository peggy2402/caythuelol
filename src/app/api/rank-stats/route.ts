import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import RankHistory from '@/models/RankHistory';

export async function GET() {
  try {
    await dbConnect();

    const API_URL = 'https://b2c-api-cdn.deeplol.gg/summoner/summoner_rank?platform_id=VN2&lane=All';
    let allData: any[] = [];
    
    // LOGIC CHUẨN: Fetch đủ 10 trang để lấy đúng số lượng Players (Count)
    // Nhưng Cut-off sẽ được trích xuất riêng từ Page 3 và Page 10
    const pageNumbers = Array.from({ length: 10 }, (_, i) => i + 1);

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

    // 2. Process Data: Tính Count từ TOÀN BỘ dữ liệu (10 trang)
    const challengers = allData.filter((p: any) => p.tier === 'CHALLENGER');
    const grandmasters = allData.filter((p: any) => p.tier === 'GRANDMASTER');

    // 3. Tính Cut-off: Chỉ lấy từ Page 3 (index 2) và Page 10 (index 9) theo yêu cầu
    const page3Data = responses[2] || []; // Dữ liệu trang 3
    const page10Data = responses[9] || []; // Dữ liệu trang 10

    // Lọc Challenger trong Page 3 để tìm Cut-off Thách Đấu
    const page3Challengers = page3Data.filter((p: any) => p.tier === 'CHALLENGER');
    const chalCutoff = page3Challengers.length > 0 
      ? Math.min(...page3Challengers.map((p: any) => p.lp)) 
      : 0;
    
    // Lọc Grandmaster trong Page 10 để tìm Cut-off Đại Cao Thủ
    const page10Grandmasters = page10Data.filter((p: any) => p.tier === 'GRANDMASTER');
    const gmCutoff = page10Grandmasters.length > 0 
      ? Math.min(...page10Grandmasters.map((p: any) => p.lp)) 
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
