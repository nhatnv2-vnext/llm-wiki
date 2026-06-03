---
title: "Chi tiết đơn hàng · SCR_006"
type: screen-spec
project: laptop-shop-angular
source:
  - "local: src/app/client/order/order-detail.component.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - screen-spec
  - laptop-shop-angular
  - order
  - checkout
  - client
---

# Chi tiết đơn hàng · SCR_006

## Tổng quan

Màn hình hiển thị chi tiết một đơn hàng vừa tạo và cho phép người dùng **xác nhận đặt hàng** bằng cách chọn phương thức thanh toán + điền thông tin người nhận. Đây là bước checkout cuối cùng sau giỏ hàng.

- Route: `order/:id`, lazy-loaded, được bảo vệ bởi `authGuard` (`src/app/app.routes.ts:33-36`).
- Component standalone `OrderDetailComponent implements OnInit, OnDestroy` (`order-detail.component.ts:415`), dùng `ChangeDetectionStrategy.OnPush` + Angular Signals.
- Có **đồng hồ đếm ngược 30 phút** kể từ `createdAt`; hết giờ thì tự điều hướng về trang chủ (`order-detail.component.ts:422`, `581-608`).

## Thành phần UI

- **Header/Footer client**: `ClientHeaderComponent`, `ClientFooterComponent` (import `order-detail.component.ts:7-8`).
- **Timer box**: hiển thị `countdownText()` định dạng `mm:ss`; thêm class `expired` khi hết hạn (`order-detail.component.ts:521-528`).
- **Danh sách sản phẩm trong đơn**: lặp `order().orderDetails`, mỗi item hiển thị ảnh (`getProductImage`), tên, số lượng, giá (`formatCurrency`) (`order-detail.component.ts:530-539`).
- **Form người nhận**: input `receiverName`, `receiverAddress`, `receiverPhone`, `receiverMail` (`order-detail.component.ts:441-444`).
- **Chọn phương thức thanh toán**: radio `COD` / `BANKING` → `selectedPaymentMethod` (`order-detail.component.ts:440`).
- **Nút Xác nhận**: disabled theo `canConfirm()` và `isSubmitting()`.
- **Success card**: hiển thị khi `isOrderSuccess()` = true (`order-detail.component.ts:365-394`, `427`).

## Luồng tương tác

1. `ngOnInit` đọc `id` từ `paramMap`; nếu không hợp lệ → set lỗi "Mã đơn hàng không hợp lệ." (`order-detail.component.ts:448-457`).
2. `loadOrder(id)` gọi `GET /products/order/:id`, chuẩn hóa response qua `normalizeOrderResponse`, đổ vào form và khởi động `startCountdown(createdAt)` (`order-detail.component.ts:546-578`).
3. Người dùng điền form + chọn phương thức thanh toán. `canConfirm()` kiểm tra: chưa hết hạn, có phương thức, các trường không rỗng, email hợp lệ qua `isValidEmail` (`order-detail.component.ts:506-515`, `541-544`).
4. `confirmOrder()` gọi `PATCH /products/order/:id/payment-method` với payload người nhận; thành công → dừng countdown, set `isOrderSuccess=true`, reset cart count về 0 (`order-detail.component.ts:464-504`).
5. `ngOnDestroy` / hết giờ → `clearCountdown()` (`order-detail.component.ts:460-462`, `610-615`).

## Service / API gọi tới

Component không inject service domain riêng mà gọi `HttpClient` trực tiếp (`order-detail.component.ts:419`). Base URL: `http://localhost:8080/api/v1/products` (`order-detail.component.ts:421`).

| Hành động | HTTP | Endpoint | file:line |
|---|---|---|---|
| Tải chi tiết đơn | GET | `/products/order/:id` | `order-detail.component.ts:551` |
| Xác nhận thanh toán | PATCH | `/products/order/:id/payment-method` | `order-detail.component.ts:486` |

### Component gọi service nào (từ codegraph_callees)

`codegraph_callees(confirmOrder)` cho thấy `confirmOrder` gọi tới `AuthService.setCartCount` (`src/app/shared/services/auth.service.ts:146`) — sau khi đặt hàng thành công thì reset số lượng giỏ hàng về 0 (`order-detail.component.ts:502`). Ngoài ra gọi nội bộ `canConfirm`, `clearCountdown` và truy cập signal `_order`, `_isSubmitting`.

- `AuthService` được inject public (`order-detail.component.ts:416`), dùng `currentUser()` để prefill email người nhận (`order-detail.component.ts:575`) và `setCartCount(0)` (`auth.service.ts:146`).

## State

Toàn bộ state cục bộ qua Angular Signals (`order-detail.component.ts:424-446`):

| Signal | Ý nghĩa |
|---|---|
| `order` | Dữ liệu `OrderDetail` đã tải |
| `isLoading` | Đang tải chi tiết đơn |
| `isSubmitting` | Đang gửi xác nhận |
| `isOrderSuccess` | Đặt hàng thành công |
| `errorMessage` / `actionMessage` | Thông báo lỗi / hành động |
| `remainingSeconds` | Giây còn lại của countdown |
| `selectedPaymentMethod`, `receiver*` | Trường form (plain property) |

Cart count là state toàn cục qua NgRx (selector `selectTotalItemsInCart` trong `AuthService`, `auth.service.ts:63`).

## Liên kết

- Feature BE: [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm & Đơn hàng]]
- Màn hình liên quan: [[02_Design/SCR_005_Lich_Su_Don_Hang|Lịch sử đơn hàng]], [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]]
- Kiến trúc: [[03_Architecture/laptop-shop-angular_Architecture|Kiến trúc FE]]
- Code graph: [[06_Code_Graph/laptop-shop-angular/admin/SKILL|Code Graph admin]]
