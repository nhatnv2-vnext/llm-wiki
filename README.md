# 📚 My Project Vault (LLM Wiki)

Knowledge vault 3 lớp, vận hành bằng AI agents (Claude Code + CodeGraph) và hiển thị trên **Obsidian**.
Dự án mẫu được áp dụng: **laptop-shop** (NestJS + Prisma + MySQL + Bull/Redis · Angular 21 SSR + NgRx + Tailwind).

## 🚀 Bắt đầu nhanh

1. Mở thư mục này bằng **Obsidian** → chọn "Open folder as vault".
2. Mở file [`02_Wiki/00_Overview/Index.md`](02_Wiki/00_Overview/Index.md) (Map of Content) để có cái nhìn tổng quan.
3. Đọc [`System/CLAUDE.md`](System/CLAUDE.md) để hiểu triết lý vận hành và quy tắc dành cho AI.

## 🏗 Cấu trúc 3 lớp (3-Layer Architecture)

Vault được thiết kế theo nguyên tắc phân tách ranh giới rõ ràng:

```text
My_Project_Vault/
├── 01_Raw/                          ← Layer 1: Nguồn thô (READ-ONLY)
│   ├── codebase/projects.json       ←   Danh sách project + local path
│   ├── screens/Screens.json         ←   Catalog màn hình + Figma URL
│   ├── database/schemas.json        ←   Link đến file schema DB
│   └── drive_docs/                  ←   Tài liệu từ Google Drive
├── 02_Wiki/                         ← Layer 2: Tri thức biên dịch (AI ghi vào đây)
└── System/                          ← Layer 3: Bộ não (Scripts, Skills, CLAUDE.md)
```

> **Kiến trúc JSON-based links:** Vault không chứa source code trực tiếp. Thay vào đó, các file JSON (`projects.json`, `schemas.json`) chứa tên + đường dẫn local (`local_path`) trỏ tới thư mục/file trên máy tính. Scripts và AI agents sẽ đọc đường dẫn này để trích xuất kiến thức, giúp vault gọn nhẹ và linh hoạt.

## 🧠 Triết lý vận hành

Lấy cảm hứng từ phương pháp **context engineering + spec-driven development** ([Karpathy LLM Council](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)):

- **Code là sự thật (Single Source of Truth):** AI sẽ đọc code và chuyển hóa thành bản dịch có ngữ cảnh trong Wiki, không phải là nơi lưu trữ bản sao của code.
- **Bất khả xâm phạm:** AI chỉ được phép đọc ở Layer 1 (`01_Raw`) và ghi vào Layer 2 (`02_Wiki`).
- **Ghi nhận thay vì tự ý sửa:** Mọi xung đột (conflict) giữa code thực tế và tài liệu đặc tả (PRD) đều được AI phát hiện và log lại tại `02_Wiki/07_Tasks_&_Logs/Conflict_Reports.md`.
- **Versioning (Archiving):** Khi AI cập nhật một file trong Wiki, nó BẮT BUỘC phải copy/di chuyển phiên bản cũ vào `02_Wiki/_Archive/` để lưu lại lịch sử trước khi ghi đè nội dung mới.


## 🛠 Lệnh nhanh (NPM Scripts)

Các script tự động hóa được đặt trong thư mục `System`:

```bash
cd System

# Đồng bộ dữ liệu gốc
npm run sync-drive      # Kéo (pull) docs từ Google Drive → 01_Raw/drive_docs

# Phân tích và sinh Wiki
npm run ingest          # Build lại wiki từ source code (sử dụng ts-morph)
npm run code-graph      # Sinh CodeGraph markdown vào 02_Wiki/06_Code_Graph
npm run generate-graph  # Vẽ lại sơ đồ Mermaid từ AST

# Validation và RAG (AI)
npm run validate        # Kiểm tra tính toàn vẹn của vault (lint-specs + audit-links)
npm run index-vault     # Build Vault_Index.json dùng cho RAG
npm run stats           # Cập nhật thông số thống kê vào bảng Vault Stats
```

## 🚀 Cách cấu trúc Wiki cho dự án mới (Luồng AI tự động)

