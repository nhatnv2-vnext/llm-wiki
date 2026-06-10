# 📚 My Project Vault (LLM Wiki)

Knowledge vault 3 lớp, vận hành bằng AI agents (Claude Code + CodeGraph) và hiển thị trên **Obsidian** và **Web Next.js**.

## 🚀 Bắt đầu nhanh

1. Mở thư mục này bằng **Obsidian** → chọn "Open folder as vault".
2. Mở file [`02_Wiki/00_Overview/Index.md`](02_Wiki/00_Overview/Index.md) (Map of Content) để có cái nhìn tổng quan.
3. Đọc [`apps/System/CLAUDE.md`](apps/System/CLAUDE.md) để hiểu triết lý vận hành và quy tắc dành cho AI.

### 🔌 Cấu hình các công cụ AI (MCP Servers)

**MCP (Model Context Protocol)** là các plugin giúp AI có thể tương tác trực tiếp với các hệ thống bên ngoài (đọc Figma, phân tích cấu trúc Code, truy cập Google Drive). Để AI có đầy đủ "siêu năng lực", bạn cần cấu hình các MCP trong file `.mcp.json` (nằm ở thư mục gốc của Vault).

1. **Figma API (Trích xuất giao diện thiết kế):**
   - Lấy token tại: **Figma > Settings > Personal access tokens**.
   - Mở terminal và thêm biến môi trường (vào `~/.zshrc` hoặc `~/.bash_profile`):
     ```bash
     export FIGMA_API_KEY="figd_..."
     ```
   - _Lưu ý: Không nên ghi cứng (hardcode) token vào file `.mcp.json` để tránh rò rỉ bảo mật._

2. **CodeGraph (Phân tích cấu trúc Source Code - Cực kỳ quan trọng):**
   - CodeGraph giúp AI hiểu được quan hệ gọi hàm (controller → service → repository), tìm callers/callees chính xác hơn nhiều so với việc chỉ tìm kiếm text thông thường.
   - **Cài đặt CLI (1 lần duy nhất):** 
     ```bash
     npm i -g @colbymchenry/codegraph
     ```
   - **Cách kích hoạt:** Bạn phải chạy CodeGraph **bên trong TỪNG thư mục mã nguồn** của dự án (KHÔNG phải chạy ở thư mục Vault). 
     ```bash
     cd /đường_dẫn/tới/source-project   # vd: /Users/admin/code/my-app
     codegraph init -i                  # Lệnh này tạo thư mục .codegraph/ (chỉ chạy 1 lần)
     ```
   - CodeGraph sẽ tự động lắng nghe và cập nhật mỗi khi code của bạn thay đổi. 
   - *Kiểm tra:* Gõ `/mcp` trong phiên làm việc của Claude để xem MCP CodeGraph đã kết nối chưa.

3. **Google Drive (Đọc tài liệu Yêu cầu / PRD):**
   - Khi bạn yêu cầu AI đọc tài liệu từ Drive lần đầu tiên, hệ thống sẽ in ra một đường link trên terminal. Hãy click vào link đó để cấp quyền xác thực (OAuth).

4. **MarkItDown (Công cụ bóc tách PDF thành Markdown - Tuỳ chọn):**
   - Dùng để chạy script `npm run parse-docs` giúp bóc tách text từ file PDF. Chỉ cần cài trên máy tính cá nhân của bạn.
   - **Cài đặt (macOS / Linux):**
     ```bash
     brew install pipx
     pipx install 'markitdown[pdf]'
     ```
   - Nếu PDF của bạn chứa chữ nằm trong ảnh (bảng biểu scan), công cụ sẽ cần thêm thư viện OCR để đọc chữ:
     ```bash
     # macOS
     brew install tesseract poppler
     ```

