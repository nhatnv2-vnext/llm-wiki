---
title: "FEA_002 - Phân quyền (Permissions)"
type: api-spec
project: laptop-shop
source:
  - "local: src/auth/controllers/permission.controller.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - api-spec
  - laptop-shop
  - auth
  - permissions
  - rbac
---

# FEA_002 — Phân quyền (Permissions)

> Spec này được lần luồng bằng **CodeGraph MCP** (context/callees/impact) trên index `laptop-shop`. Mọi claim kèm `file:line`.

## 1. Tổng quan

Module `PermissionController` (`src/auth/controllers/permission.controller.ts:10`) là API tra cứu cho hệ thống **RBAC (Role-Based Access Control)**: liệt kê toàn bộ permission, xem quyền của chính mình, và liệt kê roles. Toàn bộ controller được bảo vệ kép:

```typescript
@Controller('auth/permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)   // permission.controller.ts:8-9
```

Logic nghiệp vụ nằm ở `PermissionService` (`src/auth/services/permission.service.ts:5`). Mô hình dữ liệu: `User → Role → RolePermission → Permission` (nhiều-nhiều giữa role và permission qua bảng nối).

## 2. Chuỗi gọi thật (CodeGraph)

```
GET /auth/permissions              → getAllPermissions  (permission.controller.ts:15)
   @RequirePermissions(ADMIN_VIEW_SYSTEM)
      ↳ PermissionService.getAllPermissions   (permission.service.ts:77) → prisma.permission.findMany

GET /auth/permissions/my-permissions → getMyPermissions (permission.controller.ts:20)
   (chỉ JwtAuthGuard, KHÔNG @RequirePermissions)
      ↳ PermissionService.getUserPermissions  (permission.service.ts:8)  → prisma.user.findUnique (include role→permissions)
      ↳ PermissionService.getUserRole         (permission.service.ts:56) → prisma.user.findUnique (include role)

GET /auth/permissions/roles        → getAllRoles        (permission.controller.ts:33)
   @RequirePermissions(ADMIN_MANAGE_ROLES)
      ↳ PermissionService.getAllRoles         (permission.service.ts:83) → prisma.role.findMany (include permissions)
```

**Guard chain (CodeGraph callers của `PermissionGuard`):** `PermissionGuard.canActivate` (`permission.guard.ts:9`) đọc metadata `'permissions'` từ decorator `@RequirePermissions` (`reflector.get`, `permission.guard.ts:10-13`), rồi **tự truy vấn DB lại** lần nữa (`prisma.user.findUnique` include role→permissions, `permission.guard.ts:27-40`) và kiểm tra user có ít nhất một permission yêu cầu (`some`, `permission.guard.ts:52-54`).

> **Phát hiện nhờ CodeGraph (đọc tay dễ bỏ sót):**
> 1. `GET /my-permissions` **không** gắn `@RequirePermissions` (`permission.controller.ts:19`) → `PermissionGuard` trả `true` ngay tại `permission.guard.ts:15-16` vì không có metadata. Tức endpoint này mở cho **mọi user đã đăng nhập**, không cần quyền admin — khác hẳn 2 endpoint còn lại.
> 2. `getMyPermissions` gọi DB **2 lần** (getUserPermissions + getUserRole, mỗi hàm một `findUnique`) — `permission.service.ts:9` và `:57`. Có thể gộp 1 query. CodeGraph callees chỉ rõ điều này.
> 3. `PermissionGuard.canActivate` query DB **trùng** với `getUserPermissions` (cùng include role→permissions) → mỗi request được bảo vệ tốn tối thiểu 2 round-trip DB (1 ở guard + 1 ở service).

## 3. Danh sách API

Prefix: `@Controller('auth/permissions')` (`permission.controller.ts:8`).

### 3.1 GET /auth/permissions
- **Quyền:** `@RequirePermissions(PERMISSIONS.ADMIN_VIEW_SYSTEM)` = `'admin:view_system'` (`permission.controller.ts:14`; hằng tại `permissions.constant.ts:37`).
- **Payload:** không.
- **Response:** mảng toàn bộ permission, `orderBy resource asc` (`permission.service.ts:77-80`).

