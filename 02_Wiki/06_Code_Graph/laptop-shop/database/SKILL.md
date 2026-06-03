---
name: database
description: "Skill for the database area of laptop-shop (3 files indexed)."
type: architecture
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop/src/database"
status: draft
last_synced: 2026-06-03
tags:
  - code-graph
  - codegraph
  - laptop-shop
  - database
---

# database · laptop-shop

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Project local path:** `/Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
**Vị trí:** `src/database` — 3 file indexed.

## Code Context

**Query:** Explain the database area: main components, entry points, key symbols

### Entry Points

- **main** (function) - prisma/seed.ts:12
  `()`
- **DatabaseModule** (class) - src/database/database.module.ts:9
- **cleanDatabase** (method) - src/database/prisma.service.ts:45
  `()`

### Related Symbols

- prisma/seed.ts: seedPermissions:33, seedRoles:77, seedRolePermissions:116, seedUsers:151, seedProducts:235
- src/database/prisma.service.ts: PrismaService:11

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Tìm callers: `codegraph callers <symbol> -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Impact analysis: `codegraph impact <symbol> -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project laptop-shop
- [[Index]] — Dashboard chính
