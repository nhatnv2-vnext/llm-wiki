# CLAUDE.md — Bộ Não Trung Tâm của Vault

> File này là **single source of truth** cho mọi AI agent (Claude Code, CodeGraph, sub-agents) khi làm việc trong vault.
> Lấy cảm hứng từ phương pháp **context engineering + spec-driven development** của Andrej Karpathy
> (xem [LLM Council gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)).

---

## 1. Triết Lý Vận Hành

Vault được tổ chức theo **3 lớp**, AI phải tôn trọng ranh giới giữa các lớp:

| Layer | Thư mục | Quyền của AI | Mục đích |
|-------|---------|--------------|----------|
| **Layer 1 — Raw** | `01_Raw/` | **READ-ONLY** | Nguồn sự thật thô (code + docs gốc) |
| **Layer 2 — Wiki** | `02_Wiki/` | **READ + WRITE** | Tri thức đã biên dịch, link với nhau |
| **Layer 3 — System** | `System/` | **READ + WRITE (có kiểm soát)** | Quy tắc, skill, automation |

**Luật vàng:** AI **TUYỆT ĐỐI KHÔNG** chỉnh sửa bất cứ file nào trong `01_Raw/`.
Nếu phát hiện code/docs bị lỗi → ghi vào `02_Wiki/04_Tasks_&_Logs/Conflict_Reports.md`.

---

## 2. Quy Trình Đọc Code (Ingest)

Khi được yêu cầu cập nhật wiki từ code:

1. **Quét** `01_Raw/codebase/` để lấy danh sách module/service/route.
2. **Đối chiếu** với spec/PRD trong `01_Raw/drive_docs/`.
3. **Sinh ra** file Markdown tương ứng trong `02_Wiki/`:
   - Code → kiến trúc → `01_Architecture/`
   - Code → API contract → `02_API_Specs/`
   - Code → schema → `03_Database/`
4. **Phát hiện xung đột** giữa code thực tế và PRD → log vào `04_Tasks_&_Logs/Conflict_Reports.md`.
5. **KHÔNG bịa**: nếu thông tin không có trong source, ghi rõ `> ⚠️ Chưa xác định từ source`.

### 2.1. Lựa chọn parser theo ngôn ngữ

| Codebase | Parser bắt buộc | Lý do |
|----------|-----------------|-------|
| **Node.js / TypeScript / Angular / NestJS / Next.js / Vue** (custom ingest) | **ts-morph** | Control AST chi tiết, tự đọc `tsconfig.json` (kể cả `paths`). Dùng khi cần parse fine-grained, sinh API spec/schema/route map. |
| Code-graph overview (mọi ngôn ngữ) | **CodeGraph** (`@colbymchenry/codegraph`, MIT) | Index 19+ ngôn ngữ vào SQLite, resolve `tsconfig.paths`, dùng cho `npm run code-graph` (sinh `.md` skill per area). |
| Python (custom) | `ast` builtin | OK |

⚠️ **Luật cứng cho dự án Frontend/Node:** Script ingest fine-grained (vd `ingest_codebase.js`) dùng `ts-morph`. Workflow code-graph overview dùng `CodeGraph` (xem §4.1).

### 2.2. Plan-review gate (BẮT BUỘC cho mọi LLM-driven write)

**Triết lý:** Vault là tài sản chung của team. LLM hallucinate có thể ghi đè kiến thức cũ. Mọi script/skill ghi vào `02_Wiki/` PHẢI qua **plan → human approve → apply**.

| Workflow | Plan output | Approval check | Apply gate |
|----------|-------------|----------------|------------|
| `npm run ingest:plan` → `npm run ingest:apply <plan>` | `02_Wiki/04_Tasks_&_Logs/Ingest_Plans/<YYYY-MM-DD>_<slug>.md` | Frontmatter `approved_by` + `approved_at` không null | Script `ingest_codebase.js apply` validate trước khi ghi |
| `/spec-screen <ID>` → `/spec-screen apply <ID>` | `02_Wiki/06_Screen_Specs/_drafts/<ID>_<slug>.md` | Frontmatter `approved_by` + `approved_at` không null | Skill `apply` mode validate, mv ra root, update Screens.json |

**Quy tắc cứng:**

1. **KHÔNG ghi thẳng** vào `02_Wiki/` từ script/skill LLM-driven. Luôn vào folder draft / plan dir trước.
2. **Reviewer phải khác người chạy plan** khi possible (4-eyes principle). Set `approved_by` = github handle thật.
3. **Re-apply bị cấm.** Mỗi plan/draft áp dụng đúng 1 lần. Cần re-generate nếu muốn áp dụng lại.
4. **Stale plan guard:** plan ghi `source_snapshot` (commit SHA của submodule). Khi apply, script so lại — lệch → refuse trừ khi `--force`.
5. **Rejected plan/draft:** set `status: rejected` + section `## Rejection reason` trong file. File giữ vĩnh viễn để audit.
6. **Manual edit wiki vẫn được phép** — dev edit tay trong Obsidian + commit normal. Plan-review chỉ gate **LLM** write.

**Audit:** Mọi plan file đã apply (`applied_at` set) được giữ vĩnh viễn trong `Ingest_Plans/`. Git blame frontmatter `approved_by` → biết ai duyệt cái gì khi nào.

### 2.3. CI bot — Vault PR Summary

PR đụng `02_Wiki/**` hoặc `System/**` → bot `pr-summary` (file `.github/workflows/wiki-ci.yml`, logic `System/agent_skills/pr_summary.js`) tự động post markdown comment liệt kê:

