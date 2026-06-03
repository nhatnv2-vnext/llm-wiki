---
title: "FEA_001 — Xác thực & Phiên đăng nhập"
type: api-spec
project: laptop-shop
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop/src/auth/auth.controller.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - api-spec
  - backend
  - auth
  - jwt
  - laptop-shop
---

# FEA_001 — Xác thực & Phiên đăng nhập

> Tài liệu liên quan: [[02_Design/SCR_002_Dang_Nhap|Màn Đăng nhập]] · [[04_API_Specs/FEA_002_Phan_Quyen|Phân quyền (Permissions)]] · [[04_API_Specs/FEA_003_Cronjob_Hang_Doi_Email|Cronjob & Hàng đợi email]] · [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý Người dùng]] · [[03_Architecture/laptop-shop_Architecture|Kiến trúc Backend]] · Schema Database

## 1. Tổng quan

Module `auth` chịu trách nhiệm **xác thực người dùng** và **quản lý phiên đăng nhập** theo cơ chế JWT (access token + refresh token). Module hỗ trợ 4 luồng chính: đăng nhập (login), đăng ký (register), làm mới token (refresh) và đăng xuất (logout).

- Controller: `src/auth/auth.controller.ts` — prefix route `auth` (`auth.controller.ts:16`).
- Service nghiệp vụ: `src/auth/auth.service.ts` (`auth.service.ts:10`).
- Phụ thuộc: `UsersService` (truy vấn/cập nhật user), `JwtService` (ký/verify token), `ConfigService` (đọc TTL token), `EventEmitter2` (phát sự kiện `user.registered`) — `auth.service.ts:11-16`.

Cơ chế token:
- Access token TTL mặc định `15m`, lấy từ env `JWT_ACCESS_TOKEN_EXPIRATION` (`auth.service.ts:32`).
- Refresh token TTL mặc định `7d`, lấy từ env `JWT_REFRESH_TOKEN_EXPIRATION` (`auth.service.ts:36`).
- Refresh token được lưu vào DB (cột `users.refresh_token`) để hỗ trợ thu hồi (`auth.service.ts:40`, `schema.prisma:29`).

## 2. Danh sách APIs

Tất cả endpoint dưới prefix `auth`. Route `login`/`register`/`refresh` được đánh dấu `@Public()` (bỏ qua `JwtAuthGuard`); `logout` yêu cầu access token hợp lệ.

### 2.1 POST `/auth/login`

- Guard: `LocalAuthGuard` (passport `local`) → xác thực username/password trước khi vào handler (`auth.controller.ts:20`, `local-auth.guard.ts:5`).
- Đầu vào (body, do `local.strategy` xử lý):

```json
{
  "username": "user@example.com",
  "password": "secret123"
}
```

