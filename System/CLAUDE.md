# CLAUDE.md — Bộ Não Trung Tâm của Vault

> File này là **single source of truth** cho mọi AI agent (Claude Code, CodeGraph, sub-agents) khi làm việc trong vault.
> Lấy cảm hứng từ phương pháp **context engineering + spec-driven development** của Andrej Karpathy
> (xem [LLM Council gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)).

---

## 1. Triết Lý Vận Hành

Vault được tổ chức theo **3 lớp**, AI phải tôn trọng ranh giới giữa các lớp:

| Layer | Thư mục | Quyền của AI | Mục đích |
|-------|---------|--------------|----------|
| **Layer 1 — Raw** | `01_Raw/` | **READ-ONLY** | Nguồn sự thật thô (config JSON + docs gốc) |
| **Layer 2 — Wiki** | `02_Wiki/` | **READ + WRITE** | Tri thức đã biên dịch, link với nhau |
| **Layer 3 — System** | `System/` | **READ + WRITE (có kiểm soát)** | Quy tắc, skill, automation |

**Luật vàng:** AI **TUYỆT ĐỐI KHÔNG** chỉnh sửa bất cứ file nào trong `01_Raw/` (ngoại trừ update metadata `last_synced` trong Screens.json theo quy trình spec-screen).
Nếu phát hiện code/docs bị lỗi → ghi vào `02_Wiki/04_Tasks_&_Logs/Conflict_Reports.md`.

### 1.1. Cấu trúc Layer 1 (`01_Raw/`)

```text
01_Raw/
├── codebase/
│   └── projects.json       ← Danh sách project + local_path (KHÔNG mount code vào vault)
├── screens/
│   └── Screens.json        ← Catalog màn hình app + Figma node URL
├── database/
│   └── schemas.json        ← Link đến file schema DB (Prisma, SQL, ...)
└── drive_docs/
    └── .gitkeep             ← Tài liệu pull từ Google Drive (PRD, specs)
```

- **`projects.json`**: Mỗi entry có `name`, `local_path`, `type`, `active`. Scripts đọc `local_path` để truy cập source code bên ngoài vault.
- **`Screens.json`**: Mỗi entry có `id`, `name`, `project` (liên kết với projects.json), `component`, `figma_node_url`. Dùng bởi skill `/spec-screen`.
- **`schemas.json`**: Mỗi entry có `name`, `type` (prisma/sql/...), `local_path`, `project`, `db_engine`. Dùng cho sinh `02_Wiki/03_Database/`.

---

## 2. Quy Trình Đọc Code (Ingest)

Khi được yêu cầu cập nhật wiki từ code:

1. **Đọc `01_Raw/codebase/projects.json`** để lấy danh sách project + `local_path`.
2. **Quét source code** tại `local_path` để lấy danh sách module/service/route.
3. **Đọc `01_Raw/database/schemas.json`** để lấy path đến file schema DB → parse cho `03_Database/`.
4. **Đối chiếu** với spec/PRD trong `01_Raw/drive_docs/`.
5. **Sinh ra** file Markdown tương ứng trong `02_Wiki/`:
   - Code → kiến trúc → `03_Architecture/`
   - Code → API contract → `04_API_Specs/`
   - Schema file → DB docs → `05_Database/`
6. **Phát hiện xung đột** giữa code thực tế và PRD → log vào `07_Tasks_&_Logs/Conflict_Reports.md`.
7. **KHÔNG bịa**: nếu thông tin không có trong source, ghi rõ `> ⚠️ Chưa xác định từ source`.

### 2.1. Lựa chọn parser theo ngôn ngữ

| Codebase | Parser bắt buộc | Lý do |
|----------|-----------------|-------|
| **Node.js / TypeScript / Angular / NestJS / Next.js / Vue** (custom ingest) | **ts-morph** | Control AST chi tiết, tự đọc `tsconfig.json` (kể cả `paths`). Dùng khi cần parse fine-grained, sinh API spec/schema/route map. |
| Code-graph overview (mọi ngôn ngữ) | **CodeGraph** (`@colbymchenry/codegraph`, MIT) | Index 19+ ngôn ngữ vào SQLite, resolve `tsconfig.paths`, dùng cho `npm run code-graph` (sinh `.md` skill per area). |
| Python (custom) | `ast` builtin | OK |

