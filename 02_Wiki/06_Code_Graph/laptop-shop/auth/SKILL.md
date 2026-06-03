---
name: auth
description: "Skill for the auth area of laptop-shop (17 files indexed)."
type: architecture
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop/src/auth"
status: draft
last_synced: 2026-06-03
tags:
  - code-graph
  - codegraph
  - laptop-shop
  - auth
---

# auth · laptop-shop

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Project local path:** `/Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
**Vị trí:** `src/auth` — 17 file indexed.

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

- Query symbol cụ thể: `codegraph query "<name>" -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Tìm callers: `codegraph callers <symbol> -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Impact analysis: `codegraph impact <symbol> -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project laptop-shop
- [[Index]] — Dashboard chính
