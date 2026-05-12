---
name: roles
description: "Skill for the Roles area of laptop-shop. 6 symbols across 1 files."
---

# Roles

6 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how create, findOne, update work
- Modifying roles-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/roles/roles.service.ts` | create, findOne, update, remove, assignPermissionsToRole (+1) |

## Entry Points

Start here when exploring this area:

- **`create`** (Method) — `src/roles/roles.service.ts:13`
- **`findOne`** (Method) — `src/roles/roles.service.ts:50`
- **`update`** (Method) — `src/roles/roles.service.ts:80`
- **`remove`** (Method) — `src/roles/roles.service.ts:113`
- **`assignPermissionsToRole`** (Method) — `src/roles/roles.service.ts:144`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `create` | Method | `src/roles/roles.service.ts` | 13 |
| `findOne` | Method | `src/roles/roles.service.ts` | 50 |
| `update` | Method | `src/roles/roles.service.ts` | 80 |
| `remove` | Method | `src/roles/roles.service.ts` | 113 |
| `assignPermissionsToRole` | Method | `src/roles/roles.service.ts` | 144 |
| `updateRolePermissions` | Method | `src/roles/roles.service.ts` | 210 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Remove → AssignPermissionsToRole` | intra_community | 3 |
| `Remove → FindOne` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "create"})` — see callers and callees
2. `gitnexus_query({query: "roles"})` — find related execution flows
3. Read key files listed above for implementation details
