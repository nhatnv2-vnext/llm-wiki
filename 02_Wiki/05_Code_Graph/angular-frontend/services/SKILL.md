---
name: services
description: "Skill for the Services area of laptop-shop-angular. 12 symbols across 1 files."
---

# Services

12 symbols | 1 files | Cohesion: 70%

## When to Use

- Working with code in `src/`
- Understanding how constructor, fetchCurrentUser, restoreSession work
- Modifying services-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/shared/services/auth.service.ts` | constructor, fetchCurrentUser, restoreSession, mapMeResponseToUser, setSessionFromTokens (+7) |

## Entry Points

Start here when exploring this area:

- **`constructor`** (Method) — `src/app/shared/services/auth.service.ts:65`
- **`fetchCurrentUser`** (Method) — `src/app/shared/services/auth.service.ts:98`
- **`restoreSession`** (Method) — `src/app/shared/services/auth.service.ts:201`
- **`mapMeResponseToUser`** (Method) — `src/app/shared/services/auth.service.ts:252`
- **`setSessionFromTokens`** (Method) — `src/app/shared/services/auth.service.ts:69`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `constructor` | Method | `src/app/shared/services/auth.service.ts` | 65 |
| `fetchCurrentUser` | Method | `src/app/shared/services/auth.service.ts` | 98 |
| `restoreSession` | Method | `src/app/shared/services/auth.service.ts` | 201 |
| `mapMeResponseToUser` | Method | `src/app/shared/services/auth.service.ts` | 252 |
| `setSessionFromTokens` | Method | `src/app/shared/services/auth.service.ts` | 69 |
| `refreshSession` | Method | `src/app/shared/services/auth.service.ts` | 154 |
| `logout` | Method | `src/app/shared/services/auth.service.ts` | 182 |
| `clearSession` | Method | `src/app/shared/services/auth.service.ts` | 190 |
| `buildUserFromToken` | Method | `src/app/shared/services/auth.service.ts` | 268 |
| `resolveFullName` | Method | `src/app/shared/services/auth.service.ts` | 301 |
| `resolveAvatar` | Method | `src/app/shared/services/auth.service.ts` | 315 |
| `decodeJwtPayload` | Method | `src/app/shared/services/auth.service.ts` | 324 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → DecodeJwtPayload` | cross_community | 4 |
| `Constructor → ResolveFullName` | cross_community | 4 |
| `Constructor → ResolveAvatar` | cross_community | 4 |
| `Constructor → MapMeResponseToUser` | intra_community | 4 |
| `RefreshSession → DecodeJwtPayload` | cross_community | 4 |
| `RefreshSession → ResolveFullName` | cross_community | 4 |
| `RefreshSession → ResolveAvatar` | cross_community | 4 |
| `Constructor → ClearSession` | cross_community | 3 |

## How to Explore

1. `gitnexus_context({name: "constructor"})` — see callers and callees
2. `gitnexus_query({query: "services"})` — find related execution flows
3. Read key files listed above for implementation details
