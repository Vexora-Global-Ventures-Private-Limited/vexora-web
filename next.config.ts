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
  // Baseline security headers. No framing (stops clickjacking on one-click
  // actions); no full Content-Security-Policy yet — it needs browser testing
  // against Next.js inline scripts first.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
  reactStrictMode: false,
};

export default nextConfig;
