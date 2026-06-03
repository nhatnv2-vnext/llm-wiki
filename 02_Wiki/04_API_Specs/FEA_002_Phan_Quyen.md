---
title: "FEA_002 — Phân quyền (Permissions)"
type: api-spec
project: laptop-shop
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop/src/auth/controllers/permission.controller.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - api-spec
  - backend
  - authorization
  - rbac
  - laptop-shop
---

# FEA_002 — Phân quyền (Permissions)

> Tài liệu liên quan: [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực & Phiên đăng nhập]] · [[04_API_Specs/FEA_005_Quan_Ly_Vai_Tro|Quản lý Vai trò (Roles)]] · [[04_API_Specs/FEA_003_Cronjob_Hang_Doi_Email|Cronjob & Hàng đợi email]] · Màn Quản trị hệ thống · [[03_Architecture/laptop-shop_Architecture|Kiến trúc Backend]] · Schema Database

## 1. Tổng quan

Module phân quyền hiện thực mô hình **RBAC** (Role-Based Access Control): mỗi `User` thuộc một `Role`, mỗi `Role` có nhiều `Permission` (qua bảng nối `RolePermission`). Quyền được biểu diễn dạng chuỗi `resource:action` (vd `users:read`, `admin:manage_roles`).

- Controller: `src/auth/controllers/permission.controller.ts` — prefix route `auth/permissions` (`permission.controller.ts:8`).
- Toàn bộ controller được bảo vệ bởi `@UseGuards(JwtAuthGuard, PermissionGuard)` (`permission.controller.ts:9`).
- Service: `src/auth/services/permission.service.ts` — truy vấn trực tiếp qua `PrismaService` (`permission.service.ts:5-6`).
- Danh mục quyền/role tĩnh khai báo tại `src/auth/constants/permissions.constant.ts`.

Cơ chế guard:
- `JwtAuthGuard` xác thực access token (xem [[04_API_Specs/FEA_001_Xac_Thuc|FEA_001]]).
- `PermissionGuard` đọc metadata `permissions` (đặt bởi decorator `@RequirePermissions`) và kiểm tra user có **ít nhất một** quyền yêu cầu (`permission.guard.ts:9-55`, `customize.ts:22-24`).

## 2. Danh sách APIs

Prefix: `auth/permissions`. Mọi route đều cần Bearer access token.

### 2.1 GET `/auth/permissions`

- Yêu cầu quyền: `admin:view_system` (`@RequirePermissions(PERMISSIONS.ADMIN_VIEW_SYSTEM)`) — `permission.controller.ts:13-14`.
- Logic: `getAllPermissions()` trả toàn bộ bản ghi `Permission`, sắp xếp theo `resource` tăng dần (`permission.service.ts:77-81`).
- Đầu ra (mẫu):

```json
[
  { "id": 1, "name": "users:read", "description": "...", "resource": "users", "action": "read" }
]
```

### 2.2 GET `/auth/permissions/my-permissions`

- Không yêu cầu permission cụ thể (chỉ cần đăng nhập) — bất kỳ user hợp lệ nào cũng xem được quyền của chính mình (`permission.controller.ts:19-29`).
- Logic: lấy `userId` từ `req.user.sub`, gọi `getUserPermissions(userId)` và `getUserRole(userId)`.
  - `getUserPermissions`: load user kèm `role.permissions.permission`, map ra mảng `permission.name` (`permission.service.ts:8-29`).
  - `getUserRole`: trả `role.name` của user (`permission.service.ts:56-65`).
- Đầu ra:

```json
{
  "role": "ADMIN",
  "permissions": ["users:read", "users:create", "..."]
}
```

### 2.3 GET `/auth/permissions/roles`

- Yêu cầu quyền: `admin:manage_roles` (`permission.controller.ts:31-32`).
- Logic: `getAllRoles()` trả toàn bộ `Role` kèm danh sách permission lồng nhau (`permission.service.ts:83-93`).
- Đầu ra: mảng `Role`, mỗi role có `permissions[].permission`.

