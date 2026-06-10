import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { flattenFiles, getFileContent, getWikiTree } from "../vault.js";

const DOUBLE_STAR = "\uFFFF";

/** Chuyển glob đơn giản ("04_API_Specs/**", "*.md") thành RegExp trên slug. */
function globToRegex(glob: string): RegExp {
  const cleaned = glob.replace(/^\/+|\/+$/g, "").replace(/\.md$/i, "");
  const escaped = cleaned
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, DOUBLE_STAR)
    .replace(/\*/g, "[^/]*")
    .replaceAll(DOUBLE_STAR, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

export function registerGrepWiki(server: McpServer): void {
  server.registerTool(
    "grep_wiki",
    {
      title: "Grep wiki content",
      description:
        "Tìm kiếm theo từ khoá/regex trên toàn bộ file Markdown trong wiki. " +
        "Dùng khi cần khớp chính xác (tên hàm, mã lỗi, ID) hoặc khi search_wiki " +
        "chưa có vector index.",
      inputSchema: {
        pattern: z.string().min(1).describe("Từ khoá hoặc regex (JS) cần tìm."),
        glob: z
          .string()
          .optional()
          .describe('Lọc theo path, vd "04_API_Specs/**". Mặc định: toàn vault.'),
        caseSensitive: z.boolean().optional().describe("Mặc định false."),
        maxResults: z.number().int().min(1).max(200).optional().describe("Mặc định 50."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ pattern, glob, caseSensitive, maxResults }) => {
      let re: RegExp;
      try {
        re = new RegExp(pattern, caseSensitive ? "" : "i");
      } catch {
        // Pattern không phải regex hợp lệ → tìm như chuỗi nguyên văn.
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        re = new RegExp(escaped, caseSensitive ? "" : "i");
      }

      const globRe = glob
        ? globToRegex(glob.includes("*") ? glob : `${glob}/**`)
        : null;
      const limit = maxResults ?? 50;

      const files = flattenFiles(await getWikiTree()).filter(
        (f) => !globRe || globRe.test(f.slug),
      );

      const lines: string[] = [];
      let total = 0;
      for (const f of files) {
        if (total >= limit) break;
        const content = await getFileContent(f.slug);
        if (!content) continue;
        const fileLines = content.split(/\r?\n/);
        for (let i = 0; i < fileLines.length && total < limit; i++) {
          if (re.test(fileLines[i])) {
            lines.push(`${f.slug}.md:${i + 1}: ${fileLines[i].trim()}`);
            total++;
          }
        }
      }

      if (lines.length === 0) {
        return {
          content: [
            {
              type: "text",
              text:
                `Không tìm thấy "${pattern}"${glob ? ` trong ${glob}` : ""}. ` +
                "Thử search_wiki (semantic) hoặc nới pattern.",
            },
          ],
        };
      }

      const header =
        total >= limit ? `(hiển thị ${limit} kết quả đầu — thu hẹp pattern/glob nếu cần)\n` : "";
      return { content: [{ type: "text", text: header + lines.join("\n") }] };
    },
  );
}
