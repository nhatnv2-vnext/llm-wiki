---
title: "FEA_003 - Cronjob & Hàng đợi email"
type: api-spec
project: laptop-shop
source:
  - "local: src/cronjob/controllers/cronjob.controller.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - api-spec
  - laptop-shop
  - cronjob
  - queue
  - email
  - bull
---

# FEA_003 — Cronjob & Hàng đợi email

> Spec này được lần luồng bằng **CodeGraph MCP** (context/callees/impact). Mọi claim kèm `file:line`.

## 1. Tổng quan

Module `CronjobController` (`src/cronjob/controllers/cronjob.controller.ts:10`) cung cấp **3 endpoint chỉ-đọc (monitoring)** để theo dõi cronjob và hàng đợi email. Logic và phần lớn "khối lượng thật" nằm ở `CronjobService` (`src/cronjob/services/cronjob.service.ts:14`), gồm 3 phần:

- **API monitoring:** trạng thái job, trạng thái email queue, logs.
- **Cron jobs theo lịch:** `@Cron` chạy nền (cancel đơn hết hạn, bảo trì queue).
- **Producer hàng đợi email:** đẩy job email vào Bull queue (`@InjectQueue('email')`, `cronjob.service.ts:18`).

Toàn bộ controller bảo vệ kép `@UseGuards(JwtAuthGuard, PermissionGuard)` (`cronjob.controller.ts:9`), mọi endpoint yêu cầu `PERMISSIONS.SYSTEM.READ` = `'system:read'` (`permissions.constant.ts:41`).

## 2. Chuỗi gọi thật (CodeGraph)

```
GET /cronjob/status              → getCronjobStatus    (cronjob.controller.ts:15)
   @RequirePermissions(SYSTEM.READ)
      ↳ CronjobService.getCronjobStatus    (cronjob.service.ts:261)
          ↳ prisma.cronjobLog.findFirst (job 'queue-maintenance' mới nhất)   :264
          ↳ CronjobService.getEmailQueueStatus  (cronjob.service.ts:291)     :279

GET /cronjob/email-queue/status  → getEmailQueueStatus (cronjob.controller.ts:24)
   @RequirePermissions(SYSTEM.READ)
      ↳ CronjobService.getEmailQueueStatus (cronjob.service.ts:291)
          ↳ emailQueue.getWaiting/getActive/getCompleted/getFailed/getDelayed  :292-296

GET /cronjob/logs                → getCronjobLogs      (cronjob.controller.ts:33)
   @RequirePermissions(SYSTEM.READ)
      ↳ CronjobService.getCronjobLogs      (cronjob.service.ts:381) → prisma.cronjobLog.findMany (take 50)
```

**Luồng nền (event + cron) — CodeGraph callees của CronjobService:**

```
EventEmitter 'user.registered'  → @OnEvent handleUserRegistered (cronjob.service.ts:24)
   (event này được PHÁT từ AuthService.register, auth.service.ts:59 — xem FEA_001)
      ↳ queueWelcomeEmail        (cronjob.service.ts:156) → emailQueue.add('welcome', ...)

@Cron EVERY_10_MINUTES 'cancel-expired-orders' → handleCancelExpiredOrders (cronjob.service.ts:35)
      ↳ logJobStart → prisma.cronjobLog.create        :330
      ↳ prisma.order.findMany / order.updateMany       :47, :61
      ↳ prisma.orderDetail.findMany + product.update (restore tồn kho)  :76, :84
      ↳ logJobCompleted / logJobFailed                 :340 / :360

@Cron EVERY_10_MINUTES 'queue-maintenance' → handleQueueMaintenance (cronjob.service.ts:118)
      ↳ emailQueue.clean(...)                           :126
```

> **Phát hiện nhờ CodeGraph (đọc tay controller dễ bỏ sót):**
> 1. `getCronjobStatus` (`:261`) **gọi lồng** `getEmailQueueStatus` (`:279`) — tức endpoint `/status` thực chất bao gồm luôn dữ liệu của `/email-queue/status`. Không nhìn rõ nếu chỉ đọc controller.
> 2. Controller chỉ lộ 3 endpoint, nhưng `CronjobService` còn chứa **2 cron job nền** + **3 hàm producer email** (`queueWelcomeEmail/queuePasswordResetEmail/queueOrderConfirmationEmail`) + `scheduleEmail`. `codegraph_impact CronjobService` liệt kê đủ 19 symbol — bức tranh thật lớn hơn API nhiều.
> 3. Cron `cancel-expired-orders` **có side-effect ghi dữ liệu nghiệp vụ**: hủy đơn `PENDING` quá 30 phút có `paymentMethod = NOT_DEFINED` và **hoàn tồn kho** (`product.quantity += `, `sold -= `, `:89-94`). Đây là logic FEA_004 (đơn hàng) ẩn trong module cronjob — liên kết chéo chỉ CodeGraph callees mới nối được.

## 3. Danh sách API

Prefix: `@Controller('cronjob')` (`cronjob.controller.ts:8`).

### 3.1 GET /cronjob/status
- **Quyền:** `@RequirePermissions(PERMISSIONS.SYSTEM.READ)` (`cronjob.controller.ts:14`).
- **Response:** `{ message, data: { job, emailQueue, systemInfo } }`. `job` lấy từ log mới nhất của `queue-maintenance` (`cronjob.service.ts:269-277`); `emailQueue` là output của `getEmailQueueStatus`; `systemInfo` gồm `serverTime`, `bullVersion` (`cronjob.service.ts:281-288`).

