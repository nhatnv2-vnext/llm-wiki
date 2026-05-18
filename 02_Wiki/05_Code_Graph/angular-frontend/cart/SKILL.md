---
name: cart
description: "Skill for the Cart area of laptop-shop-angular. 14 symbols across 1 files."
---

# Cart

14 symbols | 1 files | Cohesion: 92%

## When to Use

- Working with code in `src/`
- Understanding how ngOnInit, loadCart, confirmDeleteFromModal work
- Modifying cart-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/client/cart/cart.component.ts` | ngOnInit, loadCart, confirmDeleteFromModal, totalItems, deleteProductInCart (+9) |

## Entry Points

Start here when exploring this area:

- **`ngOnInit`** (Method) — `src/app/client/cart/cart.component.ts:504`
- **`loadCart`** (Method) — `src/app/client/cart/cart.component.ts:508`
- **`confirmDeleteFromModal`** (Method) — `src/app/client/cart/cart.component.ts:587`
- **`totalItems`** (Method) — `src/app/client/cart/cart.component.ts:632`
- **`deleteProductInCart`** (Method) — `src/app/client/cart/cart.component.ts:687`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ngOnInit` | Method | `src/app/client/cart/cart.component.ts` | 504 |
| `loadCart` | Method | `src/app/client/cart/cart.component.ts` | 508 |
| `confirmDeleteFromModal` | Method | `src/app/client/cart/cart.component.ts` | 587 |
| `totalItems` | Method | `src/app/client/cart/cart.component.ts` | 632 |
| `deleteProductInCart` | Method | `src/app/client/cart/cart.component.ts` | 687 |
| `recalculateTotals` | Method | `src/app/client/cart/cart.component.ts` | 758 |
| `increaseQuantity` | Method | `src/app/client/cart/cart.component.ts` | 537 |
| `decreaseQuantity` | Method | `src/app/client/cart/cart.component.ts` | 555 |
| `openDeleteModal` | Method | `src/app/client/cart/cart.component.ts` | 647 |
| `pushUpdatedCart` | Method | `src/app/client/cart/cart.component.ts` | 652 |
| `onEscapeKey` | Method | `src/app/client/cart/cart.component.ts` | 500 |
| `closeDeleteModal` | Method | `src/app/client/cart/cart.component.ts` | 578 |
| `onPlaceOrder` | Method | `src/app/client/cart/cart.component.ts` | 599 |
| `extractOrderId` | Method | `src/app/client/cart/cart.component.ts` | 736 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DecreaseQuantity → TotalItems` | cross_community | 4 |
| `NgOnInit → TotalItems` | intra_community | 4 |
| `IncreaseQuantity → TotalItems` | cross_community | 4 |
| `ConfirmDeleteFromModal → TotalItems` | intra_community | 4 |

## How to Explore

1. `gitnexus_context({name: "ngOnInit"})` — see callers and callees
2. `gitnexus_query({query: "cart"})` — find related execution flows
3. Read key files listed above for implementation details
