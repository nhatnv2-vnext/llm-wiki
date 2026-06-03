---
title: "FEA_004 - Sản phẩm, Giỏ hàng & Đơn hàng"
type: api-spec
project: laptop-shop
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop/src/products/products.controller.ts"
status: draft
last_synced: "2026-06-03"
tags: [api-spec, backend, nestjs, products, cart, orders, laptop-shop]
---

# FEA_004 — Sản phẩm, Giỏ hàng & Đơn hàng

> Module backend xử lý vòng đời sản phẩm (CRUD), giỏ hàng của người dùng và quy trình đặt hàng / thanh toán.
> Controller: `src/products/products.controller.ts` · Service: `src/products/products.service.ts`

## Tổng quan

Module `products` gộp 3 nhóm chức năng vào chung một controller (`ProductsController`):

- **Sản phẩm (Products)**: tạo / liệt kê (phân trang) / xem chi tiết / cập nhật / xoá mềm.
- **Giỏ hàng (Cart)**: thêm sản phẩm vào giỏ, xem chi tiết giỏ, xoá item, cập nhật số lượng trước khi checkout.
- **Đơn hàng (Orders)**: đặt hàng (transaction có khoá tồn kho), lịch sử đơn, xem chi tiết đơn, cập nhật phương thức thanh toán + thông tin người nhận.

Toàn bộ controller áp dụng `@UseGuards(JwtAuthGuard, PermissionGuard)` (`products.controller.ts:25`). Hai endpoint công khai (`GET /api/products` và `GET /api/products/:id`) được đánh dấu `@Public()` nên bỏ qua xác thực (`products.controller.ts:37,66`). Các endpoint còn lại yêu cầu permission cụ thể qua `@RequirePermissions(...)`.

Prefix toàn cục là `api` (`src/main.ts:37`), nên route đầy đủ có dạng `/api/products/...`.

Tài liệu liên quan:
- Frontend: [[02_Design/SCR_002_Dang_Nhap|Trang chủ / danh sách sản phẩm]], [[02_Design/SCR_007_Chi_Tiet_San_Pham|Chi tiết sản phẩm]], [[02_Design/SCR_003_Gio_Hang|Giỏ hàng]], [[02_Design/SCR_008_Trang_Loi_404|Thanh toán / Đặt hàng]], [[02_Design/SCR_009_Bang_Dieu_Khien_Admin|Lịch sử đơn hàng]]
- Feature liên quan: [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực & phiên đăng nhập]], [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý người dùng]], [[04_API_Specs/FEA_005_Quan_Ly_Vai_Tro|Quản lý vai trò]], [[04_API_Specs/FEA_003_Cronjob_Hang_Doi_Email|Cronjob & hàng đợi email]]
- Kiến trúc: [[03_Architecture/laptop-shop_Architecture|Kiến trúc Backend]]
- Database: Schema laptop-shop

## Danh sách APIs

| # | Method | URL | Permission | Public | Service gọi |
|---|--------|-----|------------|--------|-------------|
| 1 | POST | `/api/products` | `products:create` | – | `create()` |
| 2 | GET | `/api/products?page=` | – | ✅ | `findAll()` |
| 3 | GET | `/api/products/cart` | `products:read` | – | `getCartDetailsForUser()` |
| 4 | GET | `/api/products/orders-history` | `products:read` | – | `getOrderHistoryForUser()` |
| 5 | GET | `/api/products/:id` | – | ✅ | `findOne()` |
| 6 | PATCH | `/api/products/:id` | `products:update` | – | `update()` |
| 7 | DELETE | `/api/products/:id` | `products:delete` | – | `remove()` (soft delete) |
| 8 | POST | `/api/products/:id/add-to-cart` | `products:read` | – | `addProductToCart()` |
| 9 | POST | `/api/products/delete-product-in-cart/:id` | `products:read` | – | `deleteProductInCart()` |
| 10 | POST | `/api/products/update-cart-before-checkout` | `products:read` | – | `updateCartDetailBeforeCheckout()` |
| 11 | POST | `/api/products/place-order` | `products:read` | – | `handlePlaceOrder()` |
| 12 | GET | `/api/products/order/:id` | `products:read` | – | `getOrderById()` |
| 13 | PATCH | `/api/products/order/:id/payment-method` | `products:read` | – | `updatePaymentMethod()` |

> Lưu ý thứ tự route: `cart`, `orders-history` được khai báo TRƯỚC `:id` trong controller (`products.controller.ts:44,58,65`) nên không bị nuốt bởi route động `:id`.

