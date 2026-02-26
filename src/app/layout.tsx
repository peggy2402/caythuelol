import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CÀY THUÊ LOL - Dịch vụ cày thuê Liên Minh Huyền Thoại chuyên nghiệp số 1 Việt Nam",
  description: "Hệ thống cày thuê Liên Minh Huyền Thoại chuyên nghiệp số 1 Việt Nam. An toàn, bảo mật, và nhanh chóng với đội ngũ Thách Đấu.",
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
        {children}
      </body>
    </html>
  );
}