- File changes (Wiki / System / Skill) với emoji theo status (🆕 added, ✏️ modified, 🗑️ removed).
- Bảng **Ingest plans** có trong PR + status + approver + applied?
- Bảng **Screen drafts** + approver + applied?
- Warning nếu plan/draft chưa approved hoặc chưa apply.

**Idempotent:** Bot tìm comment cũ qua marker `<!-- vault-pr-summary-bot -->` → update content, không spam.

**Disable:** Comment-out job `pr-summary` trong `wiki-ci.yml`, hoặc thêm guard `if: !contains(github.event.pull_request.labels.*.name, 'no-bot')` rồi gắn label `no-bot` vào PR.

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
  - 01_Raw/codebase/<đường dẫn>
  - 01_Raw/drive_docs/<file>
status: draft | reviewed | stale
last_synced: YYYY-MM-DD
tags: [<tag1>, <tag2>]
---
```

### 3.3. Mermaid diagrams
- Dùng Mermaid cho mọi sơ đồ (flow, ER, sequence, C4).
- Đặt code block ```mermaid``` ngay sau heading mô tả.
- Sơ đồ kiến trúc tổng → ở `01_Architecture/System_Overview.md`.

### 3.4. Spec-driven format cho API
File trong `02_API_Specs/` phải có 4 section:
1. **Contract** (endpoint, method, payload schema)
2. **Source of truth** (file code, dòng số)
3. **Business rule** (link tới PRD)
4. **Edge cases & error codes**

---

## 4. Skills & Triggers

Các script tự động hóa nằm trong `System/agent_skills/`.
Trigger qua `package.json`:

| Lệnh | Tác vụ |
|------|--------|
| `npm run ingest` | Quét toàn bộ codebase (ts-morph) → cập nhật `02_Wiki/` |
| `npm run sync-drive` | Pull docs mới từ Google Drive → `01_Raw/drive_docs/` |
| `npm run lint-specs` | Kiểm tra frontmatter |
| `npm run audit-links` | Tìm broken wikilink + orphan note |
| `npm run generate-graph` | Sinh lại sơ đồ Mermaid từ AST của code |
| `npm run code-graph` | Chạy CodeGraph lên code → output Markdown sang `02_Wiki/05_Code_Graph/` |
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
- **Output**: file `.md` skill sang `02_Wiki/05_Code_Graph/<project>/<area>/SKILL.md`. Wrapper trong `System/agent_skills/run_codegraph.sh`.
- Index nội bộ: SQLite ở `01_Raw/codebase/<project>/.codegraph/codegraph.db` — đã `.gitignore`, mỗi máy phải tự `npm run code-graph` lần đầu.

#### Khám phá live qua MCP (thay Web UI 3D cũ)

CodeGraph không có Web UI 3D như GitNexus. Để Claude Code (hoặc Cursor/Codex) query graph live, dùng MCP:

1. Index 1 lần: `npm --prefix System run code-graph`
2. Cài MCP server cho agent: `codegraph install` (interactive — chọn Claude Code).
3. Hoặc start MCP server thủ công: `npm --prefix System run code-graph:mcp`.
4. Trong Claude Code, các tool `mcp__codegraph__*` xuất hiện: query symbol, callers, callees, impact analysis.

CLI query trực tiếp (không cần MCP):
```bash
codegraph query "<keyword>"  -p 01_Raw/codebase/<project>
codegraph callers <symbol>   -p 01_Raw/codebase/<project>
codegraph impact <symbol>    -p 01_Raw/codebase/<project>
```

---

## 5. Naming Convention

- File wiki: `Snake_Case_With_Capital.md` (vd: `Realtime_Notification_API.md`).
- Tag: `kebab-case` (vd: `#realtime-sse`, `#dynamo-stream`).
- Section heading: bắt đầu bằng `##` (h1 dành cho title trong frontmatter).

---

## 6. Context Engineering (theo Karpathy)

Khi trả lời câu hỏi của user trong vault, AI nên:
- **Bắt đầu từ `00_Dashboard/Index.md`** để lấy bản đồ tổng.
- **Hoặc đọc `00_Dashboard/Vault_Index.json`** (sinh bằng `npm run index-vault`) nếu cần map nhanh title/tags/headings/wikilinks.
- **Đọc đủ nhưng không đọc thừa**: ưu tiên frontmatter + heading để định vị.
- **Trích dẫn nguồn**: mọi claim phải có link tới file Layer 1 hoặc Layer 2.
- **Khi không chắc**: thà nói "tôi cần đọc thêm `[[X]]`" còn hơn đoán.

### 6.1. Khi user hỏi câu định tính về dự án (RAG)
- Dùng slash command `/ask-vault` (file `.claude/skills/ask-vault/SKILL.md`) — Claude Code tự load khi CWD là `My_Project_Vault/`.
- Nếu gọi LLM ngoài Claude Code, dùng system prompt ở `System/PROMPTS/ask_vault_system.md`.
- Skill phải đọc `MEMORY.md` trước để biết các quyết định đã chốt (ts-morph cho custom AST, CodeGraph cho code-graph overview, …).

### 6.2. Khi user muốn sinh spec màn hình (Figma + code)
- Dùng slash command `/spec-screen <ID>` (file `.claude/skills/spec-screen/SKILL.md`).
- Catalog màn hình: `02_Wiki/00_Dashboard/Screens.json` — phải có entry trước khi gọi skill.
- Skill spawn 2 sub-agent SONG SONG: `figma-reader` (MCP Figma) + `code-reader` (Read/Grep Angular). Main agent merge output + template `_Templates/screen_spec_template.md` → ghi `02_Wiki/06_Screen_Specs/<ID>_<slug>.md`.
- Kiến trúc tách 2 sub-agent là CỐ Ý để tiết kiệm context window (Figma metadata + Angular code đều lớn).

---

_Last updated: 2026-05-11_