5. **llm-wiki MCP (Cho AI ở dự án KHÁC đọc Wiki này):**
   - MCP server read-only trong `apps/mcp/` — AI agents (Claude Code, Cursor) connect vào để tra cứu wiki (semantic search, đọc trang, wikilinks) khi code / lên plan / fix bug ở các repo khác.
   - Trong repo này: đã đăng ký sẵn trong `.mcp.json` (server `llm-wiki`).
   - Ở repo khác (local, stdio):
     ```bash
     claude mcp add --scope user llm-wiki -- \
       /đường_dẫn/tới/llm-wiki/node_modules/.bin/tsx \
       /đường_dẫn/tới/llm-wiki/apps/mcp/src/stdio.ts
     ```
   - Deploy EC2 (HTTP): `docker compose up -d mcp` rồi `claude mcp add --transport http llm-wiki http://<host>:3001/mcp`.
   - Chi tiết: xem `apps/mcp/README.md`.

## 🏗 Cấu trúc 3 lớp (3-Layer Architecture)

Vault được thiết kế theo nguyên tắc phân tách ranh giới rõ ràng:

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
│   ├── 08_ADR/                      ←   Architecture Decision Records (✨ Mới)
│   ├── 09_Testing/                  ←   Chiến lược kiểm thử + coverage (✨ Mới)
│   ├── 10_Security/                 ←   Auth/RBAC + API security (✨ Mới)
│   └── _Templates/                  ←   Template chuẩn cho từng loại tài liệu
└── apps/
    ├── System/                      ← Layer 3: Bộ não (Scripts, Skills, CLAUDE.md)
    ├── mcp/                         ← MCP server read-only (AI ngoài đọc wiki)
    └── web/                         ← App Next.js (RAG UI, graph view)
```

> **Kiến trúc JSON-based links:** Vault không chứa source code trực tiếp. Thay vào đó, các file JSON (`projects.json`, `schemas.json`) chứa tên + đường dẫn local (`local_path`) trỏ tới thư mục/file trên máy tính. Scripts và AI agents sẽ đọc đường dẫn này để trích xuất kiến thức, giúp vault gọn nhẹ và linh hoạt.

## 🧠 Triết lý vận hành

Lấy cảm hứng từ phương pháp **context engineering + spec-driven development** ([Karpathy LLM Council](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)):

- **Code là sự thật (Single Source of Truth):** AI sẽ đọc code và chuyển hóa thành bản dịch có ngữ cảnh trong Wiki, không phải là nơi lưu trữ bản sao của code.
- **Bất khả xâm phạm:** AI chỉ được phép đọc ở Layer 1 (`01_Raw`) và ghi vào Layer 2 (`02_Wiki`).
- **Ghi nhận thay vì tự ý sửa:** Mọi xung đột (conflict) giữa code thực tế và tài liệu đặc tả (PRD) đều được AI phát hiện và log lại tại `02_Wiki/07_Tasks_&_Logs/Conflict_Reports.md`.
- **Versioning (Archiving):** Khi AI cập nhật một file trong Wiki, nó BẮT BUỘC phải copy/di chuyển phiên bản cũ vào `02_Wiki/_Archive/` để lưu lại lịch sử trước khi ghi đè nội dung mới.

## 🐳 Chạy Web App (Docker)

Web app (`apps/web`) hiển thị Wiki dưới dạng website với tính năng RAG search.

### Yêu cầu

- Docker & Docker Compose v2.1+
- Google API Key — dùng cho cả embedding (`gemini-embedding-001`) và sinh câu
  trả lời (`gemini-2.5-flash` qua Vercel AI SDK)

### API RAG

| Endpoint           | Mô tả                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/search` | Nhận `{ query }` → trả Top-5 chunk liên quan (`text_content` + `file_path`), đã dedupe.                                       |
| `POST /api/chat`   | Nhận `{ query }` → **stream** (SSE) câu trả lời Markdown bám ngữ cảnh wiki, kèm `sources` (file_path) trong message metadata. |

