import fs from "node:fs/promises";
import path from "node:path";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { WIKI_ROOT_PATH } from "../config.js";
import { getWikiTree, type WikiNode } from "../vault.js";

/**
 * Metadata per-file lấy từ Vault_Index.json (sinh bởi
 * apps/System/agent_skills/build_vault_index.js) — optional, vault có thể
 * chưa chạy index-vault.
 */
type VaultIndexEntry = {
  path: string;
  title?: string;
  type?: string;
  status?: string;
  tags?: string[];
};

async function loadVaultIndex(): Promise<Map<string, VaultIndexEntry>> {
  const map = new Map<string, VaultIndexEntry>();
  try {
    const raw = await fs.readFile(
      path.join(WIKI_ROOT_PATH, "00_Overview", "Vault_Index.json"),
      "utf-8",
    );
    const parsed = JSON.parse(raw) as { entries?: VaultIndexEntry[] };
    for (const e of parsed.entries ?? []) {
      // entry.path dạng "02_Wiki/01_Business/x.md" → key slug "01_Business/x".
      const slug = e.path
        .replace(/^02_Wiki\//, "")
        .replace(/\.md$/i, "");
      map.set(slug, e);
    }
  } catch {
    // Không có Vault_Index.json — bỏ qua, tree vẫn hữu dụng.
  }
  return map;
}

function findSubtree(nodes: WikiNode[], slugPrefix: string): WikiNode[] | null {
  for (const n of nodes) {
    if (n.type !== "dir") continue;
    if (n.slug === slugPrefix) return n.children ?? [];
    const deeper = n.children ? findSubtree(n.children, slugPrefix) : null;
    if (deeper) return deeper;
  }
  return null;
}

function renderTree(
  nodes: WikiNode[],
  meta: Map<string, VaultIndexEntry>,
  depth: number,
  indent = "",
): string[] {
  const lines: string[] = [];
  for (const n of nodes) {
    if (n.type === "dir") {
      const empty = !n.children || n.children.length === 0;
      lines.push(`${indent}${n.name}/${empty ? "  (trống — chưa có nội dung)" : ""}`);
      if (!empty && depth > 1) {
        lines.push(...renderTree(n.children!, meta, depth - 1, indent + "  "));
      }
    } else {
      const m = meta.get(n.slug);
      const extras: string[] = [];
      if (m?.title && m.title !== n.name) extras.push(`title: ${m.title}`);
      if (m?.type) extras.push(`type: ${m.type}`);
      if (m?.status) extras.push(`status: ${m.status}`);
      if (m?.tags?.length) extras.push(`tags: ${m.tags.join(", ")}`);
      lines.push(
        `${indent}${n.name}.md${extras.length ? `  [${extras.join(" | ")}]` : ""}`,
      );
    }
  }
  return lines;
}

export function registerListWiki(server: McpServer): void {
  server.registerTool(
    "list_wiki",
    {
      title: "List wiki structure",
      description:
        "Liệt kê cây thư mục của wiki vault (02_Wiki/), kèm metadata (title/type/status/tags) " +
        "từ Vault_Index.json nếu có. Dùng tool này đầu tiên để định hướng trước khi đọc trang.",
      inputSchema: {
        path: z
          .string()
          .optional()
          .describe('Thư mục con cần liệt kê, vd "04_API_Specs". Mặc định: toàn vault.'),
        depth: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Độ sâu tối đa của cây. Mặc định 10."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ path: subPath, depth }) => {
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

      let nodes = tree;
      if (subPath) {
        const cleaned = subPath.replace(/^\/+|\/+$/g, "");
        const sub = findSubtree(tree, cleaned);
        if (!sub) {
          return {
            content: [
              {
                type: "text",
                text: `Không tìm thấy thư mục "${subPath}" trong vault. Gọi list_wiki không tham số để xem cấu trúc gốc.`,
              },
            ],
          };
        }
        nodes = sub;
      }

      const meta = await loadVaultIndex();
      const lines = renderTree(nodes, meta, depth ?? 10);
      const header = subPath ? `02_Wiki/${subPath}/` : "02_Wiki/";
      return {
        content: [{ type: "text", text: [header, ...lines].join("\n") }],
      };
    },
  );
}
