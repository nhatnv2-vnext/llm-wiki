# `apps/mcp` — MCP server cho Wiki Vault

MCP (Model Context Protocol) server **read-only** cho phép AI agents (Claude Code, Cursor, …) connect vào và tra cứu wiki trong `02_Wiki/` — phục vụ code, lên plan, research, fix bug dựa trên wiki.

## Tools

| Tool | Mô tả |
|------|-------|
| `get_vault_overview` | Tổng quan vault: Index.md + thống kê số trang theo section. Gọi đầu tiên để định hướng. |
| `list_wiki` | Cây thư mục + metadata (title/type/status/tags từ `Vault_Index.json`). |
| `read_page` | Đọc full Markdown của 1 trang (nhận path / slug / tên wikilink). |
| `search_wiki` | Semantic search qua LanceDB (cần `GOOGLE_API_KEY` + index đã build). |
| `grep_wiki` | Tìm từ khoá/regex chính xác — fallback khi chưa có vector index. |
| `get_related` | Outgoing wikilinks + backlinks của 1 trang. |

Khi vault còn trống hoặc chưa có vector index, các tool trả về message hướng dẫn (chạy `pnpm build-index`, dùng `grep_wiki`…) thay vì lỗi.

## Kiến trúc

- **2 transport**: `src/stdio.ts` (local) và `src/http.ts` (Streamable HTTP, stateless, `POST /mcp` + `GET /healthz`).
- **Read-only tuyệt đối**: chỉ `fs.readFile/readdir` + LanceDB `vectorSearch`; path guard chặn `..` traversal và `_Archive/`.
- Env resolve theo **vị trí file** (không theo cwd) → chạy được khi bị spawn từ repo khác. `process.env` luôn thắng `.env.local`.
- Các hằng số RAG (`wiki_chunks`, dim 768, `gemini-embedding-001`, threshold 0.3) **phải đồng bộ** với `apps/web/lib/config.ts`.

## Chạy local (stdio)

Trong repo này đã đăng ký sẵn ở `.mcp.json` (server `llm-wiki`). Chạy tay:

```bash
pnpm mcp            # = tsx apps/mcp/src/stdio.ts
```

Đăng ký cho Claude Code ở **repo khác** (dùng absolute path, scope user):

```bash
claude mcp add --scope user llm-wiki -- \
  /Users/htt/vnext/llm-wiki/node_modules/.bin/tsx \
  /Users/htt/vnext/llm-wiki/apps/mcp/src/stdio.ts
```

Cursor: thêm entry tương đương vào `~/.cursor/mcp.json`.

## Chạy HTTP (local hoặc EC2/Docker)

```bash
pnpm mcp:http                      # local, mặc định :3001
docker compose up -d mcp           # Docker (build target mcp-runner)
```

Client connect:

```bash
claude mcp add --transport http llm-wiki http://<host>:3001/mcp
```

> ⚠️ **v1 chưa có auth.** Khi deploy EC2, giới hạn truy cập port 3001 bằng security group / VPN. Có thể thêm bearer token ở `src/http.ts` sau.

Lưu ý Docker: service `web` chạy ingest lúc khởi động và ghi index vào volume `lancedb_data`; service `mcp` chỉ mount volume đó **read-only** — vì vậy hãy start `web` trước (hoặc cùng lúc) để `search_wiki` có index.

## Debug

```bash
npx @modelcontextprotocol/inspector node_modules/.bin/tsx apps/mcp/src/stdio.ts
```

Không bao giờ `console.log` trong package này — stdout là kênh protocol của stdio transport; log qua `console.error`.
