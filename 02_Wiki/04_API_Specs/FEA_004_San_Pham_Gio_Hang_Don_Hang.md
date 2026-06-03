---
title: "FEA_004 - Sản phẩm, Giỏ hàng & Đơn hàng"
type: api-spec
project: laptop-shop
source:
  - "local: src/products/products.controller.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - api-spec
  - laptop-shop
  - products
  - cart
  - order
  - checkout
---

# FEA_004 — Sản phẩm, Giỏ hàng & Đơn hàng

> Lần luồng thật bằng CodeGraph MCP (`codegraph_context` / `codegraph_callees` / `codegraph_trace` / `codegraph_impact`) trên project `laptop-shop`. Mọi claim kèm `file:line`.

## 1. Tổng quan

Module `products` gộp 3 domain liên quan trong cùng một controller/service:

- **Quản lý sản phẩm** (CRUD + soft-delete): `create`, `findAll` (phân trang), `findOne`, `update`, `remove`.
- **Giỏ hàng**: thêm/xóa sản phẩm, xem chi tiết giỏ, cập nhật số lượng trước checkout.
- **Đơn hàng**: đặt hàng (`place-order`) bằng transaction có lock chống race-condition, xem lịch sử, xem chi tiết, cập nhật phương thức thanh toán + thông tin người nhận.

Toàn bộ controller được bảo vệ bởi `JwtAuthGuard` + `PermissionGuard` (`src/products/products.controller.ts:25`), trừ các route gắn `@Public()` (`findAll`, `findOne`).

Service inject 3 dependency (`src/products/products.service.ts:18-22`):
- `PrismaService` — truy cập DB.
- `@InjectQueue('email')` `Queue` — đẩy email xác nhận bất đồng bộ (BullMQ).
- `MailService` — fallback gửi email đồng bộ khi queue lỗi.

## 2. Danh sách API

| # | Method | URL | Permission / Guard | Payload chính | Handler controller |
|---|--------|-----|--------------------|---------------|--------------------|
| 1 | POST | `/api/products` | `PRODUCTS_CREATE` | `CreateProductDto` | `create` (`products.controller.ts:31`) |
| 2 | GET | `/api/products?page=` | `@Public()` | query `page` | `findAll` (`:38`) |
| 3 | GET | `/api/products/cart` | `PRODUCTS_READ` | — (lấy `user.userId`) | `getCartDetailsForUser` (`:46`) |
| 4 | GET | `/api/products/orders-history` | `PRODUCTS_READ` | — | `getOrdersHistory` (`:60`) |
| 5 | GET | `/api/products/:id` | `@Public()` | param `id` | `findOne` (`:67`) |
| 6 | PATCH | `/api/products/:id` | `PRODUCTS_UPDATE` | `UpdateProductDto` | `update` (`:73`) |
| 7 | DELETE | `/api/products/:id` | `PRODUCTS_DELETE` | param `id` | `remove` (`:84`) |
| 8 | POST | `/api/products/:id/add-to-cart` | `PRODUCTS_READ` | `{ quantity: number }` | `addToCart` (`:91`) |
| 9 | POST | `/api/products/delete-product-in-cart/:id` | `PRODUCTS_READ` | param `id` (cartDetailId) | `deleteProductInCart` (`:103`) |
| 10 | POST | `/api/products/update-cart-before-checkout` | `PRODUCTS_READ` | `{ currentCartDetail: {id, quantity}[] }` | `updateCartBeforeCheckout` (`:110`) |
| 11 | POST | `/api/products/place-order` | `PRODUCTS_READ` | `{ totalPrice: number }` | `placeOrder` (`:121`) |
| 12 | GET | `/api/products/order/:id` | `PRODUCTS_READ` | param `id` (orderId) | `getOrderById` (`:129`) |
| 13 | PATCH | `/api/products/order/:id/payment-method` | `PRODUCTS_READ` | `UpdatePaymentMethodDto` | `updatePaymentMethod` (`:136`) |

> Lưu ý thứ tự route: `cart`, `orders-history` được khai báo TRƯỚC `:id` (`:44`-`:63` so với `:65`), nên không bị nuốt bởi route param `:id`.

