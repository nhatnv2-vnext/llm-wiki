---
title: "FEA_006 - Quản lý Người dùng"
type: api-spec
project: laptop-shop
source:
  - "local: src/users/users.controller.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - api-spec
  - laptop-shop
  - users
  - profile
  - password
---

# FEA_006 — Quản lý Người dùng

> Lần luồng thật bằng CodeGraph MCP (`codegraph_context` / `codegraph_explore` / `codegraph_impact`) trên project `laptop-shop`. Mọi claim kèm `file:line`.

## 1. Tổng quan

Module `users` quản lý CRUD người dùng, hồ sơ cá nhân (`/me`) và đổi mật khẩu. Ngoài các API public-facing, `UsersService` còn chứa các helper được tầng Auth tái sử dụng (`findByUsername`, `updateRefreshToken`, `findByRefreshToken`) — không expose qua controller này nhưng quan trọng cho impact.

Toàn bộ controller bảo vệ bởi `JwtAuthGuard` + `PermissionGuard` (`src/users/users.controller.ts:23`). `UsersService` chỉ inject `PrismaService` (`src/users/users.service.ts:14`).

Nguyên tắc bảo mật:
- Mọi truy vấn list/find đều `omit: { password: true }` (`users.service.ts:62,87,126`).
- Mật khẩu hash bằng `hashPassword` (`bcrypt` qua `src/common`).
- Soft-delete user (`deletedAt`), không xóa cứng.

## 2. Danh sách API

| # | Method | URL | Permission | Payload chính | Handler |
|---|--------|-----|------------|---------------|---------|
| 1 | POST | `/api/users` (201) | `USERS_CREATE` | `CreateUserDto` | `create` (`users.controller.ts:30`) |
| 2 | GET | `/api/users?page=` | `USERS_LIST` | query `page` | `findAll` (`:36`) |
| 3 | GET | `/api/users/me` | `USERS_READ` | — (lấy `user.userId`) | `getProfile` (`:44`) |
| 4 | GET | `/api/users/:id` | `USERS_READ` | param `id` | `findOne` (`:50`) |
| 5 | PUT | `/api/users/:id` | `USERS_UPDATE` | `UpdateUserDto` (id qua `ParseIntPipe`) | `update` (`:56`) |
| 6 | PUT | `/api/users/:id/change-password` (200) | `USERS_UPDATE` | `ChangePasswordDto` (`{ currentPassword, newPassword }`) | `changePassword` (`:66`) |
| 7 | DELETE | `/api/users/:id` (204) | `USERS_DELETE` | param `id` (`ParseIntPipe`) | `remove` (`:76`) |

> Route `/me` khai báo trước `:id` (`:42` vs `:48`) nên không bị nuốt bởi param `:id`. `id` ở các route dùng `ParseIntPipe` để validate kiểu số ngay tại controller.

## 3. Chuỗi gọi controller → service → repository

```
UsersController.create         → UsersService.create         → prisma.user.findUnique + role.findFirst(CUSTOMER) + user.create
UsersController.findAll        → UsersService.findAll        → prisma.user.count + user.findMany (omit password, include role+cart)
UsersController.getProfile     → UsersService.getProfile     → prisma.user.findUnique (include role + cart.cartDetails)
UsersController.findOne        → UsersService.findOne        → prisma.user.findUnique (omit password, include role+cart)
UsersController.update         → UsersService.update         → findOne (verify) + prisma.user.update
UsersController.changePassword → UsersService.changePassword → prisma.user.findUnique + comparePassword + hashPassword + user.update
UsersController.remove         → UsersService.remove         → prisma.softDelete(user)
```

Helper tầng Auth (không qua controller này): `findByUsername` (`:102`), `updateRefreshToken` (`:177`), `findByRefreshToken` (`:189`).

## 4. Business Logic

