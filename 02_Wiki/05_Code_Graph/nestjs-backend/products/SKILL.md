---
name: products
description: "Skill for the Products area of laptop-shop. 7 symbols across 1 files."
---

# Products

7 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how create, update, addProductToCart work
- Modifying products-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/products/products.service.ts` | create, update, addProductToCart, deleteProductInCart, updateCartDetailBeforeCheckout (+2) |

## Entry Points

Start here when exploring this area:

- **`create`** (Method) — `src/products/products.service.ts:23`
- **`update`** (Method) — `src/products/products.service.ts:75`
- **`addProductToCart`** (Method) — `src/products/products.service.ts:104`
- **`deleteProductInCart`** (Method) — `src/products/products.service.ts:188`
- **`updateCartDetailBeforeCheckout`** (Method) — `src/products/products.service.ts:223`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `create` | Method | `src/products/products.service.ts` | 23 |
| `update` | Method | `src/products/products.service.ts` | 75 |
| `addProductToCart` | Method | `src/products/products.service.ts` | 104 |
| `deleteProductInCart` | Method | `src/products/products.service.ts` | 188 |
| `updateCartDetailBeforeCheckout` | Method | `src/products/products.service.ts` | 223 |
| `handlePlaceOrder` | Method | `src/products/products.service.ts` | 234 |
| `updatePaymentMethod` | Method | `src/products/products.service.ts` | 479 |

## How to Explore

1. `gitnexus_context({name: "create"})` — see callers and callees
2. `gitnexus_query({query: "products"})` — find related execution flows
3. Read key files listed above for implementation details
