import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
};
export default nextConfig;
