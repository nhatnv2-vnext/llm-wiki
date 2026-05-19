---
title: "Tìm kiếm / Danh sách sản phẩm"
type: screen-spec
source:
  - "02_Wiki/00_Dashboard/Screens.json#SCR_002"
  - "01_Raw/codebase/angular-frontend/src/app/client/product/product-list.component.ts"
  - "figma: https://www.figma.com/design/Il3DbCCq0usFIsW8Kxuagf/eCommerce-Template---Tech-Store--Community-?node-id=73-291"
status: draft
last_synced: "2026-05-19"
tags:
  - screen-spec
  - scr_002
---

# Tìm kiếm / Danh sách sản phẩm · `SCR_002`

## TL;DR
Màn hình catalog cho khách hàng duyệt và lọc sản phẩm theo brand / category / giá, dẫn vào trang chi tiết hoặc add-to-cart trực tiếp.

> ⚠️ **Mismatch nghiêm trọng giữa design và code**: Figma mô tả 1 trang catalog đầy đủ (sidebar filter, toolbar sort, grid 5×5, pagination). Code thực tế **chưa có** `ProductListComponent` — route `/products` bị comment out, logic list/pagination/add-to-cart đang nằm trong `HomeComponent`, không có filter/search.

## Route & Component
- **Route mong đợi**: `/products`
- **Trạng thái thực**: ⚠️ Route `/products` **bị comment out** tại [`app.routes.ts:47-50`](../../01_Raw/codebase/angular-frontend/src/app/app.routes.ts). Click `Get Started` → wildcard redirect `/404` ([`app.routes.ts:77-80`](../../01_Raw/codebase/angular-frontend/src/app/app.routes.ts)).
- **Component dự kiến**: `src/app/client/product/product-list.component.ts` — ⚠️ Không tồn tại. Thư mục `client/product/` chỉ có `product-detail.component.ts`.
- **Component thực tế hiển thị danh sách**: [`HomeComponent`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts) ở route `''`.
- **Guard**: không có (cả route mong đợi lẫn `HomeComponent`).
- **Lazy load**: yes (`loadComponent` standalone).

## Layout (từ Figma)

**Sections**
- **Header**: Top header bar (`Component 14`, 1920×136) — global site header instance.
- **Hero / breadcrumb**: Banner `Group 56` (1398×104) hiển thị tiêu đề trang `MSI PS Series (20)` + breadcrumb `Home › Laptops › Everyday Use Notebooks › MSI Prestige Series › MSI WS Series`.
- **Sidebar trái** (`Frame 102`, 234×699): Filters + Brands panel (`Frame 103`), Compare Products (`Group 126`), My Wish List (`Group 127`).
- **Body**: Toolbar (`Component 43`, sort/view controls) + grid sản phẩm 5×5 (instance `Frame 12–16 / 51–60 / 82–94`, mỗi card 234×346) + pagination (`Group 154`).
- **Footer**: SEO description (`Frame 33` có `More` toggle) + promo strip (`Component 16`, 1920×273) + global footer (`Group 35`, 1920×520).

**Component instances**: `Component 14` (header), `Component 43/44` (toolbars), `Component 16` (promo band), ProductCard reusable (~25 instances), pagination buttons (`Frame 76/77`, `Frame 104–107`).

**Design tokens**
- Color: `#F5F7FF` surface, `#0156FF` primary/CTA, `#A2A6B0` / `#CACDD8` neutral, `#000` text, `#C94D3F` alert/sale, `#78A962` success/in-stock.
- Spacing: 16px sidebar padding, 233/234px column unit, 346px card height, 50px section-header height.
- Typography: 48px page title, 21px button/label, 18px breadcrumb, 14–16px body.

**CTA / user actions**: `‹ Back`, `Clear Filter`, `Apply Filters (2)` (badge theo count), facet checkboxes (Category/Price/Color), `All Brands` link, pagination prev/next + numbered buttons, `More` toggle description, tap toàn product card.

**Notes**
- `Compare Products` và `Wish List` panels có empty-state copy (`You have no items…`) — conditional variant.
- Facet rows render count động (`15 45 1`, `19 21 9 6 3 1 1 1`).
- `Apply Filters (2)` embed selected-count badge → variant theo số filter active.

> Figma source: https://www.figma.com/design/Il3DbCCq0usFIsW8Kxuagf/eCommerce-Template---Tech-Store--Community-?node-id=73-291

## State & Data (NgRx + API)

> ⚠️ Bảng dưới phản ánh `HomeComponent` (nơi đang chứa logic list), KHÔNG phải `ProductListComponent` (chưa tồn tại).

