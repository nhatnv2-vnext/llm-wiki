# 01_Raw — Layer 1 (CHỈ ĐỌC)

Đây là **nguồn sự thật thô**. AI agents (Claude Code, CodeGraph) **TUYỆT ĐỐI KHÔNG** được ghi/sửa/xóa file trong thư mục này (trừ khi cập nhật metadata JSON theo quy trình).

## Cấu trúc

```text
01_Raw/
├── codebase/
│   └── projects.json      ← Danh sách project + local path đến source code
├── screens/
│   └── Screens.json       ← Catalog màn hình app + Figma node URL
├── database/
│   └── schemas.json       ← Link đến file schema DB (Prisma, SQL, ...)
└── drive_docs/
    └── .gitkeep            ← Tài liệu pull từ Google Drive (PRD, specs)
```

### `codebase/projects.json`

File JSON chứa danh sách project cần wiki. **Không cần copy/clone source code vào vault** — chỉ cần khai báo `local_path` trỏ tới thư mục code trên máy. Các script (`run_codegraph.sh`, `ingest_codebase.js`, `generate_mermaid.js`) sẽ đọc path này để truy cập source code.

Ví dụ entry:
```json
{
  "name": "nestjs-backend",
  "local_path": "/Users/you/code/laptop-shop",
  "type": "nestjs",
  "description": "Backend API NestJS + Prisma + MySQL",
  "active": true
}
```

### `screens/Screens.json`

Catalog các màn hình app. Skill `/spec-screen` đọc file này để biết danh sách screen cần sinh spec, bao gồm Figma node URL và component path. Trường `project` liên kết với entry trong `projects.json`.

### `database/schemas.json`

Danh sách file database schema (Prisma, SQL dump, TypeORM entities...). Script wiki sẽ đọc file tại `local_path` để sinh ER diagram và tài liệu schema trong `02_Wiki/03_Database/`.

### `drive_docs/`

Tài liệu pull từ Google Drive (PRD, biên bản họp, business rules). Sync bằng `npm run sync-drive` (xem `System/agent_skills/sync_drive.sh`).

## Quy tắc

1. Nếu code/spec sai → KHÔNG sửa ở đây, mà log vào `02_Wiki/04_Tasks_&_Logs/Conflict_Reports.md`.
2. Mọi sửa code phải thực hiện trên repo gốc tại `local_path`.
3. File ở đây được tham chiếu (link) từ Layer 2, không bao giờ bị overwrite ngược.

## Parser theo loại codebase

| Loại code | Parser | Ghi chú |
|-----------|--------|---------|
| Node.js / TypeScript / Next.js / NestJS / Vue (custom ingest) | **ts-morph** | Control AST chi tiết, hiểu `tsconfig.paths` |
| Code-graph overview (mọi ngôn ngữ) | **CodeGraph** (MIT) | `npm run code-graph` — sinh `.md` skill per area |
| Python (custom) | `ast` builtin | OK |

Xem chi tiết trong `System/CLAUDE.md` §2.1.
