---
name: mail
description: "Skill for the mail area of laptop-shop (5 files indexed)."
type: architecture
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop/src/mail"
status: draft
last_synced: 2026-06-03
tags:
  - code-graph
  - codegraph
  - laptop-shop
  - mail
---

# mail · laptop-shop

> Sinh tự động bởi `codegraph context` từ index `.codegraph/codegraph.db`.
> Re-run: `npm --prefix System run code-graph`.

**Project local path:** `/Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
**Vị trí:** `src/mail` — 5 file indexed.

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

- Query symbol cụ thể: `codegraph query "<name>" -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Tìm callers: `codegraph callers <symbol> -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Impact analysis: `codegraph impact <symbol> -p /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop`
- Live MCP query trong Claude Code: `npm --prefix System run code-graph:mcp`

## Liên kết
- [[README]] — Index project laptop-shop
- [[Index]] — Dashboard chính