### 3.2 GET /cronjob/email-queue/status
- **Quyền:** `@RequirePermissions(PERMISSIONS.SYSTEM.READ)` (`cronjob.controller.ts:23`).
- **Response:** `{ message, data }` với data là thống kê Bull queue: `total, waiting, active, completed, failed, delayed, waitingByType, failedByType, oldestWaiting` (`cronjob.service.ts:310-325`).

### 3.3 GET /cronjob/logs
- **Quyền:** `@RequirePermissions(PERMISSIONS.SYSTEM.READ)` (`cronjob.controller.ts:32`).
- **Response:** `{ message, data }` — 50 bản ghi `cronjobLog` mới nhất, `orderBy createdAt desc` (`cronjob.service.ts:381-386`).

## 4. Business Logic (Quy tắc Nghiệp vụ)

- **Email queue dùng Bull/Redis:** queue tên `'email'` (`@InjectQueue('email')`, `cronjob.service.ts:18`). Mọi job email cấu hình `attempts: 3`, `backoff exponential delay 60000ms`, `removeOnComplete: 10`, `removeOnFail: 5` (`cronjob.service.ts:165-173`).
- **Welcome email tự động:** `@OnEvent('user.registered')` (`cronjob.service.ts:23`) nhận event từ đăng ký (FEA_001) → `queueWelcomeEmail`.
- **3 loại email + scheduler:** welcome, password-reset, order-confirmation (`cronjob.service.ts:156/181/208`); `scheduleEmail` cho phép đẩy email có `delay` (`cronjob.service.ts:234`).
- **Cron hủy đơn hết hạn (mỗi 10 phút):** đơn `status PENDING` + `paymentMethod NOT_DEFINED` + tạo quá 30 phút → set `CANCELLED` và **hoàn lại tồn kho** product (`cronjob.service.ts:35-112`).
- **Cron bảo trì queue (mỗi 10 phút):** dọn job `completed` cũ hơn 1 ngày (`emailQueue.clean(24*60*60*1000, 'completed')`, `cronjob.service.ts:126`).
- **Ghi log job:** mỗi cron ghi `started/completed/failed` vào bảng `cronjobLog` kèm `duration`, `details`, `error` (`logJobStart:330`, `logJobCompleted:340`, `logJobFailed:360`).

## 5. Database tương tác

| Bảng | Thao tác | Vị trí |
|------|----------|--------|
| `cronjobLog` | `findFirst` (job mới nhất) | `cronjob.service.ts:264` |
| `cronjobLog` | `findMany` (50 logs) | `cronjob.service.ts:382` |
| `cronjobLog` | `create` (ghi log start/completed/failed) | `cronjob.service.ts:331, 348, 368` |
| `order` | `findMany` / `updateMany` (hủy đơn hết hạn) | `cronjob.service.ts:47, 61` |
| `orderDetail` | `findMany` (lấy chi tiết để hoàn kho) | `cronjob.service.ts:76` |
| `product` | `update` (increment quantity, decrement sold) | `cronjob.service.ts:84` |

Ngoài DB còn tương tác **Redis qua Bull queue** (`emailQueue.add/getWaiting/getActive/getCompleted/getFailed/getDelayed/clean`).

## 6. Phạm vi ảnh hưởng (impact)

`codegraph_impact CronjobService` → **19 symbol** trong `cronjob.service.ts`:
`handleUserRegistered:24`, `handleCancelExpiredOrders:35`, `handleQueueMaintenance:118`, `queueWelcomeEmail:156`, `queuePasswordResetEmail:181`, `queueOrderConfirmationEmail:208`, `scheduleEmail:234`, `getCronjobStatus:261`, `getEmailQueueStatus:291`, `logJobStart:330`, `logJobCompleted:340`, `logJobFailed:360`, `getCronjobLogs:381` + `CronjobController` (`constructor:11`, class:10).

Phụ thuộc ngược (callers ngoài module): `AuthService.register` (`auth.service.ts:59`) phát event `user.registered` mà `handleUserRegistered` lắng nghe → sửa contract event sẽ phá welcome email. Cron `cancel-expired-orders` ghi vào `order`/`product` (chung bảng với FEA_004) → thay đổi schema đơn hàng/sản phẩm ảnh hưởng cron này.

## 7. Liên kết

- [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực & Phiên đăng nhập]] — nguồn phát event `user.registered`
- [[04_API_Specs/FEA_002_Phan_Quyen|Phân quyền (Permissions)]] — guard `system:read`
- [[04_API_Specs/FEA_006_Quan_Ly_Nguoi_Dung|Quản lý Người dùng]]
- [[03_Architecture/laptop-shop_Architecture|Kiến trúc Backend]]
- [[06_Code_Graph/laptop-shop/auth/SKILL|Code Graph — module auth]]

## 8. Cần human review

- Cron `cancel-expired-orders` thao tác trực tiếp `order`/`orderDetail`/`product` thay vì gọi qua service đơn hàng — cân nhắc tách logic để tránh trùng quy tắc tồn kho với FEA_004.
- `getCronjobStatus` chỉ phản ánh job `queue-maintenance`; trạng thái job `cancel-expired-orders` không xuất hiện trong `/status` (chỉ thấy trong `/logs`).
