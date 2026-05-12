---
name: services
description: "Skill for the Services area of laptop-shop. 20 symbols across 3 files."
---

# Services

20 symbols | 3 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how handleCancelExpiredOrders, handleQueueMaintenance, logJobStart work
- Modifying services-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/cronjob/services/cronjob.service.ts` | handleCancelExpiredOrders, handleQueueMaintenance, logJobStart, logJobCompleted, logJobFailed (+4) |
| `src/auth/services/permission.service.ts` | getUserPermissions, hasPermission, hasAnyPermission, hasAllPermissions, getUserRole (+2) |
| `src/mail/services/mail.service.ts` | sendEmail, sendWelcomeEmail, sendPasswordResetEmail, sendOrderConfirmationEmail |

## Entry Points

Start here when exploring this area:

- **`handleCancelExpiredOrders`** (Method) — `src/cronjob/services/cronjob.service.ts:34`
- **`handleQueueMaintenance`** (Method) — `src/cronjob/services/cronjob.service.ts:117`
- **`logJobStart`** (Method) — `src/cronjob/services/cronjob.service.ts:329`
- **`logJobCompleted`** (Method) — `src/cronjob/services/cronjob.service.ts:339`
- **`logJobFailed`** (Method) — `src/cronjob/services/cronjob.service.ts:359`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `handleCancelExpiredOrders` | Method | `src/cronjob/services/cronjob.service.ts` | 34 |
| `handleQueueMaintenance` | Method | `src/cronjob/services/cronjob.service.ts` | 117 |
| `logJobStart` | Method | `src/cronjob/services/cronjob.service.ts` | 329 |
| `logJobCompleted` | Method | `src/cronjob/services/cronjob.service.ts` | 339 |
| `logJobFailed` | Method | `src/cronjob/services/cronjob.service.ts` | 359 |
| `sendEmail` | Method | `src/mail/services/mail.service.ts` | 13 |
| `sendWelcomeEmail` | Method | `src/mail/services/mail.service.ts` | 49 |
| `sendPasswordResetEmail` | Method | `src/mail/services/mail.service.ts` | 77 |
| `sendOrderConfirmationEmail` | Method | `src/mail/services/mail.service.ts` | 108 |
| `getUserPermissions` | Method | `src/auth/services/permission.service.ts` | 7 |
| `hasPermission` | Method | `src/auth/services/permission.service.ts` | 30 |
| `hasAnyPermission` | Method | `src/auth/services/permission.service.ts` | 35 |
| `hasAllPermissions` | Method | `src/auth/services/permission.service.ts` | 45 |
| `getUserRole` | Method | `src/auth/services/permission.service.ts` | 55 |
| `hasRole` | Method | `src/auth/services/permission.service.ts` | 66 |
| `hasAnyRole` | Method | `src/auth/services/permission.service.ts` | 71 |
| `handleUserRegistered` | Method | `src/cronjob/services/cronjob.service.ts` | 23 |
| `queueWelcomeEmail` | Method | `src/cronjob/services/cronjob.service.ts` | 155 |
| `getCronjobStatus` | Method | `src/cronjob/services/cronjob.service.ts` | 260 |
| `getEmailQueueStatus` | Method | `src/cronjob/services/cronjob.service.ts` | 290 |

## How to Explore

1. `gitnexus_context({name: "handleCancelExpiredOrders"})` — see callers and callees
2. `gitnexus_query({query: "services"})` — find related execution flows
3. Read key files listed above for implementation details
