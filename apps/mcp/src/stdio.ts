import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { WIKI_ROOT_PATH } from "./config.js";
import { createServer } from "./server.js";

/** Entry stdio — dùng cho Claude Code / Cursor local (.mcp.json). */
async function main(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  console.error(`[mcp] llm-wiki stdio server sẵn sàng (vault: ${WIKI_ROOT_PATH})`);
}

main().catch((err) => {
  console.error("[mcp] Lỗi khởi động:", err);
  process.exit(1);
});
