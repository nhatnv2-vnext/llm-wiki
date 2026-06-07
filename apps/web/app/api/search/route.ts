import { NextResponse } from "next/server";

import { checkQuery } from "@/lib/guardrails";
import { retrieve } from "@/lib/rag";

/**
 * POST /api/search
 *
 * Body: { query: string }
 * Trả về Top-K chunk liên quan nhất (đã dedupe theo file_path) để dựng nguồn
 * tham khảo cho RAG.
 *
 * Guardrails:
 *  - Reject query injection / độc hại / quá dài / ký tự lạ → 400.
 *  - Che PII/secret trước khi embed.
 *  - Câu hỏi ngoài phạm vi wiki → chunks rỗng + thông báo (200).
 *
 * Response: { query, chunks, outOfScope?, message? }
 */

// Truy vấn vector DB + gọi Google API ở mỗi request → không cache.
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body phải là JSON hợp lệ." },
      { status: 400 },
    );
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

  // Guardrails: reject injection/độc hại/quá dài; che PII trong query.
  const guard = checkQuery(query);
  if (!guard.ok) {
    console.warn(`[api/search] query bị chặn (${guard.reason})`);
    return NextResponse.json(
      { error: guard.message, reason: guard.reason },
      { status: 400 },
    );
  }
  if (guard.redacted) {
    console.warn("[api/search] query chứa PII — đã che trước khi embed.");
  }

  try {
    const chunks = await retrieve(guard.sanitizedQuery);

    // Không có chunk nào đủ liên quan → câu hỏi ngoài phạm vi wiki.
    if (chunks.length === 0) {
      return NextResponse.json({
        query: guard.sanitizedQuery,
        chunks: [],
        outOfScope: true,
        message:
          "Không tìm thấy nội dung liên quan trong wiki. Hãy đặt câu hỏi về tài liệu trong wiki.",
      });
    }

    return NextResponse.json({ query: guard.sanitizedQuery, chunks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định.";
    console.error("[api/search] retrieve failed:", message);
    return NextResponse.json(
      { error: "Truy hồi thất bại.", detail: message },
      { status: 500 },
    );
  }
}
