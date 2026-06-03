---
name: shared
description: "Skill for the shared area of laptop-shop-angular (14 files indexed)."
type: architecture
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/shared"
status: draft
last_synced: 2026-06-03
tags:
  - code-graph
  - codegraph
  - laptop-shop-angular
  - shared
---

# shared · laptop-shop-angular

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Project local path:** `/Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular`
**Vị trí:** `src/app/shared` — 14 file indexed.

## Code Context

**Query:** Explain the shared area: main components, entry points, key symbols

### Entry Points

- **authFeatureKey** (constant) - src/app/shared/store/auth/auth.state.ts:3
  `= 'auth'`
- **remainingSeconds** (method) - src/app/client/order/order-detail.component.ts:438
- **_remainingSeconds** (method) - src/app/client/order/order-detail.component.ts:430

### Related Symbols

- src/app/client/order/order-detail.component.ts: OrderDetailComponent:415, isExpired:517, countdownText:521

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular`
- Tìm callers: `codegraph callers <symbol> -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular`
- Impact analysis: `codegraph impact <symbol> -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project laptop-shop-angular
- [[Index]] — Dashboard chính
