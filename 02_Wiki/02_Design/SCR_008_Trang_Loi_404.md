---
title: "Trang lỗi 404 · SCR_008"
type: screen-spec
project: laptop-shop-angular
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/error/error-404.component.ts"
status: draft
last_synced: "2026-06-03"
tags: [screen-spec, error, static, laptop-shop-angular]
---

# Trang lỗi 404 · SCR_008

> Route: `404` (+ wildcard `**` redirect) · Component: `src/app/error/error-404.component.ts` · Guard: không (lazy)

Liên quan: [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc Frontend]]

## 1. Tổng quan

Trang thông báo "Không tìm thấy" hiển thị khi người dùng truy cập URL không tồn tại. Đây là màn hình tĩnh, không gọi API, không state động.

- Route `404` khai báo tại `app.routes.ts:62-66`, lazy-loaded.
- Wildcard `**` redirect về `/404` (`app.routes.ts:77-80`) — mọi route không khớp đều rơi vào đây.
- Component standalone, `OnPush`, chỉ import `CommonModule` + `RouterLink` (`error-404.component.ts:5-8`).

## 2. Thành phần UI chính

| Vùng | Mô tả | Vị trí |
|---|---|---|
| Ảnh lỗi | `error-404-monochrome.svg` | `error-404.component.ts:34-38` |
| Thông điệp | "Oops! Trang không tồn tại." + mô tả | `error-404.component.ts:39-44` |
| Nút "Về trang chủ" | `routerLink="/"` | `error-404.component.ts:46-49` |
| Nút "Quay lại" | Gọi `goBack()` | `error-404.component.ts:50-53` |
| Footer | Copyright + link chính sách/điều khoản (href `#`) | `error-404.component.ts:62-74` |

## 3. Luồng tương tác

1. Người dùng vào URL không hợp lệ → wildcard redirect → màn 404.
2. Nhấn "Về trang chủ" → điều hướng `/` qua `RouterLink`.
3. Nhấn "Quay lại" → `goBack()` (`error-404.component.ts:117-119`) gọi `window.history.back()`.

## 4. API / service gọi tới

Không có. Màn hình hoàn toàn tĩnh, không inject service, không HTTP.

## 5. State / dữ liệu

Không có signal/state. Logic duy nhất là phương thức `goBack()` dựa trên history của trình duyệt.

> ⚠️ Cần human review: template nhúng cả khối `<!DOCTYPE html><html><head>...` bên trong inline template Angular (`error-404.component.ts:10-78`) — bất thường về cấu trúc, nên xác nhận có gây render lồng `<html>` hay không.
