---
title: Ask Logs
type: log
source:
  - .claude/skills/ask-vault/SKILL.md
status: draft
last_synced: 2026-05-25
tags:
  - ask-log
  - telemetry
  - audit
---

# 📝 Ask Logs

Telemetry tự động từ skill `/ask-vault` (xem `.claude/skills/ask-vault/SKILL.md` Bước 6).

## Format

1 file/tháng, JSONL append-only:
```
Ask_Logs/2026-05.jsonl
Ask_Logs/2026-06.jsonl
...
```

Mỗi dòng:
```json
{"ts":"2026-05-25T14:30:00Z","user":"nhatnv2@vnext.vn","question":"Auth flow là gì?","answer_summary":"POST /auth/login → JWT. Frontend interceptor refresh khi 401."}
```

## Quy tắc

- **Append-only.** KHÔNG edit file cũ. KHÔNG xoá entry.
- **Privacy:** `user` = git email; `question` plain text. KHÔNG gõ secret/PII/credentials vào `/ask-vault`.
- **Auto-commit:** File này commit vào vault, team-wide visibility. Audit qua git blame.
- **Pattern reuse:** Skill khác (vd `/spec-screen`) có thể port telemetry tương tự, log riêng folder `Spec_Screen_Logs/`.

## Aggregate report

```bash
npm --prefix System run report:asks            # tháng hiện tại
npm --prefix System run report:asks 2026-04    # tháng cụ thể
```

Output: `Ask_Reports/<YYYY-MM>.md` với:
- Tổng số câu hỏi + số user.
- Phân bổ theo user.
- **Gap section** — câu hỏi vault trả "chưa có" → ưu tiên viết wiki.
- Timeline tất cả entries.

## Liên kết

- [[../Ask_Reports/README|Ask Reports]]
- [[../Conflict_Reports|Conflict Reports]] — log xung đột code ↔ spec (khác mục đích)
- [[Index]]