### 1. POST /api/products — Tạo sản phẩm
- **Permission**: `products:create` (`products.controller.ts:30`)
- **Body** (`CreateProductDto`, `dto/create-product.dto.ts`):
```json
{
  "name": "Laptop Dell XPS 13",
  "price": 25000000,
  "image": "https://cdn.shop/xps13.png",
  "detailDesc": "Mô tả chi tiết...",
  "shortDesc": "Laptop cao cấp",
  "quantity": 50,
  "sold": 0,
  "factory": "Dell",
  "target": "Doanh nhân"
}
```
- **Validation**: `name` bắt buộc, trim, ≤255 ký tự; `price` số nguyên ≥1; `image` (tuỳ chọn) URL hợp lệ; `quantity` số nguyên ≥0; `sold` (tuỳ chọn) mặc định 0; `detailDesc`, `shortDesc`, `factory`, `target` bắt buộc.
- **Logic**: kiểm tra trùng tên (`product.findFirst by name`) → `ConflictException('Product name already exists')` nếu trùng (`products.service.ts:25-31`).

### 2. GET /api/products?page=N — Danh sách sản phẩm (phân trang, public)
- **Query**: `page` (mặc định 1; nếu ≤0 → ép về 1, `products.controller.ts:38-40`).
- **Logic**: bỏ qua sản phẩm `deletedAt != null`; trang kích thước `PAGE_SIZE` (`src/config/constant`). Trả `{ data, currentPage, totalPages, totalProducts }` (`products.service.ts:40-59`).

### 3. GET /api/products/cart — Chi tiết giỏ hàng của user hiện tại
- **Permission**: `products:read`. Lấy `userId` từ `@User()` (token).
- **Logic controller**: gọi `getCartDetailsForUser(userId)` rồi tính `totalPrice = Σ(price × quantity)` (`products.controller.ts:46-55`). Service trả `cart.cartDetails` (kèm `product`) hoặc `[]` nếu chưa có giỏ.

### 4. GET /api/products/orders-history — Lịch sử đơn hàng của user
- **Permission**: `products:read`. Trả tất cả `order` của `userId` kèm `orderDetails.product` (`products.service.ts:442-456`).

### 5. GET /api/products/:id — Chi tiết 1 sản phẩm (public)
- **Logic**: `findUnique` theo `id` và `deletedAt: null`; không thấy → `NotFoundException` (`products.service.ts:61-74`).

### 6. PATCH /api/products/:id — Cập nhật sản phẩm
- **Permission**: `products:update`.
- **Body**: `UpdateProductDto` = `PartialType(CreateProductDto)` — tất cả field tuỳ chọn.
- **Logic**: `product.update` theo `id` + `deletedAt: null` (`products.service.ts:76-89`).

### 7. DELETE /api/products/:id — Xoá mềm sản phẩm
- **Permission**: `products:delete`.
- **Logic**: kiểm tra tồn tại → `NotFoundException` nếu không có; gọi `prisma.softDelete(product, { id })` (set `deletedAt`) (`products.service.ts:91-103`).

### 8. POST /api/products/:id/add-to-cart — Thêm vào giỏ
- **Permission**: `products:read`. **Body**: `{ "quantity": number }` (mặc định 1 nếu thiếu, `products.controller.ts:98`).
- **Logic** (`products.service.ts:105-171`):
  - Nếu user đã có `Cart`: tăng `cart.sum += quantity`, rồi `upsert` `cartDetail` (tăng `quantity` nếu đã có item của product, ngược lại tạo mới với `price` = giá hiện tại của product).
  - Nếu chưa có `Cart`: tạo `Cart` mới (`sum = quantity`) kèm 1 `cartDetail`.

### 9. POST /api/products/delete-product-in-cart/:id — Xoá item khỏi giỏ
- **Permission**: `products:read`. `:id` = `cartDetailId`.
- **Logic**: tìm `cartDetail`; nếu có và user có `Cart` → giảm `cart.sum -= cartDetail.quantity`, rồi `delete` cartDetail (`products.service.ts:189-222`).

### 10. POST /api/products/update-cart-before-checkout — Cập nhật số lượng trước checkout
- **Permission**: `products:read`.
- **Body**: `{ "currentCartDetail": [{ "id": "12", "quantity": "3" }] }` (`products.controller.ts:108-117`).
- **Logic**: lặp mảng, `cartDetail.update` từng item theo `id` với `quantity` mới (`products.service.ts:224-233`).

### 11. POST /api/products/place-order — Đặt hàng
- **Permission**: `products:read`. **Body**: `{ "totalPrice": number }`.
- **Logic** (transaction `Serializable`, timeout 10s, `products.service.ts:235-440`):
  1. Lấy `Cart` + `cartDetails.product`; nếu rỗng → `BadRequestException('Cart is empty')`.
  2. Khoá tồn kho bằng `SELECT ... FOR UPDATE` (raw SQL `Prisma.join(productIds)`) để chống race condition.
  3. Re-check tồn kho từng product; thiếu hàng → `BadRequestException('Insufficient quantity...')`.
  4. Tạo `Order` (paymentMethod = `NOT_DEFINED`, paymentStatus = `PAYMENT_UNPAID`, receiver fields rỗng) + `orderDetails`.
  5. Giảm `product.quantity`, tăng `product.sold` theo số lượng đặt.
  6. Xoá `cartDetails` + `Cart`.
  7. Sau transaction: lấy `user.username` (email) → đẩy job `order-confirmation` vào Bull queue `email` (3 lần thử, backoff exponential). Nếu queue lỗi → fallback gửi email đồng bộ qua `MailService.sendOrderConfirmationEmail`.
