import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Disable static export prerendering — all pages render at request time
  // This also avoids build-time Supabase URL validation errors
  output: 'standalone',
};

export default nextConfig;
