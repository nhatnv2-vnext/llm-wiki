---
title: "FEA_005 - Quản lý Vai trò (Roles)"
type: api-spec
project: laptop-shop
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop/src/roles/roles.controller.ts"
status: draft
last_synced: "2026-06-03"
tags: [api-spec, backend, nestjs, roles, rbac, permissions, laptop-shop]
---

# FEA_005 — Quản lý Vai trò (Roles)

> Module quản trị RBAC: tạo/sửa/xoá vai trò và gán quyền (permissions) cho từng vai trò.
> Controller: `src/roles/roles.controller.ts` · Service: `src/roles/roles.service.ts`

## Tổng quan

`RolesController` cung cấp CRUD cho vai trò và các thao tác gán/đọc quyền. Toàn bộ controller bảo vệ bởi `@UseGuards(JwtAuthGuard, PermissionGuard)` (`roles.controller.ts:21`). Hầu hết endpoint yêu cầu `admin:manage_roles`; riêng các thao tác liên quan danh sách/gán quyền yêu cầu `admin:manage_permissions`.

Prefix toàn cục `api` (`src/main.ts:37`) → route đầy đủ `/api/roles/...`.

Tài liệu liên quan:
- Frontend: Quản lý vai trò, Phân quyền
- Feature liên quan: [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý người dùng]], [[04_API_Specs/FEA_002_Phan_Quyen|Phân quyền (Permissions)]], [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực & phiên đăng nhập]], [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm, Giỏ hàng & Đơn hàng]]
- Kiến trúc: [[03_Architecture/laptop-shop_Architecture|Kiến trúc Backend]]
- Database: Schema laptop-shop

## Danh sách APIs

| # | Method | URL | Permission | Service gọi |
|---|--------|-----|------------|-------------|
| 1 | POST | `/api/roles` | `admin:manage_roles` | `create()` |
| 2 | GET | `/api/roles` | `admin:manage_roles` | `findAll()` |
| 3 | GET | `/api/roles/permissions/available` | `admin:manage_permissions` | `getAllPermissions()` |
| 4 | GET | `/api/roles/:id` | `admin:manage_roles` | `findOne()` |
| 5 | GET | `/api/roles/:id/permissions` | `admin:manage_roles` | `getRolePermissions()` |
| 6 | PATCH | `/api/roles/:id` | `admin:manage_roles` | `update()` |
| 7 | PUT | `/api/roles/:id/permissions` | `admin:manage_permissions` | `updateRolePermissions()` |
| 8 | DELETE | `/api/roles/:id` | `admin:manage_roles` | `remove()` (soft delete) |

> Thứ tự route: `permissions/available` khai báo trước `:id` (`roles.controller.ts:37,43`) để không bị route động nuốt.

### 1. POST /api/roles — Tạo vai trò
- **Permission**: `admin:manage_roles` (`roles.controller.ts:26`).
- **Body** (`CreateRoleDto`, `dto/create-role.dto.ts`):
```json
{
  "name": "STAFF_SALES",
  "description": "Nhân viên bán hàng",
  "permissionNames": ["products:read", "orders:create"]
}
```
- **Validation**: `name` bắt buộc, trim, ≤50 ký tự; `description` bắt buộc, ≤255; `permissionNames` tuỳ chọn, mảng string.
- **Logic** (`roles.service.ts:14-36`):
  1. Tạo `Role` (tách `permissionNames` ra khỏi `roleData`).
  2. Nếu có `permissionNames` → gọi `assignPermissionsToRole`.
  3. Trả về `findOne(role.id)` (kèm permissions).
  - Lỗi Prisma `P2002` (trùng unique) → `ConflictException('Role name already exists')`.

### 2. GET /api/roles — Danh sách vai trò
- **Permission**: `admin:manage_roles`.
- **Logic**: trả các role `deletedAt: null`, kèm `_count.users` (số user của role) (`roles.service.ts:38-49`).

### 3. GET /api/roles/permissions/available — Tất cả quyền khả dụng
- **Permission**: `admin:manage_permissions`.
- **Logic**: `permission.findMany` sắp xếp theo `resource` rồi `action` (`roles.service.ts:184-188`).

