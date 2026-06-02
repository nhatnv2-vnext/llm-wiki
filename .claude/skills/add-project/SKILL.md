---
name: add-project
description: Đăng ký một project mới vào Wiki bằng cách phân tích thư mục source code. Trigger khi user gõ /add-project <local_path>.
---

# Skill: add-project

Bạn được gọi để đóng vai trò như một **Project Onboarder**. Nhiệm vụ của bạn là nhận đường dẫn thư mục mã nguồn từ user, tự động phân tích công nghệ của dự án đó và ghi đè thông tin vào `01_Raw/codebase/projects.json`.

## Đầu vào
User gõ `/add-project <local_path>` (ví dụ: `/add-project /Users/tunght/code/my-app`).

## Quy trình 3 bước

### Bước 1 — Kiểm tra thư mục và Công nghệ
1. Sử dụng công cụ (như list_dir, read_file) để kiểm tra xem `<local_path>` có tồn tại không. Nếu không, báo lỗi và DỪNG.
2. Đọc các file cấu hình chính (nếu có) như `package.json`, `go.mod`, `pom.xml`, `requirements.txt` để xác định:
   - **Tên dự án** (từ trường `name`).
   - **Mô tả** (từ trường `description`).
   - **Công nghệ (type)**: Tìm dấu hiệu của `nestjs`, `angular`, `next`, `react`, `vue`, v.v. trong `dependencies` hoặc cấu trúc file.
3. **Phát hiện Monorepo**: Kiểm tra xem file `package.json` có trường `workspaces` không, hoặc thư mục có chứa folder dạng `apps/`, `packages/` chứa nhiều project con hay không.

### Bước 2 — Chuẩn bị Dữ liệu (Schema)
Tạo dữ liệu theo cấu trúc của `projects.json`:

**Kịch bản A: Dự án đơn lẻ (Single Repo)**
Tạo 1 đối tượng JSON:
- `name`: Tên project (vd: `my-super-app`).
- `local_path`: Đường dẫn tuyệt đối `<local_path>`.
- `type`: Loại project đã suy luận (vd: `angular`, `nestjs`, `go`...).
- `description`: Mô tả ngắn.
- `active`: `true`.

**Kịch bản B: Dự án gộp (Monorepo)**
Để tối ưu cho quá trình scan sau này, hãy **tách Monorepo thành nhiều logic projects**.
Với mỗi thư mục con (ví dụ: `apps/web-client` và `apps/api-server`), tạo 1 đối tượng JSON riêng biệt:
- `name`: Tên app con (vd: `my-app-web`, `my-app-api`).
- `local_path`: `<local_path>/apps/web-client` (đường dẫn vào tận bên trong).
- `type`: Loại project của app con (FE hay BE).
- `description`: Ghi chú thêm (vd: "Frontend của Monorepo my-app").
- `active`: `true`.

### Bước 3 — Ghi vào file `projects.json`
1. Mở file `01_Raw/codebase/projects.json`.
2. Kiểm tra xem các `local_path` bạn định thêm đã tồn tại trong mảng `projects` chưa. Nếu có rồi, bỏ qua không thêm trùng lặp.
3. Đẩy (append) các đối tượng JSON mới vào mảng `"projects": []`.
4. Ghi lại file.

### Cuối cùng — Trả output
```markdown
✅ Đã phân tích và thêm dự án vào `projects.json` thành công.

**Các dự án được thêm:**
- **<Tên Project>** (`<Type>`) - `<local_path>`
*(Nếu là monorepo, liệt kê tất cả các project con)*

Bạn có thể tiếp tục với lệnh:
`/scan-project <tên_project_vừa_thêm>` để bắt đầu lấy danh sách Màn hình/Tính năng.
```
