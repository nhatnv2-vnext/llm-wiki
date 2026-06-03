---
title: "Chi tiết sản phẩm · SCR_007"
type: screen-spec
project: laptop-shop-angular
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/client/product/product-detail.component.ts"
status: draft
last_synced: "2026-06-03"
tags: [screen-spec, product, cart, client, laptop-shop-angular]
---

# Chi tiết sản phẩm · SCR_007

> Route: `products/:id` · Component: `src/app/client/product/product-detail.component.ts` · Guard: không (public, lazy)

Liên quan: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]] · [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]] · [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc Frontend]]

## 1. Tổng quan

Màn hình hiển thị thông tin chi tiết một sản phẩm (laptop) và cho phép chọn số lượng để **thêm vào giỏ hàng**.

- Route khai báo tại `app.routes.ts:37-41`, lazy-loaded, **không có guard** → truy cập công khai.
- Component standalone, `OnPush`, dùng signals (`product-detail.component.ts:17-20`, `285`).
- Template inline, gồm header/footer client dùng chung (`product-detail.component.ts:22,102`).

## 2. Thành phần UI chính

| Vùng | Mô tả | Vị trí |
|---|---|---|
| Header / Footer client | `app-client-header` (binding `currentUser`, `cartCount`) + `app-client-footer` | `product-detail.component.ts:22,102` |
| Link quay lại | "← Quay lại trang chủ" về `/` | `product-detail.component.ts:26` |
| Trạng thái tải / không tìm thấy | "Đang tải chi tiết sản phẩm…" / "Khong tim thay san pham." | `product-detail.component.ts:28-29,96-97` |
| Panel ảnh | Ảnh sản phẩm, fallback `default-laptop.jpg` khi lỗi | `product-detail.component.ts:32-38` |
| Panel thông tin | Hãng, tên, giá, mô tả ngắn, lưới meta (thương hiệu/dòng máy/đã bán/tồn kho) | `product-detail.component.ts:40-52` |
| Bộ chọn số lượng | Nút -/+ với giới hạn 1..tồn kho | `product-detail.component.ts:54-71` |
| Nút "Add to cart" | Disabled khi đang thêm hoặc tồn kho = 0 | `product-detail.component.ts:73-83` |
| Thông báo giỏ hàng | Hiện kết quả thêm vào giỏ (success/error) | `product-detail.component.ts:86-88` |
| Mô tả chi tiết | `detailDesc` hoặc placeholder | `product-detail.component.ts:90-93` |

## 3. Luồng tương tác

1. **Khởi tạo** (`ngOnInit`, `:307-317`): lấy `id` từ route param; không hợp lệ → set `product = null`, dừng loading.
2. **Tải sản phẩm** (`loadProductDetail`, `:319-342`): GET chi tiết, xử lý response lồng `{ data }` (`:325-331`), reset số lượng chọn về 1.
3. **Chọn số lượng**: `increaseQuantity` (`:344-349`) giới hạn theo tồn kho; `decreaseQuantity` (`:351-355`) tối thiểu 1.
4. **Thêm vào giỏ** (`addToCart`, `:357-395`): bỏ qua nếu hết hàng hoặc đang thêm; POST với `quantity`; thành công → tăng số lượng giỏ qua `authService.increaseCartCount()` (`:391`) và hiện thông báo; lỗi 400 → "So luong vuot qua ton kho…" (`:377`).

## 4. API / service gọi tới

> Base: `productsApiUrl = 'http://localhost:8080/api/v1/products'` (`product-detail.component.ts:289`). Backend: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]].

| Method | Endpoint | Mục đích | Vị trí |
|---|---|---|---|
| GET | `/products/:id` | Tải chi tiết sản phẩm | `product-detail.component.ts:323` |
| POST | `/products/:id/add-to-cart` | Thêm sản phẩm vào giỏ (body `{ quantity }`) | `product-detail.component.ts:368` |

- HTTP gọi trực tiếp qua `HttpClient` inject (`:287`).
- `AuthService` (`:288`) cung cấp `currentUser`, `totalItemsInCart` (cho header) và `increaseCartCount()` sau khi thêm giỏ — liên kết tới [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]].

## 5. State / dữ liệu

Signals nội bộ (`product-detail.component.ts:291-305`):

| Signal | Kiểu | Ý nghĩa |
|---|---|---|
| `product` | `Product \| null` | Sản phẩm đang xem |
| `isLoading` | `boolean` | Đang tải chi tiết |
| `isAddingToCart` | `boolean` | Đang gọi add-to-cart |
| `selectedQuantity` | `number` | Số lượng chọn (1..tồn kho) |
| `cartMessage` | `string` | Thông báo kết quả thêm giỏ |
| `cartError` | `boolean` | Cờ phân biệt success/error |

- `cartCount` / `currentUser` map từ `AuthService` (`:304-305`).
- Model `Product` import từ `../../shared/models` (`product-detail.component.ts:9`).

> ⚠️ Cần human review: phần `factory`/`target`/`shortDesc`/`detailDesc` hiển thị nhãn tiếng Việt không dấu trong template — có thể là chủ ý hoặc thiếu i18n.
