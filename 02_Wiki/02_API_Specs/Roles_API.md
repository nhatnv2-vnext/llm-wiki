---
title: Roles & Permissions API
type: api
source:
  - 01_Raw/codebase/nestjs-backend/src/roles
status: draft
last_synced: 2026-05-12
tags: [api, roles, rbac, admin]
---

# Roles & Permissions API

Controller `/roles` cho admin quản lý RBAC. Tất cả route yêu cầu permission `admin.manage_roles` hoặc `admin.manage_permissions`.

## 1. Contract

| Method | Path | Permission | Mô tả |
|--------|------|------------|-------|
| `POST` | `/roles` | `admin.manage_roles` | Tạo role mới |
| `GET` | `/roles` | `admin.manage_roles` | Liệt kê tất cả role |
| `GET` | `/roles/:id` | `admin.manage_roles` | Chi tiết 1 role |
| `PATCH` | `/roles/:id` | `admin.manage_roles` | Cập nhật role (name/description) |
| `DELETE` | `/roles/:id` | `admin.manage_roles` | Xoá role (soft) |
| `GET` | `/roles/permissions/available` | `admin.manage_permissions` | Liệt kê tất cả permission có sẵn |
| `GET` | `/roles/:id/permissions` | `admin.manage_roles` | Permission của 1 role |
| `PUT` | `/roles/:id/permissions` | `admin.manage_permissions` | Gán lại permission cho role (`{ permissionNames: string[] }`) |

### Payload

```ts
type CreateRoleDto = {
  name: string;          // unique trong bảng roles
  description: string;
};

type UpdateRoleDto = Partial<CreateRoleDto>;

type UpdateRolePermissionsBody = {
  permissionNames: string[];   // VD: ['products.create', 'products.read']
};
```

## 2. Source of truth
- Controller: `01_Raw/codebase/nestjs-backend/src/roles/roles.controller.ts:20-75`
- Service: `01_Raw/codebase/nestjs-backend/src/roles/roles.service.ts`
- Permission constants: `01_Raw/codebase/nestjs-backend/src/auth/constants/permissions.constant.ts`
- Guide bổ sung: `01_Raw/codebase/nestjs-backend/ROLE_PERMISSION_GUIDE.md`

## 3. Business rule
- **Unique role name**: bảng `roles.name @unique`.
- **Unique permission**: bảng `permissions(resource, action) @unique` — vd `(products, create)`.
- **PUT permissions** = **replace**, không phải merge: gửi mảng đầy đủ, hệ thống xoá rows cũ rồi insert lại.
- **Soft delete**: `roles.deleted_at`.

## 4. Edge cases & error codes
| Code | Khi nào | Hành vi |
|------|---------|---------|
| `400` | `permissionNames` chứa permission không tồn tại | — |
| `403` | User không có `admin.manage_roles` / `admin.manage_permissions` | — |
| `409` | Role name trùng (create) | — |

## Liên kết
- Schema `roles`, `permissions`, `role_permissions` → [[Schema_Design]]
- Áp dụng trong các API khác → [[Products_API]], [[Users_API]], [[Auth_API]]
