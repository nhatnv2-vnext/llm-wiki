---
title: Code Graph — angular-frontend
type: architecture
source:
  - 01_Raw/codebase/angular-frontend
status: draft
last_synced: 2026-05-24
tags:
  - code-graph
  - codegraph
  - angular-frontend
---

# Code Graph: angular-frontend

Sinh bởi `codegraph index` + `codegraph context` (@colbymchenry/codegraph, MIT).
Index nội bộ: `01_Raw/codebase/angular-frontend/.codegraph/` (SQLite, gitignored).
Src root: `src/app`.

## Skill files (per area)
- [[admin/SKILL|admin]]
- [[client/SKILL|client]]
- [[error/SKILL|error]]
- [[shared/SKILL|shared]]

## Re-index
```bash
npm --prefix System run code-graph             # toàn bộ projects
npm --prefix System run code-graph -- angular-frontend  # chỉ project này (qua run_codegraph.sh arg)
```

## Liên kết
- [[Index]] — Dashboard chính
