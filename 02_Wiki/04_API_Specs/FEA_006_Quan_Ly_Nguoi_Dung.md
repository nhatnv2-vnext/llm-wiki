---
title: "FEA_006 - Quản lý Người dùng"
type: api-spec
project: laptop-shop
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop/src/users/users.controller.ts"
status: draft
last_synced: "2026-06-03"
tags: [api-spec, backend, nestjs, users, profile, laptop-shop]
---

# FEA_006 — Quản lý Người dùng

> Module CRUD người dùng, xem hồ sơ cá nhân và đổi mật khẩu.
> Controller: `src/users/users.controller.ts` · Service: `src/users/users.service.ts`

## Tổng quan

`UsersController` quản lý vòng đời tài khoản người dùng (tạo / liệt kê / xem / cập nhật / xoá mềm), hồ sơ của user đăng nhập (`/me`) và đổi mật khẩu. Toàn bộ controller bảo vệ bởi `@UseGuards(JwtAuthGuard, PermissionGuard)` (`users.controller.ts:23`), mỗi endpoint yêu cầu permission `users:*` tương ứng.

Prefix toàn cục `api` (`src/main.ts:37`) → route đầy đủ `/api/users/...`.

Tài liệu liên quan:
- Frontend: Quản lý người dùng, [[02_Design/SCR_005_Lich_Su_Don_Hang|Hồ sơ cá nhân]], [[02_Design/SCR_006_Chi_Tiet_Don_Hang|Đổi mật khẩu]]
- Feature liên quan: [[04_API_Specs/FEA_005_Quan_Ly_Vai_Tro|Quản lý vai trò]], [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực & phiên đăng nhập]], [[04_API_Specs/FEA_002_Phan_Quyen|Phân quyền (Permissions)]], [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm, Giỏ hàng & Đơn hàng]]
- Kiến trúc: [[03_Architecture/laptop-shop_Architecture|Kiến trúc Backend]]
- Database: Schema laptop-shop

## Danh sách APIs

| # | Method | URL | Permission | HTTP code | Service gọi |
|---|--------|-----|------------|-----------|-------------|
| 1 | POST | `/api/users` | `users:create` | 201 | `create()` |
| 2 | GET | `/api/users?page=` | `users:list` | 200 | `findAll()` |
| 3 | GET | `/api/users/me` | `users:read` | 200 | `getProfile()` |
| 4 | GET | `/api/users/:id` | `users:read` | 200 | `findOne()` |
| 5 | PUT | `/api/users/:id` | `users:update` | 200 | `update()` |
| 6 | PUT | `/api/users/:id/change-password` | `users:update` | 200 | `changePassword()` |
| 7 | DELETE | `/api/users/:id` | `users:delete` | 204 | `remove()` (soft delete) |

> Thứ tự route: `/me` khai báo trước `:id` (`users.controller.ts:42,48`) để không bị route động nuốt.

### 1. POST /api/users — Tạo người dùng
- **Permission**: `users:create`. HTTP 201 (`users.controller.ts:28-29`).
- **Body** (`CreateUserDto`, `dto/user.dto.ts`):
```json
{
  "username": "user01",
  "password": "secret123",
  "fullName": "Nguyễn Văn A",
  "address": "123 ABC",
  "phone": "0901234567",
  "avatar": "https://cdn.shop/a.png"
}
```
- **Validation**: `username` 3–50 ký tự; `password` 6–100; `fullName`/`address`/`avatar` tuỳ chọn (avatar phải URL); `phone` tuỳ chọn, regex `^[0-9+\-\s()]+$`, ≤20.
- **Logic** (`users.service.ts:16-50`):
  1. Trùng `username` → `ConflictException('Username already exists')`.
  2. Hash mật khẩu (`hashPassword`).
  3. Tìm role `CUSTOMER` → gán `roleId` (fallback `1` nếu không tìm thấy).
  4. Tạo user với `accountType = SYSTEM`, include `role`.

### 2. GET /api/users?page=N — Danh sách người dùng (phân trang)
- **Permission**: `users:list`. `page` mặc định 1, ≤0 → 1 (`users.controller.ts:36-38`).
- **Logic**: lọc `deletedAt: null`, `omit password`, include `role` + `cart`; trang `PAGE_SIZE`. Trả `{ data, currentPage, totalPages, totalUsers }` (`users.service.ts:52-78`).

