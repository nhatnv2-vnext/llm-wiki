---
name: scan-project
description: Tự động quét mã nguồn của dự án để sinh ra danh sách các màn hình (Screens.json) cho Frontend, danh sách tính năng (Features.json) cho Backend, và schema cơ sở dữ liệu (schemas.json). Trigger khi user gõ /scan-project <project_name>.
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
- **Backend** (NestJS, Go, Python, Express...): Sẽ sinh ra `Features.json` và cập nhật `schemas.json`. Mục tiêu là tìm các file Controller/Handler/Router và file Database Schema (Prisma, SQL, TypeORM, v.v.).
- **Monorepo** (Chứa cả FE và BE): Phân tích cấu trúc thư mục (vd: `apps/web`, `apps/api`) và chạy kết hợp cả quét Frontend, Backend, và Database.

### Bước 3 — Quét Source Code (Scan)

#### Kịch bản A: Dành cho Frontend

Phân nhánh theo `type` để tìm đúng file route:

- **`angular`**: Tìm `app.routes.ts`, `*-routing.module.ts`, `app.module.ts` (decorator `RouterModule`).
- **`nextjs`**:
  - App Router (Next.js 13+): Quét thư mục `app/` — mỗi `page.tsx`/`page.ts` là 1 route.
  - Pages Router: Quét thư mục `pages/` (bỏ qua `_app.tsx`, `_document.tsx`).
  - Ưu tiên App Router nếu cả hai đều tồn tại.
- **`vue` / `nuxt`**:
  - Nuxt 3: Quét `pages/` + `layouts/`. Mỗi file `.vue` trong `pages/` là 1 route.
  - Vue Router thuần: Tìm file `router/index.ts` hoặc `router.ts`.
- **`react`** (CRA/Vite SPA): Tìm file định nghĩa route của React Router (`Routes`, `Route`, `createBrowserRouter`).

Với mỗi route tìm được:
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
3. Thực hiện **Kịch bản B** và **Kịch bản D** đối với các thư mục Backend tìm được (Append kết quả vào `Features.json` và `schemas.json`).

#### Kịch bản D: Dành cho Database Schema (Backend / Monorepo)
1. Quét cây thư mục Backend để tìm các file đặc trưng của Database Schema:
   - **Prisma:** Tìm `schema.prisma`.
   - **Drizzle:** Tìm `schema.ts` (thường trong thư mục `db`, `drizzle`, hoặc `database`).
   - **SQL:** Tìm các file `*.sql` định nghĩa bảng (thường ở thư mục `migrations`, `db`, `schema`).
   - **TypeORM:** Tìm các file `*.entity.ts`.
   - **Mongoose:** Tìm các file `*.schema.ts` hoặc `*.model.ts`.
2. Với mỗi loại schema tìm được:
   - Suy luận `name` cho schema dựa vào tên project hoặc tên file (vd: `<project_name>-db`).
   - Ghi nhận `local_path` tuyệt đối.
   - Trích xuất `type` (`prisma`, `sql`, `typeorm`, `drizzle`, `mongoose`, `other`).
   - Suy luận `db_engine` (nếu có thể nhìn thấy `provider = "postgresql"` trong Prisma, hoặc mặc định ghi `"other"` cần xem lại sau).
   - Đặt `active: true` để chuẩn bị sinh ERD bằng skill `/spec-database`.

### Bước 4 — Cập nhật Catalog
1. Đọc file catalog hiện tại (`01_Raw/screens/Screens.json`, `01_Raw/features/Features.json`, hoặc `01_Raw/database/schemas.json`).
2. **Kiểm tra trùng lặp:** Nếu route path, controller path, hoặc `local_path` của database schema đã tồn tại, bỏ qua không ghi đè.
3. Append các entry mới vào mảng `screens` hoặc `features`.
4. Ghi lại file.

### Cuối cùng — Trả output cho user
```markdown
✅ Đã quét xong project **<project_name>**.

**Kết quả:**
- Đã tìm thấy và thêm mới **<N>** (màn hình/tính năng/schema) vào `<Screens.json / Features.json / schemas.json>`.
- (Tùy chọn) Vui lòng mở file JSON để cập nhật thủ công các đường link Figma, thông tin Database Engine, hoặc description nếu cần.

**Danh sách trích xuất:**
1. `<Tên 1>` (Path/URL/Local_Path) -> `ID / DB Type`
2. ...
```