> Ghi chú: nghiệp vụ CRUD role chi tiết hơn nằm ở [[04_API_Specs/FEA_005_Quan_Ly_Vai_Tro|Quản lý Vai trò (Roles)]].

## 3. Business Logic (Quy tắc nghiệp vụ)

1. **Mô hình quyền `resource:action`**: hằng số `PERMISSIONS` định nghĩa đầy đủ tập quyền theo nhóm (users, products, orders, inventory, reports, admin, system) (`permissions.constant.ts:1-45`).
2. **Ánh xạ Role → Permission tĩnh**: `ROLE_PERMISSIONS` mô tả quyền mặc định cho 5 role: `ADMIN` (full), `CUSTOMER`, `STAFF_SALES`, `STAFF_WAREHOUSE`, `CUSTOMER_SUPPORT` (`permissions.constant.ts:47-128`). Đây là dữ liệu seed/tham chiếu; quyền thực thi runtime đọc từ DB.
3. **Kiểm tra quyền kiểu "any"**: `PermissionGuard` cho phép truy cập nếu user có **ít nhất một** trong các quyền yêu cầu (`requiredPermissions.some(...)`) (`permission.guard.ts:52-54`). `permission.service.ts` cũng cung cấp `hasAllPermissions` (kiểu "all") nhưng guard hiện dùng "any".
4. **Không có metadata `permissions` → cho qua**: nếu handler không gắn `@RequirePermissions`, guard trả `true` (`permission.guard.ts:15-17`). Vì vậy `my-permissions` chỉ cần đăng nhập.
5. **Phân quyền là nền tảng dùng chung**: cùng `PermissionGuard` được tái sử dụng ở module cronjob (`SYSTEM.READ`) — xem [[04_API_Specs/FEA_003_Cronjob_Hang_Doi_Email|FEA_003]].

### Điểm cần human review (phát hiện lệch code)

- **Sai key user id**: `PermissionGuard` tra user bằng `user.userId` (`permission.guard.ts:28`), khớp với output của `JwtStrategy.validate()` (`passport/jwt.strategy.ts:17`). NHƯNG handler `getMyPermissions` lại đọc `req.user.sub` (`permission.controller.ts:21`) — `sub` không tồn tại trên `req.user` → có khả năng trả về role/permissions rỗng. Cùng pattern lỗi với [[04_API_Specs/FEA_001_Xac_Thuc|FEA_001]] và [[04_API_Specs/FEA_003_Cronjob_Hang_Doi_Email|FEA_003]]. Cần xác nhận.
- `getUserPermissions`/`getUserRole` giả định mọi user luôn có `role` (`user.role.permissions...`) — nếu `role` null sẽ ném lỗi runtime (`permission.service.ts:28`). User mặc định `roleId = 1` (`schema.prisma:28`) nên thường an toàn, nhưng cần xác nhận seed.

## 4. Database tương tác

| Bảng (`@@map`) | Model Prisma | Vai trò |
|---|---|---|
| `users` | `User` | Lấy user + role để suy ra quyền (`schema.prisma:19-38`) |
| `roles` | `Role` | Nguồn `role.name`; liệt kê tất cả role (`schema.prisma:40-51`) |
| `permissions` | `Permission` | Danh mục quyền (`name`, `resource`, `action`) (`schema.prisma:53-66`) |
| `role_permissions` | `RolePermission` | Bảng nối many-to-many Role↔Permission (`schema.prisma:68-80`) |

- Truy vấn lồng sâu: `user → role → permissions → permission` được dùng cả ở service và guard (`permission.service.ts:9-22`, `permission.guard.ts:27-40`).
- `Permission` có ràng buộc `@@unique([resource, action])` (`schema.prisma:64`); `RolePermission` có `@@unique([roleId, permissionId])` (`schema.prisma:76`).
