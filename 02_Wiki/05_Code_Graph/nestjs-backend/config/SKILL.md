---
name: config
description: "Skill for the Config area of laptop-shop. 5 symbols across 5 files."
---

# Config

5 symbols | 5 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how setupBullBoard, TransformInterceptor, JwtAuthGuard work
- Modifying config-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/main.ts` | bootstrap |
| `src/core/transform.interceptor.ts` | TransformInterceptor |
| `src/config/cors.config.ts` | createCorsOptions |
| `src/common/bull-board.setup.ts` | setupBullBoard |
| `src/auth/guards/jwt-auth.guard.ts` | JwtAuthGuard |

## Entry Points

Start here when exploring this area:

- **`setupBullBoard`** (Function) — `src/common/bull-board.setup.ts:5`
- **`TransformInterceptor`** (Class) — `src/core/transform.interceptor.ts:18`
- **`JwtAuthGuard`** (Class) — `src/auth/guards/jwt-auth.guard.ts:10`
- **`createCorsOptions`** (Method) — `src/config/cors.config.ts:8`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `TransformInterceptor` | Class | `src/core/transform.interceptor.ts` | 18 |
| `JwtAuthGuard` | Class | `src/auth/guards/jwt-auth.guard.ts` | 10 |
| `setupBullBoard` | Function | `src/common/bull-board.setup.ts` | 5 |
| `createCorsOptions` | Method | `src/config/cors.config.ts` | 8 |
| `bootstrap` | Function | `src/main.ts` | 10 |

## How to Explore

1. `gitnexus_context({name: "setupBullBoard"})` — see callers and callees
2. `gitnexus_query({query: "config"})` — find related execution flows
3. Read key files listed above for implementation details