- **Trả về**: `{ success, message: 'Order placed successfully', orderId }`.

### 12. GET /api/products/order/:id — Chi tiết 1 đơn hàng
- **Permission**: `products:read`.
- **Logic**: `order.findFirst` theo `id` **và** `userId` (đảm bảo user chỉ xem đơn của chính họ); không thấy → `NotFoundException` (`products.service.ts:458-478`).

### 13. PATCH /api/products/order/:id/payment-method — Cập nhật phương thức thanh toán
- **Permission**: `products:read`.
- **Body** (`UpdatePaymentMethodDto`, `dto/update-payment-method.dto.ts`):
```json
{
  "paymentMethod": "COD",
  "receiverName": "Nguyễn Văn A",
  "receiverAddress": "123 Đường ABC",
  "receiverPhone": "0901234567",
  "receiverMail": "a@example.com"
}
```
- **Validation**: `paymentMethod` ∈ `['COD','BANKING']`; `receiverMail` phải là email hợp lệ.
- **Logic** (`products.service.ts:480-573`):
  - Tìm order theo `id` + `userId` + `status: 'PENDING'`; không thấy → `NotFoundException('Order not found or already processed')`.
  - Nếu `paymentMethod !== 'NOT_DEFINED'` → `BadRequestException('Payment method already set...')`.
  - Update order: set `paymentMethod`, `paymentStatus = 'PAYMENT_SUCCESS'`, thông tin người nhận, `status = 'CONFIRM'`.
  - Đẩy job email `order-confirmation` (delay 1s) vào Bull queue; lỗi queue chỉ log, không rollback.
  - Trả `{ success, message, order }`.

## Business Logic (Quy tắc nghiệp vụ)

- **Soft delete**: sản phẩm bị xoá set `deletedAt`; mọi truy vấn list/detail lọc `deletedAt: null` (`products.service.ts:46-48,64,80,102`).
- **Giỏ hàng 1-1 với user**: `Cart.userId` là `@unique` (schema), mỗi user tối đa 1 giỏ; `cart.sum` lưu tổng số lượng item.
- **Đảm bảo nhất quán tồn kho**: đặt hàng dùng transaction `Serializable` + `SELECT FOR UPDATE` khoá dòng product để tránh oversell khi nhiều request đồng thời.
- **Phân tách bước thanh toán**: đặt hàng tạo order ở trạng thái `PENDING` / `NOT_DEFINED`; thông tin người nhận và phương thức thanh toán được cập nhật ở bước riêng (endpoint 13), sau đó chuyển `status = CONFIRM`.
- **Bảo mật theo chủ sở hữu**: xem chi tiết đơn (`getOrderById`) và cập nhật payment-method luôn lọc theo `userId` từ token → user không truy cập đơn của người khác.
- **Email bất đồng bộ + fallback**: dùng Bull queue `email`; nếu queue lỗi thì gửi đồng bộ (chỉ ở `place-order`). Lỗi gửi mail không làm hỏng nghiệp vụ đặt hàng. Xem [[04_API_Specs/FEA_003_Cronjob_Hang_Doi_Email|Cronjob & hàng đợi email]].

## Database tương tác

Các bảng (Prisma model → table) được dùng — xem Schema laptop-shop:

| Model | Table | Vai trò |
|-------|-------|---------|
| `Product` | `products` | CRUD sản phẩm, tồn kho (`quantity`), đã bán (`sold`), soft delete |
| `Cart` | `carts` | Giỏ hàng (1-1 với user, field `sum`) |
| `CartDetail` | `cart_detail` | Dòng chi tiết giỏ (price, quantity, productId) |
| `Order` | `orders` | Đơn hàng (totalPrice, paymentMethod/Status, receiver*, status) |
| `OrderDetail` | `order_detail` | Dòng chi tiết đơn |
| `User` | `users` | Lấy `username` (email) để gửi confirmation; quan hệ qua `userId` |

Truy cập DB qua `PrismaService` (`src/database`). Hàng đợi email qua Bull (`@InjectQueue('email')`) + `MailService` (`src/mail/services/mail.service`).

## Cần human review

- `place-order` nhận `totalPrice` từ client mà **không** tính lại / đối chiếu với tổng giá trị giỏ phía server — rủi ro bị thao túng giá.
- `updateCartDetailBeforeCheckout` không kiểm tra cartDetail có thuộc về user gọi API hay không (chỉ update theo `id`).
- `addProductToCart`/`deleteProductInCart`/`getOrderById` dùng `products:read` thay vì permission `orders:*` — mapping permission cần xác nhận với nghiệp vụ.
