---
title: "Bảng điều khiển Admin · SCR_009"
type: screen-spec
project: laptop-shop-angular
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/admin/dashboard/admin-dashboard.component.ts"
status: draft
last_synced: "2026-06-03"
tags: [screen-spec, admin, dashboard, laptop-shop-angular]
---

# Bảng điều khiển Admin · SCR_009

> Route: `admin` (admin.routes path `''`) · Component: `src/app/admin/dashboard/admin-dashboard.component.ts` · Guard: ⚠️ không có (lazy)

Liên quan: [[04_API_Specs/FEA_005_Quan_Ly_Vai_Tro|Quản lý vai trò]] · [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý người dùng]] · [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]] · [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc Frontend]]

## 1. Tổng quan

Trang tổng quan quản trị: hiển thị số liệu thống kê (người dùng, sản phẩm, đơn hàng, doanh thu), 2 biểu đồ placeholder và bảng đơn hàng gần đây.

- Route `admin` lazy-load `adminRoutes` (`app.routes.ts:56-60`); path `''` của admin map tới dashboard (`admin.routes.ts:3-8`).
- ⚠️ Route admin **không khai báo guard** — khác với các route client `cart`/`profile`/`order` dùng `authGuard`.
- Component standalone, `OnPush`, dùng layout admin: `app-admin-header` + `app-admin-sidenav` (`admin-dashboard.component.ts:4-5,50-57`).

## 2. Thành phần UI chính

| Vùng | Mô tả | Vị trí |
|---|---|---|
| Header admin | `app-admin-header` (input `currentUser`, output `sidebarToggle`/`logout`) | `admin-dashboard.component.ts:50-54` |
| Sidenav admin | `app-admin-sidenav`, toggle qua `isSidebarToggled()` | `admin-dashboard.component.ts:56-57` |
| Thẻ thống kê (4) | Lặp `statCards()`: người dùng/sản phẩm/đơn hàng/doanh thu, mỗi thẻ link tới module admin tương ứng | `admin-dashboard.component.ts:68-94` |
| Biểu đồ | 2 canvas placeholder "Doanh thu tháng", "Sản phẩm bán chạy" | `admin-dashboard.component.ts:97-121` |
| Bảng đơn hàng gần đây | Lặp `recentOrders()`: ID, khách, tổng tiền, trạng thái (badge màu), ngày, nút "Xem" | `admin-dashboard.component.ts:124-172` |
| Footer | Copyright + link | `admin-dashboard.component.ts:177-188` |

Liên kết điều hướng từ thẻ thống kê: `/admin/users`, `/admin/products`, `/admin/orders`, `/admin/orders/statistics` (`admin-dashboard.component.ts:266-289`) — chưa được khai báo trong `admin.routes.ts` (đang comment).

## 3. Luồng tương tác

1. **Khởi tạo** (`ngOnInit`, `:294-296`): gọi `loadDashboardData()`.
2. **Tải dữ liệu** (`loadDashboardData`, `:298-380`): hiện tại dùng **mock data** (`// TODO: Replace with actual API calls`, `:300`) — set `stats` và `recentOrders` cứng, rồi build lại `statCards`.
3. **Toggle sidebar** (`toggleSidebar`, `:382-384`): đảo `isSidebarToggled`.
4. **Đăng xuất** (`onLogout`, `:386-389`): hiện chỉ `console.log` (`// TODO: Implement logout`).
5. **Badge trạng thái** (`getStatusBadgeClass`, `:398-408`): map trạng thái tiếng Việt → class Bootstrap.

## 4. API / service gọi tới

Hiện **chưa gọi API thực** — toàn bộ số liệu là mock trong `loadDashboardData` (`admin-dashboard.component.ts:298-380`). Không inject service nào.

Định hướng backend khi nối thật: thống kê người dùng → [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý người dùng]] và [[04_API_Specs/FEA_005_Quan_Ly_Vai_Tro|Quản lý vai trò]]; thống kê sản phẩm/đơn hàng/doanh thu → [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]].

## 5. State / dữ liệu

Signals nội bộ (`admin-dashboard.component.ts:243-257`):

| Signal | Kiểu | Ý nghĩa |
|---|---|---|
| `currentUser` | `any` (mặc định `{ username: 'Admin User' }`) | Người dùng admin hiện tại (hard-code) |
| `isSidebarToggled` | `boolean` | Trạng thái thu gọn sidebar |
| `stats` | `DashboardStats` | Số liệu tổng quan |
| `recentOrders` | `any[]` | Đơn hàng gần đây |
| `statCards` | `StatCard[]` | Cấu hình 4 thẻ thống kê |

Kiểu dữ liệu: `DashboardStats`, `StatCard` định nghĩa nội bộ (`admin-dashboard.component.ts:7-21`).

> ⚠️ Cần human review:
> - Route `admin` **thiếu guard** — rủi ro bảo mật, dashboard admin truy cập được không cần đăng nhập (`admin.routes.ts`).
> - Dữ liệu hoàn toàn **mock**, `currentUser`/`onLogout` là placeholder; cần nối API thật.
> - Các link `/admin/users|products|orders|orders/statistics` chưa có route (đang comment trong `admin.routes.ts:9-20`) → sẽ rơi vào wildcard 404.
