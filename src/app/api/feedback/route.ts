import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
    try {
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
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}