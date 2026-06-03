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

> Nguồn: CodeGraph MCP + code-reader (không có Figma node). Mọi claim kèm `file:line`.

## Tổng quan màn hình

Trang chủ (`/`) là landing page công khai của Laptopshop, không yêu cầu đăng nhập. Màn hình giới thiệu thương hiệu và liệt kê **sản phẩm phổ biến** có phân trang, kèm hành động thêm nhanh vào giỏ và điều hướng tới chi tiết sản phẩm.

- Route: `path: ''` → `HomeComponent`, lazy `loadComponent`, **không guard**. `app.routes.ts:9`
- Component standalone dùng signals, `implements OnInit`. `home.component.ts:541`

## Thành phần UI

- `app-client-header` — truyền `currentUser` và `cartCount` (signal từ AuthService). `home.component.ts:554-555`
- Lưới sản phẩm — render từ `products()` signal. `home.component.ts:553`
- Nút **Thêm vào giỏ** mỗi card → `addToCart(product)`. `home.component.ts:617`
- Phân trang — `goToPage(page)` + `getPageNumbers()`. `home.component.ts:646,654`
- Trạng thái loading: `isLoading()`, `isAddingToCart()`. `home.component.ts:558-559`

## Luồng tương tác

1. `ngOnInit` gọi `loadProductsRx()` và `authService.fetchCurrentUser()`. `home.component.ts:561-563`
2. `loadProductsRx(page)` → `getProducts(page)` (HTTP GET) → đổ vào `_products`, `_currentPage`, `_totalPages`. `home.component.ts:566-581`
3. Bấm **Thêm vào giỏ** → `addToCart` POST add-to-cart, thành công gọi `authService.increaseCartCount(1)`. `home.component.ts:617-640`
4. Bấm card sản phẩm → `openProductDetail(id)` → `router.navigate(['/products', id])`. `home.component.ts:642-644`
5. Đổi trang → `goToPage` gọi lại `loadProductsRx(page)`. `home.component.ts:646-652`

## Service / API gọi tới

| Hành động | Method + Path | file:line |
|---|---|---|
| Tải danh sách SP | `GET /api/v1/products?page={n}` | `home.component.ts:584` |
| Thêm vào giỏ | `POST /api/v1/products/{id}/add-to-cart` body `{ quantity: 1 }` | `home.component.ts:625` |
| Lấy user hiện tại | `GET /api/v1/users/me` (qua AuthService) | `auth.service.ts:108` |

## Component gọi service nào (CodeGraph callees)

- `HomeComponent.ngOnInit` → `AuthService.fetchCurrentUser`. `home.component.ts:563`
- `HomeComponent.addToCart` → `AuthService.increaseCartCount`. `home.component.ts:638`
- `AuthService.fetchCurrentUser` → `AuthActions` (dispatch setCurrentUser / setTotalItemsInCart). `auth.service.ts:114-115`
- `AuthService.increaseCartCount` → `AuthActions.increaseCartCount`. `auth.service.ts:139`

> CodeGraph callees ở cấp class `HomeComponent` rỗng (template-binding Angular không tạo cạnh call); cạnh thật xuất hiện ở cấp method và được nối tới `AuthActions`.

## State

- Signals nội bộ: `_products`, `_currentPage`, `_totalPages`, `_isLoading`, `_isAddingToCart`. `home.component.ts:547-551`
- Signals từ store (qua AuthService): `currentUser`, `cartCount` (= `totalItemsInCart`). `home.component.ts:554-555`
- Global state: NgRx auth feature (`selectCurrentUser`, `selectTotalItemsInCart`). `auth.service.ts:60-63`

## Liên kết

- Backend: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]], [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực]]
- Màn hình: [[02_Design/SCR_007_Chi_Tiet_San_Pham|Chi tiết sản phẩm]], [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]]
- Kiến trúc: [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc FE]]
- Code graph: [[06_Code_Graph/laptop-shop-angular/client/SKILL|Code Graph client]]
