---
title: Ingest plan — 2026-05-25 (all projects)
type: ingest-plan
source:
  - 01_Raw/codebase/angular-frontend
  - 01_Raw/codebase/nestjs-backend
status: pending_review
last_synced: '2026-05-25'
generated_at: '2026-05-25T14:13:20.999Z'
generated_by: 'ingest:plan run by nhatnguyen'
source_snapshot:
  - 01_Raw/codebase/angular-frontend @ 0c33705a22f6f878d8129cc93fa4b534a8cbe58a
  - 01_Raw/codebase/nestjs-backend @ 06fac54b1a73493ff6cb0997330f53d9dfa94ff8
approved_by: null
approved_at: null
applied_at: null
applied_by: null
tags:
  - ingest-plan
---
# Ingest plan — 2026-05-25 (all projects)

## Summary
- 2 page sẽ CREATE
- 5 page sẽ UPDATE
- 0 page SKIP (no change)



## Actions

### CREATE: `02_Wiki/02_API_Specs/App_API.md`
- **Reason:** New `AppController` (`01_Raw/codebase/nestjs-backend/src/app.controller.ts`) chưa có spec wiki.
- **Source:** `01_Raw/codebase/nestjs-backend/src/app.controller.ts`
- **Suggested template:** dùng pattern của `02_Wiki/02_API_Specs/Auth_API.md` (Contract → Source of truth → Business rule → Edge cases).


### UPDATE: `02_Wiki/02_API_Specs/Auth_API.md`
- **Reason:** Source `01_Raw/codebase/nestjs-backend/src/auth/auth.controller.ts` (mtime 2026-05-12T14:04:48.111Z) mới hơn wiki (`/Users/nhatnguyen/Documents/LLM/My_Project_Vault/02_Wiki/02_API_Specs/Auth_API.md` mtime 2026-05-12T02:54:20.534Z).
- **Suggested merge:** giữ "Business rule" + "Edge cases" cũ, cập nhật section "Contract" theo source mới.


### UPDATE: `02_Wiki/02_API_Specs/Products_API.md`
- **Reason:** Source `01_Raw/codebase/nestjs-backend/src/products/products.controller.ts` (mtime 2026-05-12T14:04:48.117Z) mới hơn wiki (`/Users/nhatnguyen/Documents/LLM/My_Project_Vault/02_Wiki/02_API_Specs/Products_API.md` mtime 2026-05-12T09:34:37.754Z).
- **Suggested merge:** giữ "Business rule" + "Edge cases" cũ, cập nhật section "Contract" theo source mới.


### UPDATE: `02_Wiki/02_API_Specs/Roles_API.md`
- **Reason:** Source `01_Raw/codebase/nestjs-backend/src/roles/roles.controller.ts` (mtime 2026-05-12T14:04:48.118Z) mới hơn wiki (`/Users/nhatnguyen/Documents/LLM/My_Project_Vault/02_Wiki/02_API_Specs/Roles_API.md` mtime 2026-05-12T09:35:05.593Z).
- **Suggested merge:** giữ "Business rule" + "Edge cases" cũ, cập nhật section "Contract" theo source mới.


### UPDATE: `02_Wiki/02_API_Specs/Users_API.md`
- **Reason:** Source `01_Raw/codebase/nestjs-backend/src/users/users.controller.ts` (mtime 2026-05-12T14:04:48.118Z) mới hơn wiki (`/Users/nhatnguyen/Documents/LLM/My_Project_Vault/02_Wiki/02_API_Specs/Users_API.md` mtime 2026-05-12T09:34:51.349Z).
- **Suggested merge:** giữ "Business rule" + "Edge cases" cũ, cập nhật section "Contract" theo source mới.


### CREATE: `02_Wiki/02_API_Specs/Permission_API.md`
- **Reason:** New `PermissionController` (`01_Raw/codebase/nestjs-backend/src/auth/controllers/permission.controller.ts`) chưa có spec wiki.
- **Source:** `01_Raw/codebase/nestjs-backend/src/auth/controllers/permission.controller.ts`
- **Suggested template:** dùng pattern của `02_Wiki/02_API_Specs/Auth_API.md` (Contract → Source of truth → Business rule → Edge cases).


### UPDATE: `02_Wiki/02_API_Specs/Cronjob_API.md`
- **Reason:** Source `01_Raw/codebase/nestjs-backend/src/cronjob/controllers/cronjob.controller.ts` (mtime 2026-05-12T14:04:48.114Z) mới hơn wiki (`/Users/nhatnguyen/Documents/LLM/My_Project_Vault/02_Wiki/02_API_Specs/Cronjob_API.md` mtime 2026-05-12T09:35:19.259Z).
- **Suggested merge:** giữ "Business rule" + "Edge cases" cũ, cập nhật section "Contract" theo source mới.


## Reviewer checklist

- [ ] Mọi CREATE đều có source rõ ràng.
- [ ] Mọi UPDATE giữ được business rule cũ (không bị LLM ghi đè).
- [ ] Không có file SKIP nào thực ra cần update.

## Approve

Để approve, edit frontmatter:
```yaml
approved_by: <your-github-handle>
approved_at: 2026-05-25T14:13:20.999Z
```
Rồi commit + chạy `npm run ingest:apply <path-to-this-file>`.
