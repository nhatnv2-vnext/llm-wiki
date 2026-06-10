import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { WIKI_ROOT_PATH } from "../config.js";
import { flattenFiles, getFileContent, getWikiTree, type WikiNode } from "../vault.js";

function countBySection(tree: WikiNode[]): string[] {
  return tree
    .filter((n) => n.type === "dir")
    .map((n) => {
      const count = flattenFiles(n.children ?? []).length;
      return `- ${n.name}/: ${count} trang${count === 0 ? " (trống)" : ""}`;
    });
}

export function registerVaultOverview(server: McpServer): void {
  server.registerTool(
    "get_vault_overview",
    {
      title: "Vault overview",
      description:
        "Tổng quan wiki vault: nội dung trang Index (00_Overview/Index.md) + thống kê " +
        "số trang theo section. Gọi tool này TRƯỚC TIÊN để định hướng.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const tree = await getWikiTree();
      if (tree.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Vault tại ${WIKI_ROOT_PATH} không tồn tại hoặc trống.`,
            },
          ],
        };
      }

      const totalFiles = flattenFiles(tree).length;
      const stats = [
        `# Vault stats`,
        `Tổng số trang: ${totalFiles}`,
        ...countBySection(tree),
      ].join("\n");

      const index = await getFileContent("00_Overview/Index");
      const indexBlock = index
        ? `\n\n---\n\n<!-- 02_Wiki/00_Overview/Index.md -->\n${index}`
        : "\n\n(Chưa có 00_Overview/Index.md — vault chưa chạy /plan-wiki.)";

      return { content: [{ type: "text", text: stats + indexBlock }] };
    },
  );
}
