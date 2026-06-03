---
title: "Bảng điều khiển Admin · SCR_009"
type: screen-spec
project: laptop-shop-angular
source:
  - "local: src/app/admin/dashboard/admin-dashboard.component.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - screen-spec
  - laptop-shop-angular
  - admin
  - dashboard
---

# Bảng điều khiển Admin · SCR_009

## Tổng quan

Trang dashboard tổng quan cho khu vực quản trị: hiển thị thẻ thống kê (người dùng, sản phẩm, đơn hàng, doanh thu), khu vực biểu đồ và bảng đơn hàng gần đây.

- Route: `admin` → `adminRoutes` (lazy children); path `''` của admin map tới `AdminDashboardComponent` (`src/app/app.routes.ts:58-59`, `src/app/admin/admin.routes.ts:4-8`).
- Component standalone `AdminDashboardComponent implements OnInit` (`admin-dashboard.component.ts:241`), `ChangeDetectionStrategy.OnPush` + Angular Signals.
- ⚠️ **Dữ liệu hiện là mock, chưa nối API** — xem mục Service bên dưới.

## Thành phần UI

- **Header admin**: `<app-admin-header>` với `[currentUser]`, output `(sidebarToggle)`, `(logout)` (`admin-dashboard.component.ts:50-54`). Component `AdminHeaderComponent` (`admin-dashboard.component.ts:4`).
- **Sidenav admin**: `<app-admin-sidenav>` với `[currentUser]`, toggle qua class `sb-sidenav-toggled` (`admin-dashboard.component.ts:56-57`). Component `AdminSidenavComponent` (`admin-dashboard.component.ts:5`).
- **Thẻ thống kê (4 card)**: lặp `statCards()`, mỗi card có title/value/icon/color/link/description (`admin-dashboard.component.ts:69-94`, `259-292`).
- **Khu vực biểu đồ**: canvas `myAreaChart`, `myBarChart` (Chart.js nạp qua CDN, chưa khởi tạo trong TS) (`admin-dashboard.component.ts:96-121`).
- **Bảng đơn hàng gần đây**: lặp `recentOrders()`; rỗng → "Chưa có đơn hàng nào"; badge trạng thái qua `getStatusBadgeClass` (`admin-dashboard.component.ts:123-172`).

## Luồng tương tác

1. `ngOnInit` gọi `loadDashboardData()` (`admin-dashboard.component.ts:294-296`).
2. `loadDashboardData()` (async) set **mock** `stats` và `recentOrders`, rồi cập nhật lại `statCards` với số liệu mới (`admin-dashboard.component.ts:298-380`). Có comment `// TODO: Replace with actual API calls`.
3. Bấm toggle trên header → `toggleSidebar()` đảo cờ `isSidebarToggled` (`admin-dashboard.component.ts:382-384`).
4. Bấm logout trên header → `onLogout()` hiện chỉ `console.log` — `// TODO: Implement logout functionality` (`admin-dashboard.component.ts:386-389`).
5. Mỗi card / dòng đơn hàng có `routerLink` tới `/admin/users`, `/admin/products`, `/admin/orders`, `/admin/orders/:id`, `/admin/orders/statistics` (các route này đang bị comment trong `admin.routes.ts:9-20`).

## Service / API gọi tới

**Không có** lời gọi `HttpClient` thực. Component không inject service domain hay `AuthService`; mọi dữ liệu là hard-code mock trong `loadDashboardData` (`admin-dashboard.component.ts:301-337`).

| Hành động | HTTP | Endpoint | Trạng thái |
|---|---|---|---|
| Tải số liệu dashboard | — | — | ⚠️ Mock, `// TODO: Replace with actual API calls` (`admin-dashboard.component.ts:300`) |
| Đăng xuất | — | — | ⚠️ Chưa cài đặt (`admin-dashboard.component.ts:387`) |

### Component gọi service nào (từ codegraph_callees)

`codegraph_callees(loadDashboardData)` chỉ trả về một callee nội bộ: `formatCurrency` (`admin-dashboard.component.ts:391`) để format doanh thu mock. **Không có callee tới service/HTTP/store** — xác nhận màn hình chưa tích hợp backend.

## State

State cục bộ qua Angular Signals (`admin-dashboard.component.ts:242-292`):

| Signal | Ý nghĩa |
|---|---|
| `currentUser` | User hiển thị trên header/sidenav (mock `{ username: 'Admin User' }`) |
| `isSidebarToggled` | Trạng thái thu/mở sidebar |
| `stats` | `DashboardStats` (mock) |
| `recentOrders` | Danh sách đơn hàng gần đây (mock) |
| `statCards` | Mảng `StatCard` hiển thị thẻ thống kê |

Không dùng NgRx; `currentUser` ở đây là mock cục bộ chứ không lấy từ `AuthService`.

## Liên kết

- Feature BE: [[04_API_Specs/FEA_005_Quan_Ly_Vai_Tro|Vai trò]], [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Người dùng]], [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]]
- Kiến trúc: [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc FE]]
- Code graph: [[06_Code_Graph/laptop-shop-angular/admin/SKILL|Code Graph admin]]
