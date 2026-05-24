---
name: client
description: "Skill for the client area of angular-frontend (7 files indexed)."
type: architecture
source:
  - 01_Raw/codebase/angular-frontend/src/app/client
status: draft
last_synced: 2026-05-24
tags:
  - code-graph
  - codegraph
  - angular-frontend
  - client
---

# client · angular-frontend

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Vị trí:** `01_Raw/codebase/angular-frontend/src/app/client` — 7 file indexed.

## Code Context

**Query:** Explain the client area: main components, entry points, key symbols

### Entry Points

- **ClientBannerComponent** (class) - src/app/shared/components/client-banner.component.ts:127
- **ClientFooterComponent** (class) - src/app/shared/components/client-footer.component.ts:322
- **ClientHeaderComponent** (class) - src/app/shared/components/client-header.component.ts:410

### Related Symbols

- src/app/shared/components/client-banner.component.ts: onSearch:128
- src/app/shared/components/client-footer.component.ts: onSubscribe:323
- src/app/shared/components/client-header.component.ts: router:411, authService:412, user:414, cartCount:415, isUserMenuOpen:416

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p 01_Raw/codebase/angular-frontend`
- Tìm callers: `codegraph callers <symbol> -p 01_Raw/codebase/angular-frontend`
- Impact analysis: `codegraph impact <symbol> -p 01_Raw/codebase/angular-frontend`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project angular-frontend
- [[Index]] — Dashboard chính
