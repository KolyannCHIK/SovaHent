import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "hentasis1.top",
      },
      {
        protocol: "https",
        hostname: "hentasis1.top",
      },
    ],
  },
};

export default nextConfig;
