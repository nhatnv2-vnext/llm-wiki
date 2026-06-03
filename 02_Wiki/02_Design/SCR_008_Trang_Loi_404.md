---
title: "Trang lỗi 404 · SCR_008"
type: screen-spec
project: laptop-shop-angular
source:
  - "local: src/app/error/error-404.component.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - screen-spec
  - laptop-shop-angular
  - error
  - static
---

# Trang lỗi 404 · SCR_008

## Tổng quan

Trang tĩnh hiển thị khi người dùng truy cập một route không tồn tại. Đây là màn hình lỗi đơn giản, không gọi API, không có state động.

- Route trực tiếp: `404` (`src/app/app.routes.ts:64-65`).
- **Wildcard** `**` redirect về `/404` cho mọi đường dẫn không khớp (`src/app/app.routes.ts:78-79`) — đây là cách màn hình thường được kích hoạt.
- Component standalone `Error404Component` (`error-404.component.ts:116`), `ChangeDetectionStrategy.OnPush`. Lazy-loaded.

## Thành phần UI

- **Ảnh lỗi**: `/admin/assets/img/error-404-monochrome.svg` (`error-404.component.ts:34-38`).
- **Thông điệp**: "Oops! Trang không tồn tại." + dòng mô tả phụ (`error-404.component.ts:39-44`).
- **CTA "Về trang chủ"**: `<a routerLink="/">` (`error-404.component.ts:46-49`).
- **CTA "Quay lại"**: `<button (click)="goBack()">` (`error-404.component.ts:50-53`).
- **Footer** copyright Laptopshop (`error-404.component.ts:62-74`).

## Luồng tương tác

1. Người dùng vào một URL sai → wildcard route redirect tới `/404` → render `Error404Component`.
2. Bấm **Về trang chủ** → `routerLink="/"` điều hướng về `SCR_001` (trang chủ).
3. Bấm **Quay lại** → `goBack()` gọi `window.history.back()` (`error-404.component.ts:117-119`).

## Service / API gọi tới

Không có. Component thuần tĩnh, không inject `HttpClient` hay service nào.

### Component gọi service nào (từ codegraph_callees)

Theo CodeGraph, `Error404Component` chỉ có một method `goBack` (`error-404.component.ts:117`) gọi API trình duyệt `window.history.back()` — **không có callee tới service/HTTP nào** trong đồ thị. Imports duy nhất: `CommonModule`, `RouterLink` (`error-404.component.ts:2-3`).

## State

Không có state. Component không khai báo signal, không có `@Input`/`@Output`, không lifecycle hook (không `OnInit`). Toàn bộ nội dung là template tĩnh.

## Liên kết

- Màn hình liên quan: [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]], [[02_Design/SCR_005_Lich_Su_Don_Hang|Lịch sử đơn hàng]]
- Kiến trúc: [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc FE]]
- Code graph: [[06_Code_Graph/laptop-shop-angular/admin/SKILL|Code Graph admin]]