Vì Vault này được thiết kế như một **bộ khung (template)**, bạn có thể áp dụng cho bất kỳ dự án phần mềm nào (cả Frontend và Backend). Nhờ vào bộ AI Skills tích hợp, quy trình tạo Wiki giờ đây được tự động hóa qua 5 bước:

### Bước 1: Đăng ký dự án mới (Add Project)

Bạn không cần mở file cấu hình bằng tay. Chỉ cần gọi lệnh và cung cấp đường dẫn thư mục code trên máy của bạn:
```bash
/add-project <đường_dẫn_tuyệt_đối_tới_thư_mục_code>
```
AI sẽ tự động phân tích đó là dự án Frontend, Backend hay Monorepo và ghi danh nó vào file `01_Raw/codebase/projects.json`.

### Bước 2: Quét Source Code tự động (Scan)

Không cần phải nhập tay danh sách màn hình hay API nữa. Hãy ra lệnh cho AI quét dự án vừa thêm:
```bash
/scan-project <tên_project>
```
- **Nếu là Frontend:** AI sẽ tự động đọc code, trích xuất cấu trúc Route/Pages và lưu vào file `01_Raw/screens/Screens.json`.
- **Nếu là Backend:** AI sẽ tìm các Controllers, Handlers, Services và lưu vào `01_Raw/features/Features.json`.

### Bước 3: Tự động lên Dàn ý (Plan)

Sau khi có dữ liệu thô từ Bước 2, bạn gõ lệnh:
```bash
/plan-wiki
```
AI sẽ gom nhóm các Màn hình, Tính năng backend và Database Schema để sinh ra file `02_Wiki/Index.md`. Đây chính là "Bản đồ" (Map of Content) của toàn bộ dự án.

### Bước 4: Sinh tài liệu chi tiết (Spec)

Dựa vào file `Index.md`, bạn có thể ra lệnh cho AI viết tài liệu chi tiết cho từng phần:
- Đối với giao diện Frontend: Gõ `/spec-screen <ID>` (ví dụ: `/spec-screen SCR_001`).
- Đối với API/Logic Backend: Gõ `/spec-feature <ID>` (ví dụ: `/spec-feature FEA_002`).

### Bước 5: Liên kết Tri thức (Cross-link)

Cuối cùng, sau khi đã tạo xong nhiều tài liệu, hãy gõ:
```bash
/cross-link
```
AI sẽ tự động rà soát toàn bộ các file `.md` và tạo ra các Wikilink `[[Liên kết chéo]]` giữa các tính năng, API và Database, biến Wiki thành một mạng lưới tri thức vững chắc.

## 👥 Hướng dẫn Onboarding nhanh cho Team

1. Clone vault này về máy.
2. Làm theo các bước ở phần **"Cách cấu trúc Wiki cho dự án mới"**.
3. Mở vault bằng ứng dụng Obsidian (File → Open vault).
4. Để team cùng làm việc, hãy chạy `npm run index-vault` (trong folder `System/`) mỗi khi có cập nhật lớn để tối ưu RAG.

### Quy ước commit (Commit Conventions)

- Mọi thay đổi trong `02_Wiki/**/*.md` sẽ đi qua hook `lint-specs` và `audit-links` tự động trước khi commit.
- Phân biệt các file không cần đẩy lên Git (đã cấu hình sẵn trong `.gitignore`): `codegraph.sqlite`, `Vault_Index.json`, `node_modules/`.
- Chỉ commit các file dữ liệu tĩnh (.md) để chia sẻ kiến thức với team.
- Khi tạo PR, Github Actions sẽ tự động chạy lại các bài kiểm tra (`lint-specs`, `audit-links`, `index-vault`).
- File auto-gen **không đưa vào Git (`.gitignore`)**: `Vault_Index.json`, `node_modules/`, `.codegraph/`, `dist/`,...
- Thư mục `02_Wiki/_Archive/` được `.gitignore` bỏ qua vì Git đã quản lý version, đây chỉ là bản backup local cho AI.
- File auto-gen **được commit vào Git** (chia sẻ cho team): `02_Wiki/06_Code_Graph/<project>/*.md`.
