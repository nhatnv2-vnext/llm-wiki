---
title: "Trang chủ"
type: screen-spec
source:
  - "02_Wiki/00_Dashboard/Screens.json#SCR_001"
  - "01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts"
  - "figma: https://www.figma.com/design/Il3DbCCq0usFIsW8Kxuagf/eCommerce-Template---Tech-Store--Community-?node-id=49-53&t=Y90UuFJhDYmb9NJa-4"
status: draft
last_synced: "2026-05-20"
tags:
  - screen-spec
  - scr_001
---

# Trang chủ · `SCR_001`

## TL;DR
Trang landing public của khách hàng cuối, hiển thị hero carousel, danh sách "New Products", các series sản phẩm theo tab (MSI GS/GT/GL/GE), brand grid, Instagram feed và footer. Mục tiêu: dẫn user vào trang chi tiết sản phẩm hoặc khám phá theo category.

## Route & Component
- **Route**: `/` (path rỗng `''`)
- **Component**: [`src/app/client/home/home.component.ts`](../../01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts) — template **inline** (⚠️ Không có `home.component.html`)
- **Guard**: public (không guard) — `app.routes.ts:7-10`
- **Lazy load**: yes — đăng ký qua `loadComponent` (`app.routes.ts:9`)

## Layout (từ Figma)

- **Header / Top bar**: `Component 14` (symbol, 1920×136 full-width).
- **Hero / Banner carousel**: `Group 56` (1398×328) + arrows `Component 4`/`Component 5`; có 1 carousel thứ 2 `Group 55` ở y=683 (⚠️ Cần human review: có thể là hero hoặc promo banner).
- **New Products grid**: heading + link "See All New Products", row 5 product card `Frame 2..6` (master `Component 6`).
- **Promo strip**: `Group 131` chứa badge `primary` + dòng "own it now, up to 6 months interest free learn more".
- **Category sections**:
  - Tab "MSI GS / GT / GL / GE Series" (y≈1381), 4 hàng × 5 product card `Frame 7..21`.
  - Tab "MSI Infinute / Triden / GL / Nightblade" (y≈1813), card `Frame 17..21`, thêm hàng `Frame 28..32`.
  - Underline `Vector 7` chỉ thị tab active.
- **Brand / Category icons row**: 7 tile `Frame 22..27, 34` (200×149).
- **Instagram section**: "Follow us on Instagram for News, Offers & More", 2 hàng × 6 tile `Frame 35..43` (225×322).
- **Footer**: `Group 62` (1160×310) + `Component 16` (1920×273) + `Group 35` (1920×520).
- **Floating action**: `Component 35` (60×60) ở x=1829, y=1225 — back-to-top hoặc chat (⚠️ Cần human review).

**Design tokens** (`get_variable_defs`):
- Color-1 `#F5F7FF` (surface), Color-3 `#0156FF` (primary), Color-5 `#A2A6B0`, Color-6 `#CACDD8`, Color-10 `#666666` (neutral), Color-8 `#C94D3F` (sale red), Color-9 `#78A962` (success green).
- ⚠️ Không có typography/spacing token cho node này.

**CTA / actions**: carousel arrows, link "See All New Products", promo CTA "learn more", tab category (active state qua underline), floating button.

> Figma source: https://www.figma.com/design/Il3DbCCq0usFIsW8Kxuagf/eCommerce-Template---Tech-Store--Community-?node-id=49-53&t=Y90UuFJhDYmb9NJa-4

## State & Data (NgRx + API)

**Signals & computed** (`home.component.ts`):

| Loại | Tên | File:line |
|------|-----|-----------|
| inject | `authService`, `http`, `router`, `sanitizer` | `home.component.ts:1086-1089` |
| signal | `_allProducts: Product[]` | `home.component.ts:1105` |
| signal | `_isLoading` (init `true`) | `home.component.ts:1106` |
| signal | `_heroIndex`, `_activeGamingTab='all'`, `_activeDesktopTab='all'` | `home.component.ts:1107-1109` |
| computed | `currentSlide` | `home.component.ts:1116` |
| computed | `newProducts` (slice 0..5) | `home.component.ts:1118` |
| computed | `gamingProducts`, `desktopProducts` (filter theo tab) | `home.component.ts:1120-1130` |
| lifecycle | `ngOnInit` — load products + autoplay + `fetchCurrentUser` | `home.component.ts:1135` |
| lifecycle | `ngOnDestroy` — `stopAutoplay` | `home.component.ts:1143` |
| handler | `prevHero/nextHero/goHero` | `home.component.ts:1221-1236` |
| handler | `setGamingTab/setDesktopTab` | `home.component.ts:1238-1244` |
| handler | `pauseAutoplay/resumeAutoplay` | `home.component.ts:1192-1198` |

Không có `@Input/@Output` trên `HomeComponent`. Component truyền `[user]`, `[cartCount]` xuống `<app-client-header>` (`home.component.ts:198-201`).

