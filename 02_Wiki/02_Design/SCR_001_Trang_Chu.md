---
title: Trang chủ
type: screen-spec
project: laptop-shop-angular
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/client/home/home.component.ts"
status: draft
last_synced: "2026-06-03"
tags: [screen, frontend, angular, home, product-listing]
---

# Trang chủ · SCR_001

> Nguồn: code-reader (không có Figma node). Mọi claim kèm `file:line`.

## Tổng quan màn hình

Trang chủ (`/`) là landing page công khai của Laptopshop, không yêu cầu đăng nhập. Màn hình giới thiệu thương hiệu (hero, stats, feature) và liệt kê **sản phẩm phổ biến** có phân trang, kèm hành động thêm nhanh vào giỏ.

- Route: `path: ''` → `HomeComponent`, lazy `loadComponent`, không guard. `app.routes.ts:7-10`
- Component standalone, `ChangeDetectionStrategy.OnPush`, template + style inline. `home.component.ts:22-25`
- Liên quan: [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc Frontend]], [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]], [[02_Design/SCR_007_Chi_Tiet_San_Pham|Chi tiết sản phẩm]], [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]].

## Thành phần UI chính

| Thành phần | Mô tả | Vị trí |
|---|---|---|
| `app-client-header` | Header chung, nhận `[user]` và `[cartCount]` | `home.component.ts:27` |
| Hero section | Tiêu đề + CTA "Get Started" → `/products` | `home.component.ts:30-52` |
| Stats / Feature section | Khối số liệu marketing tĩnh | `home.component.ts:54-84` |
| Popular Products grid | Lưới sản phẩm `@for product of products()` | `home.component.ts:86-121` |
| Product card | Ảnh, tên (link `/products/:id`), giá, nút "Add" | `home.component.ts:97-117` |
| Pagination | Prev / số trang / Next, chỉ hiển thị khi `totalPages() > 1` | `home.component.ts:123-151` |
| `app-client-footer` | Footer chung | `home.component.ts:164` |

## Luồng tương tác

1. `ngOnInit()` gọi `loadProductsRx()` + `authService.fetchCurrentUser()`. `home.component.ts:561-564`
2. Người dùng click số trang → `goToPage(page)` (chặn ngoài [1..totalPages] và trang hiện tại) → `loadProductsRx(page)`. `home.component.ts:646-652`
3. Click ảnh sản phẩm → `openProductDetail(id)` điều hướng `/products/:id`; tên sản phẩm là `routerLink` riêng (có `stopPropagation`). `home.component.ts:642-644`, `103-110`
4. Click "Add" → `addToCart(product)`: chặn re-entrant bằng `isAddingToCart`, gọi API add-to-cart, thành công thì `authService.increaseCartCount(1)`. `home.component.ts:617-640`
5. Ảnh lỗi → fallback `default-laptop.jpg` qua `(error)` handler. `home.component.ts:101`

## API / service gọi tới

| Method | Path | Mục đích | file:line |
|---|---|---|---|
| GET | `http://localhost:8080/api/v1/products?page={page}` | Lấy danh sách sản phẩm phân trang | `home.component.ts:584` |
| POST | `/api/v1/products/{id}/add-to-cart` body `{ quantity: 1 }` | Thêm sản phẩm vào giỏ | `home.component.ts:625` |
| (service) | `AuthService.fetchCurrentUser()` → GET `/api/v1/users/me` | Lấy user + số item giỏ | `home.component.ts:563`, `auth.service.ts:108` |

Token được gắn tự động bởi `authInterceptor` cho request tới `localhost:8080/api/` (trừ login/refresh). `auth.interceptor.ts:35-39`

→ Backend liên quan: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]], [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực]].

## State / dữ liệu

Quản lý bằng Angular **signals** (writable private + `asReadonly()`):

| Signal | Kiểu | file:line |
|---|---|---|
| `_products` / `products` | `Product[]` | `home.component.ts:547,553` |
| `_currentPage` / `currentPage` | `number` (mặc định 1) | `home.component.ts:548,556` |
| `_totalPages` / `totalPages` | `number` | `home.component.ts:549,557` |
| `_isLoading` / `isLoading` | `boolean` | `home.component.ts:550,558` |
| `_isAddingToCart` / `isAddingToCart` | `boolean` | `home.component.ts:551,559` |
| `currentUser` | signal từ `AuthService` (NgRx `selectCurrentUser`) | `home.component.ts:554`, `auth.service.ts:60` |
| `cartCount` | signal `totalItemsInCart` (NgRx) | `home.component.ts:555`, `auth.service.ts:63` |

Helper hiển thị: `formatCurrency` (Intl VND `home.component.ts:602`), `getProductImage` (prefix `/images/product/` `home.component.ts:609`), `getPageNumbers` (cửa sổ ±2 trang `home.component.ts:654`).

Lỗi tải sản phẩm → fallback list rỗng, không hiển thị thông báo lỗi rõ (chỉ `console.error`). `home.component.ts:585-597`
