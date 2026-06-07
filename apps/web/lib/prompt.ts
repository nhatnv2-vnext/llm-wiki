import "server-only";

import type { RetrievedChunk } from "@/lib/rag";

/**
 * Dựng prompt cho RAG generation.
 *
 * Nguyên tắc: model CHỈ được trả lời dựa trên context nội bộ (các chunk wiki),
 * không bịa kiến thức ngoài → khớp tiêu chí PoC "AI trả lời đúng ngữ cảnh dự án".
 */

/** System prompt: ràng buộc model bám context + định dạng Markdown có nguồn. */
export const SYSTEM_PROMPT = [
  "Bạn là trợ lý tra cứu wiki nội bộ của dự án.",
  "Chỉ được trả lời DỰA TRÊN các tài liệu nội bộ được cung cấp trong phần Context.",
  "TUYỆT ĐỐI không dùng kiến thức bên ngoài, không suy đoán, không bịa.",
  "Nếu Context không đủ thông tin để trả lời, hãy nói rõ là wiki chưa có nội dung này.",
  "Trả lời bằng tiếng Việt, định dạng Markdown rõ ràng.",
  "Cuối câu trả lời, liệt kê mục \"Nguồn tham khảo\" gồm các file_path đã dùng.",
].join(" ");

/** Đưa các chunk thành khối context có đánh số + ghi rõ file_path nguồn. */
export function buildContextBlock(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => {
      const heading = c.heading ? ` — ${c.heading}` : "";
      return `[${i + 1}] (nguồn: ${c.file_path}${heading})\n${c.text_content}`;
    })
    .join("\n\n---\n\n");
}

/**
 * Dựng user prompt: ghép Context (các chunk) + câu hỏi.
 * Tách riêng để tái dùng / unit-test.
 */
export function buildUserPrompt(query: string, chunks: RetrievedChunk[]): string {
  return [
    "Dựa vào các tài liệu nội bộ sau:",
    "",
    buildContextBlock(chunks),
    "",
    `Hãy trả lời câu hỏi: ${query}`,
    "",
    "Trả về Markdown, đánh dấu nguồn rõ ràng (theo file_path ở trên).",
  ].join("\n");
}
