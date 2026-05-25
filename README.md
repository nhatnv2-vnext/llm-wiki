# 📚 My Project Vault

Knowledge vault 3 lớp cho dự án **laptop-shop** (NestJS + Prisma + MySQL + Bull/Redis · Angular 21 SSR + NgRx + Tailwind), vận hành bằng AI agents (Claude Code + CodeGraph) và hiển thị trên Obsidian.

## Bắt đầu

1. Mở thư mục này bằng **Obsidian** → chọn "Open folder as vault".
2. Mở [`02_Wiki/00_Dashboard/Index.md`](02_Wiki/00_Dashboard/Index.md) để xem Map of Content.
3. Đọc [`System/CLAUDE.md`](System/CLAUDE.md) để hiểu quy tắc AI.

## Cấu trúc 3 lớp

```
My_Project_Vault/
├── System/      ← Layer 3: Bộ não (CLAUDE.md, skills, package.json)
├── 01_Raw/      ← Layer 1: Nguồn thô (READ-ONLY) — code + docs
└── 02_Wiki/     ← Layer 2: Tri thức biên dịch (AI ghi vào đây)
```

## Lệnh nhanh

```bash
cd System
npm run sync-drive      # pull docs từ Google Drive → 01_Raw/drive_docs
npm run ingest:plan     # b1: sinh plan vào 04_Tasks_&_Logs/Ingest_Plans/
npm run ingest:apply <plan-file>  # b2: apply plan đã approve (xem CLAUDE.md §2.2)
npm run code-graph      # CodeGraph → 02_Wiki/05_Code_Graph/<project>/*.md
npm run validate        # chain lint-specs + audit-links (dùng trong CI/hook)
npm run index-vault     # sinh 02_Wiki/00_Dashboard/Vault_Index.json (RAG)
npm run stats           # cập nhật bảng "Vault Stats" trong Index.md
npm run generate-graph  # vẽ lại Mermaid từ AST
```

## Triết lý

Lấy cảm hứng từ **context engineering + spec-driven development** ([Karpathy LLM Council](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)):
- Code là sự thật → wiki là **bản dịch có ngữ cảnh**, không phải bản sao.
- AI chỉ được ghi vào Layer 2. Layer 1 bất khả xâm phạm.
- Mọi xung đột giữa code và spec đều được log, không bao giờ tự sửa.

## Onboarding (team)

```bash
# 1. Clone vault
git clone <repo> My_Project_Vault && cd My_Project_Vault

# 2. Cài CLI CodeGraph một lần
npm install -g @colbymchenry/codegraph

# 3. Cài deps & hook
cd System
npm install
cd ..

# 4. Bật pre-commit hook (Husky không tự bật khi clone)
git config core.hooksPath .husky

# 5. Mở vault bằng Obsidian
#    File → Open vault → chọn thư mục My_Project_Vault

# 6. Build index + stats (lần đầu)
cd System
npm run index-vault
npm run stats
```

### Quy ước commit
- Sửa file `02_Wiki/**/*.md` → hook `lint-specs` + `audit-links` chạy tự động trước commit.
- PR → GH Actions chạy lại 3 check (`lint-specs`, `audit-links`, `index-vault`).
- File auto-gen **trong `.gitignore`**: `Vault_Index.json`, `node_modules/`, `.codegraph/`, `dist/` …
- File auto-gen **commit vào git** (cho team): `02_Wiki/05_Code_Graph/<project>/*.md` — sinh bởi `npm run code-graph`.
