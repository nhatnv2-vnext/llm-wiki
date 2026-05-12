# 01_Raw — Layer 1 (CHỈ ĐỌC)

Đây là **nguồn sự thật thô**. AI agents (Claude Code, GitNexus) **TUYỆT ĐỐI KHÔNG** được ghi/sửa/xóa file trong thư mục này.

## Cấu trúc

- `drive_docs/` — Tài liệu pull từ Google Drive (PRD, biên bản họp, business rules)
  - Sync bằng `npm run sync-drive` (xem `System/agent_skills/sync_drive.sh`)
- `codebase/` — Source code thật của dự án
  - Khuyến nghị dùng **Git submodules** thay vì copy thủ công:
    ```bash
    git submodule add <repo-frontend-url> 01_Raw/codebase/nextjs-frontend
    git submodule add <repo-backend-url>  01_Raw/codebase/nestjs-backend
    ```

## Quy tắc

1. Nếu code/spec sai → KHÔNG sửa ở đây, mà log vào `02_Wiki/04_Tasks_&_Logs/Conflict_Reports.md`.
2. Mọi sửa code phải thực hiện trên repo gốc, rồi `git submodule update`.
3. File ở đây được tham chiếu (link) từ Layer 2, không bao giờ bị overwrite ngược.

## Parser theo loại codebase

| Loại code | Parser | Ghi chú |
|-----------|--------|---------|
| Node.js / TypeScript / Next.js / NestJS / Vue (kể cả monorepo) | **ts-morph** | Bắt buộc — GitNexus không resolve được `@/` alias và monorepo |
| Python | GitNexus | OK |
| Go / Java / Rust | GitNexus | OK |

Xem chi tiết trong `System/CLAUDE.md` §2.1.
