---
name: auth
description: "Skill for the auth area of nestjs-backend (17 files indexed)."
type: architecture
source:
  - 01_Raw/codebase/nestjs-backend/src/auth
status: draft
last_synced: 2026-05-24
tags:
  - code-graph
  - codegraph
  - nestjs-backend
  - auth
---

# auth · nestjs-backend

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Vị trí:** `01_Raw/codebase/nestjs-backend/src/auth` — 17 file indexed.

## Code Context

**Query:** Explain the auth area: main components, entry points, key symbols

### Entry Points

- **main** (function) - prisma/seed.ts:12
  `()`
- **AuthModule** (class) - src/auth/auth.module.ts:46
- **AuthService** (class) - src/auth/auth.service.ts:10

### Related Symbols

- prisma/seed.ts: seedPermissions:33, seedRoles:77, seedRolePermissions:116, seedUsers:151, seedProducts:235
- src/auth/auth.service.ts: constructor:11, validateUser:18, login:28, register:48, refreshToken:73

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p 01_Raw/codebase/nestjs-backend`
- Tìm callers: `codegraph callers <symbol> -p 01_Raw/codebase/nestjs-backend`
- Impact analysis: `codegraph impact <symbol> -p 01_Raw/codebase/nestjs-backend`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project nestjs-backend
- [[Index]] — Dashboard chính
