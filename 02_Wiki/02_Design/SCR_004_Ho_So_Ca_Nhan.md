---
title: Hồ sơ cá nhân
type: screen-spec
project: laptop-shop-angular
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/client/profile/profile.component.ts"
status: draft
last_synced: "2026-06-03"
tags: [screen, frontend, angular, profile, user, placeholder]
---

# Hồ sơ cá nhân · SCR_004

> Nguồn: code-reader (không có Figma node). Mọi claim kèm `file:line`.

## Tổng quan màn hình

Hồ sơ cá nhân (`/profile`) hiện là **placeholder** ("Trang ho so đang được phát triển"). Yêu cầu đăng nhập (`authGuard`). Chỉ hiển thị email của user hiện tại lấy từ `AuthService`; chưa có form chỉnh sửa hay API riêng.

- Route: `path: 'profile'`, `canActivate: [authGuard]`, lazy `loadComponent`. `app.routes.ts:21-25`
- Component standalone, `OnPush`, không có `ngOnInit`, không inject `HttpClient`. `profile.component.ts:8-27`
- Liên quan: [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý người dùng]], [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc Frontend]], [[02_Design/SCR_005_Lich_Su_Don_Hang|Lịch sử đơn hàng]], [[02_Design/SCR_002_Dang_Nhap|Đăng nhập]].

## Thành phần UI chính

| Thành phần | Mô tả | file:line |
|---|---|---|
| `app-client-header` | Header chung; `[cartCount]="0"` hard-code (không đồng bộ giỏ thật) | `profile.component.ts:13` |
| Khối nội dung | "Tai khoan", hiển thị `currentUser()?.email`, thông báo đang phát triển | `profile.component.ts:15-20` |
| Nút "Quay về trang chủ" | `routerLink="/"` | `profile.component.ts:19` |
| `app-client-footer` | Footer chung | `profile.component.ts:22` |

## Luồng tương tác

- Không có handler/method nào ngoài binding hiển thị. Chỉ đọc `authService.currentUser()`. `profile.component.ts:17`
- Điều hướng duy nhất: link về `/`. `profile.component.ts:19`

## API / service gọi tới

| Method | Path | Mục đích | file:line |
|---|---|---|---|
| (none trực tiếp) | — | Component không tự gọi HTTP | `profile.component.ts:25-27` |
| (gián tiếp) | `AuthService` cung cấp `currentUser` (đã hydrate từ GET `/api/v1/users/me`) | Hiển thị email | `profile.component.ts:17`, `auth.service.ts:60,108` |

→ Backend liên quan (khi phát triển đầy đủ): [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý người dùng]].

## State / dữ liệu

- Không có signal cục bộ. Chỉ phụ thuộc `authService.currentUser` (signal từ NgRx `selectCurrentUser`). `profile.component.ts:26`, `auth.service.ts:60`
- `User` model: `{ id, username, email, fullName?, avatar?, address?, phone?, role? }`. `shared/models/index.ts:23-32`

> ⚠️ Cần human review: màn hình là placeholder chưa hoàn thiện. `cartCount` bị hard-code = 0 nên badge giỏ trong header không phản ánh số thực. `profile.component.ts:13`. Các field `fullName/address/phone` đã có trong model nhưng chưa được hiển thị/chỉnh sửa.
