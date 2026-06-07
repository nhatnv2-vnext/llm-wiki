import fs from "node:fs";
import path from "node:path";

/**
 * Nạp biến môi trường từ file `.env.local` ở ROOT monorepo (../../.env.local
 * tính từ apps/web) vào process.env.
 *
 * Lý do: dự án khai báo env ở MỘT nơi duy nhất — My_Project_Vault/.env.local.
 * Next.js chỉ tự nạp `.env*` trong cwd của app (apps/web), nên cần nạp thủ công
 * root env để Route Handler / Server Component thấy được GOOGLE_API_KEY...
 *
 * Quy tắc: KHÔNG ghi đè biến đã tồn tại trong process.env. Nhờ vậy khi chạy
 * trong Docker (compose `env_file` đã bơm biến sẵn) hàm này là no-op an toàn.
 *
 * Idempotent: gọi nhiều lần chỉ đọc file một lần.
 */

let loaded = false;

export function loadRootEnv(): void {
  if (loaded) return;
  loaded = true;

  // Next.js chạy với cwd = apps/web. Root monorepo là 2 cấp lên.
  // Dùng cwd thay vì __dirname vì bundler (Turbopack) đặt module ở .next/...,
  // khiến __dirname không còn trỏ tới apps/web/lib.
  // Thử vài ứng viên để an toàn dù chạy từ root hay từ apps/web.
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, "..", "..", ".env.local"), // cwd = apps/web
    path.resolve(cwd, ".env.local"), // cwd = root monorepo
  ];

  let raw: string | undefined;
  for (const candidate of candidates) {
    try {
      raw = fs.readFileSync(candidate, "utf-8");
      break;
    } catch {
      // thử ứng viên tiếp theo
    }
  }
  if (raw === undefined) {
    return; // không có file (vd trong Docker) → dựa vào process.env sẵn có
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // bỏ nháy bao quanh nếu có
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) process.env[key] = val;
  }
}
