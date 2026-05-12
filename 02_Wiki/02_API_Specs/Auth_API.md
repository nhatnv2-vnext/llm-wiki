---
title: Auth API
type: api
source:
  - 01_Raw/codebase/nestjs-backend/src/auth
status: draft
last_synced: 2026-05-12
tags: [api, auth, jwt, rbac]
---

# Auth API

REST endpoints cho đăng nhập, đăng ký, refresh token, logout và RBAC.

## 1. Contract

| Method | Path | Mô tả | Auth |
|--------|------|-------|------|
| `POST` | `/auth/login` | Đăng nhập local (username/password) | Public |
| `POST` | `/auth/register` | Tạo tài khoản mới | Public |
| `POST` | `/auth/refresh` | Đổi refresh token → access token mới | Bearer (refresh) |
| `POST` | `/auth/logout` | Thu hồi refresh token hiện tại | Bearer |
| `GET`  | `/auth/permissions` | Liệt kê mọi permission (admin) | Bearer + RBAC |
| `GET`  | `/auth/permissions/my-permissions` | Lấy permission của user hiện tại | Bearer |
| `GET`  | `/auth/permissions/roles` | Liệt kê các role | Bearer + RBAC |

### Payload (rút từ `auth/dto/`)

```ts
// POST /auth/login
type LoginDto = { username: string; password: string };
type LoginResponse = {
  accessToken: string;   // JWT, default 15m
  refreshToken: string;  // JWT, default 7d (lưu cột users.refresh_token)
  user: { id: number; username: string; role: { id: number; name: string } };
};

// POST /auth/register
type RegisterDto = {
  username: string;
  password: string;
  fullName?: string;
  phone?: string;
  address?: string;
  accountType: string;  // 'LOCAL' chủ đạo
};

// POST /auth/refresh
type RefreshDto = { refreshToken: string };
```

## 2. Source of truth

- Controller chính: `01_Raw/codebase/nestjs-backend/src/auth/auth.controller.ts` (`/auth/login|register|refresh|logout`)
- Permission controller: `01_Raw/codebase/nestjs-backend/src/auth/controllers/permission.controller.ts`
- Service: `01_Raw/codebase/nestjs-backend/src/auth/services/` (xem `auth.service.ts` cho logic JWT)
- Passport strategies: `01_Raw/codebase/nestjs-backend/src/auth/passport/`
- Guards: `01_Raw/codebase/nestjs-backend/src/auth/guards/`
- Spec bổ trợ: `01_Raw/codebase/nestjs-backend/REFRESH-TOKEN-IMPLEMENTATION.md`, `ROLE_PERMISSION_GUIDE.md`

## 3. Business rule

- **Password hashing**: bcrypt (`bcrypt` dependency).
- **JWT secret + TTL**: từ env (`.env`) — cấu hình trong `@nestjs/jwt` module.
- **Refresh token rotation**: token mới ghi đè cột `users.refresh_token`; logout = clear cột này.
- **RBAC**: guard kiểm tra cặp `(resource, action)` từ bảng `permissions` qua `role_permissions`. Xem [[Schema_Design]].
- **Soft delete user**: `deleted_at IS NOT NULL` → coi như không tồn tại khi login.

## 4. Edge cases & error codes

| Code | Khi nào | Hành vi |
|------|---------|---------|
| `400` | DTO không hợp lệ (`class-validator`) | Trả mảng `message` chi tiết |
| `401` | Sai username/password hoặc JWT hết hạn / sai chữ ký | Client redirect login |
| `403` | Thiếu permission cho `(resource, action)` | Hiện trang "không có quyền" |
| `409` | `username` đã tồn tại (register) | Đổi username khác |
| `429` | Rate limit (nếu bật) | Backoff |

## Liên kết

- Bảng `users`, `roles`, `permissions` → [[Schema_Design]]
- Kiến trúc tổng → [[System_Overview]]
- Email welcome sau register → [[Email_Queue_Flow]]
