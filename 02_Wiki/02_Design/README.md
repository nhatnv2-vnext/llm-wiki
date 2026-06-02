---
title: "Hướng dẫn thư mục: 02_Design"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed
last_synced: "2026-06-02"
tags:
  - design
  - readme
---

## 📂 Thư mục: 02_Design (Thiết kế giao diện & Screen Specs)

## 🎯 Tác dụng & Vai trò
Thư mục `02_Design/` là nơi lưu trữ toàn bộ các tài liệu đặc tả chức năng giao diện người dùng (Functional Screen Specs). Mỗi tệp tài liệu trong thư mục này mô tả một màn hình cụ thể (`SCR_XXX`), ánh xạ trực tiếp từ bản thiết kế Figma của Designer sang mã nguồn Frontend của Developer.

## 🗂️ Các thông tin chứa đựng
Thư mục này bao gồm:
1. **Các file đặc tả màn hình (`SCR_XXX_<slug>.md`)**: Được sinh tự động hoặc biên soạn thủ công, chứa liên kết Figma, cấu trúc component, luồng thao tác người dùng (User Flows) và cơ chế quản lý trạng thái giao diện (UI State & NgRx Store).
2. **Quy ước Design Tokens**: Hướng dẫn ánh xạ các biến màu sắc, khoảng cách (spacing), kiểu chữ (typography) từ Figma sang mã nguồn CSS/Tailwind.

## 📐 Cấu trúc & Quy tắc Định dạng
Mỗi file đặc tả màn hình (`SCR_XXX`) bắt buộc phải được tạo lập thông qua việc kế thừa mẫu thiết kế chuẩn tại `02_Wiki/_Templates/screen_spec_template.md`.

### 1. Quy trình sinh tài liệu tự động (AI Skill)
Khi có màn hình mới được đăng ký tại `01_Raw/screens/Screens.json`, nhà phát triển có thể ra lệnh cho AI sinh tự động file spec:
```bash
/spec-screen SCR_XXX
```
AI sẽ tự động kích hoạt 2 sub-agents song song:
- **`figma-reader`**: Đọc cấu trúc node Figma để phân tích bố cục và tokens.
- **`code-reader`**: Đọc mã nguồn Angular/React để trích xuất các Signal, Component, Actions, Selector và API đang được gọi thực tế.

### 2. Định dạng Frontmatter Mẫu
```yaml
---
title: "Tên màn hình"
type: screen-spec
source:
  - "01_Raw/screens/Screens.json#SCR_XXX"
  - "local: <local_path_tới_component>"
  - "figma: <figma_node_url>"
status: draft | reviewed | stale
last_synced: YYYY-MM-DD
tags:
  - screen-spec
  - scr_xxx
---
```

## 🔗 Liên kết Hữu ích
- [[Index]] — Quay lại Trang chủ chính.
- [[02_Wiki/_Templates/screen_spec_template|Mẫu Screen Spec Template]] — Template chuẩn để tạo spec màn hình mới.
- [[04_API_Specs/README|Đặc tả API & Logic]] — Tìm hiểu chi tiết các API mà màn hình này gọi tới.
