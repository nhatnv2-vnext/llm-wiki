import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  extractWikiLinks,
  flattenFiles,
  getFileContent,
  getWikiLinkIndex,
  getWikiTree,
  resolveWikiLink,
  suggestSimilar,
} from "../vault.js";

export function registerGetRelated(server: McpServer): void {
  server.registerTool(
    "get_related",
    {
      title: "Related wiki pages",
      description:
        "Liệt kê các trang liên quan tới một trang wiki: outgoing [[wikilinks]] " +
        "và backlinks (trang khác trỏ về). Dùng để mở rộng ngữ cảnh quanh một chủ đề.",
      inputSchema: {
        path: z
          .string()
          .min(1)
          .describe("Path / slug / tên wikilink của trang gốc."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ path: target }) => {
      const index = await getWikiLinkIndex();
      const cleaned = target.trim().replace(/^\/+/, "").replace(/\.md$/i, "");

      // Resolve trang gốc: thử path trực tiếp rồi wikilink index.
      let slug: string | null = null;
      if ((await getFileContent(cleaned)) !== null) slug = cleaned;
      else slug = resolveWikiLink(target, index);

      if (!slug) {
        const files = flattenFiles(await getWikiTree());
        const suggestions = suggestSimilar(target, files);
        const hint = suggestions.length
          ? `\nTrang gần giống:\n${suggestions.map((s) => `- ${s}`).join("\n")}`
          : "";
        return {
          content: [
            { type: "text", text: `Không tìm thấy trang "${target}".${hint}` },
          ],
        };
      }

      const content = (await getFileContent(slug)) ?? "";

      // Outgoing: [[wikilink]] trong trang, resolve về slug nếu được.
      const outgoing = extractWikiLinks(content).map((t) => {
        const resolved = resolveWikiLink(t, index);
        return resolved ? `- [[${t}]] → ${resolved}.md` : `- [[${t}]] (chưa có trang)`;
      });

      // Backlinks: quét toàn vault tìm trang link tới slug này.
      const files = flattenFiles(await getWikiTree());
      const backlinks: string[] = [];
      for (const f of files) {
        if (f.slug === slug) continue;
        const c = await getFileContent(f.slug);
        if (!c) continue;
        const links = extractWikiLinks(c);
        if (links.some((t) => resolveWikiLink(t, index) === slug)) {
          backlinks.push(`- ${f.slug}.md`);
        }
      }

      const text = [
        `# Liên kết của 02_Wiki/${slug}.md`,
        "",
        `## Outgoing (${outgoing.length})`,
        outgoing.length ? outgoing.join("\n") : "(không có wikilink nào)",
        "",
        `## Backlinks (${backlinks.length})`,
        backlinks.length ? backlinks.join("\n") : "(chưa có trang nào trỏ về)",
      ].join("\n");

      return { content: [{ type: "text", text }] };
    },
  );
}