- Logic: `validateUser()` tìm user theo username, so khớp mật khẩu bằng `comparePassword` (bcrypt) (`auth.service.ts:18-26`). Nếu hợp lệ → `login()` ký access + refresh token với payload `{ username, sub: user.id }` và lưu refresh token vào DB (`auth.service.ts:28-46`).
- Đầu ra:

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>"
}
```

### 2.2 POST `/auth/register`

- `@Public()`, `@ResponseMessage('User registered successfully')` (`auth.controller.ts:26-28`).
- Đầu vào — `RegisterUserDto` (`dto/register-user.dto.ts`):

```json
{
  "username": "user@example.com",
  "password": "secret123",
  "confirmPassword": "secret123",
  "fullName": "Nguyen Van A"
}
```

- Validation (class-validator):
  - `username`: phải là email hợp lệ — `@IsEmail` (`register-user.dto.ts:5`).
  - `password`: string, tối thiểu 6 ký tự (`register-user.dto.ts:8-9`).
  - `confirmPassword`: string, tối thiểu 6 ký tự, phải **khớp** `password` qua validator tùy biến `@MatchPassword('password')` (`register-user.dto.ts:12-17`).
  - `fullName`: string, không rỗng (`register-user.dto.ts:19-21`).
- Logic: `register()` chỉ lấy `username/password/fullName` (loại bỏ `confirmPassword`), gọi `userService.create()`, sau đó **phát event `user.registered`** để gửi welcome email bất đồng bộ qua queue (`auth.service.ts:48-65`). Xem [[04_API_Specs/FEA_003_Cronjob_Hang_Doi_Email|Cronjob & Hàng đợi email]].
- Đầu ra: `{ id, username, fullName }` (`auth.service.ts:66-70`).

### 2.3 POST `/auth/refresh`

- `@Public()`, `@HttpCode(200)`, `@ResponseMessage('Token refreshed successfully')` (`auth.controller.ts:33-37`).
- Đầu vào — `RefreshTokenDto`:

```json
{ "refreshToken": "<jwt>" }
```

  - `refreshToken`: string, không rỗng (`refresh-token.dto.ts:4-6`).
- Logic: `refreshToken()` verify chữ ký token → tìm user theo refresh token trong DB → đối chiếu `user.id === payload.sub`; nếu không khớp ném `UnauthorizedException`. Nếu hợp lệ → ký cặp token mới và cập nhật lại refresh token trong DB (token rotation) (`auth.service.ts:73-110`).
- Đầu ra: `{ access_token, refresh_token }`.

### 2.4 POST `/auth/logout`

- Guard: `JwtAuthGuard`, `@HttpCode(200)`, `@ResponseMessage('Logout successful')` (`auth.controller.ts:41-44`).
- Đầu vào: không có body; lấy user từ `req.user.sub` (`auth.controller.ts:46`).
- Logic: `logout()` set `refresh_token = null` trong DB để vô hiệu hóa phiên (`auth.service.ts:112-116`).
- Đầu ra: `{ message: 'Logout successful' }`.

## 3. Business Logic (Quy tắc nghiệp vụ)

1. **Xác thực mật khẩu**: so khớp bằng `comparePassword` (bcrypt). Mật khẩu không bao giờ trả về client — bị loại khỏi object user (`auth.service.ts:22-23`).
2. **Token rotation**: mỗi lần login/refresh đều sinh refresh token mới và ghi đè trong DB; refresh token cũ trở nên vô hiệu (`auth.service.ts:40`, `auth.service.ts:101`).
3. **Thu hồi phiên**: logout xóa refresh token trong DB → refresh sau đó thất bại (`auth.service.ts:114`).
4. **Public routes**: `JwtAuthGuard` đọc metadata `isPublic` để bỏ qua xác thực cho login/register/refresh (`jwt-auth.guard.ts:15-22`, `customize.ts:7-8`).
5. **Side-effect đăng ký**: phát event `user.registered` → consumer trong [[04_API_Specs/FEA_003_Cronjob_Hang_Doi_Email|cronjob/email]] đẩy welcome email vào Bull queue (`auth.service.ts:59-64`).

### Điểm cần human review (phát hiện lệch code)

- **`req.user.sub` vs `req.user.userId`**: `JwtStrategy.validate()` trả về object `{ userId, username }` (`passport/jwt.strategy.ts:16-18`), KHÔNG có trường `sub`. Tuy nhiên handler `handleLogout` lại đọc `req.user.sub` (`auth.controller.ts:46`) → giá trị có thể là `undefined`, dẫn tới logout không tìm đúng user. Cần xác nhận hành vi thực tế. (Liên quan cùng kiểu lỗi ở [[04_API_Specs/FEA_002_Phan_Quyen|FEA_002]].)
- `validateUser` nhận `user.password` từ bảng `users` — cần đảm bảo mật khẩu được hash khi tạo user (ở [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý Người dùng]]).

## 4. Database tương tác

| Bảng (`@@map`) | Model Prisma | Vai trò trong feature |
|---|---|---|
| `users` | `User` | Tìm user theo username/refresh token, lưu `refresh_token`, tạo user mới (`schema.prisma:19-38`) |
| `roles` | `Role` | Gắn `roleId` mặc định `1` khi tạo user; dùng cho phân quyền (`schema.prisma:28`, `schema.prisma:40-51`) |

- Cột chính: `users.refresh_token` (`@map("refresh_token")`, nullable) là nơi lưu phiên hiện hành (`schema.prisma:29`).
- Lưu ý: tồn tại model `Session` (`schema.prisma:10-17`) nhưng luồng auth JWT này **không** dùng tới nó; có thể là cơ chế session cũ — cần human review.

Tương tác DB thực hiện gián tiếp qua `UsersService` (`findByUsername`, `findByRefreshToken`, `updateRefreshToken`, `create`) — chi tiết ở [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý Người dùng]].
