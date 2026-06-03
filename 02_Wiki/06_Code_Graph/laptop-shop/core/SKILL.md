---
name: core
description: "Skill for the core area of laptop-shop (1 files indexed)."
type: architecture
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop/src/core"
status: draft
last_synced: 2026-06-03
tags:
  - code-graph
  - codegraph
  - laptop-shop
  - core
---

# core · laptop-shop

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Project local path:** `/Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
**Vị trí:** `src/core` — 1 file indexed.

## Code Context

**Query:** Explain the core area: main components, entry points, key symbols

### Entry Points

- **main** (function) - prisma/seed.ts:12
  `()`
- **IS_PUBLIC_KEY** (constant) - src/common/decorators/customize.ts:7
  `= 'isPublic'`

### Related Symbols

- prisma/seed.ts: seedPermissions:33, seedRoles:77, seedRolePermissions:116, seedUsers:151, seedProducts:235

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Tìm callers: `codegraph callers <symbol> -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Impact analysis: `codegraph impact <symbol> -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project laptop-shop
- [[Index]] — Dashboard chính