| Loại | Tên | Mô tả | File:line |
|------|-----|-------|-----------|
| Signal (private) | `_products: Product[]` | Danh sách sản phẩm hiện thị | [`home.component.ts:547`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts) |
| Signal (private) | `_currentPage`, `_totalPages` | State pagination | [`home.component.ts:548-549`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts) |
| Signal (private) | `_isLoading`, `_isAddingToCart` | Loading flags | [`home.component.ts:550-551`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts) |
| Signal (readonly) | `products`, `currentPage`, `totalPages`, `isLoading`, `isAddingToCart` | Public read-only | [`home.component.ts:553-559`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts) |
| Method | `loadProductsRx(page=1)` / `getProducts(page)` | Fetch list theo trang | [`home.component.ts:566-584`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts) |
| Method | `addToCart(productId)` | Thêm sản phẩm vào giỏ | [`home.component.ts:625`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts) |
| Method | `goToPage(page)`, `getPageNumbers()` | Điều hướng pagination | [`home.component.ts:566-666`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts) |
| API | `GET /api/v1/products?page={page}` | Lấy danh sách sản phẩm (chỉ paging, không filter) | [`home.component.ts:584`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts) |
| API | `POST /api/v1/products/{id}/add-to-cart` | Add-to-cart từ thẻ sản phẩm | [`home.component.ts:625`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts) |
| API | `GET /api/v1/users/me` | Resolve current user (qua `AuthService.fetchCurrentUser`) | [`auth.service.ts:108`](../../01_Raw/codebase/angular-frontend/src/app/shared/services/auth.service.ts) |
| NgRx | _(không có cho products)_ | Store chỉ có feature `auth` (`shared/store/auth/`); product list dùng signal cục bộ | — |
| Interceptor | `authInterceptor` | Gắn `Authorization: Bearer` cho `localhost:8080/api/`, xử lý refresh 401 | [`auth.interceptor.ts:23-94`](../../01_Raw/codebase/angular-frontend/src/app/shared/interceptors/auth.interceptor.ts) |

ChangeDetection: `OnPush` ([`home.component.ts:25`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts)). Không có `ProductService` riêng — `HttpClient` gọi trực tiếp trong component.

## User Flow

> ⚠️ Cần human review — flow lý tưởng theo Figma vs flow thực tế khác biệt rõ rệt.

**Flow theo Figma (mong đợi)**:
1. User vào `/products` (hoặc click breadcrumb từ category).
2. Sidebar load filter (brand, category, price, color) với facet count.
3. User chọn filter → grid refresh, badge `Apply Filters (n)` cập nhật.
4. User sort/view qua toolbar, paginate qua `Group 154`.
5. Click product card → `/products/:id`; click `Add to Cart` icon trên card → thêm giỏ.

**Flow thực tế trong code**:
1. User landing route `''` → `HomeComponent.ngOnInit()` gọi `loadProductsRx()` + `fetchCurrentUser()` ([`home.component.ts:561-564`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts)).
2. Grid sản phẩm + pagination hiển thị; không có search/filter/sort UI.
3. User bấm số trang → `goToPage(page)` → re-fetch.
4. Click card → `router.navigate(['/products', id])` ([`home.component.ts:643`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts)) → `ProductDetailComponent`.
5. Bấm `Add to Cart` → `POST /products/:id/add-to-cart` → `AuthService.increaseCartCount(1)`.

## Business Rules
- Pagination 1-based, `page` mặc định `1`; backend trả `{ data, totalPages }` qua `ApiResponse` envelope (suy từ [`home.component.ts:584`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts)).
- Add-to-cart yêu cầu user đăng nhập — `authInterceptor` chèn token; nếu không có token và backend từ chối, refresh-flow trigger qua interceptor ([`auth.interceptor.ts:42-94`](../../01_Raw/codebase/angular-frontend/src/app/shared/interceptors/auth.interceptor.ts)).
- > ⚠️ Cần human review — quy tắc filter (combinable, mutually exclusive, default sort, default page size 25?) chưa có trong code, chỉ thấy trên Figma.
- > ⚠️ Cần human review — chính sách hiển thị sản phẩm out-of-stock (token `#78A962` success/in-stock và `#C94D3F` alert/sale gợi ý có badge stock/sale nhưng code chưa render).

## Edge Cases & Validation
- **Empty state**: ⚠️ Không có handler `_products().length === 0` trong template hiện tại (`HomeComponent`). Figma cũng không có frame empty cho grid (chỉ có empty cho Compare/Wish List).
- **Error state**: ⚠️ `loadProductsRx` không có nhánh `error` rõ ràng — cần human review để xác nhận toast / banner.
- **Loading state**: signal `_isLoading` có nhưng cần check template render skeleton/spinner ([`home.component.ts:550`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts)).
- **Pagination boundary**: `getPageNumbers()` quyết định range hiển thị — cần test khi `totalPages` ≤ 1 hoặc rất lớn.
- **Validation**: không có FormGroup/Validators — màn hình chỉ có nút bấm, không có input do thiếu search/filter form.
- **Auth gating cho add-to-cart**: khi chưa login, hành vi reject của BE chưa rõ → cần human review.
- **Hardcoded base URL**: `http://localhost:8080/api/v1/products` ([`home.component.ts:546`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts)) — sẽ vỡ khi build prod, cần move sang `environment`.

## Source of truth
- Component code (thực tế hiển thị list): [`01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts)
- Component code (theo Screens.json — ⚠️ chưa tồn tại): `01_Raw/codebase/angular-frontend/src/app/client/product/product-list.component.ts`
- Route definition: [`01_Raw/codebase/angular-frontend/src/app/app.routes.ts`](../../01_Raw/codebase/angular-frontend/src/app/app.routes.ts)
- Figma: https://www.figma.com/design/Il3DbCCq0usFIsW8Kxuagf/eCommerce-Template---Tech-Store--Community-?node-id=73-291
- API contract: [[Products_API]]

## Liên kết
- [[Index]]
- [[Frontend_Overview]]
- [[Frontend_NgRx_Store]]
- [[Products_API]] — endpoint `GET /products`, `GET /products/:id`
