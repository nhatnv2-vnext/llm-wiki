---
name: dashboard
description: "Skill for the Dashboard area of laptop-shop-angular. 3 symbols across 1 files."
---

# Dashboard

3 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how ngOnInit, loadDashboardData, formatCurrency work
- Modifying dashboard-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/admin/dashboard/admin-dashboard.component.ts` | ngOnInit, loadDashboardData, formatCurrency |

## Entry Points

Start here when exploring this area:

- **`ngOnInit`** (Method) — `src/app/admin/dashboard/admin-dashboard.component.ts:293`
- **`loadDashboardData`** (Method) — `src/app/admin/dashboard/admin-dashboard.component.ts:297`
- **`formatCurrency`** (Method) — `src/app/admin/dashboard/admin-dashboard.component.ts:390`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ngOnInit` | Method | `src/app/admin/dashboard/admin-dashboard.component.ts` | 293 |
| `loadDashboardData` | Method | `src/app/admin/dashboard/admin-dashboard.component.ts` | 297 |
| `formatCurrency` | Method | `src/app/admin/dashboard/admin-dashboard.component.ts` | 390 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `NgOnInit → FormatCurrency` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "ngOnInit"})` — see callers and callees
2. `gitnexus_query({query: "dashboard"})` — find related execution flows
3. Read key files listed above for implementation details