Cả hai có guardrails: chặn prompt injection / từ độc hại / query quá dài, che
PII, và từ chối câu hỏi ngoài phạm vi wiki (`outOfScope`). `/api/chat` chỉ trả
lời dựa trên context nội bộ, không bịa kiến thức ngoài.

### Cấu hình môi trường

Tạo file env tương ứng với môi trường bạn muốn chạy (không commit các file này lên git):

```bash
# Tham khảo .env.example
cp .env.example .env.local      # local
cp .env.example .env.staging    # staging
cp .env.example .env.production # production
```

Mở file vừa tạo và điền các biến (xem [`.env.example`](.env.example)):

```env
GOOGLE_API_KEY=your-google-api-key-here
# Chỉ cần cho chạy local/ingest ngoài Docker (Docker tự ghi đè 2 biến này):
WIKI_ROOT_PATH=/absolute/path/to/My_Project_Vault/02_Wiki
LANCEDB_PATH=.lancedb
```

> Env khai báo ở **một nơi duy nhất**: `.env.local` ở gốc monorepo. Compose,
> local dev và script ingest đều đọc chung file này.

### Chạy

```bash
# Local
docker compose --env-file .env.local up --build

# Staging
docker compose --env-file .env.staging up --build

# Production
docker compose --env-file .env.production up --build
```

**Mỗi lần** container khởi động, `entrypoint.sh` tự động:

1. Chạy ingestion pipeline — đọc toàn bộ `02_Wiki/`, embedding và lưu vào LanceDB
2. Khởi động Next.js server tại `http://localhost:3000`

Từ lần 2 trở đi, ingestion chỉ re-embed các file đã thay đổi (incremental) nên restart rất nhanh.

> **Lưu ý — Docker KHÔNG dùng `npm run build-index`.** Để image runtime gọn và
> không phụ thuộc `tsx`/pnpm, ingestion được đóng gói khác:
>
> - Lúc **build image**: `esbuild` bundle `scripts/ingest-rag.ts` thành
>   `ingest-rag.mjs`, đặt cùng `node_modules` riêng trong thư mục `/ingest`.
> - Lúc **container chạy**: `entrypoint.sh` gọi `node /ingest/ingest-rag.mjs`
>   rồi mới khởi động Next.js (`node server.js`).
>
> Cả hai đường (`npm run build-index` ở local và `/ingest/ingest-rag.mjs` trong
> Docker) **dùng chung file nguồn** `scripts/ingest-rag.ts` nên logic incremental
> giống hệt nhau — chỉ khác cách đóng gói & thời điểm chạy. Trong Docker, biến
> env do Compose bơm sẵn vào `process.env`, không đọc từ file `.env.local`.

### Chạy ingestion thủ công (ngoài Docker)

Script `build-index` đọc toàn bộ `02_Wiki/`, embedding qua Google rồi lưu vào
LanceDB. Có thể chạy từ **gốc monorepo** hoặc từ `apps/web` (kết quả như nhau):

```bash
# Từ gốc monorepo (My_Project_Vault/)
npm run build-index               # incremental — chỉ re-embed file đã thay đổi
npm run build-index -- --force    # reset & re-index toàn bộ

# Hoặc từ apps/web
cd apps/web && npm run build-index
```

Xem nhanh nội dung index đã build:

```bash
npm run view-index                # (chạy được từ gốc hoặc apps/web)
```

> **Yêu cầu env (khai báo ở MỘT nơi):** `GOOGLE_API_KEY`, `WIKI_ROOT_PATH`,
> `LANCEDB_PATH` phải có trong `.env.local` ở **gốc monorepo**
> (`My_Project_Vault/.env.local`). Local dev (`apps/web`), script ingest và
> Docker Compose đều đọc chung file này — không cần tạo `apps/web/.env.local`
> riêng. Tham khảo [`.env.example`](.env.example).
>
> Lần đầu chạy `build-index` có thể mất vài phút (gọi Google Embedding API cho
> mọi chunk). Các lần sau là incremental nên rất nhanh.

