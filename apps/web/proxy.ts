import { NextResponse, type NextRequest } from "next/server";

import { decrypt } from "@/lib/session";

/**
 * Proxy (Next.js 16 — trước đây gọi là Middleware) bảo vệ TOÀN BỘ web.
 * Chạy trước mọi request không thuộc static asset (xem `config.matcher`).
 *
 * - Chưa đăng nhập + vào trang cần bảo vệ → chuyển hướng /login.
 * - Chưa đăng nhập + gọi API → trả 401 (không redirect, để client xử lý).
 * - Đã đăng nhập + mở /login → chuyển về trang chủ.
 *
 * Chỉ đọc session từ cookie (optimistic check) — không truy vấn DB, để nhanh.
 */

const PUBLIC_PATHS = ["/login"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isApi = pathname.startsWith("/api/");

  const token = req.cookies.get("session")?.value;
  const session = await decrypt(token);
  const isAuthed = Boolean(session?.email);

  // API: chưa đăng nhập → 401 JSON (không redirect HTML).
  if (isApi) {
    if (!isAuthed) {
      return NextResponse.json(
        { error: "Chưa đăng nhập." },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // Trang public (/login): nếu đã đăng nhập thì đưa về trang chủ.
  if (isPublic) {
    if (isAuthed) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Trang cần bảo vệ: chưa đăng nhập → /login.
  if (!isAuthed) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

/**
 * Bỏ qua static asset + file nội bộ Next. KHÁC doc mặc định: KHÔNG loại `api`,
 * vì ta muốn proxy chặn cả /api/chat, /api/search (tốn Gemini) khi chưa login.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$).*)",
  ],
};
