---
name: users
description: "Skill for the users area of nestjs-backend (7 files indexed)."
type: architecture
source:
  - 01_Raw/codebase/nestjs-backend/src/users
status: draft
last_synced: 2026-05-24
tags:
  - code-graph
  - codegraph
  - nestjs-backend
  - users
---

# users · nestjs-backend

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Vị trí:** `01_Raw/codebase/nestjs-backend/src/users` — 7 file indexed.

## Code Context

**Query:** Explain the users area: main components, entry points, key symbols

### Entry Points

- **User** (class) - src/users/entities/user.entity.ts:3
- **main** (function) - prisma/seed.ts:12
  `()`
- **UsersModule** (class) - src/users/users.module.ts:10

### Related Symbols

- src/users/entities/user.entity.ts: id:4, username:5, password:6, fullName:7, address:8
- prisma/seed.ts: seedPermissions:33, seedRoles:77, seedRolePermissions:116, seedUsers:151, seedProducts:235

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p 01_Raw/codebase/nestjs-backend`
- Tìm callers: `codegraph callers <symbol> -p 01_Raw/codebase/nestjs-backend`
- Impact analysis: `codegraph impact <symbol> -p 01_Raw/codebase/nestjs-backend`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project nestjs-backend
- [[Index]] — Dashboard chính
