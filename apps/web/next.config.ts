import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // @lancedb/lancedb có native addon (.node) không bundle được vào ESM chunk;
  // giữ nguyên dạng require ở runtime thay vì để Turbopack bundle.
  serverExternalPackages: ["@lancedb/lancedb"],
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
};

export default nextConfig;