### 4. GET /api/roles/:id — Chi tiết vai trò
- **Permission**: `admin:manage_roles`.
- **Logic**: `role.findUnique` theo `id` + `deletedAt: null`, include permissions (qua `RolePermission` → `Permission`); không thấy → `NotFoundException` (`roles.service.ts:51-79`).

### 5. GET /api/roles/:id/permissions — Quyền của 1 vai trò
- **Permission**: `admin:manage_roles`.
- **Logic**: `role.findUnique` include permissions, trả mảng `permission` đã map phẳng; không thấy role → `NotFoundException` (`roles.service.ts:191-208`).

### 6. PATCH /api/roles/:id — Cập nhật vai trò
- **Permission**: `admin:manage_roles`.
- **Body** (`UpdateRoleDto` = `PartialType(CreateRoleDto)` + `permissionNames` tuỳ chọn).
- **Logic** (`roles.service.ts:81-112`):
  1. Cập nhật thông tin cơ bản (`name`, `description`).
  2. Nếu `permissionNames !== undefined`: xoá toàn bộ `rolePermission` của role rồi gán lại danh sách mới (nếu mảng > 0).
  3. Trả `findOne(id)`.
  - `P2002` → `ConflictException('Role name already exists')`.

### 7. PUT /api/roles/:id/permissions — Cập nhật riêng danh sách quyền
- **Permission**: `admin:manage_permissions`.
- **Body**: `{ "permissionNames": ["products:read", "products:update"] }` (`roles.controller.ts:61-68`).
- **Logic** (`roles.service.ts:211-226`): kiểm tra role tồn tại (`findOne`) → xoá hết `rolePermission` cũ → gán lại danh sách mới → trả `findOne(roleId)`.

### 8. DELETE /api/roles/:id — Xoá mềm vai trò
- **Permission**: `admin:manage_roles`.
- **Logic** (`roles.service.ts:114-142`):
  - Đếm user active (`roleId = id`, `deletedAt: null`); nếu > 0 → `ConflictException('Cannot delete role. N user(s) are still assigned...')`.
  - Ngược lại set `deletedAt = now()` (soft delete), trả `{ id, name, description, deletedAt }`.

## Business Logic (Quy tắc nghiệp vụ)

- **RBAC qua bảng nối**: quan hệ Role ↔ Permission là many-to-many qua `RolePermission`. Gán quyền nhận **tên permission** (`permissionNames`), service tra `permissionId` từ tên.
- **Gán quyền kiểu replace**: cả `update` và `updateRolePermissions` đều xoá sạch `rolePermission` cũ rồi tạo lại — không phải merge incremental.
- **Validate permission tồn tại**: `assignPermissionsToRole` so khớp danh sách yêu cầu với DB; nếu có tên không tồn tại → `NotFoundException('The following permissions do not exist: ...')` (`roles.service.ts:145-181`).
- **Soft delete + ràng buộc**: không cho xoá role còn user đang gán — bảo vệ toàn vẹn tham chiếu trước khi soft delete.
- **Tên role là unique**: trùng tên bị bắt qua mã lỗi Prisma `P2002` → `ConflictException`.

## Database tương tác

Xem Schema laptop-shop:

| Model | Table | Vai trò |
|-------|-------|---------|
| `Role` | `roles` | Vai trò (name unique, description, soft delete) |
| `Permission` | `permissions` | Quyền (name, resource, action) |
| `RolePermission` | `role_permissions` | Bảng nối Role ↔ Permission (unique `[roleId, permissionId]`, onDelete Cascade) |
| `User` | `users` | Đếm user theo `roleId` khi xoá role |

Truy cập DB qua `PrismaService` (`src/database`). `PermissionGuard` (`src/auth/guards/permission.guard.ts`) cũng đọc các bảng này để kiểm tra quyền runtime — xem [[04_API_Specs/FEA_002_Phan_Quyen|Phân quyền (Permissions)]].

## Cần human review

- Permission constant (`src/auth/constants/permissions.constant.ts`) dùng định dạng `resource:action` (vd `products:read`); cần xác nhận seed data `permissions` khớp tập tên này, nếu không `assignPermissionsToRole` sẽ ném `NotFoundException`.
- Xoá quyền theo kiểu replace có thể gây mất quyền tạm thời nếu xảy ra lỗi giữa bước delete và create (không nằm trong transaction).
