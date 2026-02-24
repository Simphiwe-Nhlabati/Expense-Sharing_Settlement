import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bun global variables
  env: {
    BUN_VERSION: "1.3.9",
  },
  // Use Bun runtime for server-side rendering
  experimental: {
    // Enable Bun runtime (Next.js 14+)
    // Bun is compatible with Node.js runtime
  },
};

export default nextConfig;
