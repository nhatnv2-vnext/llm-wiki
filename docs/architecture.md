# Kiến trúc & Triết lý vận hành

## Cấu trúc 3 lớp

Vault tách ranh giới rõ ràng giữa 3 lớp — AI chỉ được đọc Layer 1 và ghi Layer 2.

```text
My_Project_Vault/
├── 01_Raw/                          ← Layer 1: Nguồn thô (READ-ONLY)
│   ├── codebase/projects.json       ←   Danh sách project + local path
│   ├── screens/Screens.json         ←   Catalog màn hình + Figma URL
│   ├── features/Features.json       ←   Catalog tính năng Backend
│   ├── database/schemas.json        ←   Link đến file schema DB
│   └── drive_docs/                  ←   Tài liệu từ Google Drive (PRD)
├── 02_Wiki/                         ← Layer 2: Tri thức biên dịch (AI ghi vào đây)
│   ├── 00_Overview/                 ←   Index.md + Vault_Index.json
│   ├── 01_Business/                 ←   PRD biên dịch + business rules
│   ├── 02_Design/                   ←   Đặc tả màn hình Figma + code
│   ├── 03_Architecture/             ←   Sơ đồ C4, sequence, queue/cron
│   ├── 04_API_Specs/                ←   Hợp đồng API + business logic
│   ├── 05_Database/                 ←   ERD + Data Dictionary
│   ├── 06_Code_Graph/               ←   AST skill map từ CodeGraph
│   ├── 07_Tasks_&_Logs/             ←   Conflict Reports + Sync Logs
│   ├── 08_ADR/                      ←   Architecture Decision Records
│   ├── 09_Testing/                  ←   Chiến lược kiểm thử + coverage
│   ├── 10_Security/                 ←   Auth/RBAC + API security
│   └── _Templates/                  ←   Template chuẩn cho từng loại tài liệu
└── apps/
    ├── System/                      ← Layer 3: Bộ não (Scripts, Skills, CLAUDE.md)
    ├── mcp/                         ← MCP server read-only (AI ngoài đọc wiki)
    └── web/                         ← App Next.js (RAG UI, graph view)
```

> **Kiến trúc JSON-based links:** Vault không chứa source code trực tiếp. Các
> file JSON (`projects.json`, `schemas.json`) chứa tên + `local_path` trỏ tới
> thư mục/file trên máy. Scripts và AI đọc đường dẫn này để trích xuất kiến
> thức, giúp vault gọn nhẹ và linh hoạt.

## Triết lý vận hành

Lấy cảm hứng từ **context engineering + spec-driven development**
([Karpathy LLM Council](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)):

- **Code là sự thật (Single Source of Truth):** AI đọc code và chuyển hóa thành
  bản dịch có ngữ cảnh trong Wiki, không phải nơi lưu bản sao của code.
- **Bất khả xâm phạm:** AI chỉ được đọc Layer 1 (`01_Raw`) và ghi Layer 2 (`02_Wiki`).
- **Ghi nhận thay vì tự ý sửa:** Mọi xung đột giữa code và PRD được log lại tại
  `02_Wiki/07_Tasks_&_Logs/Conflict_Reports.md`.
- **Versioning (Archiving):** Khi cập nhật một file Wiki, AI BẮT BUỘC copy bản cũ
  vào `02_Wiki/_Archive/` trước khi ghi đè.

Hợp đồng vận hành đầy đủ cho AI nằm ở [`apps/System/CLAUDE.md`](../apps/System/CLAUDE.md).

## Cấu hình các công cụ AI (MCP Servers)

**MCP (Model Context Protocol)** là plugin giúp AI tương tác hệ thống ngoài
(Figma, CodeGraph, Google Drive). Cấu hình trong `.mcp.json` ở gốc vault.

### 1. Figma API (trích xuất giao diện)

Lấy token tại **Figma > Settings > Personal access tokens**, rồi thêm biến môi
trường (vào `~/.zshrc`):

```bash
export FIGMA_API_KEY="figd_..."
```

> Không hardcode token vào `.mcp.json` để tránh rò rỉ.

### 2. CodeGraph (phân tích cấu trúc code)

Giúp AI hiểu quan hệ gọi hàm (controller → service → repository) chính xác hơn
grep. Cài CLI 1 lần, rồi index **trong từng thư mục source** (không phải vault):

```bash
npm i -g @colbymchenry/codegraph
cd /đường_dẫn/tới/source-project
codegraph init -i                   # tạo .codegraph/ (chỉ chạy 1 lần)
```

File watcher tự cập nhật khi code đổi. Kiểm tra kết nối: gõ `/mcp` trong Claude.

### 3. Google Drive (đọc PRD)

Lần đầu yêu cầu AI đọc Drive, terminal in link OAuth — click để cấp quyền.

### 4. MarkItDown (parse PDF → Markdown, tùy chọn)

Cho `npm run parse-docs`:

```bash
brew install pipx
pipx install 'markitdown[pdf]'
brew install tesseract poppler   # nếu PDF có chữ trong ảnh (OCR)
```

### 5. llm-wiki MCP (cho AI ở dự án KHÁC đọc Wiki này)

MCP server read-only (`apps/mcp/`) — AI agents (Claude Code, Cursor) connect vào
để tra cứu wiki (semantic search, đọc trang, wikilinks) khi làm việc ở repo
khác. Đã đăng ký sẵn trong `.mcp.json` (server `llm-wiki`).

Ở repo khác (local, stdio):

```bash
claude mcp add --scope user llm-wiki -- \
  /đường_dẫn/tới/llm-wiki/node_modules/.bin/tsx \
  /đường_dẫn/tới/llm-wiki/apps/mcp/src/stdio.ts
```

Deploy HTTP: `docker compose up -d mcp` rồi
`claude mcp add --transport http llm-wiki http://<host>:3001/mcp`.
Chi tiết: [`apps/mcp/README.md`](../apps/mcp/README.md).
