---
title: "FEA_005 - Quản lý Vai trò (Roles)"
type: api-spec
project: laptop-shop
source:
  - "local: src/roles/roles.controller.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - api-spec
  - laptop-shop
  - roles
  - rbac
  - permissions
---

# FEA_005 — Quản lý Vai trò (Roles)

> Lần luồng thật bằng CodeGraph MCP (`codegraph_context` / `codegraph_explore` / `codegraph_impact`) trên project `laptop-shop`. Mọi claim kèm `file:line`.

## 1. Tổng quan

Module `roles` quản lý vai trò (RBAC) và việc gán permission cho vai trò. Đây là tầng quản trị: mọi route đòi permission `ADMIN_MANAGE_ROLES` hoặc `ADMIN_MANAGE_PERMISSIONS`.

Toàn bộ controller bảo vệ bởi `JwtAuthGuard` + `PermissionGuard` (`src/roles/roles.controller.ts:21`). `RolesService` chỉ inject `PrismaService` (`src/roles/roles.service.ts:12`).

Đặc trưng nghiệp vụ:
- **Soft-delete** vai trò (set `deletedAt`), chặn xóa nếu còn user đang gán.
- Gán permission qua bảng nối `rolePermission` (xóa hết rồi tạo lại — replace toàn bộ).
- Validate permission tồn tại trước khi gán.

## 2. Danh sách API

| # | Method | URL | Permission | Payload chính | Handler |
|---|--------|-----|------------|---------------|---------|
| 1 | POST | `/api/roles` | `ADMIN_MANAGE_ROLES` | `CreateRoleDto` (`{ name, description?, permissionNames?[] }`) | `create` (`roles.controller.ts:27`) |
| 2 | GET | `/api/roles` | `ADMIN_MANAGE_ROLES` | — | `findAll` (`:33`) |
| 3 | GET | `/api/roles/permissions/available` | `ADMIN_MANAGE_PERMISSIONS` | — | `getAllPermissions` (`:39`) |
| 4 | GET | `/api/roles/:id` | `ADMIN_MANAGE_ROLES` | param `id` | `findOne` (`:45`) |
| 5 | GET | `/api/roles/:id/permissions` | `ADMIN_MANAGE_ROLES` | param `id` | `getRolePermissions` (`:51`) |
| 6 | PATCH | `/api/roles/:id` | `ADMIN_MANAGE_ROLES` | `UpdateRoleDto` | `update` (`:57`) |
| 7 | PUT | `/api/roles/:id/permissions` | `ADMIN_MANAGE_PERMISSIONS` | `{ permissionNames: string[] }` | `updateRolePermissions` (`:63`) |
| 8 | DELETE | `/api/roles/:id` | `ADMIN_MANAGE_ROLES` | param `id` | `remove` (`:72`) |

> Thứ tự route: `permissions/available` khai báo trước `:id` (`:37` vs `:43`) nên không bị nuốt bởi param `:id`.

## 3. Chuỗi gọi controller → service → repository

```
RolesController.create        → RolesService.create        → prisma.role.create → assignPermissionsToRole → prisma.permission.findMany + rolePermission.createMany → findOne
RolesController.findAll       → RolesService.findAll        → prisma.role.findMany (_count.users)
RolesController.getAllPermissions   → RolesService.getAllPermissions   → prisma.permission.findMany
RolesController.findOne       → RolesService.findOne        → prisma.role.findUnique (include permissions.permission)
RolesController.getRolePermissions  → RolesService.getRolePermissions  → prisma.role.findUnique (include permissions.permission)
RolesController.update        → RolesService.update         → prisma.role.update + rolePermission.deleteMany + assignPermissionsToRole → findOne
RolesController.updateRolePermissions → RolesService.updateRolePermissions → findOne + rolePermission.deleteMany + assignPermissionsToRole → findOne
RolesController.remove        → RolesService.remove         → prisma.user.count + role.update (set deletedAt)
```

