import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import LanguageProvider from "@/components/LanguageProvider";
import CookieConsent from "@/components/CookieConsent";
import { ChatProvider } from "@/contexts/ChatContext"; // Import ChatProvider
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
    default: "LEORANK - Hệ thống cày thuê game & boost rank chuyên nghiệp số 1 Việt Nam",
    template: "%s | LEORANK",
  },
  description: "Hệ thống cày thuê game chuyên nghiệp, uy tín số 1 Việt Nam. Cung cấp dịch vụ cày thuê, kéo rank tất cả các tựa game hot: LMHT, Liên Quân Mobile, Valorant, Tốc Chiến, Đấu Trường Chân Lý (TFT), CS2... Nhanh chóng, bảo mật tuyệt đối với đội ngũ booster hàng đầu.",
  keywords: [
    "cày thuê game",
    "dịch vụ cày thuê game",
    "hệ thống cày thuê",
    "boost rank",
    "leorank",
    "leo rank",
    "cày thuê lol",
    "cày thuê liên minh",
    "cày thuê liên quân",
    "cày thuê valorant",
    "cày thuê tốc chiến",
    "cày thuê tft",
    "cày thuê cs2",
    "game boosting",
    "cày thuê uy tín",
    "thuê booster",
    "kéo rank game",
  ],
  authors: [{ name: "LEORANK Team" }],
  creator: "LEORANK",
  openGraph: {
    title: "LEORANK - Hệ thống cày thuê game & boost rank chuyên nghiệp số 1 Việt Nam",
    description: "Hệ thống cày thuê game chuyên nghiệp, uy tín số 1 Việt Nam. Cung cấp dịch vụ cày thuê, kéo rank tất cả các tựa game hot: LMHT, Liên Quân Mobile, Valorant, Tốc Chiến, Đấu Trường Chân Lý (TFT), CS2... Nhanh chóng, bảo mật tuyệt đối với đội ngũ booster hàng đầu.",
    url: "/",
    siteName: "LEORANK",
    images: [
      {
        url: "/og-image.png", // Bạn cần thêm file ảnh này vào thư mục public
        width: 1200,
        height: 630,
        alt: "LEORANK Banner",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LEORANK - Hệ thống cày thuê game & boost rank chuyên nghiệp số 1 Việt Nam",
    description: "Hệ thống cày thuê game chuyên nghiệp, uy tín số 1 Việt Nam. Cung cấp dịch vụ cày thuê, kéo rank tất cả các tựa game hot: LMHT, Liên Quân Mobile, Valorant, Tốc Chiến, Đấu Trường Chân Lý (TFT), CS2... Nhanh chóng, bảo mật tuyệt đối với đội ngũ booster hàng đầu.",
    images: ["/og-image.png"],
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
    <html lang="vi">
      <body
        className={`${beVietnamPro.variable} font-sans antialiased bg-zinc-950 text-white`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <ChatProvider>
            {children}
            <CookieConsent />
            <Toaster position="top-center" richColors theme="dark" />
          </ChatProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
