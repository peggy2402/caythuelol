import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import LanguageProvider from "@/components/LanguageProvider";
import CookieConsent from "@/components/CookieConsent";
import LiveActivityToast from "@/components/LiveActivityToast";
import { ChatProvider } from "@/contexts/ChatContext"; // Import ChatProvider
import ApiInterceptor from "@/components/ApiInterceptor";
import { Toaster } from "sonner";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.leorank.site"),
  title: {
    default: "LEORANK - Cày Thuê Game & Cày Thuê Liên Quân Giá Rẻ, LMHT, Valorant Uy Tín #1",
    template: "%s | LEORANK",
  },
  description: "Hệ thống cày thuê game uy tín số 1 Việt Nam. Chuyên cày thuê liên quân giá rẻ, cày thuê liên minh LMHT, Valorant, Tốc Chiến, ĐTCL. Cam kết an toàn 100%, bảo mật IP VPN, giữ tiền bảo chứng qua Escrow.",
  keywords: [
    "leorank",
    "leo rank",
    "cày rank",
    "cày thuê",
    "cày thuê liên quân",
    "cày thuê liên quân giá rẻ",
    "cày thuê liên minh",
    "cày thuê lol",
    "cày thuê uy tín",
    "kéo rank",
    "kéo rank liên quân",
    "cày thuê tốc chiến",
    "cày thuê valorant",
    "cày thuê tft",
    "dịch vụ cày thuê giá rẻ",
    "bảng giá cày thuê",
    "cày sao liên quân",
    "thuê booster",
    "game boosting",
  ],
  authors: [{ name: "LEORANK Team" }],
  creator: "LEORANK",
  alternates: {
    canonical: "https://www.leorank.site",
  },
  openGraph: {
    title: "LEORANK - Cày Thuê Game & Cày Thuê Liên Quân Giá Rẻ, LMHT, Valorant Uy Tín #1",
    description: "Hệ thống cày thuê game uy tín số 1 Việt Nam. Chuyên cày thuê liên quân giá rẻ, cày thuê liên minh LMHT, Valorant, Tốc Chiến. An toàn 100% với cơ chế Escrow bảo vệ người dùng.",
    url: "https://www.leorank.site",
    siteName: "LEORANK",
    images: [
      {
        url: "https://www.leorank.site/og-image.png",
        secureUrl: "https://www.leorank.site/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "LEORANK - Hệ thống cày thuê game & boost rank chuyên nghiệp số 1 Việt Nam",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LEORANK - Cày Thuê Game & Cày Thuê Liên Quân Giá Rẻ, LMHT, Valorant Uy Tín #1",
    description: "Hệ thống cày thuê game uy tín số 1 Việt Nam. Chuyên cày thuê liên quân giá rẻ, cày thuê liên minh LMHT, Valorant. 100% Escrow Hold bảo vệ quyền lợi.",
    images: ["https://www.leorank.site/og-image.png"],
    creator: "@leorank",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="overflow-x-clip" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://www.leorank.site" />
        <link rel="image_src" href="https://www.leorank.site/og-image.png" />
        {/* Google Tag Manager (GTM) */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtm.js?id=GTM-NLQN7HBR"
        />
        <Script
          id="gtm-datalayer-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://www.leorank.site/#organization",
                  "name": "LeoRank",
                  "url": "https://www.leorank.site",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.leorank.site/og-image.png",
                    "width": 1200,
                    "height": 630
                  },
                  "description": "Hệ thống cày thuê game và kéo rank uy tín số 1 Việt Nam: LMHT, Liên Quân Mobile, Valorant, Tốc Chiến, ĐTCL, FC Online.",
                  "email": "contact@leorank.site"
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.leorank.site/#website",
                  "url": "https://www.leorank.site",
                  "name": "LeoRank - Dịch Vụ Cày Thuê Game Uy Tín",
                  "publisher": {
                    "@id": "https://www.leorank.site/#organization"
                  },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.leorank.site/boosters?search={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "Service",
                  "name": "Dịch vụ cày thuê & kéo rank game chuyên nghiệp",
                  "provider": {
                    "@id": "https://www.leorank.site/#organization"
                  },
                  "areaServed": "VN",
                  "serviceType": "Game Boosting",
                  "offers": {
                    "@type": "AggregateOffer",
                    "priceCurrency": "VND",
                    "lowPrice": "10000",
                    "highPrice": "5000000"
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "reviewCount": "25000",
                    "bestRating": "5",
                    "worstRating": "1"
                  }
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Tài khoản của tôi có bị khóa khi cày thuê không?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "LeoRank áp dụng 100% công nghệ ảo hóa VPN định tuyến theo vị trí máy chủ của bạn và bật chế độ Offline trong game. Booster không chat, không troll game, đảm bảo an toàn tài khoản tối đa."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Cơ chế ký quỹ Escrow bảo vệ tôi như thế nào?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Khoản tiền của bạn sẽ được giữ an toàn tại tài khoản Escrow của hệ thống. Booster chỉ được thanh toán sau khi bạn đăng nhập xác nhận đúng mức rank cam kết và hài lòng."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Tôi có thể chơi Duo với Booster mà không cần đưa tài khoản không?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Hoàn toàn được! Bạn chỉ cần chọn tùy chọn 'Chơi cùng Booster (Duo)' khi đặt đơn. Booster sẽ kết bạn trong game và cùng bạn leo rank mà bạn không cần phải chia sẻ mật khẩu."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Nếu Booster không đạt mức rank mong muốn thì sao?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Hệ thống tự động tính toán đối soát: hoàn lại 100% tiền cọc cho các mốc chưa hoàn thành, đồng thời hỗ trợ đổi booster khác hoặc hoàn tiền về ví ngay lập tức kèm bồi thường."
                      }
                    }
                  ]
                }
              ]
            })
          }}
        />
        {process.env.NODE_ENV !== 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  const _err = console.error;
                  console.error = function() {
                    for (let i = 0; i < arguments.length; i++) {
                      const a = arguments[i];
                      if (typeof a === 'string' && a.indexOf('bis_skin_checked') !== -1) {
                        return;
                      }
                    }
                    return _err.apply(console, arguments);
                  };
                })();
              `,
            }}
          />
        )}
      </head>
      <body
        className={`${beVietnamPro.variable} font-sans antialiased bg-zinc-950 text-white w-full max-w-full overflow-x-clip`}
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript fallback) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NLQN7HBR"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <ApiInterceptor />
        <LanguageProvider>
          <ChatProvider>
            {children}
            <LiveActivityToast />
            <CookieConsent />
            <Toaster
              position="top-center"
              richColors
              theme="dark"
              closeButton
              toastOptions={{
                classNames: {
                  toast: '!rounded-2xl !backdrop-blur-xl !border !shadow-[0_20px_50px_rgba(0,0,0,0.8)] font-sans !py-3.5 !px-4',
                  title: '!font-bold !text-sm !tracking-tight text-white',
                  description: '!text-xs !leading-relaxed !opacity-95 text-zinc-300 mt-1',
                  actionButton: '!rounded-full !text-xs !font-black !px-4 !py-2 !transition-all hover:!scale-105 active:!scale-95 cursor-pointer !bg-white !text-emerald-950 !shadow-xl hover:!bg-zinc-100 !border-0',
                  closeButton: '!border-zinc-800 !bg-zinc-900/90 hover:!bg-zinc-800 text-zinc-400 hover:text-white',
                },
              }}
            />
          </ChatProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
