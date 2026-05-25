---
title: "Ingest plan — <YYYY-MM-DD> (<scope>)"
type: ingest-plan
status: pending_review
generated_at: <ISO timestamp>
generated_by: "ingest:plan run by <user>"
source_snapshot:
  - "01_Raw/codebase/nestjs-backend @ <commit-sha>"
  - "01_Raw/codebase/angular-frontend @ <commit-sha>"
approved_by: null
approved_at: null
applied_at: null
applied_by: null
tags:
  - ingest-plan
---

# Ingest Plan — <YYYY-MM-DD>

## Summary

- N page sẽ CREATE
- N page sẽ UPDATE
- N page SKIP

## Actions

### CREATE: `02_Wiki/<path>.md`

- **Reason:** ...
- **Source:** `01_Raw/codebase/<file>`
- **Preview:** ...

### UPDATE: `02_Wiki/<path>.md`

- **Reason:** ...
- **Diff:** ...
- **Merge strategy:** giữ business rule cũ, cập nhật contract.

### SKIP: `02_Wiki/<path>.md`

- No change detected.

## Reviewer checklist

- [ ] Mọi CREATE đều có source rõ ràng.
- [ ] Mọi UPDATE giữ được business rule cũ.
- [ ] Không có file SKIP nào thực ra cần update.

## Approve

Edit frontmatter:
```yaml
approved_by: <your-github-handle>
approved_at: <ISO timestamp>
```
Rồi chạy `npm run ingest:apply <path-to-this-file>`.

## Rejection reason

_(Chỉ điền khi reject — set `status: rejected` trong frontmatter)_
