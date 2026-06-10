import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  flattenFiles,
  getFileContent,
  getWikiLinkIndex,
  getWikiTree,
  resolveWikiLink,
  suggestSimilar,
} from "../vault.js";

export function registerReadPage(server: McpServer): void {
  server.registerTool(
    "read_page",
    {
      title: "Read wiki page",
      description:
        "Đọc toàn bộ nội dung Markdown của một trang wiki. Nhận path tương đối " +
        '("04_API_Specs/Auth_Login.md"), slug ("04_API_Specs/Auth_Login"), hoặc ' +
        'tên wikilink ("Auth_Login").',
      inputSchema: {
        path: z
          .string()
          .min(1)
          .describe("Path / slug / tên wikilink của trang cần đọc."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ path: target }) => {
      let content: string | null = null;
      let resolved = target.trim().replace(/^\/+/, "").replace(/\.md$/i, "");

      try {
        content = await getFileContent(resolved);
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: (err as Error).message }],
        };
      }

      // Không trúng path trực tiếp → thử resolve như wikilink/tên trang.
      if (content === null) {
        const index = await getWikiLinkIndex();
        const slug = resolveWikiLink(target, index);
        if (slug) {
          resolved = slug;
          content = await getFileContent(slug);
        }
      }

      if (content === null) {
        const files = flattenFiles(await getWikiTree());
        const suggestions = suggestSimilar(target, files);
        const hint = suggestions.length
          ? `\n\nTrang gần giống:\n${suggestions.map((s) => `- ${s}`).join("\n")}`
          : "\n\nGọi list_wiki để xem các trang hiện có.";
        return {
          content: [
            { type: "text", text: `Không tìm thấy trang "${target}".${hint}` },
          ],
        };
      }

      return {
        content: [
          { type: "text", text: `<!-- 02_Wiki/${resolved}.md -->\n${content}` },
        ],
      };
    },
  );
}
