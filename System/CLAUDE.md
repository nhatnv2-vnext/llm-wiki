# CLAUDE.md — Bộ Não Trung Tâm của Vault

> File này là **single source of truth** cho mọi AI agent (Claude Code, GitNexus, sub-agents) khi làm việc trong vault.
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
| **Node.js / TypeScript / Angular / NestJS / Next.js / Vue** | **ts-morph** | GitNexus **KHÔNG** resolve được path alias (`@/`, `~/`, `#app/`) và không hiểu monorepo (turborepo, nx, pnpm/yarn workspaces). ts-morph tự đọc `tsconfig.json` (kể cả `paths`) và walk AST chính xác. |
| Python | GitNexus hoặc `ast` builtin | OK |
| Go / Java / Rust | GitNexus | OK |

⚠️ **Luật cứng cho dự án Frontend/Node:** Mọi script ingest phải dùng `ts-morph`. Nếu thấy code dùng GitNexus cho Node project → dừng và đổi parser.

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
| `npm run code-graph` | Chạy GitNexus lên code → output Markdown sang `02_Wiki/05_Code_Graph/` |
| `npm run index-vault` | Sinh `Vault_Index.json` cho RAG |
| `npm run stats` | Cập nhật bảng "Vault Stats" trong `Index.md` |
| `npm run validate` | Chain `lint-specs` + `audit-links` (dùng cho CI) |

### 4.1. GitNexus — cài và dùng

GitNexus chỉ là **tool**, không phải nội dung vault.

- **Cài 1 lần** (user tự chạy lệnh sudo, AI không tự chạy):
  ```bash
  sudo npm install -g gitnexus
  ```
- **KHÔNG** clone source GitNexus vào vault.
- **KHÔNG** cài cục bộ vào subfolder của vault.
- **Output**: chỉ file `.md` mới được copy sang `02_Wiki/05_Code_Graph/<project>/`. Wrapper trong `System/agent_skills/run_gitnexus.sh`.
- Index nội bộ của GitNexus (LadybugDB) nằm ở `01_Raw/codebase/<project>/.gitnexus/` — không đồng bộ ngược, không edit.

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
- Skill phải đọc `MEMORY.md` trước để biết các quyết định đã chốt (parser ts-morph, install GitNexus global, …).

---

_Last updated: 2026-05-11_
