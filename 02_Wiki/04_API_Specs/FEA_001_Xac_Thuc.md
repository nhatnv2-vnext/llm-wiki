---
title: "FEA_001 - Xác thực & Phiên đăng nhập"
type: api-spec
project: laptop-shop
source:
  - "local: src/auth/auth.controller.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - api-spec
  - laptop-shop
  - auth
  - jwt
  - authentication
---

# FEA_001 — Xác thực & Phiên đăng nhập

> Spec này được lần luồng bằng **CodeGraph MCP** (callers/callees/impact) trên index `laptop-shop`, không đọc mò. Mọi claim đều kèm `file:line`.

## 1. Tổng quan

Module `AuthController` (`src/auth/auth.controller.ts:17`) cung cấp 4 endpoint cho vòng đời phiên đăng nhập dựa trên **JWT (access + refresh token)**:

- Đăng nhập bằng username/password (Passport `local` strategy).
- Đăng ký tài khoản mới (phát event để gửi welcome email).
- Làm mới access token bằng refresh token.
- Đăng xuất (xóa refresh token khỏi DB).

Toàn bộ logic nghiệp vụ nằm ở `AuthService` (`src/auth/auth.service.ts:10`). Controller chỉ là lớp mỏng forward request.

## 2. Chuỗi gọi thật (CodeGraph)

CodeGraph callees/callers cho thấy chuỗi gọi controller → service → repository như sau:

```
POST /auth/login    → handleLogin       (auth.controller.ts:22)
                        ↳ LocalAuthGuard → LocalStrategy.validate (local.strategy.ts:12)
                            ↳ AuthService.validateUser           (auth.service.ts:18)
                                ↳ UsersService.findByUsername     (users.service.ts:102) → prisma.user.findUnique
                                ↳ comparePassword                 (common/utils/password.util)
                        ↳ AuthService.login                       (auth.service.ts:28)
                            ↳ JwtService.sign (x2)
                            ↳ UsersService.updateRefreshToken     (users.service.ts:177) → UsersService.update → prisma.user.update

POST /auth/register → handleRegister     (auth.controller.ts:29)
                        ↳ AuthService.register                    (auth.service.ts:48)
                            ↳ UsersService.create                 (users.service.ts:16) → prisma.user.create
                            ↳ EventEmitter2.emit('user.registered') → [FEA_003] CronjobService.handleUserRegistered

POST /auth/refresh  → handleRefreshToken (auth.controller.ts:37)
                        ↳ AuthService.refreshToken                (auth.service.ts:73)
                            ↳ JwtService.verify
                            ↳ UsersService.findByRefreshToken     (users.service.ts) → prisma.user.findUnique
                            ↳ UsersService.updateRefreshToken     → prisma.user.update

POST /auth/logout   → handleLogout       (auth.controller.ts:45)
                        ↳ JwtAuthGuard (JwtStrategy.validate, jwt.strategy.ts:16)
                        ↳ AuthService.logout                      (auth.service.ts:112)
                            ↳ UsersService.updateRefreshToken(userId, null) → prisma.user.update
```

> **Phát hiện nhờ CodeGraph (mà đọc tay dễ bỏ sót):** `register` không chỉ tạo user — nó `emit('user.registered')` (`auth.service.ts:59`). CodeGraph callees nối thẳng tới `CronjobService.handleUserRegistered` (`cronjob.service.ts:24`) → `queueWelcomeEmail` (`cronjob.service.ts:156`). Tức là **luồng đăng ký FEA_001 nối liền với hàng đợi email FEA_003** qua event-driven, một liên kết ẩn không thể grep ra.

## 3. Danh sách API

Prefix controller: `@Controller('auth')` (`auth.controller.ts:16`). Đường dẫn thực tế có thể kèm global prefix `/api` (xem `main.ts`).

### 3.1 POST /auth/login
- **Guard:** `@Public()` + `@UseGuards(LocalAuthGuard)` (`auth.controller.ts:19-20`). Local strategy tự validate user trước khi vào handler.
- **Payload:** `{ "username": string, "password": string }` (đọc bởi `LocalStrategy.validate`, `local.strategy.ts:12`).
- **Logic:** `validateUser` so khớp password bằng `comparePassword`; nếu sai → `UnauthorizedException` (`local.strategy.ts:15`).
- **Response:** `{ access_token, refresh_token }` (`auth.service.ts:42-45`).

### 3.2 POST /auth/register
- **Guard:** `@Public()` (`auth.controller.ts:27`), kèm `@ResponseMessage('User registered successfully')`.
- **Payload:** `RegisterUserDto` — `{ username, password, fullName, ... }`. `confirmPassword` (nếu có) bị loại bỏ khi tạo user (`auth.service.ts:50-54`).
- **Response:** `{ id, username, fullName }` (`auth.service.ts:66-70`).

