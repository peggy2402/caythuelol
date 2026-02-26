import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
