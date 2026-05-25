---
title: Index
type: <architecture | api | schema | task | log | dashboard>
source:
  - 01_Raw/codebase/<path>
status: draft
last_synced: 2026-05-12
tags:
  - moc
  - dashboard
  - index
---

# 🧭 Map of Content (MOC)

> Trang chủ của vault. Mọi khám phá đều bắt đầu từ đây.
> AI agents nên đọc trang này trước khi đi sâu vào bất kỳ chủ đề nào (xem `System/CLAUDE.md` mục 6).

---

## 🏛 Kiến trúc hệ thống
- [[System_Overview]] — Stack tổng (NestJS + Prisma + MySQL + Bull/Redis + Angular SSR), sơ đồ C4
- [[Frontend_Overview]] — **Angular 21**: routes, NgRx store, guards, interceptor JWT, SSR render mode
- [[Frontend_NgRx_Store]] — Catalogue mọi feature store NgRx + quy ước thêm feature mới
- [[Email_Queue_Flow]] — Flow gửi mail bất đồng bộ qua Bull (welcome / password-reset / order-confirmation)
- [[Cronjob_Flow]] — 2 job định kỳ (`cancel-expired-orders`, `queue-maintenance`) + lifecycle log

## 🔌 API
- [[Auth_API]] — Login, register, refresh, logout, permissions
- [[Users_API]] — CRUD user + /me + change-password
- [[Roles_API]] — Quản lý role + gán permission (admin)
- [[Products_API]] — Products + Cart + Orders (13 endpoint)
- [[Cronjob_API]] — Admin monitor cronjob + email queue

## 🗄 Database
- [[Schema_Design]] — MySQL `nodejspro`, 12 model Prisma (users, products, orders, email_queue…)

## 🐞 Tasks & Logs
- [[Conflict_Reports]] — Xung đột giữa code và PRD
- [[04_Tasks_&_Logs/Ingest_Plans/README|Ingest Plans]] — Plan-review gate cho LLM-driven write (xem `CLAUDE.md §2.2`)

## 🕸 Code Graph (CodeGraph)
- [[05_Code_Graph/README|Code Graph index]] — Skill markdown sinh tự động bằng `codegraph context` per area
- Rebuild: `npm --prefix System run code-graph`
- Query live qua MCP: `npm --prefix System run code-graph:mcp` (hoặc `codegraph install` để add MCP cho Claude Code)

## 🤖 LLM / RAG
- Slash command `/ask-vault` (Claude Code): `.claude/skills/ask-vault/SKILL.md` — chạy `claude` từ trong vault để skill được load
- Slash command `/spec-screen <ID>`: sinh functional spec màn hình từ Figma + Angular code (`.claude/skills/spec-screen/SKILL.md`) → output `02_Wiki/06_Screen_Specs/`
- Danh mục màn hình: [Screens.json](Screens.json) — nguồn dữ liệu của `/spec-screen`
- System prompt RAG ngoài Claude Code: `System/PROMPTS/ask_vault_system.md`
- Index nhanh cho RAG: `02_Wiki/00_Dashboard/Vault_Index.json` (chạy `npm run index-vault`).

---

## 📌 Trạng thái sync gần nhất

| Layer | Nguồn | Lần cuối |
|-------|-------|----------|
| Drive docs | `gdrive:MyProjectDocs` | _chưa sync_ |
| Codebase | `01_Raw/codebase/nestjs-backend` (laptop-shop) | 2026-05-12 |
| Codebase | `01_Raw/codebase/angular-frontend` (Angular 21 + NgRx + Tailwind) | 2026-05-12 |
| Wiki | viết tay theo Prisma schema | 2026-05-12 |

## 📊 Vault Stats

<!-- VAULT_STATS:START — auto-generated, do not edit by hand. Run `npm run stats`. -->

| Metric | Count |
|--------|-------|
| Wiki notes | **13** |
| Wikilinks | **58** |
| Code-graph skills | **12** |
| API endpoints documented | **38** |
| Prisma models | **12** |
| Last updated | 2026-05-12 |

<!-- VAULT_STATS:END -->

## 🚀 Lệnh nhanh
```bash
npm install -g @colbymchenry/codegraph    # cài CLI 1 lần (chỉ lần đầu)
npm --prefix "System" run sync-drive      # pull docs mới
npm --prefix "System" run ingest:plan     # b1: sinh plan vào Ingest_Plans/
npm --prefix "System" run ingest:apply <plan>  # b2: apply plan đã approve
npm --prefix "System" run code-graph      # CodeGraph → 02_Wiki/05_Code_Graph
npm --prefix "System" run code-graph:mcp  # CodeGraph MCP server (query live)
npm --prefix "System" run validate        # lint-specs + audit-links (chain)
npm --prefix "System" run index-vault     # sinh Vault_Index.json cho RAG
npm --prefix "System" run stats           # cập nhật bảng Vault Stats ở trên
npm --prefix "System" run generate-graph  # vẽ lại Mermaid
```

