---
title: "Chi tiết sản phẩm · SCR_007"
type: screen-spec
project: laptop-shop-angular
source:
  - "local: src/app/client/product/product-detail.component.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - screen-spec
  - laptop-shop-angular
  - product
  - cart
  - client
---

# Chi tiết sản phẩm · SCR_007

## Tổng quan

Màn hình hiển thị chi tiết một sản phẩm (laptop) và cho phép người dùng chọn số lượng rồi **thêm vào giỏ hàng**.

- Route: `products/:id`, lazy-loaded, **không có guard** (truy cập công khai) (`src/app/app.routes.ts:38-41`).
- Component standalone `ProductDetailComponent implements OnInit` (`product-detail.component.ts:285`), `ChangeDetectionStrategy.OnPush` + Angular Signals.

## Thành phần UI

- **Ảnh + thông tin sản phẩm**: tên, giá (`formatCurrency`), mô tả, tồn kho `product().quantity`; ảnh qua `getProductImage(product)` (`product-detail.component.ts:397-406`).
- **Bộ chọn số lượng**: nút `+ / -` gọi `increaseQuantity()` / `decreaseQuantity()`, ràng buộc trong khoảng `1..maxQty` (`product-detail.component.ts:344-355`).
- **Nút Thêm vào giỏ**: disabled khi hết hàng hoặc đang thêm (`isAddingToCart()`).
- **Thông báo giỏ hàng**: `cartMessage()` + cờ `cartError()` để tô màu lỗi (`product-detail.component.ts:295-296`).
- **Badge giỏ hàng** trên header: `cartCount` = `authService.totalItemsInCart` (`product-detail.component.ts:304`).

## Luồng tương tác

1. `ngOnInit` đọc `id` từ `paramMap`; nếu không hợp lệ (NaN hoặc ≤ 0) → set product = null, dừng loading (`product-detail.component.ts:307-316`).
2. `loadProductDetail(id)` gọi `GET /products/:id`, chuẩn hóa response (unwrap `data.data` nếu lồng), set product + reset số lượng về 1 (`product-detail.component.ts:319-342`).
3. Người dùng điều chỉnh số lượng trong giới hạn tồn kho.
4. `addToCart()` gọi `POST /products/:id/add-to-cart` với `{ quantity }`; thành công → tăng cart count + báo "Da them N san pham vao gio hang" (`product-detail.component.ts:357-395`).
5. Xử lý lỗi: status 400 → "So luong vuot qua ton kho..."; khác → "Khong the them vao gio hang..." (`product-detail.component.ts:376-380`).

## Service / API gọi tới

Component gọi `HttpClient` trực tiếp (`product-detail.component.ts:287`). Base URL: `http://localhost:8080/api/v1/products` (`product-detail.component.ts:289`).

| Hành động | HTTP | Endpoint | file:line |
|---|---|---|---|
| Tải chi tiết sản phẩm | GET | `/products/:id` | `product-detail.component.ts:323` |
| Thêm vào giỏ | POST | `/products/:id/add-to-cart` | `product-detail.component.ts:368` |

### Component gọi service nào (từ codegraph_callees)

`codegraph_callees(addToCart)` cho thấy `addToCart` gọi `AuthService.increaseCartCount` (`src/app/shared/services/auth.service.ts:132`) sau khi POST thành công (`product-detail.component.ts:391`). Ngoài ra truy cập signal nội bộ `product`, `_isAddingToCart`, `_selectedQuantity` và interface `Product` (`src/app/shared/models/index.ts:1`).

- `AuthService` được inject (`product-detail.component.ts:288`): cung cấp `totalItemsInCart` (badge giỏ) và `currentUser` (`product-detail.component.ts:304-305`), `increaseCartCount` (`auth.service.ts:132`).

## State

State cục bộ qua Angular Signals (`product-detail.component.ts:291-305`):

| Signal | Ý nghĩa |
|---|---|
| `product` | Dữ liệu `Product` đã tải (null nếu lỗi/không có) |
| `isLoading` | Đang tải chi tiết |
| `isAddingToCart` | Đang gửi request thêm giỏ |
| `selectedQuantity` | Số lượng người dùng chọn |
| `cartMessage` / `cartError` | Thông báo + cờ lỗi sau khi thêm giỏ |
| `cartCount` / `currentUser` | Mirror từ `AuthService` (NgRx global) |

## Liên kết

- Feature BE: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]]
- Màn hình liên quan: [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]], [[02_Design/SCR_005_Lich_Su_Don_Hang|Lịch sử đơn hàng]]
- Kiến trúc: [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc FE]]
- Code graph: [[06_Code_Graph/laptop-shop-angular/admin/SKILL|Code Graph admin]]
