# 📚 My Project Vault (LLM Wiki)

Knowledge vault 3 lớp, vận hành bằng AI agents (Claude Code + CodeGraph), hiển
thị trên **Web Next.js** với tìm kiếm **RAG**.

Vault **không chứa code dự án** — nó là *bản dịch có ngữ cảnh* của code, trỏ tới
source qua `local_path`. Mục tiêu: tra cứu kiến thức dự án nhanh, tiết kiệm token
(hỏi wiki thay vì để AI đọc lại toàn bộ code).

---

## ⚡ Cài đặt nhanh

```bash
pnpm install     # cài dependencies toàn monorepo
pnpm onboard     # chạy từ thư mục gốc — không cần cd
```

`pnpm onboard` là script tương tác (idempotent, không gọi mạng):

1. **Doctor** — kiểm tra Node (≥ 20), pnpm, openssl + các biến env bắt buộc.
2. **Tạo `.env.local`** — copy từ `.env.example`, **tự sinh** `SESSION_SECRET` và
   điền `WIKI_ROOT_PATH`. Bạn chỉ cần điền tay `GOOGLE_API_KEY` và `AUTH_USERS`.
3. **Thêm dự án** — hỏi đường dẫn source, ghi vào `projects.json`.
4. **CodeGraph (khuyến nghị)** — nếu có CLI `codegraph`, chạy `codegraph init -i`
   trong source để skill `/spec-*` lần theo call graph chính xác hơn.

> _Tên `onboard` chứ không phải `setup` vì `pnpm setup` là lệnh built-in của pnpm._

Sau khi onboard, **chạy web app**:

```bash
npm run build-index                                    # embedding wiki → LanceDB
docker compose --env-file .env.local up --build        # → http://localhost:3000
```

Chi tiết Docker / env / đăng nhập: [docs/deployment.md](docs/deployment.md).

---

## 🚀 Tạo Wiki cho dự án mới (6 bước, qua AI Skills)

Vault là một **bộ khung** áp dụng cho bất kỳ dự án nào. Gõ slash command trong
Claude Code (CWD = thư mục vault):

```bash
/add-project <đường_dẫn_source>   # 1. Đăng ký + dò tech stack → projects.json
/scan-project <tên>               # 2. Quét route/controller → Screens/Features.json
/plan-wiki                        # 3. Sinh Index.md (bản đồ wiki)
/spec-feature <ID>                # 4. Sinh spec chi tiết (xem bảng skills bên dưới)
/cross-link                       # 5. Nối wikilink giữa các trang
/check-update                     # 6. (về sau) đánh dấu trang lỗi thời → /update-wiki <ID>
```

> 💡 Bước 1 đã làm sẵn nếu bạn dùng `pnpm onboard`. Build CodeGraph
> (`codegraph init -i` trong source) giúp các bước Spec chính xác hơn — xem
> [docs/architecture.md](docs/architecture.md#2-codegraph-phân-tích-cấu-trúc-code).

### Bộ AI Skills

| Skill               | Trigger                        | Mô tả                                                              | Ghi vào                        |
| ------------------- | ------------------------------ | ----------------------------------------------------------------- | ------------------------------ |
| `add-project`       | `/add-project <path>`          | Đăng ký dự án, phát hiện tech stack                                | `projects.json`                |
| `scan-project`      | `/scan-project <name>`         | Quét route/controller (Angular, Next.js, Nuxt 3, Vue)             | `Screens.json / Features.json` |
| `plan-wiki`         | `/plan-wiki`                   | Sinh `Index.md` + `WikiState.json`                                 | `00_Overview/`                 |
| `spec-business`     | `/spec-business <topic>`       | Biên dịch PRD + đối chiếu code → business spec                     | `01_Business/`                 |
| `spec-screen`       | `/spec-screen <ID>`            | 2 sub-agent song song: Figma reader + code reader                 | `02_Design/`                   |
| `spec-architecture` | `/spec-architecture <project>` | Sơ đồ C4 + sequence + queue/cron                                  | `03_Architecture/`             |
| `spec-feature`      | `/spec-feature <ID>`           | API spec: Contract / Source / Rules / Edge Cases                  | `04_API_Specs/`                |
| `spec-database`     | `/spec-database <name>`        | ERD + Data Dictionary từ Prisma/SQL/TypeORM                       | `05_Database/`                 |
| `cross-link`        | `/cross-link [--dry-run]`      | Tạo wikilink với guard chống hỏng file                            | Toàn bộ Wiki                   |
| `check-update`      | `/check-update`                | Đánh dấu `[~]` trang lỗi thời so với code                          | `WikiState.json` & `Index.md`  |
| `update-wiki`       | `/update-wiki <ID>`            | Cập nhật trang cũ, giữ ghi chú thủ công                            | `02_Wiki/**/*.md`              |
| `log-adr`           | `/log-adr <tiêu_đề>`           | Ghi Architecture Decision Record                                  | `08_ADR/`                      |
| `log-conflict`      | `/log-conflict`                | Ghi xung đột PRD ↔ code (append-only)                             | `07_Tasks_&_Logs/`             |
| `ask-vault`         | `/ask-vault`                   | Tra cứu wiki + code-graph + source để trả lời câu hỏi             | (read-only)                    |

> Skills đọc `local_path` từ `projects.json` để truy cập source — ưu tiên
> CodeGraph MCP, fallback Read/Grep nếu chưa có index.

---

## 📖 Tài liệu chi tiết

| Tài liệu | Nội dung |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Cấu trúc 3 lớp, triết lý vận hành, cấu hình MCP (Figma/CodeGraph/Drive/llm-wiki) |
| [docs/deployment.md](docs/deployment.md) | Docker, env, đăng nhập, ingestion, API RAG |
| [docs/commands.md](docs/commands.md) | Bảng lệnh `npm`/`pnpm` đầy đủ + quy ước commit |
| [`apps/System/CLAUDE.md`](apps/System/CLAUDE.md) | Hợp đồng vận hành đầy đủ cho AI |
| [`apps/mcp/README.md`](apps/mcp/README.md) | MCP server cho AI ở repo khác đọc wiki |

## 👥 Onboarding cho Team

1. Clone vault → `pnpm install && pnpm onboard`.
2. Làm theo **"Tạo Wiki cho dự án mới"** ở trên.
3. Chạy web app để duyệt wiki + tìm kiếm RAG + xem knowledge graph tại
   `/graph` (xem [docs/deployment.md](docs/deployment.md)).
4. Chạy `npm run index-vault` (trong `apps/System/`) sau mỗi cập nhật lớn để tối
   ưu RAG.