- **create** (`users.service.ts:16`): chặn trùng `username` → `ConflictException('Username already exists')` (`:23`); hash password (`:27`); lấy role mặc định `ROLES.CUSTOMER` (`:28`), fallback `roleId: 1` nếu không tìm thấy (`:41`); `accountType: ACCOUNT_TYPE.SYSTEM`. Trả user kèm `role`.
- **findAll** (`:52`): phân trang theo `PAGE_SIZE`, lọc `deletedAt: null`, `omit password`, include `role` + `cart`.
- **findOne** (`:80`): `omit password`, include `role` + `cart`; không thấy → `NotFoundException` (`:96`).
- **update** (`:115`): gọi `findOne(id)` để verify tồn tại trước (`:116`) rồi `user.update`; `omit password`. (Lưu ý: không hash lại password nếu payload chứa password — cần human-review.)
- **changePassword** (`:137`): lấy user kèm password → `comparePassword(currentPassword, user.password)` (`:152`); sai → `ConflictException('Current password is incorrect')` (`:158`); đúng → `hashPassword(newPassword)` (`:162`) + `user.update`. Chỉ trả `{ id, username, fullName, updatedAt }`.
- **remove** (`:201`): soft-delete qua `prisma.softDelete(this.prisma.user, { id })` — controller trả 204.
- **getProfile** (`:206`): validate `id` là number (`:208`); lấy user `omit password+refreshToken`, include `role` + `cart.cartDetails.quantity`; tính `totalItemsInCart = Σ quantity` (`:242`); loại `cart` khỏi response, trả `{ ...userWithoutCart, totalItemsInCart }`.

> Điểm cần human-review: `update` (`:115`) nhận `updateUserDto` trải thẳng vào `updateData` — nếu DTO cho phép field `password` thì sẽ lưu plaintext (không hash). Cần xác nhận `UpdateUserDto` không chứa password.

## 5. Tương tác Database (Prisma)

| Model | Thao tác | Vị trí (users.service.ts) |
|-------|----------|---------------------------|
| `user` | findUnique, findFirst, count, findMany, create, update, softDelete | `:18,32,55,57,81,103,123,139,165,178,190,203,214` |
| `role` | findFirst (lấy role CUSTOMER mặc định) | `:28` |
| `cart` / `cartDetail` | đọc qua include (profile/findAll/findOne) | `:66,91,225-233` |

Phụ thuộc helper bên ngoài: `hashPassword`, `comparePassword` (`src/common`, `:8`); hằng `ACCOUNT_TYPE`, `PAGE_SIZE` (`src/config/constant`), `ROLES` (`src/auth/constants/permissions.constant`).

## 6. Phạm vi ảnh hưởng (impact)

Cụm `users` gói trong 2 file chính, NHƯNG service được Auth tái sử dụng nên impact lan rộng hơn roles:

- **users.controller.ts**: `UsersController:24`, `create:30`, `findAll:36`, `getProfile:44`, `findOne:50`, `update:56`, `changePassword:66`, `remove:76`.
- **users.service.ts**: `UsersService:13`, `create:16`, `findAll:52`, `findOne:80`, `findByUsername:102`, `update:115`, `changePassword:137`, `updateRefreshToken:177`, `findByRefreshToken:189`, `remove:201`, `getProfile:206`.

Các helper `findByUsername` / `updateRefreshToken` / `findByRefreshToken` được module Auth gọi → thay đổi chữ ký của chúng sẽ ảnh hưởng [[04_API_Specs/FEA_005_Quan_Ly_Vai_Tro|module phân quyền/role]] và luồng xác thực. `create` phụ thuộc role mặc định `CUSTOMER` nên gắn chặt với quản lý vai trò.

## 7. Liên kết

- [[04_API_Specs/FEA_005_Quan_Ly_Vai_Tro|Vai trò]]
- [[03_Architecture/laptop-shop_Architecture|Kiến trúc BE]]
- [[06_Code_Graph/laptop-shop/products/SKILL|Code Graph products]]
