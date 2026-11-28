import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LEORANK - Cày Thuê Game & Boost Rank Chuyên Nghiệp Số 1 Việt Nam';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#05070c',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(6, 182, 212, 0.25) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(245, 158, 11, 0.2) 0%, transparent 50%)',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4)',
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              LR
            </div>
            <span
              style={{
                fontSize: '36px',
                fontWeight: 900,
                letterSpacing: '-1px',
                color: '#ffffff',
              }}
            >
              LEO<span style={{ color: '#06b6d4' }}>RANK</span>
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 22px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              border: '1.5px solid rgba(6, 182, 212, 0.4)',
              color: '#38bdf8',
              fontSize: '18px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            ★ 100% ESCROW HOLD
          </div>
        </div>

        {/* Center Hero Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '1000px',
            gap: '18px',
          }}
        >
          <h1
            style={{
              fontSize: '54px',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.18,
              margin: 0,
              letterSpacing: '-1.5px',
            }}
          >
            Cày Thuê Game & Kéo Rank Chuyên Nghiệp #1 Việt Nam
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Liên Quân Mobile • LMHT • Valorant • Tốc Chiến • ĐTCL (TFT) • CS2
          </p>
        </div>

        {/* Bottom Trust Metrics */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            width: '100%',
            padding: '24px 32px',
            borderRadius: '24px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#38bdf8' }}>25.000+</span>
            <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 600 }}>Khách hàng tin tưởng</span>
          </div>
          <div style={{ width: '1px', height: '36px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#34d399' }}>4.9 / 5.0</span>
            <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 600 }}>Đánh giá Reviews.io</span>
          </div>
          <div style={{ width: '1px', height: '36px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#fbbf24' }}>0% Ban Rate</span>
            <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 600 }}>Ảo hóa VPN an toàn tuyệt đối</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
