---
title: Code Graph — laptop-shop
type: architecture
source:
  - "local: /Users/nhatnguyen/Documents/Github/code-demo/laptop-shop"
status: draft
last_synced: 2026-06-03
tags:
  - code-graph
  - codegraph
  - laptop-shop
---

# Code Graph: laptop-shop

Sinh bởi `codegraph index` + `codegraph context` (@colbymchenry/codegraph, MIT).
Index nội bộ: `/Users/nhatnguyen/Documents/Github/code-demo/laptop-shop/.codegraph/` (SQLite, local only).
Src root: `src`.

## Skill files (per area)
- [[auth/SKILL|auth]]
- [[common/SKILL|common]]
- [[config/SKILL|config]]
- [[core/SKILL|core]]
- [[cronjob/SKILL|cronjob]]
- [[database/SKILL|database]]
- [[mail/SKILL|mail]]
- [[products/SKILL|products]]
- [[roles/SKILL|roles]]
- [[users/SKILL|users]]

## Re-index
```bash
npm --prefix System run code-graph             # toàn bộ projects
npm --prefix System run code-graph -- laptop-shop  # chỉ project này
```

## Liên kết
- [[Index]] — Dashboard chính
