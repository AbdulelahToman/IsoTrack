import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the development cache separate from production build artifacts.
  // This prevents a concurrent `next build` from invalidating the dev server.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
