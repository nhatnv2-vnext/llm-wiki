---
title: Code Graph (GitNexus output)
type: architecture
source:
  - 01_Raw/codebase
status: draft
last_synced: 2026-05-12
tags: [code-graph, gitnexus, index]
---

# Code Graph

Thư mục này chứa **markdown output** sinh bởi GitNexus (https://github.com/abhigyanpatwari/GitNexus) khi quét codebase trong `01_Raw/codebase/`.

## Quy trình

1. Cài CLI một lần (cần sudo):
   ```bash
   sudo npm install -g gitnexus
   ```
2. Mount code thật vào `01_Raw/codebase/<project>/` (git submodule).
3. Chạy:
   ```bash
   cd System
   npm run code-graph                          # quét tất cả project (không embeddings — nhanh)
   npm run code-graph -- <project>             # chỉ quét 1 project
   GITNEXUS_EMBEDDINGS=1 npm run code-graph    # bật embeddings (semantic search, chậm hơn)
   ```

Wrapper script: `System/agent_skills/run_gitnexus.sh`.

## Cấu trúc output

```
05_Code_Graph/
└── <project_name>/
    ├── README.md          ← Index do wrapper tạo
    └── *.md               ← Skill files từ gitnexus analyze --skills
                              (mỗi file = 1 community/module trong codebase)
```

## Lưu ý

- Index nội bộ của GitNexus (LadybugDB) nằm ở `01_Raw/codebase/<project>/.gitnexus/`, **không** đồng bộ sang wiki vì là binary.
- Chỉ file `.md` được copy về wiki.
- Mỗi lần chạy lại sẽ overwrite `05_Code_Graph/<project>/` → không sửa thủ công file trong đây.
- Nếu code là **Node.js monorepo có path alias `@/`**, kết hợp thêm pipeline `ts-morph` (xem `System/agent_skills/ingest_codebase.js`) vì GitNexus có thể bỏ sót.
