/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const nextConfig = {
  reactStrictMode: true,
  // Allow <img> for certificate thumbnails / map exports without extra config
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_API_BASE_URL: API_BASE,
  },
  async headers() {
    return [
      {
        // The app is no longer embedded in an iframe (plan Phase 2.3)
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
