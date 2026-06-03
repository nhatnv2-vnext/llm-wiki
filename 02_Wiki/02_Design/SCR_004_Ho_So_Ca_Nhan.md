---
title: Hồ sơ cá nhân
type: screen-spec
project: laptop-shop-angular
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/client/profile/profile.component.ts"
status: draft
last_synced: "2026-06-03"
tags: [screen, frontend, angular, profile, user]
---

# Hồ sơ cá nhân · SCR_004

> Nguồn: CodeGraph MCP + code-reader (không có Figma node). Mọi claim kèm `file:line`.

## Tổng quan màn hình

Màn hình hồ sơ cá nhân (`/profile`) hiển thị thông tin tài khoản đăng nhập. Hiện ở trạng thái **placeholder / đang phát triển**: chỉ hiển thị email và nút quay về trang chủ.

- Route: `path: 'profile'` → `ProfileComponent`, lazy, guard `authGuard`. `app.routes.ts:22-24`
- Component standalone, `ChangeDetectionStrategy.OnPush`, **không có** `OnInit`. `profile.component.ts:11,25`

> ⚠️ Màn hình mới là khung; template ghi rõ "Trang ho so đang được phát triển." `profile.component.ts:18`

## Thành phần UI

- `app-client-header` với `[user]="authService.currentUser()"`, `[cartCount]="0"` (hard-code 0). `profile.component.ts:13`
- Tiêu đề "Tai khoan" + dòng email `authService.currentUser()?.email`. `profile.component.ts:16-17`
- Link `routerLink="/"` quay về trang chủ. `profile.component.ts:19`
- `app-client-footer`. `profile.component.ts:22`

## Luồng tương tác

1. Component render trực tiếp từ signal `authService.currentUser()` — không có lifecycle hook fetch riêng. `profile.component.ts:13,17`
2. Dữ liệu user được nạp upstream bởi `ClientHeaderComponent` (gọi `fetchCurrentUser` nếu có token mà chưa có user). `client-header.component.ts:232-239`
3. Bấm link → điều hướng `/`. `profile.component.ts:19`

## Service / API gọi tới

| Hành động | Method + Path | file:line |
|---|---|---|
| Đọc user hiện tại (signal) | `AuthService.currentUser` (NgRx selector) | `profile.component.ts:17` |
| (gián tiếp) Tải hồ sơ | `GET /api/v1/users/me` qua header component | `auth.service.ts:108`, `client-header.component.ts:238` |

> Component **không tự gọi HTTP**; toàn bộ dữ liệu đến từ AuthService signal.

## Component gọi service nào (CodeGraph callees)

- `ProfileComponent` chỉ `inject(AuthService)` và đọc signal `currentUser`. `profile.component.ts:26`
- CodeGraph explore: file profile chỉ chứa `ProfileComponent(class)` + `authService(method)`, không có cạnh HTTP call — xác nhận là màn hình placeholder. `profile.component.ts:1-27`
- `AuthService.currentUser` = `toSignal(store.select(selectCurrentUser))`. `auth.service.ts:60`

## State

- Không có signal nội bộ riêng. Chỉ đọc `authService.currentUser()` (NgRx auth). `profile.component.ts:26`, `auth.service.ts:60`
- `cartCount` truyền cứng `0` cho header (khác các màn khác đọc `totalItemsInCart`). `profile.component.ts:13`

## Liên kết

- Backend: [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Người dùng]], [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực]]
- Màn hình: [[02_Design/SCR_005_Lich_Su_Don_Hang|Lịch sử đơn hàng]]
- Kiến trúc: [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc FE]]
- Code graph: [[06_Code_Graph/laptop-shop-angular/client/SKILL|Code Graph client]]
