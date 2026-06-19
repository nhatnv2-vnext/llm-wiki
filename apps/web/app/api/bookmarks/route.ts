import { NextResponse } from "next/server";

import { listBookmarks, toggleBookmark } from "@/lib/chat-db";
import { getSession } from "@/lib/session";

/**
 * GET  /api/bookmarks            → { bookmarks: Bookmark[] } của user
 * POST /api/bookmarks            → bật/tắt bookmark 1 trang wiki
 *
 * Body POST: { slug, title? }  → trả { bookmarked: boolean } sau toggle.
 * Mọi thao tác gắn với email trong session; chưa đăng nhập → 401.
 */

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const bookmarks = listBookmarks(session.email);
  return NextResponse.json({ bookmarks });
}

export async function POST(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body phải là JSON hợp lệ." }, { status: 400 });
  }

  const { slug, title } = (body ?? {}) as { slug?: unknown; title?: unknown };

  if (typeof slug !== "string" || slug === "") {
    return NextResponse.json({ error: "Thiếu slug." }, { status: 400 });
  }

  const bookmarked = toggleBookmark(
    session.email,
    slug,
    typeof title === "string" ? title : "",
  );

  return NextResponse.json({ bookmarked });
}
