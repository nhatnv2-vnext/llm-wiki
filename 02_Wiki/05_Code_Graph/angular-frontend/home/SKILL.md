---
name: home
description: "Skill for the Home area of laptop-shop-angular. 4 symbols across 1 files."
---

# Home

4 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how ngOnInit, loadProductsRx, getProducts work
- Modifying home-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/client/home/home.component.ts` | ngOnInit, loadProductsRx, getProducts, goToPage |

## Entry Points

Start here when exploring this area:

- **`ngOnInit`** (Method) — `src/app/client/home/home.component.ts:560`
- **`loadProductsRx`** (Method) — `src/app/client/home/home.component.ts:565`
- **`getProducts`** (Method) — `src/app/client/home/home.component.ts:582`
- **`goToPage`** (Method) — `src/app/client/home/home.component.ts:645`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ngOnInit` | Method | `src/app/client/home/home.component.ts` | 560 |
| `loadProductsRx` | Method | `src/app/client/home/home.component.ts` | 565 |
| `getProducts` | Method | `src/app/client/home/home.component.ts` | 582 |
| `goToPage` | Method | `src/app/client/home/home.component.ts` | 645 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `NgOnInit → GetProducts` | intra_community | 3 |
| `GoToPage → GetProducts` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "ngOnInit"})` — see callers and callees
2. `gitnexus_query({query: "home"})` — find related execution flows
3. Read key files listed above for implementation details
