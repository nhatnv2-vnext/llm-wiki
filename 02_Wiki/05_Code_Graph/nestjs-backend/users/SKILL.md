---
name: users
description: "Skill for the Users area of laptop-shop. 4 symbols across 1 files."
---

# Users

4 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how findOne, update, changePassword work
- Modifying users-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/users/users.service.ts` | findOne, update, changePassword, updateRefreshToken |

## Entry Points

Start here when exploring this area:

- **`findOne`** (Method) — `src/users/users.service.ts:79`
- **`update`** (Method) — `src/users/users.service.ts:114`
- **`changePassword`** (Method) — `src/users/users.service.ts:136`
- **`updateRefreshToken`** (Method) — `src/users/users.service.ts:176`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `findOne` | Method | `src/users/users.service.ts` | 79 |
| `update` | Method | `src/users/users.service.ts` | 114 |
| `changePassword` | Method | `src/users/users.service.ts` | 136 |
| `updateRefreshToken` | Method | `src/users/users.service.ts` | 176 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `ChangePassword → FindOne` | intra_community | 3 |
| `UpdateRefreshToken → FindOne` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "findOne"})` — see callers and callees
2. `gitnexus_query({query: "users"})` — find related execution flows
3. Read key files listed above for implementation details