---

## 🛠 Lệnh nhanh (NPM Scripts)

Các script tự động hóa được đặt trong thư mục `System`:

```bash
cd apps/System

# Đồng bộ dữ liệu gốc
npm run sync-drive      # Kéo (pull) docs từ Google Drive → 01_Raw/drive_docs (tự chạy archive-prd sau đó)
npm run archive-prd     # Versioning PRD: đẩy bản cũ vào drive_docs/archive/, ghi con trỏ .current
npm run parse-docs      # Bóc tách PDF (PRD*.pdf) → Markdown; TỰ bật OCR nếu PDF có ảnh

# Phân tích và sinh Wiki
npm run ingest          # Build lại wiki từ source code (sử dụng ts-morph)
npm run code-graph      # Sinh CodeGraph markdown vào 02_Wiki/06_Code_Graph
npm run generate-graph  # Vẽ lại sơ đồ Mermaid từ AST

# Validation và RAG (AI)
npm run validate        # Kiểm tra tính toàn vẹn của vault (lint-specs + audit-links)
npm run index-vault     # Build Vault_Index.json dùng cho RAG
npm run stats           # Cập nhật thông số thống kê vào bảng Vault Stats
```

## 🚀 Cách cấu trúc Wiki cho dự án mới (Luồng AI tự động)

Vì Vault này được thiết kế như một **bộ khung (template)**, bạn có thể áp dụng cho bất kỳ dự án phần mềm nào (cả Frontend và Backend). Nhờ vào bộ AI Skills tích hợp, quy trình tạo Wiki giờ đây được tự động hóa qua 5 bước:

## 🤖 Bộ AI Skills (`.claude/skills/`)

Vault tích hợp **13 AI skills** kích hoạt qua slash command trong Claude Code:

| Skill               | Trigger                        | Mô tả                                                                                                   | Ghi vào                        |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `add-project`       | `/add-project <path>`          | Đăng ký dự án mới, phát hiện tech stack                                                                 | `01_Raw/projects.json`         |
| `scan-project`      | `/scan-project <name>`         | Quét route/controller → catalog màn hình & API · **Hỗ trợ Angular, Next.js App Router, Nuxt 3, Vue**    | `Screens.json / Features.json` |
| `plan-wiki`         | `/plan-wiki`                   | Sinh `Index.md` và `WikiState.json` để theo dõi tình trạng tạo tài liệu.                               | `00_Overview/Index.md`         |
| `check-update`      | `/check-update`                | **Mới:** Phát hiện thay đổi của code và tài liệu, đánh dấu `[~]` những mục bị lỗi thời cần update.      | `WikiState.json` & `Index.md`  |
| `update-wiki`       | `/update-wiki <ID>`            | **Mới:** Cập nhật thông minh tài liệu cũ dựa trên thay đổi mới, bảo vệ ghi chú thủ công của user.       | `02_Wiki/**/*.md`              |
| `spec-business`     | `/spec-business <topic>`       | Biên dịch PRD + đối chiếu code → business spec                                                          | `01_Business/`                 |
| `spec-screen`       | `/spec-screen <ID>`            | 2 sub-agent song song: Figma reader + code reader                                                       | `02_Design/`                   |
| `spec-architecture` | `/spec-architecture <project>` | Sinh sơ đồ C4 + sequence + queue/cron                                                                   | `03_Architecture/`             |
| `spec-feature`      | `/spec-feature <ID>`           | **Nâng cấp:** 2 sub-agent song song (code + test), 4 section bắt buộc: Contract/Source/Rules/Edge Cases | `04_API_Specs/`                |
| `spec-database`     | `/spec-database <name>`        | ERD Mermaid + Data Dictionary từ Prisma/SQL/TypeORM                                                     | `05_Database/`                 |
| `log-adr`           | `/log-adr <tiêu_đề>`           | **Mới:** Ghi nhận Architecture Decision Record                                                          | `08_ADR/`                      |
| `cross-link`        | `/cross-link [--dry-run]`      | **Nâng cấp:** Tạo wikilink với guard chống hỏng file, hỗ trợ dry-run                                    | Toàn bộ Wiki                   |
| `ask-vault`         | `/ask-vault`                   | Tra cứu wiki + code-graph + source code để trả lời câu hỏi về dự án                                     | (read-only)                    |
| `log-conflict`      | `/log-conflict`                | Ghi nhận xung đột PRD ↔ code (append-only)                                                              | `07_Tasks_&_Logs/`             |
| `skill-creator`     | meta                           | Tạo và cải thiện skill mới với eval/benchmark                                                           | `.claude/skills/`              |

