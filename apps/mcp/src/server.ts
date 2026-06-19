import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerGetRelated } from "./tools/get-related.js";
import { registerGrepWiki } from "./tools/grep-wiki.js";
import { registerListWiki } from "./tools/list-wiki.js";
import { registerReadPage } from "./tools/read-page.js";
import { registerSearchWiki } from "./tools/search-wiki.js";
import { registerVaultOverview } from "./tools/vault-overview.js";

/**
 * Tạo MCP server với đủ 6 tools — transport-agnostic.
 * QUY TẮC: toàn bộ package này READ-ONLY với vault; logging chỉ qua
 * console.error (stdout là kênh protocol khi chạy stdio).
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "llm-wiki",
    version: "0.1.0",
  });

  registerVaultOverview(server);
  registerListWiki(server);
  registerReadPage(server);
  registerSearchWiki(server);
  registerGrepWiki(server);
  registerGetRelated(server);

  return server;
}
