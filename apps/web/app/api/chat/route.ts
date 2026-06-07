import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";
import { NextResponse } from "next/server";

import { CHAT_MODEL, readGoogleApiKey } from "@/lib/config";
import { checkQuery } from "@/lib/guardrails";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompt";
import { retrieve } from "@/lib/rag";

/**
 * POST /api/chat
 *
 * Body: { query: string }
 * Ghép retrieval (#8) với LLM: lấy Top-K chunk → đưa vào prompt → stream câu
 * trả lời Markdown (SSE) qua Vercel AI SDK. Metadata `sources` (file_path các
 * chunk đã dùng) gắn vào message qua messageMetadata.
 *
 * Guardrails: reject injection/độc hại/quá dài (400); che PII; câu ngoài wiki
 * → 200 kèm outOfScope (không gọi LLM).
 */

// Stream theo request → không cache.
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body phải là JSON hợp lệ." }, { status: 400 });
  }

  const query =
    typeof body === "object" && body !== null && "query" in body
      ? (body as { query: unknown }).query
      : undefined;

  if (typeof query !== "string" || query.trim() === "") {
    return NextResponse.json(
      { error: 'Thiếu hoặc sai trường "query" (cần chuỗi không rỗng).' },
      { status: 400 },
    );
  }

  // Guardrails đầu vào (dùng chung với /api/search).
  const guard = checkQuery(query);
  if (!guard.ok) {
    console.warn(`[api/chat] query bị chặn (${guard.reason})`);
    return NextResponse.json({ error: guard.message, reason: guard.reason }, { status: 400 });
  }

  // Retrieval (tái dùng từ #8).
  let chunks;
  try {
    chunks = await retrieve(guard.sanitizedQuery);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định.";
    console.error("[api/chat] retrieve failed:", message);
    return NextResponse.json({ error: "Truy hồi thất bại.", detail: message }, { status: 500 });
  }

  // Không có chunk liên quan → câu hỏi ngoài phạm vi wiki, không gọi LLM.
  // Vẫn trả về dạng UI message stream để client (useChat) render thống nhất.
  if (chunks.length === 0) {
    const text =
      "Không tìm thấy nội dung liên quan trong wiki. Hãy đặt câu hỏi về tài liệu trong wiki.";
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: "message-metadata", messageMetadata: { sources: [], outOfScope: true } });
        writer.write({ type: "text-start", id: "0" });
        writer.write({ type: "text-delta", id: "0", delta: text });
        writer.write({ type: "text-end", id: "0" });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  const sources = [...new Set(chunks.map((c) => c.file_path))];

  const google = createGoogleGenerativeAI({ apiKey: readGoogleApiKey() });

  const result = streamText({
    model: google(CHAT_MODEL),
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(guard.sanitizedQuery, chunks),
  });

  // Stream SSE; gắn sources vào message metadata để client dựng nguồn.
  return result.toUIMessageStreamResponse({
    messageMetadata: () => ({ sources }),
  });
}
