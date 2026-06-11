import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { loadRootEnv } from "@/lib/load-root-env";

/**
 * Quản lý phiên đăng nhập bằng JWT lưu trong cookie httpOnly.
 *
 * Pattern theo doc Next.js 16 (Stateless Sessions, jose). KHÔNG dùng được ở
 * Client Component — `server-only` chặn bundle ra client để không lộ secret.
 *
 * Session chỉ chứa dữ liệu tối thiểu (email người dùng), KHÔNG chứa mật khẩu.
 */

loadRootEnv();

const COOKIE_NAME = "session";
const SESSION_TTL_DAYS = 7;

function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "Thiếu hoặc SESSION_SECRET quá ngắn (cần >= 32 ký tự). " +
        "Hãy thêm SESSION_SECRET vào .env.local — sinh bằng: " +
        "`openssl rand -base64 32`.",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload extends JWTPayload {
  /** Email người dùng đã đăng nhập (định danh phiên). */
  email: string;
}

/** Ký JWT từ payload, hết hạn sau SESSION_TTL_DAYS ngày. */
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(getEncodedKey());
}

/** Giải mã + xác thực JWT. Trả về null nếu thiếu/sai/hết hạn. */
export async function decrypt(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    // Token hỏng, hết hạn, hoặc bị giả mạo → coi như chưa đăng nhập.
    return null;
  }
}

/** Tạo phiên mới: ký JWT và set cookie httpOnly. */
export async function createSession(email: string): Promise<void> {
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  const token = await encrypt({ email });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    // secure chỉ bật khi chạy production (HTTPS). Local dev (http) vẫn set được.
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

/** Đọc phiên hiện tại từ cookie (đã xác thực). Null nếu chưa đăng nhập. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(COOKIE_NAME)?.value);
}

/** Xóa phiên (đăng xuất). */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME };
