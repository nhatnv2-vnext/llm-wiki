---
title: Lịch sử đơn hàng
type: screen-spec
project: laptop-shop-angular
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/client/order-history/order-history.component.ts"
status: draft
last_synced: "2026-06-03"
tags: [screen, frontend, angular, order, history]
---

# Lịch sử đơn hàng · SCR_005

> Nguồn: CodeGraph MCP + code-reader (không có Figma node). Mọi claim kèm `file:line`.

## Tổng quan màn hình

Màn hình lịch sử đơn hàng (`/order-history`) liệt kê các đơn đã đặt của user kèm tổng tiền, phương thức/trạng thái thanh toán, thông tin người nhận và chi tiết sản phẩm trong từng đơn.

- Route: `path: 'order-history'` → `OrderHistoryComponent`, lazy, guard `authGuard`. `app.routes.ts:27-31`
- Component standalone dùng signals, `implements OnInit`. `order-history.component.ts:339`

## Thành phần UI

- Danh sách đơn từ `orders()` signal; mỗi đơn có `orderDetails[]` (interface `HistoryOrder`). `order-history.component.ts:30-42,348`
- Format hiển thị: `formatCurrency` (VND), `formatDate` (vi-VN), `getProductImage`. `order-history.component.ts:356,363,375`
- Trạng thái: `isLoading()`, banner lỗi `errorMessage()`. `order-history.component.ts:349-350`

## Luồng tương tác

1. `ngOnInit` → `loadOrdersHistory()`. `order-history.component.ts:352-354`
2. `loadOrdersHistory` GET orders-history; `map` chuẩn hoá response (array hoặc `{ data }`). `order-history.component.ts:383-392`
3. Lỗi → log, set `errorMessage` "Không thể tải lịch sử đơn hàng." rồi trả mảng rỗng. `order-history.component.ts:393-397`
4. `finalize` tắt `_isLoading`; subscribe set `_orders`. `order-history.component.ts:398-402`

## Service / API gọi tới

| Hành động | Method + Path | file:line |
|---|---|---|
| Tải lịch sử đơn | `GET /api/v1/products/orders-history` | `order-history.component.ts:384` |

> Component chỉ inject `AuthService` (readonly, cho header) + `HttpClient`; chỉ 1 endpoint HTTP. `order-history.component.ts:340-341`

## Component gọi service nào (CodeGraph callees)

- `OrderHistoryComponent.ngOnInit` → `loadOrdersHistory`. `order-history.component.ts:353`
- `OrderHistoryComponent.loadOrdersHistory` → `HttpClient.get` + RxJS `map`/`catchError`/`finalize`. `order-history.component.ts:383-399`
- `authService` field = `inject(AuthService)` (dùng cho header, không có cạnh HTTP riêng trong component). `order-history.component.ts:340`

> CodeGraph explore xác nhận file chỉ chứa 1 lệnh `http.get` — không có ghi/đặt đơn ở màn này (chỉ đọc).

## State

- Signals nội bộ: `_orders`, `_isLoading` (init true), `_errorMessage`. `order-history.component.ts:344-346`
- Public readonly: `orders`, `isLoading`, `errorMessage`. `order-history.component.ts:348-350`
- Không ghi global state; chỉ đọc user qua AuthService cho header. `order-history.component.ts:340`

## Liên kết

- Backend: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]], [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực]]
- Màn hình: [[02_Design/SCR_006_Chi_Tiet_Don_Hang|Chi tiết đơn hàng]], [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]]
- Kiến trúc: [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc FE]]
- Code graph: [[06_Code_Graph/laptop-shop-angular/client/SKILL|Code Graph client]]
