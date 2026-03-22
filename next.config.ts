import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_PUBLIC_BASE_PATH is baked in at Docker build time.
  // Locally it is unset → app runs at root (/).
  // In production it is /life-game → app runs under bogdan-vaduva.com/life-game.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  output: "standalone",
};

export default nextConfig;
