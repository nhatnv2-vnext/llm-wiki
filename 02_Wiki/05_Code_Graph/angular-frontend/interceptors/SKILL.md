---
name: interceptors
description: "Skill for the Interceptors area of laptop-shop-angular. 4 symbols across 1 files."
---

# Interceptors

4 symbols | 1 files | Cohesion: 75%

## When to Use

- Working with code in `src/`
- Understanding how authInterceptor work
- Modifying interceptors-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/shared/interceptors/auth.interceptor.ts` | isApiRequest, isAuthLoginOrRefresh, addAuthHeader, authInterceptor |

## Entry Points

Start here when exploring this area:

- **`authInterceptor`** (Function) — `src/app/shared/interceptors/auth.interceptor.ts:22`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `authInterceptor` | Function | `src/app/shared/interceptors/auth.interceptor.ts` | 22 |
| `isApiRequest` | Function | `src/app/shared/interceptors/auth.interceptor.ts` | 9 |
| `isAuthLoginOrRefresh` | Function | `src/app/shared/interceptors/auth.interceptor.ts` | 12 |
| `addAuthHeader` | Function | `src/app/shared/interceptors/auth.interceptor.ts` | 15 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Services | 2 calls |

## How to Explore

1. `gitnexus_context({name: "authInterceptor"})` — see callers and callees
2. `gitnexus_query({query: "interceptors"})` — find related execution flows
3. Read key files listed above for implementation details