**Services & endpoints**:

| Service | Method | HTTP | Endpoint | File:line |
|---------|--------|------|----------|-----------|
| `HomeComponent` (inline `HttpClient`) | `fetchProducts(page)` | GET | `/api/v1/products?page={n}` | `home.component.ts:1090, 1155` |
| `AuthService` | `fetchCurrentUser` | GET | `/api/v1/users/me` | `auth.service.ts:58, 108` |
| `AuthService` | `refreshSession` | POST | `/api/v1/auth/refresh` | `auth.service.ts:57, 165` |
| `AuthService` | `logout` | POST | `/api/v1/auth/logout` | `auth.service.ts:184` |

**NgRx state** (feature `auth`):

| Kind | Tên | File:line |
|------|-----|-----------|
| Selector | `selectCurrentUser` → bind vào `[user]` | `auth.selectors.ts:6` |
| Selector | `selectTotalItemsInCart` → bind vào `[cartCount]` | `auth.selectors.ts:9` |
| Selector | `selectAccessToken`, `selectRefreshToken`, `selectIsAuthenticated` | `auth.selectors.ts:7,8,10` |
| Action | `setCurrentUser`, `setTotalItemsInCart` (dispatched bởi `fetchCurrentUser`) | `auth.actions.ts:11-12`, `auth.service.ts:114-115` |
| Action | `hydrateSession`, `setTokens`, `clearSession` | `auth.actions.ts:6,10,14` |

⚠️ Không có Effects file trong `shared/store/auth/`. Không có feature `product` NgRx — `HomeComponent` gọi HTTP trực tiếp.

## User Flow

1. **Landing**: User mở `/` (public, không guard). `ngOnInit` chạy: gọi `loadProducts()` → `GET /api/v1/products?page=1`, dispatch `hydrateSession`, nếu có token → `fetchCurrentUser` (cập nhật `[user]`, `[cartCount]`).
2. **Hero carousel**: Autoplay (`startAutoplay`); user có thể click `prevHero/nextHero/goHero` hoặc hover pause (`pauseAutoplay/resumeAutoplay`).
3. **Browse**: User cuộn qua New Products, tab Gaming/Desktop (`setGamingTab/setDesktopTab` đổi filter `computed`).
4. **CTA**: Click "See All New Products" → ⚠️ Cần human review (route đích chưa xác định, `/products` đang comment trong `app.routes.ts`).
5. **Select**: Click product card → navigate `/products/:id` → `ProductDetailComponent` (`app.routes.ts:38-41`).
6. **Side**: Click brand tile / Instagram tile / footer link — ⚠️ Cần human review handler cụ thể.

## Business Rules

- Hero carousel autoplay; pause khi hover (xem `pauseAutoplay/resumeAutoplay`).
- `newProducts` = 5 sản phẩm đầu tiên của `_allProducts` (slice).
- Gaming/Desktop tabs filter trên client từ list đã fetch (không gọi lại API).
- Endpoint sản phẩm: xem [[Products_API]] (`GET /api/v1/products`).
- Auth token tự inject bởi `authInterceptor` (app-wide, `auth.interceptor.ts:23-96`); 401 → thử `refreshSession`, fail → redirect `/login`.
- ⚠️ Cần human review: business rule cho 2 carousel song song (`Group 55` + `Group 56`), promo "6 months interest free", floating action button.

## Edge Cases & Validation

- **Empty state**: Khi API trả list rỗng → ⚠️ Cần human review (chưa có frame "no products" trong Figma).
- **Error state**: Lỗi `GET /products` → chưa có UI handler trong `HomeComponent`. 401 ở các call khác → `authInterceptor` xử lý (refresh hoặc logout).
- **Loading state**: `_isLoading()` signal (init `true`); cần skeleton/spinner UI — ⚠️ Cần human review chi tiết.
- **Validation**: Không có `FormGroup`/`Validators` (trang home không có form input).

## Source of truth

- Component code: `01_Raw/codebase/angular-frontend/src/app/client/home/home.component.ts`
- Route definition: `01_Raw/codebase/angular-frontend/src/app/app.routes.ts:7-10`
- HTTP interceptor: `01_Raw/codebase/angular-frontend/src/app/shared/interceptors/auth.interceptor.ts`
- App config (interceptor wiring): `01_Raw/codebase/angular-frontend/src/app/app.config.ts`
- NgRx auth store: `01_Raw/codebase/angular-frontend/src/app/shared/store/auth/`
- Figma: https://www.figma.com/design/Il3DbCCq0usFIsW8Kxuagf/eCommerce-Template---Tech-Store--Community-?node-id=49-53&t=Y90UuFJhDYmb9NJa-4
- API contract: [[Products_API]]

## Liên kết

- [[Index]]
- [[Frontend_Overview]]
- [[Frontend_NgRx_Store]]
- [[Products_API]]
