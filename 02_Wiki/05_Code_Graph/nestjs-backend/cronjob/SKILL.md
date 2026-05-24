---
name: cronjob
description: "Skill for the cronjob area of nestjs-backend (6 files indexed)."
type: architecture
source:
  - 01_Raw/codebase/nestjs-backend/src/cronjob
status: draft
last_synced: 2026-05-24
tags:
  - code-graph
  - codegraph
  - nestjs-backend
  - cronjob
---

# cronjob · nestjs-backend

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Vị trí:** `01_Raw/codebase/nestjs-backend/src/cronjob` — 6 file indexed.

## Code Context

**Query:** Explain the cronjob area: main components, entry points, key symbols

### Entry Points

- **main** (function) - prisma/seed.ts:12
  `()`
- **CronjobModule** (class) - src/cronjob/cronjob.module.ts:22
- **CronjobService** (class) - src/cronjob/services/cronjob.service.ts:14

### Related Symbols

- prisma/seed.ts: seedPermissions:33, seedRoles:77, seedRolePermissions:116, seedUsers:151, seedProducts:235
- src/cronjob/services/cronjob.service.ts: logger:15, constructor:17, handleUserRegistered:24, handleCancelExpiredOrders:35, handleQueueMaintenance:118

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p 01_Raw/codebase/nestjs-backend`
- Tìm callers: `codegraph callers <symbol> -p 01_Raw/codebase/nestjs-backend`
- Impact analysis: `codegraph impact <symbol> -p 01_Raw/codebase/nestjs-backend`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project nestjs-backend
- [[Index]] — Dashboard chính
