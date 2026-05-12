---
title: Users API
type: api
source:
  - 01_Raw/codebase/nestjs-backend/src/users
status: draft
last_synced: 2026-05-12
tags: [api, users, rbac]
---

# Users API

Controller `/users` quản lý CRUD tài khoản. Tất cả route bảo vệ `JwtAuthGuard + PermissionGuard`.

## 1. Contract

| Method | Path | Permission | Mô tả |
|--------|------|------------|-------|
| `POST` | `/users` | `users.create` | Admin tạo user (HTTP 201) |
| `GET` | `/users` | `users.list` | Danh sách user phân trang (`?page=`) |
| `GET` | `/users/me` | `users.read` | Profile của user hiện tại |
| `GET` | `/users/:id` | `users.read` | Profile theo id |
| `PUT` | `/users/:id` | `users.update` | Cập nhật user |
| `PUT` | `/users/:id/change-password` | `users.update` | Đổi mật khẩu (HTTP 200) |
| `DELETE` | `/users/:id` | `users.delete` | Soft delete (HTTP 204) |

### Payload

```ts
type CreateUserDto = {
  username: string;
  password: string;
  fullName?: string;
  phone?: string;
  address?: string;
  accountType: string;
  roleId?: number;       // default 1 (xem schema.prisma)
};

type UpdateUserDto = Partial<Omit<CreateUserDto, 'password'>>;

type ChangePasswordDto = {
  oldPassword: string;
  newPassword: string;
};
```

## 2. Source of truth
- Controller: `01_Raw/codebase/nestjs-backend/src/users/users.controller.ts:22-79`
- Service: `01_Raw/codebase/nestjs-backend/src/users/users.service.ts`
- DTO: `01_Raw/codebase/nestjs-backend/src/users/dto/`

## 3. Business rule
- **Soft delete**: `users.deleted_at` được set, không xoá thật.
- **Password**: hash bằng bcrypt trong service.
- **Self vs admin**: route `/me` lấy `userId` từ JWT (decorator `@User()`), không cho phép user khác xem.
- **Role mặc định**: `roleId = 1` (xem `prisma/schema.prisma:33`).

## 4. Edge cases & error codes
| Code | Khi nào | Hành vi |
|------|---------|---------|
| `400` | DTO sai | mảng `message` |
| `401` | Thiếu JWT | redirect login |
| `403` | Thiếu permission | — |
| `404` | User không tồn tại / đã soft-delete | — |
| `409` | Username trùng (create) | đổi username |

## Liên kết
- Schema `users` → [[Schema_Design]]
- Auth (login/register) → [[Auth_API]]
- RBAC → [[Roles_API]]