> **Ghi chú:** Skills đọc `local_path` từ `01_Raw/codebase/projects.json` để truy cập source code — vault không chứa code trực tiếp. Skills ưu tiên **CodeGraph MCP** cho traversal, fallback sang Read/Grep nếu chưa có index.

### Bước 1: Đăng ký dự án mới (Add Project)

Bạn không cần mở file cấu hình bằng tay. Chỉ cần gọi lệnh và cung cấp đường dẫn thư mục code trên máy của bạn:

```bash
/add-project <đường_dẫn_tuyệt_đối_tới_thư_mục_code>
```

AI sẽ tự động phân tích đó là dự án Frontend, Backend hay Monorepo và ghi danh nó vào file `01_Raw/codebase/projects.json`.

### Bước 1b: Build CodeGraph cho source code (khuyến nghị)

CodeGraph là index AST giúp các bước Spec sau (Bước 4) lần theo quan hệ gọi
(controller → service → DB), callers/callees và impact analysis **chính xác hơn**
so với chỉ grep. **Tùy chọn** — nếu bỏ qua, skill tự fallback sang Read/Grep.

```bash
npm i -g @colbymchenry/codegraph        # cài CLI 1 lần (kiểm tra: which codegraph)

cd <local_path_của_project>             # vào đúng thư mục source vừa add ở Bước 1
codegraph init -i                        # tạo .codegraph/ trong project (1 lần)
```

> Build index **trong từng thư mục source**, KHÔNG phải ở vault. File watcher tự
> cập nhật khi code đổi. Skill sẽ tự trỏ tới `.codegraph/` của project qua
> `projectPath`. Chi tiết: xem mục _"Cấu hình các công cụ AI (MCP Servers) → CodeGraph"_ ở đầu README.

### Bước 2: Quét Source Code tự động (Scan)

Không cần phải nhập tay danh sách màn hình hay API nữa. Hãy ra lệnh cho AI quét dự án vừa thêm:

```bash
/scan-project <tên_project>
```

- **Nếu là Frontend:** AI sẽ tự động đọc code, trích xuất cấu trúc Route/Pages và lưu vào file `01_Raw/screens/Screens.json`.
- **Nếu là Backend:** AI sẽ tìm các Controllers, Handlers, Services và lưu vào `01_Raw/features/Features.json`.

### Bước 3: Tự động lên Dàn ý (Plan)

Sau khi có dữ liệu thô từ Bước 2, bạn gõ lệnh:

```bash
/plan-wiki
```

AI sẽ gom nhóm các Màn hình, Tính năng backend và Database Schema để sinh ra file `02_Wiki/Index.md`. Đây chính là "Bản đồ" (Map of Content) của toàn bộ dự án.

### Bước 4: Sinh tài liệu chi tiết (Spec)

Dựa vào file `Index.md`, bạn có thể ra lệnh cho AI viết tài liệu chi tiết cho từng phần:

- Đối với giao diện Frontend: Gõ `/spec-screen <ID>` (ví dụ: `/spec-screen SCR_001`).
- Đối với API/Logic Backend: Gõ `/spec-feature <ID>` (ví dụ: `/spec-feature FEA_002`).
- Database: Gõ `/spec-database <name>` (ví dụ: `/spec-database laptop-shop-db`).
- Kiến trúc tổng thể: Gõ `/spec-architecture <project>` (ví dụ: `/spec-architecture nestjs-backend`).
- Nghiệp vụ / PRD: Gõ `/spec-business <topic>` (ví dụ: `/spec-business checkout`).
- Quyết định kiến trúc: Gõ `/log-adr <tiêu_đề>` (ví dụ: `/log-adr Chọn Redis thay vì WebSocket`).

> 💡 Nếu đã build CodeGraph ở **Bước 1b**, các skill này sẽ dùng index đó để
> trích call graph / quan hệ service↔bảng chính xác (kèm `file:line`) thay vì đọc mò.

### Bước 5: Liên kết Tri thức (Cross-link)

Cuối cùng, sau khi đã tạo xong nhiều tài liệu, hãy gõ:

```bash
/cross-link
```

AI sẽ tự động rà soát toàn bộ các file `.md` và tạo ra các Wikilink `[[Liên kết chéo]]` giữa các tính năng, API và Database, biến Wiki thành một mạng lưới tri thức vững chắc.

### Bước 6: Living Documentation (Cập nhật Wiki liên tục)

Dự án phần mềm luôn thay đổi. Thay vì phải tạo lại toàn bộ Wiki mỗi khi có code mới, hệ thống cung cấp cơ chế **Cập nhật tăng dần (Incremental Update)**:

1. Mỗi khi code thay đổi hoặc có tài liệu Yêu cầu mới, hãy gõ:
   ```bash
   /check-update
   ```
   Hệ thống sẽ quét và nhận diện những Tính năng/Màn hình nào bị lỗi thời so với mã nguồn và đánh dấu chúng bằng ký hiệu `[~]` (needs update) trong `Index.md`.

2. Để cập nhật tài liệu lỗi thời mà **không làm mất các ghi chú thủ công** của bạn trước đó, hãy gõ:
   ```bash
   /update-wiki <ID>
   ```
   (Ví dụ: `/update-wiki FEA_002`). AI sẽ tự đối chiếu file cũ và dữ liệu mới để bổ sung thông minh!

## 👥 Hướng dẫn Onboarding nhanh cho Team

1. Clone vault này về máy.
2. Làm theo các bước ở phần **"Cách cấu trúc Wiki cho dự án mới"**.
3. Mở vault bằng ứng dụng Obsidian (File → Open vault).
4. Để team cùng làm việc, hãy chạy `npm run index-vault` (trong folder `apps/System/`) mỗi khi có cập nhật lớn để tối ưu RAG.

### Quy ước commit (Commit Conventions)

- Mọi thay đổi trong `02_Wiki/**/*.md` sẽ đi qua hook `lint-specs` và `audit-links` tự động trước khi commit.
- Phân biệt các file không cần đẩy lên Git (đã cấu hình sẵn trong `.gitignore`): `codegraph.sqlite`, `Vault_Index.json`, `node_modules/`.
- Chỉ commit các file dữ liệu tĩnh (.md) để chia sẻ kiến thức với team.
- Khi tạo PR, Github Actions sẽ tự động chạy lại các bài kiểm tra (`lint-specs`, `audit-links`, `index-vault`).
- File auto-gen **không đưa vào Git (`.gitignore`)**: `Vault_Index.json`, `node_modules/`, `.codegraph/`, `dist/`,...
- Thư mục `02_Wiki/_Archive/` được `.gitignore` bỏ qua vì Git đã quản lý version, đây chỉ là bản backup local cho AI.
- File auto-gen **được commit vào Git** (chia sẻ cho team): `02_Wiki/06_Code_Graph/<project>/*.md`.