Helper private `assignPermissionsToRole` (`roles.service.ts:145`) được dùng lại bởi `create`, `update`, `updateRolePermissions` — là điểm trung tâm việc gán permission.

## 4. Business Logic

- **create** (`roles.service.ts:14`): tách `permissionNames` khỏi `roleData`, tạo role rồi (nếu có) gán permission; bắt lỗi Prisma `P2002` → `ConflictException('Role name already exists')` (`:32`). Trả về `findOne(role.id)` (kèm permissions).
- **findAll** (`:38`): chỉ lấy `deletedAt: null`, kèm `_count.users` (số user đang gán role).
- **findOne** (`:51`): include `permissions.permission` (chọn `id,name,description,resource,action`); không thấy → `NotFoundException` (`:75`).
- **update** (`:81`): cập nhật thông tin cơ bản; nếu `permissionNames !== undefined` → `rolePermission.deleteMany` xóa hết rồi gán lại (replace, không merge) (`:92-102`). Lỗi `P2002` → `ConflictException`.
- **remove** (`:114`): đếm user còn active gán role (`:116`); nếu `> 0` → `ConflictException('Cannot delete role. N user(s)...')` (`:124`). Nếu không có user → **soft-delete** set `deletedAt: new Date()` (`:130-141`).
- **assignPermissionsToRole** (`:145`, private): lấy permission theo tên; nếu thiếu tên nào → `NotFoundException('The following permissions do not exist: ...')` (`:165`); rồi `rolePermission.createMany` (`:178`).
- **getAllPermissions** (`:184`): trả tất cả permission, sort theo `resource` rồi `action`.
- **getRolePermissions** (`:191`): trả mảng `permission` (đã flatten từ `permissions.map(rp => rp.permission)`); role không tồn tại → `NotFoundException` (`:203`).
- **updateRolePermissions** (`:211`): `findOne` để verify tồn tại → xóa hết rolePermission → gán lại → trả `findOne`.

> Điểm cần human-review: `update` (`:81`) và `remove` (`:114`) gọi `role.update({ where: { id } })` không lọc `deletedAt`, có thể tác động lên role đã soft-deleted; cần kiểm tra mong muốn.

## 5. Tương tác Database (Prisma)

| Model | Thao tác | Vị trí (roles.service.ts) |
|-------|----------|---------------------------|
| `role` | create, findMany, findUnique, update | `:19,39,52,86,130,192` |
| `rolePermission` | deleteMany, createMany | `:94,178,216` |
| `permission` | findMany | `:150,185` |
| `user` | count (kiểm tra ràng buộc trước khi xóa role) | `:116` |

Quan hệ many-to-many `Role ↔ Permission` đi qua bảng nối `rolePermission` (`roleId`, `permissionId`).

## 6. Phạm vi ảnh hưởng (impact)

`codegraph_impact` / `codegraph_explore` cho thấy cụm `roles` khá biệt lập, gói trong 2 file:

- **roles.controller.ts**: `RolesController:22`, `create:27`, `findAll:33`, `getAllPermissions:39`, `findOne:45`, `getRolePermissions:51`, `update:57`, `updateRolePermissions:63`, `remove:72`.
- **roles.service.ts**: `RolesService:11`, `create:14`, `findAll:38`, `findOne:51`, `update:81`, `remove:114`, `assignPermissionsToRole:145`, `getAllPermissions:184`, `getRolePermissions:191`, `updateRolePermissions:211`.

Sửa `assignPermissionsToRole` ảnh hưởng tới 3 caller (`create`, `update`, `updateRolePermissions`). Vai trò liên quan trực tiếp tới gán role cho user — xem [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Người dùng]] (`UsersService.create` đọc role mặc định `CUSTOMER`).

## 7. Liên kết

- [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Người dùng]]
- [[03_Architecture/laptop-shop_Architecture|Kiến trúc BE]]
- [[06_Code_Graph/laptop-shop/products/SKILL|Code Graph products]]
