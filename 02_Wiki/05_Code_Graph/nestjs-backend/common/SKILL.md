---
name: common
description: "Skill for the common area of nestjs-backend (9 files indexed)."
type: architecture
source:
  - 01_Raw/codebase/nestjs-backend/src/common
status: draft
last_synced: 2026-05-24
tags:
  - code-graph
  - codegraph
  - nestjs-backend
  - common
---

# common · nestjs-backend

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Vị trí:** `01_Raw/codebase/nestjs-backend/src/common` — 9 file indexed.

## Code Context

**Query:** Explain the common area: main components, entry points, key symbols

### Entry Points

- **main** (function) - prisma/seed.ts:12
  `()`
- **IS_PUBLIC_KEY** (constant) - src/common/decorators/customize.ts:7
  `= 'isPublic'`

### Related Symbols

- prisma/seed.ts: seedPermissions:33, seedRoles:77, seedRolePermissions:116, seedUsers:151, seedProducts:235

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p 01_Raw/codebase/nestjs-backend`
- Tìm callers: `codegraph callers <symbol> -p 01_Raw/codebase/nestjs-backend`
- Impact analysis: `codegraph impact <symbol> -p 01_Raw/codebase/nestjs-backend`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project nestjs-backend
- [[Index]] — Dashboard chính
