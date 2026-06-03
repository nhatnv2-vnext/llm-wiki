---
title: "FEA_003 — Cronjob & Hàng đợi email"
type: api-spec
project: laptop-shop
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop/src/cronjob/controllers/cronjob.controller.ts"
status: draft
last_synced: "2026-06-03"
tags:
  - api-spec
  - backend
  - cronjob
  - queue
  - bull
  - email
  - laptop-shop
---

# FEA_003 — Cronjob & Hàng đợi email

> Tài liệu liên quan: [[04_API_Specs/FEA_001_Xac_Thuc|Xác thực & Phiên đăng nhập]] · [[04_API_Specs/FEA_002_Phan_Quyen|Phân quyền (Permissions)]] · [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Sản phẩm, Giỏ hàng & Đơn hàng]] · Màn Giám sát Cronjob · [[03_Architecture/laptop-shop_Architecture|Kiến trúc Backend]] · Schema Database

## 1. Tổng quan

Module `cronjob` quản lý các **tác vụ nền theo lịch (cron)** và một **hàng đợi email bất đồng bộ** dựa trên Bull (Redis). Controller chỉ cung cấp các endpoint **giám sát (read-only)**: trạng thái cronjob, trạng thái email queue và logs lịch sử. Phần xử lý thực sự nằm trong `CronjobService`.

- Controller: `src/cronjob/controllers/cronjob.controller.ts` — prefix route `cronjob` (`cronjob.controller.ts:8`).
- Toàn bộ controller được bảo vệ `@UseGuards(JwtAuthGuard, PermissionGuard)` (`cronjob.controller.ts:9`); mọi endpoint yêu cầu quyền `system:read` (`cronjob.controller.ts:14,23,32`). Xem [[04_API_Specs/FEA_002_Phan_Quyen|Phân quyền]].
- Service: `src/cronjob/services/cronjob.service.ts` — inject Bull queue tên `email` và `PrismaService` (`cronjob.service.ts:17-20`).

### Thành phần nền (background) — không expose qua HTTP

- **Event listener** `@OnEvent('user.registered')`: nhận event từ [[04_API_Specs/FEA_001_Xac_Thuc|đăng ký user]], đẩy welcome email vào queue (`cronjob.service.ts:23-27`).
- **Cron `cancel-expired-orders`** — chạy mỗi 10 phút: hủy đơn `PENDING` có `paymentMethod = NOT_DEFINED` quá 30 phút và hoàn lại tồn kho (`cronjob.service.ts:32-112`).
- **Cron `queue-maintenance`** — chạy mỗi 10 phút: dọn job completed > 1 ngày, failed > 7 ngày; log thống kê queue (`cronjob.service.ts:115-152`).

## 2. Danh sách APIs

Prefix: `cronjob`. Tất cả yêu cầu Bearer token + quyền `system:read`.

### 2.1 GET `/cronjob/status`

- Quyền: `system:read` (`cronjob.controller.ts:13-14`).
- Logic: `getCronjobStatus()` đọc log gần nhất của job `queue-maintenance` từ bảng `cronjob_logs`, gộp với thống kê email queue và `systemInfo` (`cronjob.service.ts:261-289`).
- Đầu ra:

```json
{
  "message": "Lấy trạng thái cronjob thành công",
  "data": {
    "job": { "name": "queue-maintenance", "displayName": "Queue Maintenance", "schedule": "Mỗi 10 phút", "lastRun": "...", "lastStatus": "completed", "lastDuration": 1234, "status": "active" },
    "emailQueue": { "...": "xem 2.2" },
    "systemInfo": { "serverTime": "...", "bullVersion": "Bull Redis Queue" }
  }
}
```

### 2.2 GET `/cronjob/email-queue/status`

- Quyền: `system:read` (`cronjob.controller.ts:22-23`).
- Logic: `getEmailQueueStatus()` đọc trực tiếp Bull queue (`waiting/active/completed/failed/delayed`), tính tổng và phân nhóm theo loại job (`cronjob.service.ts:291-326`).
- Đầu ra (`data`):

```json
{
  "total": 12, "waiting": 2, "active": 0, "completed": 8, "failed": 1, "delayed": 1,
  "waitingByType": { "welcome": 2 },
  "failedByType": { "order-confirmation": 1 },
  "oldestWaiting": 1716800000000
}
```

### 2.3 GET `/cronjob/logs`

