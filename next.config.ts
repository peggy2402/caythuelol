import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["mongoose", "ws"],

  images: {
    remotePatterns: [
      // Google avatar
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },

      // UI avatar generator
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },

      // MetaSRC (rank icons)
      {
        protocol: "https",
        hostname: "metasrc.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.metasrc.com",
        pathname: "/**",
      },

      // Riot Data Dragon (champion / rank icons)
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/**",
      },

      // Deeplol CDN
      {
        protocol: "https",
        hostname: "b2c-api-cdn.deeplol.gg",
        pathname: "/**",
      },

      // SEPAY QR
      {
        protocol: "https",
        hostname: "qr.sepay.vn",
        pathname: "/**",
      },

      // Bing
      {
        protocol: "https",
        hostname: "th.bing.com",
        pathname: "/**",
      },

      // Imgur
      {
        protocol: "https",
        hostname: "i.imgur.com",
        pathname: "/**",
      },

      // Discord CDN
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },

      // GitHub avatars
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },

      // Twitter / X images
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/**",
      },
      // Bing 
      {
        protocol: "https",
        hostname: "www.bing.com",
        pathname: "/**",
      },
    ],
    
    domains: [
      "images.unsplash.com",
      "i.imgur.com",
      "cdn.discordapp.com",
      "res.cloudinary.com"
    ]
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;