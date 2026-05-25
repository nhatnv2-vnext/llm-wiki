---
title: Ask Reports
type: log
source:
  - 02_Wiki/04_Tasks_&_Logs/Ask_Logs
status: draft
last_synced: 2026-05-25
tags:
  - ask-report
  - telemetry
---

# 📊 Ask Reports

Aggregate report sinh từ `Ask_Logs/<YYYY-MM>.jsonl`.

## Sinh report

```bash
npm --prefix System run report:asks            # tháng hiện tại
npm --prefix System run report:asks 2026-04    # tháng cụ thể
```

Script: `System/agent_skills/analyze_asks.js`.

## Format report

Mỗi file `<YYYY-MM>.md` chứa:

1. **Header counts** — tổng câu hỏi, số user, số gap.
2. **Phân bổ theo user** — bảng histogram ai hỏi nhiều.
3. **⚠️ Gap** — câu hỏi vault trả "chưa có"/"không tìm thấy". Ưu tiên viết wiki.
4. **Timeline** — toàn bộ entries, mới nhất trước.

## Report gần nhất

- [[2026-05]] — May 2026 (PoC)

## Workflow cho lead

- Cuối mỗi tuần/tháng, chạy `npm run report:asks`.
- Mở `Ask_Reports/<YYYY-MM>.md` trong Obsidian.
- Đọc section **Gap** → tạo issue/PR viết wiki cho topic thiếu.
- Đọc **user histogram** → biết ai dùng vault nhiều (= "power user", người có thể giúp review wiki).

## Liên kết

- [[../Ask_Logs/README|Ask Logs]] — nguồn dữ liệu
- [[Index]]
