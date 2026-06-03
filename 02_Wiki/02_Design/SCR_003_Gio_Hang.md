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

> Nguồn: code-reader (không có Figma node). Mọi claim kèm `file:line`.

## Tổng quan màn hình

Giỏ hàng (`/cart`) liệt kê các sản phẩm đã thêm, cho phép tăng/giảm số lượng, xóa (qua modal xác nhận) và **đặt hàng**. Yêu cầu đăng nhập (`authGuard`).

- Route: `path: 'cart'`, `canActivate: [authGuard]`, lazy `loadComponent`. `app.routes.ts:16-20`
- `authGuard`: chưa xác thực → `createUrlTree(['/login'], { returnUrl: state.url })`. `auth.guard.ts:5-21`
- Component standalone, `OnPush`. `cart.component.ts:36-39`
- Liên quan: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]], [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc Frontend]], [[02_Design/SCR_006_Chi_Tiet_Don_Hang|Chi tiết đơn hàng]], [[02_Design/SCR_007_Chi_Tiet_San_Pham|Chi tiết sản phẩm]], [[02_Design/SCR_005_Lich_Su_Don_Hang|Lịch sử đơn hàng]].

## Thành phần UI chính

| Thành phần | Mô tả | file:line |
|---|---|---|
| State boxes | loading / error / empty (giỏ trống) có CTA về `/` | `cart.component.ts:50-58` |
| Danh sách item | `@for item of cartItems()`: ảnh, tên (link `/products/:id`), mô tả, giá | `cart.component.ts:60-103` |
| Qty box | nút `-` / `+` với số lượng; `+` disabled khi `>=` tồn kho | `cart.component.ts:80-99` |
| Summary card | Số sản phẩm, Tạm tính, Tổng thanh toán, nút "Đặt hàng" | `cart.component.ts:105-135` |
| Modal xác nhận xóa | Overlay + dialog, đóng bằng click ngoài hoặc phím Escape | `cart.component.ts:140-156` |

## Luồng tương tác

1. `ngOnInit()` → `loadCart()`. `cart.component.ts:505-507`
2. `increaseQuantity(id)`: chặn vượt tồn kho, cập nhật optimistic rồi `pushUpdatedCart`. `cart.component.ts:538-554`
3. `decreaseQuantity(id)`: nếu số lượng = 1 → mở modal xóa; ngược lại giảm 1 + `pushUpdatedCart`. `cart.component.ts:556-577`
4. `pushUpdatedCart`: cập nhật signal optimistic, gọi update-cart; lỗi → rollback `previousItems`. `cart.component.ts:653-686`
5. Xác nhận xóa trong modal → `confirmDeleteFromModal()` → `deleteProductInCart()` (xóa rồi đồng bộ lại giỏ). `cart.component.ts:588-598,688-735`
6. `onPlaceOrder()`: POST place-order, lấy `orderId` (linh hoạt số / `{id}` / `{orderId}`), reset cartCount=0, điều hướng `/order/:id`. `cart.component.ts:600-631`
7. Escape đóng modal qua `@HostListener('document:keydown.escape')`. `cart.component.ts:500-503`

## API / service gọi tới

| Method | Path | Mục đích | file:line |
|---|---|---|---|
| GET | `/api/v1/products/cart` | Lấy giỏ (`cartDetails`, `totalPrice`) | `cart.component.ts:515` |
| POST | `/api/v1/products/update-cart-before-checkout` body `{ currentCartDetail: [{id,quantity}] }` | Đồng bộ số lượng giỏ | `cart.component.ts:668,721` |
| POST | `/api/v1/products/delete-product-in-cart/{cartDetailId}` | Xóa 1 dòng giỏ | `cart.component.ts:693` |
| POST | `/api/v1/products/place-order` body `{ totalPrice }` | Tạo đơn hàng | `cart.component.ts:610` |
| (service) | `AuthService.setCartCount(n)` → NgRx + localStorage | Đồng bộ badge giỏ | `cart.component.ts:628,762`, `auth.service.ts:146` |

→ Backend liên quan: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]].

## State / dữ liệu

Signals: `cart.component.ts:481-498`

| Signal | Kiểu | file:line |
|---|---|---|
| `_cartItems` / `cartItems` | `CartDetail[]` | `cart.component.ts:481,491` |
| `_totalPrice` / `totalPrice` | `number` | `cart.component.ts:482,492` |
| `_isLoading` | `boolean` | `cart.component.ts:483,493` |
| `_isUpdatingCart` | `boolean` | `cart.component.ts:484,494` |
| `_isPlacingOrder` | `boolean` | `cart.component.ts:485,495` |
| `_errorMessage` / `_actionMessage` | `string` | `cart.component.ts:486-487,496-497` |
| `_isDeleteModalOpen` / `_pendingDeleteCartDetailId` | `boolean` / `number\|null` | `cart.component.ts:488-489,498` |

- `CartDetail`: `{ id, price, quantity, cartId, productId, product: Product }`. `cart.component.ts:17-24`
- `totalItems()` = tổng quantity; `recalculateTotals()` ưu tiên `serverTotal`, fallback tính client + đồng bộ cartCount. `cart.component.ts:633-635,759-763`
- Helper `formatCurrency` (Intl VND), `getProductImage` (fallback default). `cart.component.ts:637-646`

> Lưu ý: thao tác tăng/giảm là optimistic update kèm rollback khi API lỗi. `cart.component.ts:670-675`