## 3. Chuỗi gọi controller → service → repository

Trích từ `codegraph_callees` / `codegraph_context`:

```
ProductsController.create          → ProductsService.create            → prisma.product.findFirst / create
ProductsController.findAll         → ProductsService.findAll           → prisma.product.count / findMany
ProductsController.findOne         → ProductsService.findOne           → prisma.product.findUnique
ProductsController.update          → ProductsService.update            → prisma.product.update
ProductsController.remove          → ProductsService.remove            → prisma.softDelete(product)
ProductsController.addToCart       → ProductsService.addProductToCart  → prisma.cart.(find/update/create) + cartDetail.upsert
ProductsController.deleteProductInCart       → ProductsService.deleteProductInCart        → prisma.cartDetail.delete + cart.update
ProductsController.updateCartBeforeCheckout  → ProductsService.updateCartDetailBeforeCheckout → prisma.cartDetail.update (loop)
ProductsController.placeOrder      → ProductsService.handlePlaceOrder  → prisma.$transaction(...) + emailQueue.add / MailService.sendOrderConfirmationEmail
ProductsController.getOrdersHistory → ProductsService.getOrderHistoryForUser → prisma.order.findMany
ProductsController.getOrderById    → ProductsService.getOrderById      → prisma.order.findFirst
ProductsController.updatePaymentMethod → ProductsService.updatePaymentMethod → prisma.order.findFirst/update + emailQueue.add
```

`codegraph_callees(handlePlaceOrder)` xác nhận 3 nhánh con: `ProductsService.create`, `ProductsService.update` (cùng class) và `MailService.sendOrderConfirmationEmail` (`src/mail/services/mail.service.ts:109`).

## 4. Business Logic

### 4.1 CRUD sản phẩm
- **create** (`products.service.ts:24`): chặn trùng tên — `findFirst({ where: { name } })`, nếu tồn tại → `ConflictException('Product name already exists')` (`:30`).
- **findAll** (`:40`): phân trang theo `PAGE_SIZE`, chỉ lấy `deletedAt: null`; trả `{ data, currentPage, totalPages, totalProducts }`.
- **findOne** (`:61`): không thấy → `NotFoundException` (`:70`).
- **remove** (`:91`): soft-delete qua `prisma.softDelete(this.prisma.product, { id })` (`:102`) — KHÔNG xóa cứng.

### 4.2 Giỏ hàng
- **addProductToCart** (`:105`): nếu user đã có cart → tăng `cart.sum` (`:125`) và `upsert` cartDetail (tăng `quantity` nếu đã có, tạo mới nếu chưa) (`:137-152`); nếu chưa có cart → tạo cart kèm cartDetail (`:155-169`). Giá lưu vào cartDetail lấy từ `product.price` tại thời điểm thêm.
- **getCartDetailsForUser** (`:173`): trả `cart.cartDetails` (include `product`); controller tự tính `totalPrice = Σ price*quantity` (`products.controller.ts:51`).
- **deleteProductInCart** (`:189`): giảm `cart.sum` theo `cartDetail.quantity` rồi `cartDetail.delete`.
- **updateCartDetailBeforeCheckout** (`:224`): loop cập nhật `quantity` từng cartDetail trước khi đặt hàng.

### 4.3 Đặt hàng — `handlePlaceOrder` (luồng phức tạp, `codegraph_trace`)

`ProductsService.handlePlaceOrder` (`:235`) là điểm phức tạp nhất, bọc trong `prisma.$transaction` với `isolationLevel: 'Serializable'`, `timeout: 10000` (`:344-347`). Các bước trong transaction:

1. Lấy cart kèm cartDetails + product (`:239`). Cart rỗng → `BadRequestException('Cart is empty')` (`:253`).
2. **Lock chống race-condition**: `SELECT ... FOR UPDATE` raw query khóa các product trong cart (`:259-263`) — dùng `Prisma.join(productIds)`.
3. **Re-check tồn kho** sau khi lock: nếu `product.quantity < cartDetail.quantity` → `BadRequestException('Insufficient quantity...')` (`:274-282`).
4. **Tạo order** với `paymentMethod: 'NOT_DEFINED'`, `paymentStatus: 'PAYMENT_UNPAID'`, receiver info rỗng (cập nhật sau ở bước payment-method) + nested-create `orderDetails` (`:286-311`).
5. **Trừ kho + tăng đã bán**: loop `product.update` decrement `quantity`, increment `sold` (`:314-328`).
6. **Dọn giỏ**: `cartDetail.deleteMany` + `cart.delete` (`:331-340`).

