---
title: Cronjob Monitoring API
type: api
source:
  - 01_Raw/codebase/nestjs-backend/src/cronjob
status: draft
last_synced: 2026-05-12
tags: [api, cronjob, admin, monitoring]
---

# Cronjob Monitoring API

Endpoint admin tra cứu trạng thái cronjob + email queue. Yêu cầu permission `system.read`.

## 1. Contract

| Method | Path | Permission | Mô tả |
|--------|------|------------|-------|
| `GET` | `/cronjob/status` | `system.read` | Trạng thái tổng (jobs đang chạy / hẹn giờ tiếp theo) |
| `GET` | `/cronjob/email-queue/status` | `system.read` | Số job pending/processing/sent/failed trong `email_queue` |
| `GET` | `/cronjob/logs` | `system.read` | Lịch sử log từ bảng `cronjob_logs` |

### Response shape

```ts
type Envelope<T> = { message: string; data: T };

type CronjobStatus = {
  jobs: {
    name: string;
    isRunning: boolean;
    nextRunAt?: string;     // ISO 8601
    lastRunAt?: string;
  }[];
};

type EmailQueueStatus = {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
};

type CronjobLogEntry = {
  id: number;
  jobName: string;
  status: 'started' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number;       // ms
  error?: string;
  details?: any;
};
```

## 2. Source of truth
- Controller: `01_Raw/codebase/nestjs-backend/src/cronjob/controllers/cronjob.controller.ts:8-39`
- Service: `01_Raw/codebase/nestjs-backend/src/cronjob/services/`
- Schema bảng: `01_Raw/codebase/nestjs-backend/prisma/schema.prisma` model `CronjobLog`, `EmailQueue`

## 3. Business rule
- Wrap response trong envelope `{ message, data }` — khác convention các controller khác (trả thẳng object).
- Permission key dùng object lồng nhau `PERMISSIONS.SYSTEM.READ` (xem `permissions.constant.ts`).
- Log lưu MySQL bảng `cronjob_logs` (không phải Redis) → còn lại khi Redis restart.

## 4. Edge cases & error codes
| Code | Khi nào | Hành vi |
|------|---------|---------|
| `401` | Thiếu JWT | redirect login |
| `403` | Không có `system.read` | — |
| `500` | DB down | response failure |

## Liên kết
- Flow xử lý mail queue → [[Email_Queue_Flow]]
- Flow cronjob chi tiết → [[Cronjob_Flow]]
- Schema `cronjob_logs`, `email_queue` → [[Schema_Design]]
