import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel handles Next.js output natively — standalone is for self-hosting only */
  allowedDevOrigins: ["192.168.1.246"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
