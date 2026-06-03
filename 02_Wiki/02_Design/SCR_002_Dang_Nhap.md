---
title: Đăng nhập
type: screen-spec
project: laptop-shop-angular
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/client/auth/login.component.ts"
status: draft
last_synced: "2026-06-03"
tags: [screen, frontend, angular, auth, login]
---

# Đăng nhập · SCR_002

> Nguồn: CodeGraph MCP + code-reader (không có Figma node). Mọi claim kèm `file:line`.

## Tổng quan màn hình

Màn hình đăng nhập (`/login`) cho phép người dùng nhập email + mật khẩu để xác thực. Sau khi thành công, lưu token vào session/localStorage, tải hồ sơ hiện tại và điều hướng về `returnUrl` (hoặc `/`).

- Route: `path: 'login'` → `LoginComponent`, lazy, guard `guestOnlyGuard` (chặn user đã đăng nhập). `app.routes.ts:12-14`
- Component standalone dùng `FormGroup` reactive + signals. `login.component.ts:202`

## Thành phần UI

- Form đăng nhập `loginForm` với 3 control: `username`, `password`, `rememberPassword`. `login.component.ts:223-227`
- Hiển thị lỗi field qua `isFieldInvalid(name)`. `login.component.ts:230-233`
- Banner lỗi từ `errorMessages()` signal. `login.component.ts:217`
- Trạng thái nút submit qua `isLoading()`. `login.component.ts:216`

## Luồng tương tác

1. Người dùng nhập form; submit gọi `onSubmit()`. `login.component.ts:235`
2. Nếu `loginForm.invalid` → mark all touched, dừng. `login.component.ts:236-242`
3. Hợp lệ → `authenticateUser({ username, password })` POST login. `login.component.ts:252-255,291`
4. Có `access_token` → `authService.setSessionFromTokens(access, refresh)` rồi `await firstValueFrom(authService.fetchCurrentUser())`. `login.component.ts:258-264`
5. Điều hướng tới `returnUrl` (queryParam) hoặc `/`. `login.component.ts:268-269`
6. Lỗi: map theo status — 401 sai tài khoản, 0 không kết nối được, else dùng `error.message`. `login.component.ts:275-285`

## Service / API gọi tới

| Hành động | Method + Path | file:line |
|---|---|---|
| Đăng nhập | `POST /api/v1/auth/login` body `{ username, password }` | `login.component.ts:209,293` |
| Lưu session | `AuthService.setSessionFromTokens` (NgRx + localStorage) | `auth.service.ts:70` |
| Tải hồ sơ | `GET /api/v1/users/me` (qua `fetchCurrentUser`) | `auth.service.ts:108` |

## Component gọi service nào (CodeGraph callees)

- `LoginComponent.onSubmit` → `authenticateUser` → `HttpClient.post`. `login.component.ts:252,293`
- `LoginComponent.onSubmit` → `AuthService.setSessionFromTokens`. `login.component.ts:259`
- `LoginComponent.onSubmit` → `AuthService.fetchCurrentUser`. `login.component.ts:264`
- `AuthService.setSessionFromTokens` → `AuthActions.setTokens` / `setCurrentUser`. `auth.service.ts:74,79`
- CodeGraph references: `authenticateUser` → `LoginRequest`, `LoginResponse` (DTO). `login.component.ts:291`

## State

- Form state: `loginForm` (Validators.email, minLength 6). `login.component.ts:220-227`
- Signals UI: `_isLoading`, `_errorMessages`. `login.component.ts:212-213`
- Global state ghi vào sau login: NgRx auth (`setTokens`, `setCurrentUser`, `setTotalItemsInCart`). `auth.service.ts:73-79,114-115`

## Liên kết

- Backend: [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực]], [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Người dùng]]
- Màn hình: [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]]
- Kiến trúc: [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc FE]]
- Code graph: [[06_Code_Graph/laptop-shop-angular/client/SKILL|Code Graph client]]
