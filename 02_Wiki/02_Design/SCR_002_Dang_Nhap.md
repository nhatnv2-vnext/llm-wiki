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

> Nguồn: code-reader (không có Figma node). Mọi claim kèm `file:line`.

## Tổng quan màn hình

Màn hình đăng nhập (`/login`) cho người dùng nhập email + mật khẩu để lấy JWT. Áp dụng `guestOnlyGuard` — người đã đăng nhập bị redirect về `/`. Sau khi đăng nhập thành công, điều hướng về `returnUrl` (nếu có) hoặc trang chủ.

- Route: `path: 'login'`, `canActivate: [guestOnlyGuard]`, lazy `loadComponent`. `app.routes.ts:11-15`
- `guestOnlyGuard`: nếu đã xác thực hoặc còn `access_token` trong localStorage → `createUrlTree(['/'])`. `guest-only.guard.ts:5-16`
- Component standalone, `OnPush`, dùng `ReactiveFormsModule`. `login.component.ts:29-32`
- Liên quan: [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực]], [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc Frontend]], [[02_Design/SCR_001_Trang_Chu|Trang chủ]].

## Thành phần UI chính

| Thành phần | Mô tả | file:line |
|---|---|---|
| Card đăng nhập (Bootstrap) | Khung form, header "Đăng nhập" | `login.component.ts:38-41` |
| Alert lỗi | Lặp `errorMessages()`, hiển thị khi có lỗi | `login.component.ts:44-50` |
| Input Email (`username`) | type=email, validate required + email | `login.component.ts:54-74` |
| Input Mật khẩu (`password`) | type=password, validate required + minLength 6 | `login.component.ts:76-96` |
| Checkbox "Ghi nhớ mật khẩu" (`rememberPassword`) | Control nhưng chưa dùng tới logic nào | `login.component.ts:98-108` |
| Nút "Đăng nhập" | disabled khi form invalid hoặc `isLoading()`; có spinner | `login.component.ts:112-125` |
| Link "Quên mật khẩu?" / "Đăng ký" | `routerLink` `/forgot-password`, `/register` (route chưa khai báo) | `login.component.ts:111,132` |

## Luồng tương tác

1. `onSubmit()`: nếu form invalid → markAsTouched toàn bộ control, dừng. `login.component.ts:235-242`
2. Set `isLoading=true`, clear lỗi → gọi `authenticateUser({username,password})` (POST login). `login.component.ts:244-255`
3. Có `access_token` → `authService.setSessionFromTokens(access, refresh)` rồi `await fetchCurrentUser()`. `login.component.ts:258-265`
4. Đọc `returnUrl` từ queryParam (mặc định `/`) → `router.navigateByUrl(returnUrl)`. `login.component.ts:268-269`
5. Lỗi: map theo status — 401 "sai tài khoản/mật khẩu", 0 "không kết nối được máy chủ", còn lại lấy `error.error.message`. `login.component.ts:275-285`
6. `finally` luôn `isLoading=false`. `login.component.ts:286-288`

## API / service gọi tới

| Method | Path | Mục đích | file:line |
|---|---|---|---|
| POST | `http://localhost:8080/api/v1/auth/login` body `{username,password}` | Xác thực, trả `access_token`/`refresh_token` | `login.component.ts:209,293` |
| (service) | `AuthService.setSessionFromTokens()` → dispatch NgRx + lưu localStorage | Lưu phiên | `auth.service.ts:70-97` |
| GET | `/api/v1/users/me` (qua `fetchCurrentUser`) | Lấy hồ sơ + giỏ sau login | `login.component.ts:264`, `auth.service.ts:108` |

`authInterceptor` KHÔNG gắn token cho `/auth/login` (qua `isAuthLoginOrRefresh`). `auth.interceptor.ts:13,37`

→ Backend liên quan: [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực]].

## State / dữ liệu

**FormGroup** `loginForm` (`FormBuilder`): `login.component.ts:222-228`

| Control | Validators | file:line |
|---|---|---|
| `username` | `required`, `email` | `login.component.ts:224` |
| `password` | `required`, `minLength(6)` | `login.component.ts:225` |
| `rememberPassword` | mặc định `false` | `login.component.ts:226` |

Signals: `_isLoading`/`isLoading`, `_errorMessages`/`errorMessages` (`string[]`). `login.component.ts:212-217`
Helper `isFieldInvalid(name)` kiểm tra invalid && (dirty||touched). `login.component.ts:230-233`

Phiên đăng nhập được lưu vào NgRx store auth + localStorage (`access_token`, `refresh_token`, `user`, `total_items_in_cart`). `auth.service.ts:81-96`

> ⚠️ Cần human review: route `/forgot-password` và `/register` được link nhưng chưa khai báo trong `app.routes.ts` (đang comment) → click sẽ rơi vào wildcard `/404`. `app.routes.ts:42-46,78-80`
