import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Required for Prisma to work in serverless
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
