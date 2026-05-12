---
title: Conflict Reports
type: log
source:
  - 01_Raw/codebase
  - 01_Raw/drive_docs
status: draft
last_synced: 2026-05-11
tags: [log, conflict, audit]
---

# 🐞 Conflict Reports

> AI ghi lại mọi điểm **lệch giữa code thực tế và PRD/spec**.
> Không tự sửa code — chỉ báo cáo để con người ra quyết định.

## Định dạng entry

```markdown
### YYYY-MM-DD — <tiêu đề ngắn>
- **Code:** `01_Raw/codebase/<path>:<line>` — mô tả hành vi thật.
- **Spec:** `01_Raw/drive_docs/<file>` — mô tả hành vi yêu cầu.
- **Mức độ:** 🔴 blocker | 🟡 warning | 🔵 info
- **Đề xuất:** <hành động kế tiếp>
- **Liên kết:** [[<file wiki liên quan>]]
```

---

## Lịch sử

_Chưa có conflict nào được ghi nhận. Chạy `npm run ingest` để quét lần đầu._
