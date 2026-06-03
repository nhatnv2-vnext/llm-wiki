---
title: "Chi tiết đơn hàng · SCR_006"
type: screen-spec
project: laptop-shop-angular
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop-angular/src/app/client/order/order-detail.component.ts"
status: draft
last_synced: "2026-06-03"
tags: [screen-spec, order, payment, client, laptop-shop-angular]
---

# Chi tiết đơn hàng · SCR_006

> Route: `order/:id` · Component: `src/app/client/order/order-detail.component.ts` · Guard: `authGuard` (lazy)

Liên quan: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]] · [[02_Design/SCR_005_Lich_Su_Don_Hang|Lịch sử đơn hàng]] · [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]] · [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc Frontend]]

## 1. Tổng quan

Màn hình hiển thị chi tiết một đơn hàng và cho phép người dùng **xác nhận phương thức thanh toán + thông tin nhận hàng** trong một khung thời gian giới hạn (đếm ngược 30 phút). Đây là bước chốt đơn ngay sau khi tạo đơn từ giỏ hàng.

- Route được khai báo tại `app.routes.ts:32-36`, lazy-loaded, bảo vệ bằng `authGuard` (`app.routes.ts:34`) — yêu cầu đăng nhập.
- Component là standalone, `ChangeDetectionStrategy.OnPush`, dùng Angular signals (`order-detail.component.ts:57-60`, `415`).
- Template inline (không có file `.html` riêng), gồm header/footer client dùng chung (`order-detail.component.ts:62`, `181`).

## 2. Thành phần UI chính

| Vùng | Mô tả | Vị trí |
|---|---|---|
| Header / Footer client | `app-client-header` (binding `user`, `cartCount`) + `app-client-footer` | `order-detail.component.ts:62,181` |
| Trạng thái tải / lỗi / rỗng | Hộp "Đang tải…", lỗi, "Không tìm thấy đơn hàng" | `order-detail.component.ts:66-71` |
| Thẻ thành công | Hiển thị sau khi xác nhận, có nút "Quay về trang chủ" | `order-detail.component.ts:72-78` |
| Danh sách sản phẩm trong đơn | Lặp `order().orderDetails`, ảnh + tên + SL × giá + thành tiền | `order-detail.component.ts:86-102` |
| Hộp đếm ngược | Thời gian xác nhận còn lại, đổi style khi `isExpired()` | `order-detail.component.ts:107-110` |
| Form thanh toán & nhận hàng | Radio COD/BANKING, tên, SĐT, email, địa chỉ | `order-detail.component.ts:117-162` |
| Nút "Xác nhận đặt hàng" | Disabled khi `!canConfirm()` hoặc đang submit | `order-detail.component.ts:164-170` |

## 3. Luồng tương tác

1. **Khởi tạo** (`ngOnInit`, `:448-458`): lấy `id` từ route param; nếu không hợp lệ → set lỗi "Mã đơn hàng không hợp lệ." và dừng.
2. **Tải đơn** (`loadOrder`, `:546-579`): GET đơn hàng, chuẩn hoá response (`normalizeOrderResponse`, `:617-627`), prefill form (tên/SĐT/email/địa chỉ; email fallback từ user đang đăng nhập, `:575`), khởi động đếm ngược từ `createdAt`.
3. **Đếm ngược** (`startCountdown`, `:581-608`): hết hạn (30 phút kể từ `createdAt`, `:422`) → nếu chưa thành công thì điều hướng về `/` (`:601`). `createdAt` không hợp lệ cũng điều hướng về `/` (`:587`).
4. **Điều chỉnh form**: chọn phương thức thanh toán, nhập thông tin; `canConfirm()` (`:506-515`) kiểm tra chưa hết hạn + đủ trường + email hợp lệ (`isValidEmail`, `:541-544`).
5. **Xác nhận** (`confirmOrder`, `:464-504`): PATCH cập nhật phương thức thanh toán; thành công → dừng đếm ngược, hiện thẻ thành công, reset số lượng giỏ hàng về 0 (`authService.setCartCount(0)`, `:502`).
6. **Hủy / dọn dẹp** (`ngOnDestroy`, `:460-462`): clear interval đếm ngược.

## 4. API / service gọi tới

> Base: `productsApiUrl = 'http://localhost:8080/api/v1/products'` (`order-detail.component.ts:421`). Backend: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]].

| Method | Endpoint | Mục đích | Vị trí |
|---|---|---|---|
| GET | `/products/order/:orderId` | Tải chi tiết đơn hàng | `order-detail.component.ts:551` |
| PATCH | `/products/order/:orderId/payment-method` | Xác nhận phương thức thanh toán + thông tin nhận hàng | `order-detail.component.ts:486` |

- HTTP gọi trực tiếp qua `HttpClient` inject (`:419`), không qua service riêng.
- `AuthService` (`:416`) cung cấp `currentUser()`, `totalItemsInCart()` cho header và `setCartCount(0)` sau khi đặt hàng.

## 5. State / dữ liệu

Signals nội bộ (`order-detail.component.ts:424-438`):

| Signal | Kiểu | Ý nghĩa |
|---|---|---|
| `order` | `OrderDetail \| null` | Đơn hàng đang xem |
| `isLoading` | `boolean` | Đang tải |
| `isSubmitting` | `boolean` | Đang gửi xác nhận |
| `isOrderSuccess` | `boolean` | Đã xác nhận thành công |
| `errorMessage` / `actionMessage` | `string` | Thông báo lỗi tải / kết quả thao tác |
| `remainingSeconds` | `number` | Giây còn lại của đếm ngược |

Trường form (two-way `ngModel`, `:440-444`): `selectedPaymentMethod` (`'COD' \| 'BANKING' \| ''`), `receiverName`, `receiverAddress`, `receiverPhone`, `receiverMail`.

Kiểu dữ liệu chính: `OrderDetail`, `OrderDetailItem`, `OrderProduct`, `UpdatePaymentPayload` định nghĩa nội bộ component (`:11-55`).

> ⚠️ Cần human review: thời lượng hết hạn 30 phút (`expiryDurationMs`, `:422`) được hard-code ở FE — cần xác nhận khớp với backend.
