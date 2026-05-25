---
title: Ingest Plans
type: log
source:
  - 01_Raw/codebase
status: draft
last_synced: 2026-05-25
tags:
  - ingest-plan
  - audit
---

# 🧾 Ingest Plans

Mỗi lần chạy `npm run ingest:plan` sinh 1 file ở đây.

## Workflow

```
pending_review  →  (human edits approved_by/approved_at)  →  approved
                                                              ↓
                                                          ingest:apply
                                                              ↓
                                                           applied
```

Hoặc reviewer set `status: rejected` + section `## Rejection reason` → script `apply` refuse.

## Convention

- Tên file: `<YYYY-MM-DD>_<slug>.md` (vd `2026-05-25_nestjs-backend.md`).
- File đã `applied` giữ vĩnh viễn để audit — KHÔNG xoá.
- Re-apply không được phép. Cần re-generate plan mới.

## Quy tắc cứng

1. AI **không** edit folder này (chỉ user + script `ingest_codebase.js`).
2. Wiki page chỉ được tạo/sửa qua `ingest:apply <plan>` (gate by approved_by).
3. Frontmatter `approved_by` = github handle người duyệt → audit qua git blame.

## Plan gần nhất

- [[2026-05-25_all-projects]] — Plan đầu tiên (PoC pipeline)

## Liên kết

- [[Index]] — Dashboard chính
- [[Conflict_Reports]] — Log xung đột code ↔ spec (khác mục đích)
