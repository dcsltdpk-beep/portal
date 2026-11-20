import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  experimental: {
    staleTimes: {
      dynamic: 120, // Keep pre-rendered pages in client router cache for 2 minutes
      static: 300,
    },
  },
};

export default nextConfig;
