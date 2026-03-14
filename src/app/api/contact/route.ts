import { NextRequest, NextResponse } from 'next/server';

// Lưu trữ tạm thời số lần request của từng IP (In-memory Rate Limiting)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 5 * 60 * 1000; // 5 phút
const MAX_REQUESTS = 3; // Tối đa 3 tin nhắn

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        
        const rateData = rateLimitMap.get(ip) || { count: 0, resetTime: now + WINDOW_MS };

        if (now > rateData.resetTime) {
            rateData.count = 0;
            rateData.resetTime = now + WINDOW_MS;
        }

        if (rateData.count >= MAX_REQUESTS) {
            return NextResponse.json({ error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau 5 phút!' }, { status: 429 });
        }

        const body = await req.json();
        const { name, email, message } = body;

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Vui lòng điền đầy đủ thông tin.' }, { status: 400 });
        }

        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookUrl) {
            return NextResponse.json({ error: 'Lỗi cấu hình server' }, { status: 500 });
        }

        const payload = {
            username: "Hệ thống Liên hệ",
            embeds: [{
                title: "📬 THƯ LIÊN HỆ MỚI",
                description: message,
                color: 3447003, // Màu xanh dương
                fields: [
                    { name: "Họ và tên", value: name, inline: true },
                    { name: "Email", value: email, inline: true },
                ],
                timestamp: new Date().toISOString(),
            }]
        };

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Gửi Webhook thất bại');
        
        rateData.count++;
        rateLimitMap.set(ip, rateData);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}