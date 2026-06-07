import "server-only";

import { EMBED_MODEL, EMBEDDING_DIM, readGoogleApiKey } from "@/lib/config";

/**
 * Nhúng (embed) một đoạn text thành vector qua Google Generative Language API.
 *
 * Dùng cùng model + outputDimensionality với scripts/ingest-rag.ts để vector
 * của query so sánh được với vector đã index.
 */

type EmbedContentResponse = { embedding: { values: number[] } };

/** Nhúng một câu truy vấn thành vector embedding (độ dài = EMBEDDING_DIM). */
export async function embedQuery(query: string): Promise<number[]> {
  const text = query.trim();
  if (!text) {
    throw new Error("Câu truy vấn rỗng — không thể embed.");
  }

  const googleKey = readGoogleApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/${EMBED_MODEL}:embedContent?key=${googleKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIM,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Google Embedding API lỗi ${res.status}: ${errBody}`);
  }

  const values = ((await res.json()) as EmbedContentResponse).embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIM) {
    throw new Error(
      `Embedding trả về không hợp lệ (mong đợi ${EMBEDDING_DIM} chiều, nhận ${values?.length}).`,
    );
  }

  return values;
}