### 3.2 GET /auth/permissions/my-permissions
- **Quyền:** chỉ cần đã đăng nhập (JwtAuthGuard); **không** có `@RequirePermissions`.
- **Payload:** không; lấy `req.user.sub` (`permission.controller.ts:21`).
- **Response:** `{ role: string | null, permissions: string[] }` (`permission.controller.ts:25-28`).

### 3.3 GET /auth/permissions/roles
- **Quyền:** `@RequirePermissions(PERMISSIONS.ADMIN_MANAGE_ROLES)` = `'admin:manage_roles'` (`permission.controller.ts:32`).
- **Payload:** không.
- **Response:** mảng roles kèm permissions lồng nhau (`permission.service.ts:83-92`).

## 4. Business Logic (Quy tắc Nghiệp vụ)

- **Mô hình kiểm quyền OR (any-of):** `PermissionGuard` cho phép khi user có **ít nhất một** trong các permission yêu cầu (`requiredPermissions.some(...)`, `permission.guard.ts:52`). Không phải all-of.
- **Bỏ qua khi không khai báo quyền:** handler không có `@RequirePermissions` → guard trả `true` (`permission.guard.ts:15-16`).
- **Trích permission từ role:** quyền của user = `user.role.permissions.map(rp => rp.permission.name)` (`permission.service.ts:28`, lặp lại tại `permission.guard.ts:47-49`).
- **Hằng phân quyền tĩnh:** danh mục permission/role và bản đồ `ROLE_PERMISSIONS` được định nghĩa cứng tại `permissions.constant.ts:1-128` (ADMIN, CUSTOMER, STAFF_SALES, STAFF_WAREHOUSE, CUSTOMER_SUPPORT). Đây là seed nghiệp vụ, runtime đọc từ DB.
- **Các helper chưa dùng ở controller này:** `hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `hasRole`, `hasAnyRole` (`permission.service.ts:31-75`) tồn tại nhưng không được PermissionController gọi (xác nhận bằng `codegraph_impact PermissionService` — chỉ `getMyPermissions` là caller ngoài service).

## 5. Database tương tác

| Bảng | Thao tác | Vị trí |
|------|----------|--------|
| `permission` | `findMany` (orderBy resource) | `permission.service.ts:78` |
| `user` | `findUnique` include role→permissions→permission | `permission.service.ts:9` (getUserPermissions), `permission.guard.ts:27` |
| `user` | `findUnique` include role | `permission.service.ts:57` (getUserRole) |
| `role` | `findMany` include permissions→permission | `permission.service.ts:84` (getAllRoles) |

Bảng nối ngầm: `rolePermission` (quan hệ nhiều-nhiều role↔permission) — thấy qua các `include.permissions.permission`.

## 6. Phạm vi ảnh hưởng (impact)

`codegraph_impact PermissionService` → **16 symbol**:

- `src/auth/services/permission.service.ts`: `getUserPermissions:8`, `hasPermission:31`, `hasAnyPermission:36`, `hasAllPermissions:46`, `getUserRole:56`, `hasRole:67`, `hasAnyRole:72`, `getAllPermissions:77`, `getAllRoles:83`.
- `src/auth/controllers/permission.controller.ts`: `getMyPermissions:20`, route `GET /auth/permissions/my-permissions:19`.

Ngoài ra `PermissionGuard` (`permission.guard.ts`) **không** phụ thuộc `PermissionService` (nó tự query Prisma) — nên sửa logic permission ở service sẽ **không** tự đồng bộ sang guard. Đây là điểm rủi ro CodeGraph làm rõ: logic kiểm quyền bị nhân đôi ở 2 nơi (`permission.service.ts:28` và `permission.guard.ts:47`).

## 7. Liên kết

- [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực & Phiên đăng nhập]] — `JwtAuthGuard` chạy trước `PermissionGuard`
- [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý Người dùng]] — bảng `user` và quan hệ role
- [[03_Architecture/laptop-shop_Architecture|Kiến trúc Backend]]
- [[06_Code_Graph/laptop-shop/auth/SKILL|Code Graph — module auth]]

## 8. Cần human review

- Xác nhận chủ ý: `GET /my-permissions` cố tình mở cho mọi user đã login (không gắn `@RequirePermissions`).
- Logic kiểm quyền nhân đôi ở `PermissionGuard` vs `PermissionService` — cân nhắc refactor cho guard gọi service.
