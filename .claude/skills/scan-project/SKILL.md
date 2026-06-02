---
name: scan-project
description: Tự động quét mã nguồn của dự án để sinh ra danh sách các màn hình (Screens.json) cho Frontend hoặc danh sách tính năng (Features.json) cho Backend. Trigger khi user gõ /scan-project <project_name>.
---

# Skill: scan-project

Bạn được gọi để **tự động quét cấu trúc source code** của một project nhằm khám phá các tính năng/màn hình và lưu vào danh mục (Catalog) tương ứng.

## Đầu vào

User gõ `/scan-project <project_name>` (vd: `/scan-project angular-frontend` hoặc `/scan-project nestjs-backend`).

## Quy trình 4 bước

### Bước 1 — Lookup Project
1. Đọc `01_Raw/codebase/projects.json`.
2. Tìm entry có `name == <project_name>`. Nếu không có hoặc `active == false` → Báo lỗi:
   > ❌ Project `<project_name>` không tồn tại hoặc chưa được active trong projects.json.
3. Lấy `local_path` và `type` của project.

### Bước 2 — Phân tích loại dự án (Frontend vs Backend)
Xác định project thuộc nhóm nào dựa vào `type` (hoặc cấu trúc file nếu `type` không rõ ràng):
- **Frontend** (Angular, React, Vue, Nextjs...): Sẽ sinh ra `Screens.json`. Mục tiêu là tìm các file định nghĩa Route/Page.
- **Backend** (NestJS, Go, Python, Express...): Sẽ sinh ra `Features.json`. Mục tiêu là tìm các file Controller/Handler/Router.
- **Monorepo** (Chứa cả FE và BE): Phân tích cấu trúc thư mục (vd: `apps/web`, `apps/api`) và chạy kết hợp cả 2 kịch bản quét.

### Bước 3 — Quét Source Code (Scan)

#### Kịch bản A: Dành cho Frontend
1. Dùng lệnh glob/grep trong `local_path` để tìm các file config route (vd: `app.routes.ts`, `*-routing.module.ts`, hoặc folder `pages/`, `app/` cho Next.js).
2. Phân tích nội dung các file route này để lấy ra danh sách các Route path và Component tương ứng.
3. Với mỗi route tìm được:
   - Tự động sinh `id`: `SCR_XXX` (tăng dần so với số ID hiện có trong `01_Raw/screens/Screens.json`).
   - Tự động suy luận `name` tiếng Việt dựa vào path hoặc tên component (vd: `path: 'products'` -> `name: 'Danh sách sản phẩm'`).
   - Điền `url` và `component` path.
   - Set `figma_node_url: []`.
   - Set `status: "draft"`.

#### Kịch bản B: Dành cho Backend
1. Dùng lệnh glob/grep trong `local_path` để tìm các file Controller hoặc Handler (vd: `*.controller.ts`, `*_handler.go`, hoặc file khởi tạo route).
2. Phân tích nội dung để lấy ra các Domain (ví dụ: `UserController`, `ProductService`).
3. Với mỗi domain/controller tìm được:
   - Tự động sinh `id`: `FEA_XXX` (tăng dần so với số ID hiện có trong `01_Raw/features/Features.json`).
   - Tự suy luận `name` tiếng Việt (vd: `UserController` -> `name: 'Quản lý người dùng'`).
   - Điền `controller_or_entry` path.
   - Trích xuất cơ bản các `api_endpoints` (vd: `['GET /users', 'POST /users']`).
   - Set `status: "draft"`.

#### Kịch bản C: Dành cho Monorepo (Chứa cả Frontend & Backend)
1. Dùng lệnh list dir (`ls` hoặc đọc cây thư mục) để xác định thư mục con nào là Frontend (vd: `apps/frontend`, `packages/web`) và thư mục nào là Backend (vd: `apps/backend`, `packages/api`).
2. Thực hiện **Kịch bản A** đối với các thư mục Frontend tìm được (Append kết quả vào `Screens.json`).
3. Thực hiện **Kịch bản B** đối với các thư mục Backend tìm được (Append kết quả vào `Features.json`).

### Bước 4 — Cập nhật Catalog
1. Đọc file catalog hiện tại (`01_Raw/screens/Screens.json` hoặc `01_Raw/features/Features.json`).
2. **Kiểm tra trùng lặp:** Nếu route path hoặc controller path đã tồn tại, bỏ qua không ghi đè.
3. Append các entry mới vào mảng `screens` hoặc `features`.
4. Ghi lại file.

### Cuối cùng — Trả output cho user
```markdown
✅ Đã quét xong project **<project_name>**.

**Kết quả:**
- Đã tìm thấy và thêm mới **<N>** (màn hình/tính năng) vào `<Screens.json / Features.json>`.
- (Tùy chọn) Vui lòng mở file JSON để cập nhật thủ công các đường link Figma (nếu có).

**Danh sách trích xuất:**
1. `<Tên 1>` (Path/URL) -> `ID`
2. ...
```
