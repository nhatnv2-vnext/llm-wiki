---
title: Frontend NgRx Store
type: architecture
source:
  - 01_Raw/codebase/angular-frontend/src/app/shared/store
status: draft
last_synced: 2026-05-12
tags: [architecture, frontend, ngrx, state]
---

# Frontend NgRx Store

Tổng hợp **mọi feature store** của Angular app. Mỗi feature = 1 section, có actions / state / selectors / reducer entry-point.

> File này phải cập nhật mỗi khi thêm feature mới vào `src/app/shared/store/`.

## Feature: `auth` ✅

| Mục | Giá trị |
|-----|---------|
| Feature key | `auth` |
| Đăng ký tại | `app.config.ts` → `provideStore({ [authFeatureKey]: authReducer })` |
| Source | `01_Raw/codebase/angular-frontend/src/app/shared/store/auth/` |

### State

```ts
interface AuthState {
  currentUser: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  totalItemsInCart: number;
}
```

### Actions (`createActionGroup`, source `Auth`)

| Action | Payload | Khi nào dispatch |
|--------|---------|------------------|
| `Hydrate Session` | `{ accessToken, refreshToken, user, totalItemsInCart }` | App khởi động → restore từ localStorage |
| `Set Tokens` | `{ accessToken, refreshToken }` | Sau login / refresh thành công |
| `Set Current User` | `{ user }` | Sau khi gọi `/users/me` |
| `Set Total Items In Cart` | `{ totalItemsInCart }` | Sau khi load `/products/cart` |
| `Increase Cart Count` | `{ quantity }` | Sau khi `/products/:id/add-to-cart` |
| `Clear Session` | — | Logout, hoặc khi refresh fail |

### Selectors

- `selectCurrentUser`
- `selectAccessToken`
- `selectRefreshToken`
- `selectTotalItemsInCart`
- `selectIsAuthenticated` = `!!accessToken`

### Liên quan
- Interceptor `auth.interceptor` đọc `accessToken`, gọi `refreshSession()` khi 401 → xem [[Frontend_Overview]] §"Auth flow".
- Guard `auth.guard` đọc `selectIsAuthenticated`.

---

## Feature: `cart` ⏳

> **TODO** — Chưa có trong code. Khi mở rộng store cho giỏ hàng (lưu cart offline, optimistic update), cập nhật section này.

Đề xuất khi triển khai:
- State: `{ items: CartItem[]; totalPrice: number; isSyncing: boolean }`
- Actions: `Load Cart`, `Add Item`, `Remove Item`, `Update Quantity`, `Sync With Server`
- Effect (NgRx Effects, chưa cài) gọi `/products/cart`, `/products/:id/add-to-cart`.

---

## Feature: `orders` ⏳

> **TODO** — Chưa có. Đề xuất:
- State: `{ list: Order[]; current: Order | null; loading: boolean }`
- Actions: `Load Orders`, `Load Order Detail`, `Place Order`, `Update Payment Method`.

---

## Feature: `admin` ⏳

> **TODO** — Chưa có. Khi build admin dashboard cần state riêng cho users/roles/permissions list, có thể tách lazy feature qua `provideState`.

---

## Quy ước thêm feature mới

1. Tạo folder `src/app/shared/store/<feature>/` với 5 file: `actions.ts`, `reducer.ts`, `state.ts`, `selectors.ts`, `index.ts`.
2. Export `<feature>FeatureKey` và `<feature>Reducer` trong `index.ts`.
3. Đăng ký trong `app.config.ts`:
   ```ts
   provideStore({
     [authFeatureKey]: authReducer,
     [<feature>FeatureKey]: <feature>Reducer,
   })
   ```
4. Cập nhật file này — thêm section mới theo template feature `auth`.
5. Nếu cần side effect (HTTP call) → cài `@ngrx/effects` và document trong file này.

## Liên kết
- Component nào dùng store nào → [[Frontend_Overview]]
- API backend tương ứng → [[Auth_API]], [[Products_API]]
