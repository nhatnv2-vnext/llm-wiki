---
title: "Hướng dẫn thư mục: 06_Code_Graph"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed
last_synced: "2026-06-02"
tags:
  - code-graph
  - readme
---

## 📂 Thư mục: 06_Code_Graph (Sơ đồ tri thức mã nguồn)

## 🎯 Tác dụng & Vai trò
Thư mục `06_Code_Graph/` là phân vùng lưu trữ các **Sơ đồ tri thức cấu trúc mã nguồn (Code-Graph Knowledge Maps)** được sinh tự động trực tiếp từ mã nguồn thực tế (AST). Nó hoạt động như một chỉ mục (index) giúp các AI agents nhanh chóng tìm kiếm, phân tích ngữ cảnh mã nguồn, tìm callers/callees và đánh giá mức độ ảnh hưởng của thay đổi code (Impact Analysis).

## 🗂️ Các thông tin chứa đựng
Thư mục này được tổ chức tự động hóa theo từng dự án đăng ký tại `01_Raw/codebase/projects.json`:
- **`06_Code_Graph/<project_name>/README.md`**: Tệp index chính của dự án, chứa liên kết tới tất cả các khu vực (Areas/Modules) của mã nguồn đó.
- **`06_Code_Graph/<project_name>/<area_name>/SKILL.md`**: Tệp tri thức chi tiết cho từng thư mục chức năng chính của dự án (ví dụ: `auth/SKILL.md`, `cronjob/SKILL.md`). Chứa mô tả tóm tắt linh hồn của area, các component chính, các symbol quan trọng (classes, functions, types).

> [!NOTE]
> Tất cả các tệp `.md` trong thư mục này đều được **sinh tự động 100%** thông qua công cụ CodeGraph CLI. Bạn **KHÔNG NÊN** chỉnh sửa thủ công các tệp tin tại đây vì chúng sẽ bị ghi đè khi chạy lại lệnh đồng bộ.

## 📐 Cấu trúc & Quy tắc Định dạng

### 1. Hướng dẫn sinh tự động (Re-index)
Để quét và xây dựng lại toàn bộ sơ đồ tri thức mã nguồn, hãy chạy lệnh sau:
```bash
npm --prefix System run code-graph
```
Để quét riêng một dự án cụ thể:
```bash
npm --prefix System run code-graph -- [tên_dự_án]
```
Wrapper script tại `System/agent_skills/run_codegraph.sh` sẽ tự động:
1. Đọc local path của project từ `projects.json`.
2. Khởi tạo và chạy CLI `codegraph index` để phân tích cú pháp mã nguồn (lưu dữ liệu SQLite vào local `.codegraph/codegraph.db` của chính project đó).
3. Đọc AST của từng area và sử dụng `codegraph context` để sinh ra file `SKILL.md` chi tiết.

### 2. Tương tác trực tiếp qua MCP (Claude Code / Cursor)
Không chỉ xem tài liệu tĩnh, bạn có thể biến CodeGraph thành một server MCP để truy vấn trực tiếp từ AI của bạn:
1. Chạy server MCP:
   ```bash
   npm --prefix System run code-graph:mcp
   ```
2. Giờ đây, AI Agent của bạn có thể sử dụng các tool MCP để tìm callers, tìm cấu trúc hàm mà không cần tải toàn bộ mã nguồn vào cửa sổ ngữ cảnh.

## 🔗 Liên kết Hữu ích
- [[Index]] — Quay lại Trang chủ chính.
- [[System/CLAUDE.md#41-codegraph-cai-va-dung|Hướng dẫn CodeGraph chi tiết trong CLAUDE.md]] — Tìm hiểu sâu hơn cơ chế vận hành của CodeGraph.
