---
name: mail
description: "Skill for the mail area of nestjs-backend (5 files indexed)."
type: architecture
source:
  - 01_Raw/codebase/nestjs-backend/src/mail
status: draft
last_synced: 2026-05-24
tags:
  - code-graph
  - codegraph
  - nestjs-backend
  - mail
---

# mail · nestjs-backend

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Vị trí:** `01_Raw/codebase/nestjs-backend/src/mail` — 5 file indexed.

## Code Context

**Query:** Explain the mail area: main components, entry points, key symbols

### Entry Points

- **main** (function) - prisma/seed.ts:12
  `()`
- **MailModule** (class) - src/mail/mail.module.ts:35
- **MailService** (class) - src/mail/services/mail.service.ts:9

### Related Symbols

- prisma/seed.ts: seedPermissions:33, seedRoles:77, seedRolePermissions:116, seedUsers:151, seedProducts:235
- src/mail/services/mail.service.ts: logger:10, constructor:12, sendEmail:14, sendWelcomeEmail:50, sendPasswordResetEmail:78

## Khám phá sâu hơn

- Query symbol cụ thể: `codegraph query "<name>" -p 01_Raw/codebase/nestjs-backend`
- Tìm callers: `codegraph callers <symbol> -p 01_Raw/codebase/nestjs-backend`
- Impact analysis: `codegraph impact <symbol> -p 01_Raw/codebase/nestjs-backend`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project nestjs-backend
- [[Index]] — Dashboard chính
