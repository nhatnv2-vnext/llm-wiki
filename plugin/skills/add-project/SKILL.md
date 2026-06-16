---
name: add-project
description: Đăng ký một project mới vào vault bằng cách phân tích thư mục source code. Trigger khi user gõ /llm-wiki:add-project <local_path>.
---

# Skill: add-project

Bạn đóng vai **Project Onboarder**. Nhận đường dẫn thư mục mã nguồn từ user, tự động phân tích công nghệ và ghi vào `01_Raw/codebase/projects.json` **trong vault của dự án hiện tại (cwd)**.

> ⚠️ Yêu cầu vault đã được khởi tạo. Nếu chưa có `01_Raw/codebase/projects.json`,
> hãy hướng dẫn user chạy `/llm-wiki:init` trước rồi DỪNG.

## Đầu vào
User gõ `/llm-wiki:add-project <local_path>` (vd: `/llm-wiki:add-project /Users/me/code/my-app`).

## Quy trình 3 bước

### Bước 1 — Kiểm tra thư mục & Công nghệ
1. Kiểm tra `<local_path>` có tồn tại không. Không → báo lỗi và DỪNG.
2. Đọc file cấu hình chính (`package.json`, `go.mod`, `pom.xml`, `requirements.txt`) để xác định:
   - **Tên dự án** (trường `name`), **Mô tả** (`description`).
   - **Công nghệ (type)**: dấu hiệu `nestjs`, `angular`, `next`, `react`, `vue`... trong dependencies/cấu trúc.
3. **Phát hiện Monorepo**: `package.json` có `workspaces`, hoặc có `apps/`, `packages/` chứa nhiều project con.

### Bước 2 — Chuẩn bị dữ liệu
**Dự án đơn:** 1 object `{ name, local_path (tuyệt đối), type, description, active: true }`.

**Monorepo:** tách mỗi app con thành 1 object riêng, `local_path` trỏ vào tận thư mục con.

### Bước 3 — Ghi vào `projects.json`
1. Đọc `01_Raw/codebase/projects.json` (tương đối theo cwd). Chưa có → hướng dẫn chạy `/llm-wiki:init`.
2. Bỏ qua `local_path` đã tồn tại (không thêm trùng).
3. Append object mới vào mảng `projects` rồi ghi lại.

### Cuối cùng — Output
```markdown
✅ Đã thêm dự án vào `projects.json`.

**Đã thêm:**
- **<Tên>** (`<type>`) — `<local_path>`

Bước tiếp: `/llm-wiki:spec-feature <FEA_ID>` (sau khi có Features.json).
```
