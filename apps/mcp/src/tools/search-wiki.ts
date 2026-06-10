import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  LANCEDB_PATH,
  RELEVANCE_DISTANCE_THRESHOLD,
  RETRIEVE_TOP_K,
  readGoogleApiKey,
} from "../config.js";
import { embedQuery } from "../embeddings.js";
import { tryGetTable } from "../vectordb.js";

type RetrievedChunk = {
  id: string;
  text_content: string;
  file_path: string;
  heading?: string;
  _distance?: number;
};

const NO_INDEX_MSG =
  `Chưa có vector index tại ${LANCEDB_PATH}. ` +
  "Chạy `pnpm build-index` ở root repo llm-wiki để tạo index, " +
  "hoặc dùng grep_wiki / list_wiki thay thế.";

const NO_KEY_MSG =
  "Thiếu GOOGLE_API_KEY (cần cho semantic search). " +
  "Thêm vào .env.local ở root repo llm-wiki, hoặc dùng grep_wiki / list_wiki thay thế.";

export function registerSearchWiki(server: McpServer): void {
  server.registerTool(
    "search_wiki",
    {
      title: "Semantic search wiki",
      description:
        "Tìm kiếm ngữ nghĩa (vector search) trên nội dung wiki. Trả về các đoạn " +
        "liên quan nhất kèm file nguồn. Dùng cho câu hỏi định tính (kiến trúc, flow, " +
        "nghiệp vụ); với từ khoá chính xác hãy dùng grep_wiki.",
      inputSchema: {
        query: z.string().min(1).describe("Câu hỏi / mô tả cần tìm."),
        topK: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe(`Số kết quả tối đa. Mặc định ${RETRIEVE_TOP_K}.`),
        maxDistance: z
          .number()
          .optional()
          .describe(
            `Ngưỡng distance tối đa (càng nhỏ càng giống). Mặc định ${RELEVANCE_DISTANCE_THRESHOLD}.`,
          ),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, topK, maxDistance }) => {
      if (!readGoogleApiKey()) {
        return { content: [{ type: "text", text: NO_KEY_MSG }] };
      }

      const table = await tryGetTable();
      if (!table) {
        return { content: [{ type: "text", text: NO_INDEX_MSG }] };
      }

      // Thuật toán mirror apps/web/lib/rag.ts:retrieve — keep in sync.
      const k = topK ?? RETRIEVE_TOP_K;
      const threshold = maxDistance ?? RELEVANCE_DISTANCE_THRESHOLD;

      const queryVector = await embedQuery(query);
      // Lấy dư để sau khi dedupe theo file_path vẫn đủ topK.
      const rows = (await table
        .vectorSearch(queryVector)
        .select(["id", "text_content", "file_path", "heading"])
        .limit(k * 4)
        .toArray()) as RetrievedChunk[];

      const relevant = rows.filter(
        (r) => r._distance === undefined || r._distance <= threshold,
      );

      const seen = new Set<string>();
      const deduped: RetrievedChunk[] = [];
      for (const row of relevant) {
        if (seen.has(row.file_path)) continue;
        seen.add(row.file_path);
        deduped.push(row);
        if (deduped.length >= k) break;
      }

      if (deduped.length === 0) {
        const closest = rows[0]?._distance;
        return {
          content: [
            {
              type: "text",
              text:
                `Không có kết quả đủ liên quan (distance gần nhất: ${closest?.toFixed(3) ?? "n/a"}, ngưỡng: ${threshold}). ` +
                "Câu hỏi có thể ngoài phạm vi wiki — thử grep_wiki hoặc diễn đạt lại.",
            },
          ],
        };
      }

      const blocks = deduped.map((c, i) => {
        const head = c.heading ? ` — ${c.heading}` : "";
        const dist = c._distance !== undefined ? ` (distance: ${c._distance.toFixed(3)})` : "";
        return `## [${i + 1}] ${c.file_path}${head}${dist}\n${c.text_content}`;
      });

      return { content: [{ type: "text", text: blocks.join("\n\n---\n\n") }] };
    },
  );
}