- Quyền: `system:read` (`cronjob.controller.ts:31-32`).
- Logic: `getCronjobLogs(limit = 50)` trả 50 bản ghi `cronjob_logs` mới nhất, sắp theo `createdAt` giảm dần (`cronjob.service.ts:381-386`).
- Đầu ra: `{ message, data: CronjobLog[] }`.

## 3. Business Logic (Quy tắc nghiệp vụ)

### 3.1 Hàng đợi email (Bull)

- Queue tên `email`, mọi job cấu hình: `attempts: 3`, backoff `exponential` delay 60s, `removeOnComplete: 10`, `removeOnFail: 5` (`cronjob.service.ts:165-173`).
- Ba loại email: `welcome`, `password-reset`, `order-confirmation` (`cronjob.service.ts:156-231`). Có thêm `scheduleEmail()` đặt email với `delay` tùy chỉnh (`cronjob.service.ts:234-257`).
- Kiểu dữ liệu email lấy từ `mail/processors/email.processor` (`WelcomeEmailData`, `PasswordResetEmailData`, `OrderConfirmationEmailData`) (`cronjob.service.ts:7-11`).

### 3.2 Cron hủy đơn quá hạn (`cancel-expired-orders`)

1. Mỗi 10 phút, tìm `Order` có `status = PENDING` và `paymentMethod = NOT_DEFINED` với `createdAt <= now-30 phút` (`cronjob.service.ts:47-55`).
2. `updateMany` các đơn đó sang `status = CANCELLED` (`cronjob.service.ts:61-72`).
3. **Hoàn kho**: với mỗi `OrderDetail`, `increment product.quantity` và `decrement product.sold` theo số lượng (`cronjob.service.ts:75-98`). Liên quan [[04_API_Specs/FEA_004_San_Pham_Gio_Hang_Don_Hang|Đơn hàng]].
4. Ghi log start/completed/failed vào `cronjob_logs` (`cronjob.service.ts:330-379`).

### 3.3 Cron bảo trì queue (`queue-maintenance`)

- Dọn job `completed` cũ hơn 1 ngày, `failed` cũ hơn 7 ngày; thu thập số liệu waiting/active/completed/failed và ghi log (`cronjob.service.ts:126-147`).

### 3.4 Ghi log job

- `logJobStart/Completed/Failed` tạo bản ghi `cronjob_logs` với `jobName`, `status`, `startTime`, `endTime`, `duration`, `error`, `details(JSON)` (`cronjob.service.ts:330-379`).

### Điểm cần human review

- **Quyền guard so với DB**: endpoint dùng `system:read`; quyền này nằm trong `PERMISSIONS.SYSTEM.READ` (`permissions.constant.ts:40-44`) và chỉ gán cho role `ADMIN` trong seed (`permissions.constant.ts:82`). Cùng pattern `req.user.userId` của `PermissionGuard` — xem cảnh báo ở [[04_API_Specs/FEA_002_Phan_Quyen|FEA_002]].
- **Hai cơ chế email song song**: tồn tại model `EmailQueue` trong DB (`schema.prisma:166-184`) nhưng service này dùng Bull/Redis làm hàng đợi runtime; bảng `email_queue` có thể là cơ chế dự phòng/cũ — cần xác nhận có processor nào ghi vào nó không.
- `getCronjobStatus` chỉ phản ánh job `queue-maintenance`, không báo cáo job `cancel-expired-orders` — có thể là thiếu sót giám sát.

## 4. Database tương tác

| Bảng (`@@map`) | Model Prisma | Vai trò |
|---|---|---|
| `cronjob_logs` | `CronjobLog` | Ghi/đọc lịch sử chạy job (status, duration, error, details) (`schema.prisma:186-201`) |
| `orders` | `Order` | Tìm & hủy đơn quá hạn (`schema.prisma:82-100`) |
| `order_detail` | `OrderDetail` | Lấy chi tiết đơn để hoàn kho (`schema.prisma:102-116`) |
| `products` | `Product` | Hoàn lại `quantity`, giảm `sold` (`schema.prisma:118-136`) |
| `email_queue` | `EmailQueue` | (Tham chiếu) bảng hàng đợi email persistent — cần review (`schema.prisma:166-184`) |

Ngoài DB, feature phụ thuộc **Redis** (Bull queue `email`) cho hàng đợi runtime — xem [[03_Architecture/laptop-shop_Architecture|Kiến trúc Backend]].
