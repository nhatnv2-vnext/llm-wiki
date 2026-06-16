import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { deleteConversation, getConversation } from "@/lib/chat-db";

/**
 * GET    /api/conversations/[id]  → 1 hội thoại kèm messages (của user)
 * DELETE /api/conversations/[id]  → xoá hội thoại (của user)
 *
 * Trong Next 16, `params` là Promise. Lọc theo email session; 401 nếu chưa
 * đăng nhập, 404 nếu hội thoại không tồn tại / không thuộc user.
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const conversation = getConversation(session.email, id);
  if (!conversation) {
    return NextResponse.json({ error: "Không tìm thấy hội thoại." }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function DELETE(_request: Request, { params }: Params): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  deleteConversation(session.email, id);
  return NextResponse.json({ ok: true });
}