⚠️ **Luật cứng cho dự án Frontend/Node:** Script ingest fine-grained (vd `ingest_codebase.js`) dùng `ts-morph`. Workflow code-graph overview dùng `CodeGraph` (xem §4.1).

### 2.2. Quy trình sinh Database Wiki

1. Đọc `01_Raw/database/schemas.json` để lấy danh sách schema file.
2. Với mỗi entry `active == true`, đọc file tại `local_path` (Prisma schema, SQL dump, etc.).
3. Parse schema → sinh ER diagram + danh sách model vào `02_Wiki/05_Database/`.
4. Frontmatter `source:` trỏ đến `01_Raw/database/schemas.json` + `local_path`.

---

## 3. Quy Tắc Viết Markdown (Obsidian-flavored)

### 3.1. Internal links
- Dùng wikilink `[[Tên File]]` thay vì link đầy đủ.
- Đặt link ở mọi nơi có thể (term, service, table name) để Graph view phát huy tác dụng.

### 3.2. Frontmatter bắt buộc
Mỗi file trong `02_Wiki/` phải có frontmatter:

```yaml
---
title: <Tiêu đề con người đọc>
type: architecture | api | schema | task | log | dashboard
source:
  - "local: <local_path>/<đường dẫn>"
  - 01_Raw/drive_docs/<file>
status: draft | reviewed | stale
last_synced: YYYY-MM-DD
tags: [<tag1>, <tag2>]
---
```

### 3.3. Mermaid diagrams
- Dùng Mermaid cho mọi sơ đồ (flow, ER, sequence, C4).
- Đặt code block ```mermaid``` ngay sau heading mô tả.
- Sơ đồ kiến trúc tổng → ở `03_Architecture/System_Overview.md`.

### 3.4. Spec-driven format cho API
File trong `04_API_Specs/` phải có 4 section:
1. **Contract** (endpoint, method, payload schema)
2. **Source of truth** (file code tại `local_path`, dòng số)
3. **Business rule** (link tới PRD)
4. **Edge cases & error codes**

### 3.5. Quy tắc Versioning (Archiving) BẮT BUỘC
Khi Agent hoặc Script cập nhật một file `.md` đã tồn tại trong `02_Wiki/` (ghi đè nội dung):
1. **TUYỆT ĐỐI KHÔNG** ghi đè ngay lập tức.
2. Kiểm tra xem file có tồn tại không. Nếu có, tạo bản copy chuyển vào `02_Wiki/_Archive/<Thư_mục_tương_ứng>/<Tên_file>_v<YYYYMMDD_HHMMSS>.md`.
   - Ví dụ: Cập nhật `02_Design/SCR_002_xxx.md` → Copy file cũ sang `_Archive/02_Design/SCR_002_xxx_v20260602_104500.md`.
3. Sau đó mới ghi nội dung mới vào file gốc.

---

## 4. Skills & Triggers

Các script tự động hóa nằm trong `System/agent_skills/`.
Trigger qua `package.json`:

| Lệnh | Tác vụ |
|------|--------|
| `npm run ingest` | Đọc `projects.json` → quét code tại `local_path` (ts-morph) → cập nhật `02_Wiki/` |
| `npm run sync-drive` | Pull docs mới từ Google Drive → `01_Raw/drive_docs/` |
| `npm run lint-specs` | Kiểm tra frontmatter |
| `npm run audit-links` | Tìm broken wikilink + orphan note |
| `npm run generate-graph` | Đọc `projects.json` + `schemas.json` → sinh lại sơ đồ Mermaid |
| `npm run code-graph` | Đọc `projects.json` → chạy CodeGraph tại `local_path` → output Markdown sang `02_Wiki/06_Code_Graph/` |
| `npm run code-graph:mcp` | Start CodeGraph MCP server (Claude Code/Cursor query graph live) |
| `npm run index-vault` | Sinh `Vault_Index.json` cho RAG |
| `npm run stats` | Cập nhật bảng "Vault Stats" trong `Index.md` |
| `npm run validate` | Chain `lint-specs` + `audit-links` (dùng cho CI) |

