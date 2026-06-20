# Lệnh & Quy ước

## Lệnh nhanh (NPM Scripts)

Script tự động hóa đặt trong `apps/System` — chạy `cd apps/System` trước:

```bash
# Onboarding
pnpm onboard            # (từ gốc) doctor + tạo .env.local + thêm project + CodeGraph

# Đồng bộ dữ liệu gốc
npm run sync-drive      # Pull docs từ Google Drive → 01_Raw/drive_docs (tự archive-prd)
npm run archive-prd     # Versioning PRD: đẩy bản cũ vào archive/, ghi con trỏ .current
npm run parse-docs      # Bóc tách PDF (PRD*.pdf) → Markdown; TỰ bật OCR nếu PDF có ảnh

# Phân tích & sinh Wiki
npm run ingest          # Build wiki từ source code (ts-morph)
npm run code-graph      # Sinh CodeGraph markdown vào 02_Wiki/06_Code_Graph
npm run generate-graph  # Vẽ lại sơ đồ Mermaid từ AST

# Validation & RAG
npm run validate        # Kiểm tra toàn vẹn vault (lint-specs + audit-links)
npm run index-vault     # Build Vault_Index.json cho RAG
npm run stats           # Cập nhật bảng Vault Stats
```

Lệnh của web app (`apps/web`) — xem [deployment.md](deployment.md):
`build-index`, `view-index`, `hash-password`.

## Quy ước commit

- Mọi thay đổi trong `02_Wiki/**/*.md` đi qua hook `lint-specs` + `audit-links`
  tự động trước khi commit.
- Khi tạo PR, GitHub Actions chạy lại `lint-specs`, `audit-links`, `index-vault`.
- File auto-gen **KHÔNG commit** (đã gitignore): `Vault_Index.json`,
  `node_modules/`, `.codegraph/`, `dist/`, `.lancedb`.
- Thư mục `02_Wiki/_Archive/` được gitignore (Git đã quản version) — chỉ là backup
  local cho AI.
- File auto-gen **CÓ commit** (chia sẻ cho team): `02_Wiki/06_Code_Graph/<project>/*.md`.
