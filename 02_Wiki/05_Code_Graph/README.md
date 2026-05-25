---
title: Code Graph (CodeGraph output)
type: architecture
source:
  - 01_Raw/codebase
status: draft
last_synced: 2026-05-25
tags:
  - code-graph
  - codegraph
  - index
---

# 🕸 Code Graph

Thư mục này chứa **markdown output** sinh bởi [CodeGraph](https://github.com/colbymchenry/codegraph) (`@colbymchenry/codegraph`, MIT) khi quét codebase trong `01_Raw/codebase/`.

## Projects đã index

- [[angular-frontend/README|angular-frontend]] — Angular 21 + NgRx + Tailwind SSR
- [[nestjs-backend/README|nestjs-backend]] — NestJS + Prisma + MySQL + Bull

## 2 mode index (chọn theo workflow team)

| Mode | Lệnh | Khi nào dùng |
|------|------|--------------|
| **Local rebuild** | `npm --prefix System run code-graph` | Lần đầu setup, hoặc khi host snapshot down |
| **Pull snapshot** (Recommended cho team) | `npm --prefix System run code-graph:fetch` | Hàng ngày — pull DB từ host always-on, không tự index |

Setup centralized host: xem `System/agent_skills/codegraph_host/README.md` + `TAILSCALE_SETUP.md`.

## Cấu trúc output

```
05_Code_Graph/
├── README.md                ← File này (top-level index)
└── <project_name>/
    ├── README.md            ← Index project (wikilink tới từng area)
    └── <area>/
        └── SKILL.md         ← 1 file/area (thư mục con cấp 1 dưới src root)
```

Mỗi `SKILL.md` build bằng `codegraph context "Explain the <area> area..." -p <project>`.

## Workflow đầy đủ

```
[host machine] cron 30m
  → git fetch + reset submodule
  → codegraph sync
  → snapshot DB.gz vào ~/codegraph-snapshots/
  → HTTP server :7474 expose qua Tailscale
       │
       ▼
[dev machine] npm run code-graph:fetch
  → curl snapshot DB.gz
  → atomic mv vào .codegraph/codegraph.db
       │
       ▼
[Claude Code] mcp__codegraph__codegraph_search
  → query DB local (vừa pull)
       │
       ▼
[dev local] npm run code-graph
  → đọc DB local + codegraph context per area
  → ghi 02_Wiki/05_Code_Graph/<project>/<area>/SKILL.md
  → commit + PR
```

## Lưu ý

- Index nội bộ CodeGraph (SQLite) ở `01_Raw/codebase/<project>/.codegraph/codegraph.db`, **gitignored** (binary).
- Chỉ file `.md` được commit về wiki.
- Mỗi lần chạy `npm run code-graph` overwrite `05_Code_Graph/<project>/` — KHÔNG sửa thủ công file trong đây.
- CodeGraph resolve `tsconfig.paths` (`@/`, `~/`) và monorepo TS/JS.

## Liên kết

- [[Index]] — Dashboard chính
- [[../../System/CLAUDE|CLAUDE.md]] §4.1 — CodeGraph workflow detail
