---
title: Code Graph — nestjs-backend
type: architecture
source:
  - 01_Raw/codebase/nestjs-backend
status: draft
last_synced: 2026-05-24
tags:
  - code-graph
  - codegraph
  - nestjs-backend
---

# Code Graph: nestjs-backend

Sinh bởi `codegraph index` + `codegraph context` (@colbymchenry/codegraph, MIT).
Index nội bộ: `01_Raw/codebase/nestjs-backend/.codegraph/` (SQLite, gitignored).
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
npm --prefix System run code-graph -- nestjs-backend  # chỉ project này (qua run_codegraph.sh arg)
```

## Liên kết
- [[Index]] — Dashboard chính
