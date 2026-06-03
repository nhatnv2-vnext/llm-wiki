---
title: Lịch sử đơn hàng
type: screen-spec
project: laptop-shop-angular
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/client/order-history/order-history.component.ts"
status: draft
last_synced: "2026-06-03"
tags: [screen, frontend, angular, order, order-history]
---

# Lịch sử đơn hàng · SCR_005

> Nguồn: code-reader (không có Figma node). Mọi claim kèm `file:line`.

## Tổng quan màn hình

Lịch sử đơn hàng (`/order-history`) liệt kê tất cả đơn hàng của người dùng đã đăng nhập, kèm trạng thái thanh toán/giao hàng, thông tin người nhận và danh sách sản phẩm từng đơn. Yêu cầu đăng nhập (`authGuard`). Màn hình chỉ đọc (read-only).

- Route: `path: 'order-history'`, `canActivate: [authGuard]`, lazy `loadComponent`. `app.routes.ts:26-31`
- Component standalone, `OnPush`. `order-history.component.ts:44-47`
- Liên quan: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]], [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc Frontend]], [[02_Design/SCR_006_Chi_Tiet_Don_Hang|Chi tiết đơn hàng]], [[02_Design/SCR_007_Chi_Tiet_San_Pham|Chi tiết sản phẩm]], [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]].

## Thành phần UI chính

| Thành phần | Mô tả | file:line |
|---|---|---|
| `app-client-header` | Header chung, nhận user + cartCount | `order-history.component.ts:49` |
| State boxes | loading / error / empty (chưa có đơn) có CTA "Mua sắm ngay" | `order-history.component.ts:58-66` |
| Order card | `@for order of orders()`: mã đơn `#id`, ngày tạo | `order-history.component.ts:69-83` |
| Status chips | `paymentStatus` (xanh khi `PAYMENT_SUCCESS`) + `status` | `order-history.component.ts:77-82` |
| Summary grid | Tổng tiền, phương thức, người nhận, điện thoại, địa chỉ | `order-history.component.ts:85-106` |
| Detail list | `@for detail of order.orderDetails`: ảnh, tên (link `/products/:id`), số lượng × giá | `order-history.component.ts:108-125` |

## Luồng tương tác

1. `ngOnInit()` → `loadOrdersHistory()`. `order-history.component.ts:352-354`
2. Mỗi sản phẩm trong đơn là link `routerLink ['/products', productId]` → màn chi tiết sản phẩm. `order-history.component.ts:117`
3. Ảnh lỗi → fallback `default-laptop.jpg`. `order-history.component.ts:114`
4. Link "Quay về trang chủ" / "Mua sắm ngay" → `/`. `order-history.component.ts:55,65`

## API / service gọi tới

| Method | Path | Mục đích | file:line |
|---|---|---|---|
| GET | `/api/v1/products/orders-history` | Lấy danh sách đơn hàng của user | `order-history.component.ts:384` |
| (service) | `AuthService` cung cấp `currentUser` + `totalItemsInCart` cho header | Hiển thị header | `order-history.component.ts:49,340` |

Response được chuẩn hóa linh hoạt: chấp nhận cả mảng trực tiếp hoặc `{ data: [] }`. `order-history.component.ts:386-392`

→ Backend liên quan: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]].

## State / dữ liệu

Signals: `order-history.component.ts:344-350`

| Signal | Kiểu | file:line |
|---|---|---|
| `_orders` / `orders` | `HistoryOrder[]` | `order-history.component.ts:344,348` |
| `_isLoading` / `isLoading` | `boolean` | `order-history.component.ts:345,349` |
| `_errorMessage` / `errorMessage` | `string` | `order-history.component.ts:346,350` |

- `HistoryOrder`: `{ id, totalPrice, paymentMethod, paymentStatus, receiverAddress/Name/Phone, status, createdAt, updatedAt, orderDetails[] }`. `order-history.component.ts:30-42`
- `HistoryOrderDetail`: `{ id, price, quantity, productId, product: { id, name, image } }`. `order-history.component.ts:22-28`
- Helper hiển thị: `formatCurrency` (Intl VND), `formatDate` (Intl vi-VN, fallback raw nếu date không hợp lệ), `getProductImage`. `order-history.component.ts:356-377`

Lỗi tải → set `errorMessage` "Không thể tải lịch sử đơn hàng." và trả mảng rỗng. `order-history.component.ts:393-397`
