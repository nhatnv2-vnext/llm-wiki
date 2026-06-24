import type { NextConfig } from "next";
import path from "path";

/**
 * Security headers — lớp phòng thủ chiều sâu (XSS đã chặn ở tầng render Markdown,
 * đây là backup). Áp cho mọi route.
 *
 * CSP: script/style cần 'unsafe-inline' vì Next.js App Router inject inline
 * script (hydration) + Tailwind/Mermaid inject inline style. connect-src mở cho
 * Google API (embeddings/chat gọi từ server, nhưng useChat stream qua self).
 * Siết chặt hơn (nonce) là việc về sau nếu cần.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://generativelanguage.googleapis.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // @lancedb/lancedb có native addon (.node) không bundle được vào ESM chunk;
  // node:sqlite là built-in experimental — cả hai giữ nguyên require ở runtime
  // thay vì để Turbopack bundle.
  serverExternalPackages: ["@lancedb/lancedb", "node:sqlite"],
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
