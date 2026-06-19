import "server-only";

import bcrypt from "bcryptjs";

import { loadRootEnv } from "@/lib/load-root-env";

/**
 * Xác thực người dùng dựa trên danh sách user khai báo trong biến môi trường.
 *
 * Định dạng AUTH_USERS (một nơi duy nhất: .env.local ở root):
 *   AUTH_USERS="email1:bcryptHash1,email2:bcryptHash2"
 *
 * - Mỗi user là cặp `email:hash`, các user cách nhau bằng dấu phẩy.
 * - `hash` là bcrypt hash của mật khẩu (sinh bằng `npm run hash-password`).
 * - Email so khớp không phân biệt hoa/thường.
 *
 * KHÔNG lưu mật khẩu dạng plaintext — chỉ lưu hash.
 */

loadRootEnv();

interface UserRecord {
  email: string;
  hash: string;
}

/** Parse AUTH_USERS thành map email(lowercase) → hash. Cache sau lần đầu. */
let cachedUsers: Map<string, string> | null = null;

function getUsers(): Map<string, string> {
  if (cachedUsers) return cachedUsers;

  const raw = process.env.AUTH_USERS?.trim();
  if (!raw) {
    throw new Error(
      "Thiếu biến môi trường AUTH_USERS. Khai báo danh sách user dạng " +
        '`email:bcryptHash` cách nhau bằng dấu phẩy trong .env.local. ' +
        "Sinh hash bằng: `cd apps/web && npm run hash-password`.",
    );
  }

  const map = new Map<string, string>();
  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    // Hash bcrypt chứa nhiều dấu ":" KHÔNG xảy ra, nhưng email không chứa ":".
    // Tách ở dấu ":" ĐẦU TIÊN để phần còn lại là hash nguyên vẹn.
    const sep = trimmed.indexOf(":");
    if (sep === -1) continue;
    const email = trimmed.slice(0, sep).trim().toLowerCase();
    const hash = trimmed.slice(sep + 1).trim();
    if (email && hash) map.set(email, hash);
  }

  if (map.size === 0) {
    throw new Error(
      "AUTH_USERS không có user hợp lệ. Mỗi user phải có dạng `email:hash`.",
    );
  }

  cachedUsers = map;
  return map;
}

/**
 * Kiểm tra email + password. Trả về email chuẩn hóa (lowercase) nếu hợp lệ,
 * null nếu sai. So sánh hash bằng bcrypt (an toàn với timing).
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const users = getUsers();
  const hash = users.get(normalized);

  if (!hash) {
    // Vẫn chạy bcrypt.compare với hash giả để giảm rò rỉ thời gian
    // (timing attack) khi email không tồn tại.
    await bcrypt.compare(password, "$2b$10$invalidinvalidinvalidinvalidinv");
    return null;
  }

  const ok = await bcrypt.compare(password, hash);
  return ok ? normalized : null;
}

export type { UserRecord };
