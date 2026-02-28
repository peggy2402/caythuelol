import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Fetch từ Riot với Cache (Revalidate mỗi 24h)
    const res = await fetch('https://ddragon.leagueoflegends.com/cdn/14.4.1/data/en_US/champion.json', {
      next: { revalidate: 86400 } 
    });

    if (!res.ok) {
      throw new Error('Failed to fetch from DataDragon');
    }

    const data = await res.json();
    
    // 2. Map dữ liệu gọn nhẹ (Chỉ lấy tên và ảnh)
    const champions = Object.values(data.data).map((item: any) => ({
      id: item.id,
      name: item.name,
      imageUrl: `https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion/${item.image.full}`,
      tags: item.tags,
      info: item.info,
      partype: item.partype,
      stats: item.stats,
    }));

    return NextResponse.json(champions);
  } catch (error) {
    console.error('Champion API Error:', error);
    return NextResponse.json({ error: 'Failed to load champions' }, { status: 500 });
  }
}
