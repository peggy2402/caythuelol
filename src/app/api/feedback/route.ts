import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Lưu trữ tạm thời số lần request của từng IP (In-memory Rate Limiting)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 5 * 60 * 1000; // Thời gian chờ: 5 phút
const MAX_REQUESTS = 3; // Số lần tối đa: 3 lần gửi

export async function POST(req: NextRequest) {
    try {
        // 1. Lấy địa chỉ IP của người dùng
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        
        // Lấy thông tin rate limit hiện tại của IP này
        const rateData = rateLimitMap.get(ip) || { count: 0, resetTime: now + WINDOW_MS };

        // Nếu đã qua khoảng thời gian chờ, reset lại bộ đếm
        if (now > rateData.resetTime) {
            rateData.count = 0;
            rateData.resetTime = now + WINDOW_MS;
        }

        // Nếu số lần gọi vượt quá giới hạn -> Chặn
        if (rateData.count >= MAX_REQUESTS) {
            return NextResponse.json({ error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau 5 phút!' }, { status: 429 });
        }

        const body = await req.json();
        const { type, message } = body;

        if (!message) {
            return NextResponse.json({ error: 'Nội dung là bắt buộc' }, { status: 400 });
        }

        // Lấy URL Webhook từ biến môi trường (KHÔNG có NEXT_PUBLIC_)
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookUrl) {
            console.error("DISCORD_WEBHOOK_URL chưa được cấu hình");
            return NextResponse.json({ error: 'Lỗi cấu hình server' }, { status: 500 });
        }

        // Lấy thông tin người dùng nếu họ đã đăng nhập
        const session = await auth();
        const userInfo = session?.user ? `${session.user.username} (${session.user.email})` : 'Khách vãng lai (Chưa đăng nhập)';

        const payload = {
            username: "Hệ thống Feedback",
            embeds: [{
                title: type === 'BUG' ? "🐛 BÁO LỖI HỆ THỐNG" : "💡 GÓP Ý CẢI TIẾN",
                description: message,
                color: type === 'BUG' ? 16711680 : 16766720,
                fields: [{ name: "Người gửi", value: userInfo }],
                timestamp: new Date().toISOString(),
            }]
        };

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Gửi Webhook thất bại');
        
        // Tăng bộ đếm và lưu lại vào Map sau khi gửi thành công
        rateData.count++;
        rateLimitMap.set(ip, rateData);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}