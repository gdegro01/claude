import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/spin-app",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