### 4.1. CodeGraph — cài và dùng

CodeGraph ([@colbymchenry/codegraph](https://github.com/colbymchenry/codegraph), **MIT license**) thay thế GitNexus từ 2026-05-24. Chỉ là **tool**, không phải nội dung vault.

- **Cài 1 lần:**
  ```bash
  npm install -g @colbymchenry/codegraph
  ```
- **KHÔNG** clone source CodeGraph vào vault.
- **Input**: `local_path` từ `01_Raw/codebase/projects.json`.
- **Output**: file `.md` skill sang `02_Wiki/06_Code_Graph/<project>/<area>/SKILL.md`. Wrapper trong `System/agent_skills/run_codegraph.sh`.
- Index nội bộ: SQLite ở `<local_path>/.codegraph/codegraph.db` — nằm bên ngoài vault, mỗi máy tự `npm run code-graph` lần đầu.

#### Khám phá live qua MCP (thay Web UI 3D cũ)

CodeGraph không có Web UI 3D như GitNexus. Để Claude Code (hoặc Cursor/Codex) query graph live, dùng MCP:

1. Index 1 lần: `npm --prefix System run code-graph`
2. Cài MCP server cho agent: `codegraph install` (interactive — chọn Claude Code).
3. Hoặc start MCP server thủ công: `npm --prefix System run code-graph:mcp`.
4. Trong Claude Code, các tool `mcp__codegraph__*` xuất hiện: query symbol, callers, callees, impact analysis.

CLI query trực tiếp (không cần MCP):
```bash
codegraph query "<keyword>"  -p <local_path>
codegraph callers <symbol>   -p <local_path>
codegraph impact <symbol>    -p <local_path>
```

---

## 5. Naming Convention

- File wiki: `Snake_Case_With_Capital.md` (vd: `Realtime_Notification_API.md`).
- Tag: `kebab-case` (vd: `#realtime-sse`, `#dynamo-stream`).
- Section heading: bắt đầu bằng `##` (h1 dành cho title trong frontmatter).

---

## 6. Context Engineering (theo Karpathy)

Khi trả lời câu hỏi của user trong vault, AI nên:
- **Bắt đầu từ `00_Overview/Index.md`** để lấy bản đồ tổng.
- **Hoặc đọc `00_Overview/Vault_Index.json`** (sinh bằng `npm run index-vault`) nếu cần map nhanh title/tags/headings/wikilinks.
- **Đọc đủ nhưng không đọc thừa**: ưu tiên frontmatter + heading để định vị.
- **Trích dẫn nguồn**: mọi claim phải có link tới file Layer 1 hoặc Layer 2.
- **Khi không chắc**: thà nói "tôi cần đọc thêm `[[X]]`" còn hơn đoán.

### 6.1. Khi user hỏi câu định tính về dự án (RAG)
- Dùng slash command `/ask-vault` (file `.claude/skills/ask-vault/SKILL.md`) — Claude Code tự load khi CWD là `My_Project_Vault/`.
- Nếu gọi LLM ngoài Claude Code, dùng system prompt ở `System/PROMPTS/ask_vault_system.md`.
- Skill phải đọc `MEMORY.md` trước để biết các quyết định đã chốt (ts-morph cho custom AST, CodeGraph cho code-graph overview, …).

### 6.2. Khi user muốn sinh spec màn hình (Figma + code)
- Dùng slash command `/spec-screen <ID>` (file `.claude/skills/spec-screen/SKILL.md`).
- Catalog màn hình: `01_Raw/screens/Screens.json` — phải có entry trước khi gọi skill.
- Skill đọc `01_Raw/codebase/projects.json` để lấy `local_path` cho code-reader sub-agent.
- Skill spawn 2 sub-agent SONG SONG: `figma-reader` (MCP Figma) + `code-reader` (Read/Grep tại local_path). Main agent merge output + template `_Templates/screen_spec_template.md` → ghi `02_Wiki/02_Design/<ID>_<slug>.md`.
- Kiến trúc tách 2 sub-agent là CỐ Ý để tiết kiệm context window (Figma metadata + code đều lớn).

---

_Last updated: 2026-06-02_
