import "server-only";

import { RELEVANCE_DISTANCE_THRESHOLD, RETRIEVE_TOP_K } from "@/lib/config";
import { embedQuery } from "@/lib/embeddings";
import { getTable } from "@/lib/vectordb";

/**
 * Một chunk được truy hồi (retrieved) cho RAG, kèm điểm khoảng cách.
 * `_distance` do LanceDB trả về (càng nhỏ càng tương đồng).
 */
export type RetrievedChunk = {
  id: string;
  text_content: string;
  file_path: string;
  heading?: string;
  _distance?: number;
};

export type RetrieveOptions = {
  /** Số chunk trả về cuối cùng. Mặc định RETRIEVE_TOP_K. */
  topK?: number;
  /** Dedupe theo file_path để nguồn tham khảo không trùng. Mặc định true. */
  dedupeByFilePath?: boolean;
  /**
   * Ngưỡng _distance tối đa để coi chunk là liên quan. Chunk vượt ngưỡng bị
   * loại (câu hỏi ngoài phạm vi wiki). Mặc định RELEVANCE_DISTANCE_THRESHOLD.
   * Đặt Infinity để tắt lọc.
   */
  maxDistance?: number;
};

/**
 * Truy hồi các chunk liên quan nhất cho một câu hỏi:
 *   embed query → vector search Top-K trong LanceDB.
 *
 * Tách riêng để tái dùng ở bước generation (RAG answer).
 */
export async function retrieve(
  query: string,
  options: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  const topK = options.topK ?? RETRIEVE_TOP_K;
  const dedupe = options.dedupeByFilePath ?? true;
  const maxDistance = options.maxDistance ?? RELEVANCE_DISTANCE_THRESHOLD;

  const queryVector = await embedQuery(query);
  const table = await getTable();

  // Khi dedupe, lấy dư kết quả để sau khi loại trùng file_path vẫn đủ topK.
  const fetchLimit = dedupe ? topK * 4 : topK;

  const rows = (await table
    .vectorSearch(queryVector)
    .select(["id", "text_content", "file_path", "heading"])
    .limit(fetchLimit)
    .toArray()) as RetrievedChunk[];

  // Lọc chunk ngoài phạm vi wiki: _distance vượt ngưỡng → không đủ liên quan.
  const relevant = rows.filter(
    (r) => r._distance === undefined || r._distance <= maxDistance,
  );

  if (!dedupe) return relevant.slice(0, topK);

  const seen = new Set<string>();
  const deduped: RetrievedChunk[] = [];
  for (const row of relevant) {
    if (seen.has(row.file_path)) continue;
    seen.add(row.file_path);
    deduped.push(row);
    if (deduped.length >= topK) break;
  }

  return deduped;
}