Sau khi commit transaction:
7. Lấy email user (`:351`); nếu có → đẩy job `'order-confirmation'` vào `emailQueue` với `attempts: 3`, backoff exponential (`:363-393`).
8. **Fallback**: nếu queue lỗi → gọi `mailService.sendOrderConfirmationEmail` đồng bộ (`:401`); nếu email vẫn lỗi → nuốt lỗi, KHÔNG ảnh hưởng đơn hàng (`:419-422`).
9. Lỗi `BadRequestException` được re-throw nguyên trạng (`:433`); lỗi khác bọc lại thành `BadRequestException('Failed to place order...')` (`:438`).

> Điểm cần human-review: `totalPrice` được client gửi lên (`products.controller.ts:123`) và lưu thẳng vào order (`:302`) — không tính lại ở backend → rủi ro client thao túng giá.

### 4.4 Đơn hàng — xem & cập nhật
- **getOrderHistoryForUser** (`:442`): lấy mọi order của user (include orderDetails + product).
- **getOrderById** (`:458`): `findFirst({ id, userId })` — chặn xem order của user khác; không thấy → `NotFoundException` (`:474`).
- **updatePaymentMethod** (`:480`): chỉ cho update khi order `status: 'PENDING'` (`:494`) và `paymentMethod === 'NOT_DEFINED'` (`:510`); nếu không → `NotFoundException` / `BadRequestException`. Khi hợp lệ: cập nhật receiver info, `paymentStatus: 'PAYMENT_SUCCESS'`, `status: 'CONFIRM'` (`:521-529`) rồi đẩy email xác nhận lần 2 vào queue (`:555`).

## 5. Tương tác Database (Prisma)

Các model được đụng tới (suy ra từ lời gọi `prisma.*`):

| Model | Thao tác | Vị trí (products.service.ts) |
|-------|----------|------------------------------|
| `product` | findFirst, create, count, findMany, findUnique, update, softDelete | `:25,33,43,45,62,77,102,112,268,315` |
| `cart` | findUnique, update, create, delete | `:106,120,155,197,336` |
| `cartDetail` | findFirst, upsert, delete, update, deleteMany | `:131,137,190,216,228,331` |
| `order` | create, findMany, findFirst, update | `:286,443,459,490,517` |
| `orderDetail` | nested-create trong order | `:293-298` |
| `user` | findUnique (lấy username gửi mail) | `:351` |

Raw SQL: `SELECT id, quantity FROM \`products\` ... FOR UPDATE` (`:259-263`).

## 6. Phạm vi ảnh hưởng (impact)

`codegraph_impact(handlePlaceOrder)` → 23 symbol bị ảnh hưởng:

- **products.service.ts**: `handlePlaceOrder:235`, `ProductsService:17`, `create:24`, `addProductToCart:105`, `findAll:40`, `findOne:61`, `update:76`, `deleteProductInCart:189`, `updateCartDetailBeforeCheckout:224`, `updatePaymentMethod:480`, `remove:91`, `getCartDetailsForUser:173`, `getOrderHistoryForUser:442`, `getOrderById:458`.
- **products.controller.ts**: `placeOrder:121`, `ProductsController:26`, route `POST /products/place-order:119`, `addToCart:91`, `updateCartBeforeCheckout:110`, `getOrdersHistory:60`.

Thay đổi schema order/cart hoặc logic transaction sẽ tác động toàn bộ chuỗi đặt hàng + nhánh email (queue và fallback `MailService`).

## 7. Liên kết

- [[04_API_Specs/FEA_005_Quan_Ly_Vai_Tro|Vai trò]]
- [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Người dùng]]
- [[03_Architecture/laptop-shop_Architecture|Kiến trúc BE]]
- [[06_Code_Graph/laptop-shop/products/SKILL|Code Graph products]]
