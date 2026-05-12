---
name: prisma
description: "Skill for the Prisma area of laptop-shop. 6 symbols across 1 files."
---

# Prisma

6 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `prisma/`
- Understanding how main, seedPermissions, seedRoles work
- Modifying prisma-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `prisma/seed.ts` | main, seedPermissions, seedRoles, seedRolePermissions, seedUsers (+1) |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `main` | Function | `prisma/seed.ts` | 11 |
| `seedPermissions` | Function | `prisma/seed.ts` | 32 |
| `seedRoles` | Function | `prisma/seed.ts` | 76 |
| `seedRolePermissions` | Function | `prisma/seed.ts` | 115 |
| `seedUsers` | Function | `prisma/seed.ts` | 150 |
| `seedProducts` | Function | `prisma/seed.ts` | 234 |

## How to Explore

1. `gitnexus_context({name: "main"})` — see callers and callees
2. `gitnexus_query({query: "prisma"})` — find related execution flows
3. Read key files listed above for implementation details
