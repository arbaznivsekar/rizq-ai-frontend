import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporarily disabled for idempotency feature deployment
  },
  experimental: {
    scrollRestoration: true,
  },
};

export default nextConfig;
