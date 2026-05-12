---
title: Products & Cart & Orders API
type: api
source:
  - 01_Raw/codebase/nestjs-backend/src/products
status: draft
last_synced: 2026-05-12
tags: [api, products, cart, orders, rbac]
---

# Products & Cart & Orders API

Controller gộp 3 nhóm endpoint dưới prefix `/products` (theo `products.controller.ts:24`). Tất cả route đều bảo vệ bằng `JwtAuthGuard + PermissionGuard`; route `@Public()` bypass.

## 1. Contract

| Method | Path | Permission | Mô tả |
|--------|------|------------|-------|
| `GET` | `/products` | Public | Danh sách sản phẩm phân trang (`?page=`) |
| `GET` | `/products/:id` | Public | Chi tiết sản phẩm |
| `POST` | `/products` | `products.create` | Tạo sản phẩm mới |
| `PATCH` | `/products/:id` | `products.update` | Cập nhật sản phẩm |
| `DELETE` | `/products/:id` | `products.delete` | Xoá sản phẩm (soft) |
| `GET` | `/products/cart` | `products.read` | Lấy cart hiện tại + `totalPrice` |
| `POST` | `/products/:id/add-to-cart` | `products.read` | Thêm sản phẩm vào cart (`{ quantity }`) |
| `POST` | `/products/delete-product-in-cart/:id` | `products.read` | Xoá 1 dòng khỏi cart |
| `POST` | `/products/update-cart-before-checkout` | `products.read` | Sync số lượng cart trước khi checkout |
| `POST` | `/products/place-order` | `products.read` | Tạo order từ cart (`{ totalPrice }`) |
| `GET` | `/products/orders-history` | `products.read` | Lịch sử order của user |
| `GET` | `/products/order/:id` | `products.read` | Chi tiết 1 order |
| `PATCH` | `/products/order/:id/payment-method` | `products.read` | Cập nhật payment method + thông tin nhận hàng |

### Payload chính

```ts
type CreateProductDto = {
  name: string;
  price: number;
  image?: string;
  detailDesc: string;
  shortDesc: string;
  quantity: number;
  factory: string;
  target: string;
};

type UpdatePaymentMethodDto = {
  paymentMethod: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  receiverMail: string;
};

type AddToCartBody = { quantity: number };
type PlaceOrderBody = { totalPrice: number };
type UpdateCartBody = { currentCartDetail: { id: string; quantity: string }[] };
```

## 2. Source of truth
- Controller: `01_Raw/codebase/nestjs-backend/src/products/products.controller.ts:24-152`
- Service: `01_Raw/codebase/nestjs-backend/src/products/products.service.ts`
- DTOs: `01_Raw/codebase/nestjs-backend/src/products/dto/`
- Permissions constants: `01_Raw/codebase/nestjs-backend/src/auth/constants/permissions.constant.ts`

## 3. Business rule
- **Pagination**: query `page`, mặc định 1, clamp về 1 nếu <= 0.
- **Cart 1-1 user**: bảng `carts.userId @unique` (xem [[Schema_Design]]).
- **Place-order**: tổng tiền (`totalPrice`) do FE tính rồi gửi lên → backend tin và lưu. **Tiềm năng tampering** — xem [[Conflict_Reports]] nếu cần ghi nhận.
- **RBAC**: mọi mutation product yêu cầu permission tương ứng (xem [[Roles_API]]).

## 4. Edge cases & error codes
| Code | Khi nào | Hành vi |
|------|---------|---------|
| `401` | Thiếu JWT | Redirect login |
| `403` | Thiếu permission | Trả về `403 Forbidden` |
| `400` | DTO sai (class-validator) | Mảng `message` |
| `404` | Sản phẩm/order không tồn tại | — |
| `409` | Quantity > tồn kho (nếu service kiểm tra) | _cần xác nhận trong service_ |

## Liên kết
- Bảng `products`, `orders`, `carts` → [[Schema_Design]]
- Email confirm order → [[Email_Queue_Flow]]
- RBAC permission → [[Roles_API]]
- Auth context → [[Auth_API]]
