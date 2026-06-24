import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { WIKI_ROOT_PATH } from "./config.js";
import { createServer } from "./server.js";

/**
 * Entry Streamable HTTP — dùng khi deploy (Docker/EC2) cho nhiều người dùng.
 * Stateless: mỗi request tạo transport + server mới (không session) —
 * đơn giản, an toàn cho multi-client; client connect tới POST /mcp.
 *
 * LƯU Ý: v1 chưa có auth. Mặc định CHỈ bind loopback (127.0.0.1) để không lộ
 * ra ngoài — đặt sau reverse proxy hoặc tunnel. Khi deploy EC2 vẫn phải giới
 * hạn truy cập bằng security group / VPN. Muốn lắng nghe ngoài, set MCP_HOST
 * tường minh (vd 0.0.0.0). Xem apps/mcp/README.md.
 */

const PORT = Number(process.env.MCP_PORT ?? process.env.PORT ?? 3001);
// Mặc định loopback: an toàn-mặc-định, không tự lộ ra interface công khai.
const HOST = process.env.MCP_HOST?.trim() || "127.0.0.1";

const app = express();
app.use(express.json({ limit: "4mb" }));

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, vault: WIKI_ROOT_PATH });
});

app.post("/mcp", async (req, res) => {
  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
    });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[mcp] Lỗi xử lý request:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Stateless mode không hỗ trợ GET (SSE notifications) / DELETE (session).
const methodNotAllowed = (_req: express.Request, res: express.Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed (stateless server)" },
    id: null,
  });
};
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

app.listen(PORT, HOST, () => {
  console.error(
    `[mcp] llm-wiki HTTP server nghe trên ${HOST}:${PORT} (POST /mcp, vault: ${WIKI_ROOT_PATH})`,
  );
});
