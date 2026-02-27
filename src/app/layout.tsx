import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import LanguageProvider from "@/components/LanguageProvider";
import CookieConsent from "@/components/CookieConsent";
import { Toaster } from "sonner";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.zentramart.site"),
  title: {
    default: "CÀY THUÊ LOL - Dịch vụ cày thuê Liên Minh Huyền Thoại chuyên nghiệp số 1 Việt Nam",
    template: "%s | CÀY THUÊ LOL",
  },
  description: "Hệ thống cày thuê Liên Minh Huyền Thoại chuyên nghiệp số 1 Việt Nam. An toàn, bảo mật, và nhanh chóng với đội ngũ Thách Đấu.",
  keywords: ["cày thuê lol", "cày thuê liên minh", "boost rank lol", "leo rank thần tốc", "cày thuê uy tín", "dịch vụ cày thuê", "lol boosting"],
  authors: [{ name: "CAYTHUELOL Team" }],
  creator: "CAYTHUELOL",
  openGraph: {
    title: "CÀY THUÊ LOL - Dịch vụ cày thuê Liên Minh Huyền Thoại chuyên nghiệp số 1 Việt Nam",
    description: "Hệ thống cày thuê Liên Minh Huyền Thoại chuyên nghiệp số 1 Việt Nam. An toàn, bảo mật, và nhanh chóng với đội ngũ Thách Đấu.",
    url: "/",
    siteName: "CÀY THUÊ LOL",
    images: [
      {
        url: "/og-image.png", // Bạn cần thêm file ảnh này vào thư mục public
        width: 1200,
        height: 630,
        alt: "CÀY THUÊ LOL Banner",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CÀY THUÊ LOL - Dịch vụ cày thuê Liên Minh Huyền Thoại chuyên nghiệp số 1 Việt Nam",
    description: "Hệ thống cày thuê Liên Minh Huyền Thoại chuyên nghiệp số 1 Việt Nam. An toàn, bảo mật, và nhanh chóng với đội ngũ Thách Đấu.",
    images: ["/og-image.png"],
    creator: "@caythuelol",
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
          {children}
          <CookieConsent />
          <Toaster position="top-center" richColors theme="dark" />
        </LanguageProvider>
      </body>
    </html>
  );
}
