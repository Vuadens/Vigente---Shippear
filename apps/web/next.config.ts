import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vigente/schema", "@vigente/matcher", "@vigente/db"],
};

export default nextConfig;