### 3. GET /api/users/me — Hồ sơ user đăng nhập
- **Permission**: `users:read`. Lấy `userId` từ `@User()` (token).
- **Logic** (`users.service.ts:206-255`): `findUnique` theo `id` + `deletedAt: null`, omit `password`/`refreshToken`, include `role` và `cart.cartDetails.quantity`. Tính `totalItemsInCart = Σ quantity`, loại `cart` khỏi response, trả kèm `totalItemsInCart`.

### 4. GET /api/users/:id — Chi tiết người dùng
- **Permission**: `users:read`.
- **Logic**: `findUnique` theo `id` + `deletedAt: null`, omit `password`, include `role` + `cart`; không thấy → `NotFoundException` (`users.service.ts:80-100`).

### 5. PUT /api/users/:id — Cập nhật người dùng
- **Permission**: `users:update`. `:id` qua `ParseIntPipe`.
- **Body** (`UpdateUserDto`): `fullName?`, `address?`, `phone?`, `avatar?`, `roleId?` (≥1). (Không cho đổi `username`/`password` qua endpoint này.)
- **Logic** (`users.service.ts:115-135`): kiểm tra tồn tại qua `findOne` → `user.update`, omit `password`, include `role`.

### 6. PUT /api/users/:id/change-password — Đổi mật khẩu
- **Permission**: `users:update`. HTTP 200 (`users.controller.ts:63-64`).
- **Body** (`ChangePasswordDto`, `dto/change-password.dto.ts`):
```json
{
  "currentPassword": "old123",
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}
```
- **Validation**: `newPassword` 6–100 ký tự; `confirmPassword` phải khớp `newPassword` (validator tuỳ chỉnh `@MatchPassword('newPassword')`, `src/common/validators`).
- **Logic** (`users.service.ts:137-175`):
  1. Lấy user (chỉ `id`, `password`); không thấy → `NotFoundException`.
  2. So khớp `currentPassword` (`comparePassword`); sai → `ConflictException('Current password is incorrect')`.
  3. Hash `newPassword`, update; trả `{ id, username, fullName, updatedAt }`.

### 7. DELETE /api/users/:id — Xoá mềm người dùng
- **Permission**: `users:delete`. HTTP 204 (`users.controller.ts:73-74`).
- **Logic**: `prisma.softDelete(user, { id })` (set `deletedAt`) (`users.service.ts:201-204`).

## Business Logic (Quy tắc nghiệp vụ)

- **Mật khẩu luôn hash**: tạo user và đổi mật khẩu đều qua `hashPassword`; mọi truy vấn trả về đều `omit password` (trừ `findByUsername` dùng cho xác thực).
- **Username unique**: tạo user kiểm tra trùng → `ConflictException`.
- **Role mặc định CUSTOMER**: user mới được gán role `CUSTOMER`; `accountType = SYSTEM` (`src/config/constant`, `permissions.constant.ts`).
- **Soft delete**: xoá set `deletedAt`; mọi list/detail lọc `deletedAt: null`.
- **/me suy ra từ token**: không nhận `id` từ client, lấy `user.userId` từ JWT → tránh xem hồ sơ người khác.
- **Đổi mật khẩu cần mật khẩu hiện tại**: phải cung cấp đúng `currentPassword` mới đổi được.
- **Service mở rộng cho Auth**: `findByUsername`, `updateRefreshToken`, `findByRefreshToken` (`users.service.ts:102-199`) phục vụ luồng xác thực — xem [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực & phiên đăng nhập]].

## Database tương tác

Xem Schema laptop-shop:

| Model | Table | Vai trò |
|-------|-------|---------|
| `User` | `users` | CRUD user, password, refreshToken, soft delete |
| `Role` | `roles` | Gán role mặc định khi tạo, include khi đọc — [[04_API_Specs/FEA_005_Quan_Ly_Vai_Tro|Quản lý vai trò]] |
| `Cart` | `carts` | Include vào hồ sơ/danh sách; tính `totalItemsInCart` |
| `CartDetail` | `cart_detail` | Lấy `quantity` để tính số item trong giỏ (`/me`) |

Truy cập DB qua `PrismaService` (`src/database`); hash/so khớp mật khẩu qua helper `hashPassword`/`comparePassword` (`src/common`).

## Cần human review

- `update` cho phép truyền `roleId` tự do với chỉ permission `users:update` — cần xác nhận có nên giới hạn việc nâng quyền (escalation) bằng permission admin riêng.
- `findAll` không `omit` các field nhạy cảm khác ngoài `password` (vd `refreshToken` không bị omit trong `findAll`/`findOne`) — cần review lộ lọt token.
