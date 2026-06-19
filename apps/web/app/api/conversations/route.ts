import { NextResponse } from "next/server";
import type { UIMessage } from "ai";

import { getSession } from "@/lib/session";
import { listConversations, upsertConversation } from "@/lib/chat-db";

/**
 * GET  /api/conversations        → danh sách hội thoại của user (không kèm messages)
 * POST /api/conversations        → upsert { id, title, messages }
 *
 * Mọi thao tác lọc theo email trong session; chưa đăng nhập → 401.
 */

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const conversations = listConversations(session.email);
  return NextResponse.json({ conversations });
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

  const { id, title, messages } = (body ?? {}) as {
    id?: unknown;
    title?: unknown;
    messages?: unknown;
  };

  if (typeof id !== "string" || id.trim() === "") {
    return NextResponse.json(
      { error: 'Thiếu hoặc sai trường "id".' },
      { status: 400 },
    );
  }
  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { error: 'Trường "messages" phải là mảng.' },
      { status: 400 },
    );
  }

  upsertConversation(
    session.email,
    id,
    typeof title === "string" ? title : "",
    messages as UIMessage[],
  );

  return NextResponse.json({ ok: true });
}
