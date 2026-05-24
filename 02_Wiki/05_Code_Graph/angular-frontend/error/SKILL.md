---
name: error
description: "Skill for the error area of angular-frontend (1 files indexed)."
type: architecture
source:
  - 01_Raw/codebase/angular-frontend/src/app/error
status: draft
last_synced: 2026-05-24
tags:
  - code-graph
  - codegraph
  - angular-frontend
  - error
---

# error · angular-frontend

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Vị trí:** `01_Raw/codebase/angular-frontend/src/app/error` — 1 file indexed.

## Code Context

**Query:** Explain the error area: main components, entry points, key symbols

### Entry Points

- **Error404Component** (class) - src/app/error/error-404.component.ts:116
- **errorMessage** (method) - src/app/client/cart/cart.component.ts:496
- **errorMessage** (method) - src/app/client/order-history/order-history.component.ts:350

### Related Symbols

- src/app/error/error-404.component.ts: goBack:117
- src/app/client/cart/cart.component.ts: CartComponent:474
- src/app/client/order-history/order-history.component.ts: OrderHistoryComponent:339

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p 01_Raw/codebase/angular-frontend`
- Tìm callers: `codegraph callers <symbol> -p 01_Raw/codebase/angular-frontend`
- Impact analysis: `codegraph impact <symbol> -p 01_Raw/codebase/angular-frontend`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project angular-frontend
- [[Index]] — Dashboard chính
