---
title: Cronjob Flow
type: architecture
source:
  - 01_Raw/codebase/nestjs-backend/src/cronjob
status: draft
last_synced: 2026-05-12
tags: [architecture, cronjob, scheduler, email-queue]
---

# Cronjob Flow

Module `src/cronjob/` dùng **`@nestjs/schedule`** chạy 2 job định kỳ và ghi log vào MySQL.

## Lịch chạy

| Job name | Schedule | Trách nhiệm |
|----------|----------|-------------|
| `cancel-expired-orders` | `EVERY_10_MINUTES` | Hủy order `PENDING` quá hạn |
| `queue-maintenance` | `EVERY_10_MINUTES` | Quét `email_queue`: retry pending, đánh dấu failed quá `maxRetries`, dọn rows cũ |

(Đọc tại `cronjob.service.ts:32` và `cronjob.service.ts:115`.)

## Sequence — `queue-maintenance`

```mermaid
sequenceDiagram
  autonumber
  participant S as @nestjs/schedule
  participant C as CronjobService
  participant DB as MySQL
  participant Q as Bull queue 'email'
  participant SMTP as SMTP

  S->>C: tick (mỗi 10 phút)
  C->>DB: INSERT cronjob_logs (status='started', startTime)
  C->>DB: SELECT email_queue WHERE status='pending' AND scheduled_at <= NOW()
  loop mỗi row
    C->>Q: queue.add('<type>', data)
    C->>DB: UPDATE email_queue SET status='processing'
  end
  Q-->>SMTP: gửi mail (xem Email_Queue_Flow)
  C->>DB: SELECT email_queue WHERE retryCount >= maxRetries
  C->>DB: UPDATE status='failed'
  C->>DB: UPDATE cronjob_logs SET status='completed', endTime, duration
```

## Sequence — `cancel-expired-orders`

```mermaid
sequenceDiagram
  autonumber
  participant S as @nestjs/schedule
  participant C as CronjobService
  participant DB as MySQL
  participant Q as Bull queue 'email'

  S->>C: tick
  C->>DB: INSERT cronjob_logs (started)
  C->>DB: UPDATE orders SET status='CANCELLED' WHERE status='PENDING' AND created_at < NOW() - INTERVAL
  C->>Q: enqueue 'order-cancelled' email (nếu có)
  C->>DB: UPDATE cronjob_logs (completed)
```

## Lifecycle log

Mỗi job emit 2 row vào `cronjob_logs`:
- 1 row `status='started'` lúc bắt đầu.
- 1 row update `status='completed'|'failed'`, `endTime`, `duration` (ms), `error` (nếu fail).

→ Admin xem qua `GET /cronjob/logs` (xem [[Cronjob_API]]).

## Quan hệ với các thành phần khác

```mermaid
flowchart LR
  Sched[@nestjs/schedule] --> Cron[CronjobService]
  Cron --> EmailQ[(email_queue)]
  Cron --> Orders[(orders)]
  Cron --> Logs[(cronjob_logs)]
  EmailQ --> BullProcessor[EmailProcessor]
  BullProcessor --> SMTP[SMTP]
```

## Edge cases
- **Overlap**: nếu job trước chưa xong mà tick mới đến, `@nestjs/schedule` mặc định **không khoá** → cần đảm bảo idempotent (service hiện chỉ update theo điều kiện WHERE, an toàn).
- **Service restart giữa job**: row `cronjob_logs` `started` không có row `completed` → admin biết job bị abort, có thể quan sát qua `/cronjob/logs`.
- **DB down**: schedule vẫn tick nhưng thao tác fail → log vào console.

## Liên kết
- Endpoint admin → [[Cronjob_API]]
- Flow gửi mail chi tiết → [[Email_Queue_Flow]]
- Bảng `cronjob_logs`, `email_queue`, `orders` → [[Schema_Design]]
- Kiến trúc tổng → [[System_Overview]]
