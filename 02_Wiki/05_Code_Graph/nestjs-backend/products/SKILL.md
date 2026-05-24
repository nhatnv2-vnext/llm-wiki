---
name: products
description: "Skill for the products area of nestjs-backend (8 files indexed)."
type: architecture
source:
  - 01_Raw/codebase/nestjs-backend/src/products
status: draft
last_synced: 2026-05-24
tags:
  - code-graph
  - codegraph
  - nestjs-backend
  - products
---

# products · nestjs-backend

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Vị trí:** `01_Raw/codebase/nestjs-backend/src/products` — 8 file indexed.

## Code Context

**Query:** Explain the products area: main components, entry points, key symbols

### Entry Points

- **Product** (class) - src/products/entities/product.entity.ts:1
- **main** (function) - prisma/seed.ts:12
  `()`
- **ProductsModule** (class) - src/products/products.module.ts:11

### Related Symbols

- src/products/entities/product.entity.ts: id:2, name:3, price:4, image:5, detailDesc:6
- prisma/seed.ts: seedPermissions:33, seedRoles:77, seedRolePermissions:116, seedUsers:151, seedProducts:235

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p 01_Raw/codebase/nestjs-backend`
- Tìm callers: `codegraph callers <symbol> -p 01_Raw/codebase/nestjs-backend`
- Impact analysis: `codegraph impact <symbol> -p 01_Raw/codebase/nestjs-backend`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project nestjs-backend
- [[Index]] — Dashboard chính
