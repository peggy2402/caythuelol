import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "metasrc.com",
      },
      {
        protocol: "https",
        hostname: "img.metasrc.com",
      },
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
      },
    ],
  },
  // Ensure we don't have any experimental flags that might cause cache issues
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
