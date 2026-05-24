---
name: admin
description: "Skill for the admin area of angular-frontend (4 files indexed)."
type: architecture
source:
  - 01_Raw/codebase/angular-frontend/src/app/admin
status: draft
last_synced: 2026-05-24
tags:
  - code-graph
  - codegraph
  - angular-frontend
  - admin
---

# admin · angular-frontend

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Vị trí:** `01_Raw/codebase/angular-frontend/src/app/admin` — 4 file indexed.

## Code Context

**Query:** Explain the admin area: main components, entry points, key symbols

### Entry Points

- **AdminHeaderComponent** (class) - src/app/admin/layout/admin-header.component.ts:78
- **AdminSidenavComponent** (class) - src/app/admin/layout/admin-sidenav.component.ts:119
- **AdminDashboardComponent** (class) - src/app/admin/dashboard/admin-dashboard.component.ts:241

### Related Symbols

- src/app/admin/layout/admin-header.component.ts: currentUser:79, sidebarToggle:80, logout:81, onSidebarToggle:83, onLogout:87
- src/app/admin/layout/admin-sidenav.component.ts: currentUser:120, navigationItems:122, managementItems:130
- src/app/admin/dashboard/admin-dashboard.component.ts: _currentUser:243, _isSidebarToggled:244

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p 01_Raw/codebase/angular-frontend`
- Tìm callers: `codegraph callers <symbol> -p 01_Raw/codebase/angular-frontend`
- Impact analysis: `codegraph impact <symbol> -p 01_Raw/codebase/angular-frontend`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project angular-frontend
- [[Index]] — Dashboard chính