### 3.3 POST /auth/refresh
- **Guard:** `@Public()` + `@HttpCode(200)` (`auth.controller.ts:34-36`).
- **Payload:** `RefreshTokenDto` — `{ "refreshToken": string }` (`src/auth/dto/refresh-token.dto.ts:3`).
- **Response:** `{ access_token, refresh_token }` mới (`auth.service.ts:103-106`).

### 3.4 POST /auth/logout
- **Guard:** `@UseGuards(JwtAuthGuard)` + `@HttpCode(200)` (`auth.controller.ts:42-44`).
- **Payload:** không có body; lấy `req.user.sub` từ JWT (`auth.controller.ts:46`).
- **Response:** `{ message: 'Logout successful' }` (`auth.service.ts:115`).

## 4. Business Logic (Quy tắc Nghiệp vụ)

- **Cấp token kép:** access token (`JWT_ACCESS_TOKEN_EXPIRATION`, mặc định `15m`) và refresh token (`JWT_REFRESH_TOKEN_EXPIRATION`, mặc định `7d`) — `auth.service.ts:31-37`.
- **Refresh token lưu DB:** mỗi lần login/refresh, refresh token được ghi vào cột `refreshToken` của user qua `updateRefreshToken` (`auth.service.ts:40, 101`). Logout set về `null` (`auth.service.ts:114`).
- **Validate refresh:** `refreshToken` verify chữ ký JWT **và** đối chiếu token trong DB (`findByRefreshToken`) + so `user.id === payload.sub` (`auth.service.ts:78-85`). Mọi lỗi → `UnauthorizedException('Invalid refresh token')` (`auth.service.ts:108`).
- **Đăng ký phát event:** `emit('user.registered', {...})` để bộ phận cronjob xếp welcome email vào queue (`auth.service.ts:59-64`). Đây là xử lý bất đồng bộ, không block response đăng ký.
- **Account type mặc định:** user mới tạo có `accountType = SYSTEM` và `roleId` = role `CUSTOMER` (`users.service.ts:40-41`).
- **Không lộ password:** `validateUser` loại field `password` khỏi object trả về (`auth.service.ts:22`).

## 5. Database tương tác

Truy cập DB qua Prisma (không có repository riêng — service gọi thẳng `PrismaService`):

| Bảng | Thao tác | Vị trí |
|------|----------|--------|
| `user` | `findUnique` (theo username, kèm role) | `users.service.ts:102` (findByUsername) |
| `user` | `create` (đăng ký) | `users.service.ts:32` |
| `user` | `update` (ghi/xóa refreshToken) | `users.service.ts:115` (qua updateRefreshToken) |
| `user` | `findUnique` (theo refreshToken) | findByRefreshToken |
| `role` | `findFirst` (role CUSTOMER khi tạo user) | `users.service.ts:28` |

## 6. Phạm vi ảnh hưởng (impact)

`codegraph_impact AuthService` → **21 symbol** phụ thuộc. Nếu sửa `AuthService`, các điểm sau bị ảnh hưởng:

- `src/auth/auth.service.ts`: `validateUser:18`, `login:28`, `register:48`, `refreshToken:73`, `logout:112`.
- `src/auth/passport/local.strategy.ts`: `LocalStrategy:7`, `validate:12` (gọi `validateUser`).
- `src/auth/auth.controller.ts`: cả 4 handler + 4 route (`POST /auth/login|register|refresh|logout`).

Phụ thuộc xuôi (callees): `UsersService.findByUsername / create / updateRefreshToken / findByRefreshToken`, `JwtService.sign|verify`, `EventEmitter2.emit` → `CronjobService`.

## 7. Liên kết

- [[04_API_Specs/FEA_002_Phan_Quyen|Phân quyền (Permissions)]]
- [[04_API_Specs/FEA_003_Cronjob_Hang_Doi_Email|Cronjob & Hàng đợi email]] — nơi nhận event `user.registered`
- [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý Người dùng]] — `UsersService` được inject vào `AuthService`
- [[03_Architecture/laptop-shop_Architecture|Kiến trúc Backend]]
- [[06_Code_Graph/laptop-shop/auth/SKILL|Code Graph — module auth]]

## 8. Cần human review

- DTO `login` không có class validator riêng (validate trong Passport local strategy) — cần xác nhận quy tắc password/username.
- `refreshToken` dùng `JwtService.verify` với secret mặc định; cần kiểm tra có dùng đúng secret cho refresh token không.
