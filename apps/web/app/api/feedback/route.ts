import { NextResponse } from "next/server";

import {
  getFeedbackForConversation,
  setFeedback,
  type FeedbackRating,
} from "@/lib/chat-db";
import { getSession } from "@/lib/session";

/**
 * GET  /api/feedback?conversationId=...  → { feedback: { [messageId]: rating } }
 * POST /api/feedback                     → ghi/toggle đánh giá 1 message
 *
 * Body POST: { conversationId, messageId, rating: 1 | -1 }
 * Bấm lại đúng rating đang có = gỡ đánh giá (trả rating 0).
 * Mọi thao tác gắn với email trong session; chưa đăng nhập → 401.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json(
      { error: "Thiếu tham số conversationId." },
      { status: 400 },
    );
  }

  const feedback = getFeedbackForConversation(session.email, conversationId);
  return NextResponse.json({ feedback });
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

  const { conversationId, messageId, rating } = (body ?? {}) as {
    conversationId?: unknown;
    messageId?: unknown;
    rating?: unknown;
  };

  if (typeof conversationId !== "string" || conversationId === "") {
    return NextResponse.json({ error: "Thiếu conversationId." }, { status: 400 });
  }
  if (typeof messageId !== "string" || messageId === "") {
    return NextResponse.json({ error: "Thiếu messageId." }, { status: 400 });
  }
  if (rating !== 1 && rating !== -1) {
    return NextResponse.json(
      { error: "rating phải là 1 (👍) hoặc -1 (👎)." },
      { status: 400 },
    );
  }

  const current = setFeedback(
    session.email,
    conversationId,
    messageId,
    rating as FeedbackRating,
  );

  return NextResponse.json({ rating: current });
}
