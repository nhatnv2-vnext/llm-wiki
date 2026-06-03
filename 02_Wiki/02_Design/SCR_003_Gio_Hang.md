---
title: Giỏ hàng
type: screen-spec
project: laptop-shop-angular
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/client/cart/cart.component.ts"
status: draft
last_synced: "2026-06-03"
tags: [screen, frontend, angular, cart, checkout]
---

# Giỏ hàng · SCR_003

> Nguồn: CodeGraph MCP + code-reader (không có Figma node). Mọi claim kèm `file:line`.

## Tổng quan màn hình

Màn hình giỏ hàng (`/cart`) hiển thị các sản phẩm đã thêm, cho phép tăng/giảm số lượng, xoá sản phẩm (qua modal xác nhận) và đặt hàng. Thay đổi số lượng được đồng bộ optimistic lên server trước khi checkout.

- Route: `path: 'cart'` → `CartComponent`, lazy, guard `authGuard` (yêu cầu đăng nhập). `app.routes.ts:17-19`
- Component standalone dùng signals, `implements OnInit`. `cart.component.ts:474`

## Thành phần UI

- Danh sách item từ `cartItems()`; tổng tiền `totalPrice()`. `cart.component.ts:491-492`
- Nút tăng/giảm số lượng → `increaseQuantity` / `decreaseQuantity`. `cart.component.ts:538,556`
- Modal xoá (`isDeleteModalOpen()`) với `confirmDeleteFromModal` / `closeDeleteModal`; đóng bằng phím Esc (`@HostListener`). `cart.component.ts:498-503,579,588`
- Nút **Đặt hàng** → `onPlaceOrder()`. `cart.component.ts:600`
- Thông báo trạng thái: `actionMessage()`, `errorMessage()`, cờ `isUpdatingCart()`, `isPlacingOrder()`. `cart.component.ts:493-497`

## Luồng tương tác

1. `ngOnInit` → `loadCart()` GET cart, set items + tổng tiền; nếu rỗng `authService.setCartCount(0)`. `cart.component.ts:505-535`
2. Tăng số lượng kiểm tra tồn kho `item.product.quantity`; giảm về 1 thì mở modal xoá. `cart.component.ts:545,567-568`
3. Thay đổi → `pushUpdatedCart` cập nhật signal optimistic rồi POST update-cart; lỗi rollback về `previousItems`. `cart.component.ts:653-686`
4. Xoá item → `deleteProductInCart` POST delete rồi `switchMap` POST update-cart đồng bộ. `cart.component.ts:688-735`
5. Đặt hàng → `onPlaceOrder` POST place-order, lấy orderId qua `extractOrderId`, `setCartCount(0)`, điều hướng `/order/{id}`. `cart.component.ts:600-630`

## Service / API gọi tới

| Hành động | Method + Path | file:line |
|---|---|---|
| Tải giỏ hàng | `GET /api/v1/products/cart` | `cart.component.ts:515` |
| Cập nhật giỏ trước checkout | `POST /api/v1/products/update-cart-before-checkout` | `cart.component.ts:668,721` |
| Xoá sản phẩm | `POST /api/v1/products/delete-product-in-cart/{id}` | `cart.component.ts:693` |
| Đặt hàng | `POST /api/v1/products/place-order` body `{ totalPrice }` | `cart.component.ts:610` |
| Cập nhật badge giỏ | `AuthService.setCartCount` (NgRx) | `auth.service.ts:146` |

## Component gọi service nào (CodeGraph callees)

- `CartComponent.loadCart` → `AuthService.setCartCount`. `cart.component.ts:529`
- `CartComponent.onPlaceOrder` → `_totalPrice`, `extractOrderId`, `AuthService.setCartCount`, `router.navigate`. `cart.component.ts:611,614,628-629`
- `CartComponent.increaseQuantity`/`decreaseQuantity` → `pushUpdatedCart` → `HttpClient.post` + `recalculateTotals`. `cart.component.ts:553,653-668`
- `AuthService.setCartCount` → `AuthActions.setTotalItemsInCart`. `auth.service.ts:148`

## State

- Signals nội bộ: `_cartItems`, `_totalPrice`, `_isLoading`, `_isUpdatingCart`, `_isPlacingOrder`, `_errorMessage`, `_actionMessage`, `_isDeleteModalOpen`, `_pendingDeleteCartDetailId`. `cart.component.ts:481-489`
- Đồng bộ optimistic: signal cập nhật trước HTTP, rollback khi lỗi. `cart.component.ts:657,672`
- Global state: badge giỏ (`totalItemsInCart`) qua NgRx auth. `auth.service.ts:146-148`

## Liên kết

- Backend: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]], [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực]]
- Màn hình: [[02_Design/SCR_007_Chi_Tiet_San_Pham|Chi tiết sản phẩm]]
- Kiến trúc: [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc FE]]
- Code graph: [[06_Code_Graph/laptop-shop-angular/client/SKILL|Code Graph client]]
