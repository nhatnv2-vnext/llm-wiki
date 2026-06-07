# 📚 My Project Vault (LLM Wiki)

Knowledge vault 3 lớp, vận hành bằng AI agents (Claude Code + CodeGraph) và hiển thị trên **Obsidian**.
Dự án mẫu được áp dụng: **laptop-shop** (NestJS + Prisma + MySQL + Bull/Redis · Angular 21 SSR + NgRx + Tailwind).

## 🚀 Bắt đầu nhanh

1. Mở thư mục này bằng **Obsidian** → chọn "Open folder as vault".
2. Mở file [`02_Wiki/00_Overview/Index.md`](02_Wiki/00_Overview/Index.md) (Map of Content) để có cái nhìn tổng quan.
3. Đọc [`System/CLAUDE.md`](System/CLAUDE.md) để hiểu triết lý vận hành và quy tắc dành cho AI.

### Cấu hình các công cụ AI (MCP Servers)

Để AI (Claude Code) có thể đọc dữ liệu thiết kế, source code và tài liệu, bạn cần hoàn tất các cấu hình sau:

1. **Figma API (Thiếu biến môi trường `FIGMA_API_KEY`):**
   - Lấy token tại: **Figma > Settings > Personal access tokens**.
   - Mở terminal và thêm biến môi trường (vào `~/.zshrc` hoặc `~/.bash_profile`):
     ```bash
     export FIGMA_API_KEY="figd_..."
     ```
   - *Lưu ý: Không hardcode token vào file `.mcp.json` để tránh rò rỉ bảo mật.*

2. **CodeGraph (Knowledge graph của source code):**

   CodeGraph là index AST (tree-sitter) của mã nguồn, giúp các skill `/spec-feature`,
   `/spec-database`, `/spec-architecture`, `/ask-vault`... lần theo quan hệ gọi
   (controller → service → repository), tìm callers/callees và impact analysis
   chính xác hơn grep. **Tùy chọn nhưng nên có** — nếu thiếu, các skill tự fallback
   sang Read/Grep.

   - Cài CLI (1 lần): `npm i -g @colbymchenry/codegraph` (kiểm tra: `which codegraph`).
   - **Index phải build TRONG TỪNG thư mục source code** (không phải ở vault).
     Với mỗi project đã đăng ký ở `projects.json`, vào `local_path` rồi chạy:
     ```bash
     cd /đường_dẫn/tới/source-project   # vd .../code-demo/laptop-shop
     codegraph init -i                  # tạo thư mục .codegraph/ (chạy 1 lần)
     ```
   - File watcher của CodeGraph tự cập nhật index khi code đổi (~500ms debounce).
   - Skill truy vấn index của project khác qua tham số `projectPath` (trỏ tới
     thư mục chứa `.codegraph/`), nên không cần index ở vault root.
   - Mở `claude` (tương tác), khi được hỏi cấp quyền MCP trong `.mcp.json` → "Approve".
     Kiểm tra: `claude mcp list` hoặc gõ `/mcp`. Xem trạng thái index: tool
     `codegraph_status` (hoặc `codegraph status` ở thư mục project).

3. **Google Drive (Yêu cầu xác thực OAuth):**
   - Lần đầu sử dụng tính năng đọc tài liệu Drive, server sẽ yêu cầu đăng nhập. Hãy theo dõi thông báo trên terminal khi chạy Claude để bấm vào link xác thực.

## 🏗 Cấu trúc 3 lớp (3-Layer Architecture)

Vault được thiết kế theo nguyên tắc phân tách ranh giới rõ ràng:

```text
My_Project_Vault/
├── 01_Raw/                          ← Layer 1: Nguồn thô (READ-ONLY)
│   ├── codebase/projects.json       ←   Danh sách project + local path
│   ├── screens/Screens.json         ←   Catalog màn hình + Figma URL
│   ├── database/schemas.json        ←   Link đến file schema DB
│   └── drive_docs/                  ←   Tài liệu từ Google Drive
├── 02_Wiki/                         ← Layer 2: Tri thức biên dịch (AI ghi vào đây)
└── System/                          ← Layer 3: Bộ não (Scripts, Skills, CLAUDE.md)
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

| Endpoint | Mô tả |
|---|---|
| `POST /api/search` | Nhận `{ query }` → trả Top-5 chunk liên quan (`text_content` + `file_path`), đã dedupe. |
| `POST /api/chat` | Nhận `{ query }` → **stream** (SSE) câu trả lời Markdown bám ngữ cảnh wiki, kèm `sources` (file_path) trong message metadata. |

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
cd System

# Đồng bộ dữ liệu gốc
npm run sync-drive      # Kéo (pull) docs từ Google Drive → 01_Raw/drive_docs

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
> `projectPath`. Chi tiết: xem mục *"Cấu hình các công cụ AI (MCP Servers) → CodeGraph"* ở đầu README.

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

> 💡 Nếu đã build CodeGraph ở **Bước 1b**, các skill này sẽ dùng index đó để
> trích call graph / quan hệ service↔bảng chính xác (kèm `file:line`) thay vì đọc mò.

### Bước 5: Liên kết Tri thức (Cross-link)

Cuối cùng, sau khi đã tạo xong nhiều tài liệu, hãy gõ:
```bash
/cross-link
```
AI sẽ tự động rà soát toàn bộ các file `.md` và tạo ra các Wikilink `[[Liên kết chéo]]` giữa các tính năng, API và Database, biến Wiki thành một mạng lưới tri thức vững chắc.

## 👥 Hướng dẫn Onboarding nhanh cho Team

1. Clone vault này về máy.
2. Làm theo các bước ở phần **"Cách cấu trúc Wiki cho dự án mới"**.
3. Mở vault bằng ứng dụng Obsidian (File → Open vault).
4. Để team cùng làm việc, hãy chạy `npm run index-vault` (trong folder `System/`) mỗi khi có cập nhật lớn để tối ưu RAG.

### Quy ước commit (Commit Conventions)

- Mọi thay đổi trong `02_Wiki/**/*.md` sẽ đi qua hook `lint-specs` và `audit-links` tự động trước khi commit.
- Phân biệt các file không cần đẩy lên Git (đã cấu hình sẵn trong `.gitignore`): `codegraph.sqlite`, `Vault_Index.json`, `node_modules/`.
- Chỉ commit các file dữ liệu tĩnh (.md) để chia sẻ kiến thức với team.
- Khi tạo PR, Github Actions sẽ tự động chạy lại các bài kiểm tra (`lint-specs`, `audit-links`, `index-vault`).
- File auto-gen **không đưa vào Git (`.gitignore`)**: `Vault_Index.json`, `node_modules/`, `.codegraph/`, `dist/`,...
- Thư mục `02_Wiki/_Archive/` được `.gitignore` bỏ qua vì Git đã quản lý version, đây chỉ là bản backup local cho AI.
- File auto-gen **được commit vào Git** (chia sẻ cho team): `02_Wiki/06_Code_Graph/<project>/*.md`.
