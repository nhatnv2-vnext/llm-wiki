---
title: "Hướng dẫn thư mục: 04_API_Specs"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed
last_synced: "2026-06-02"
tags:
  - api-specs
  - readme
---

## 📂 Thư mục: 04_API_Specs (Đặc tả APIs & Backend Features)

## 🎯 Tác dụng & Vai trò
Thư mục `04_API_Specs/` là nơi tài liệu hóa chi tiết toàn bộ các **Hợp đồng API (API Contracts)** và **Đặc tả tính năng Backend (Backend Features)** của hệ thống. Nó định nghĩa chính xác cách các ứng dụng khách (Frontend, App di động, Dịch vụ bên thứ ba) giao tiếp với máy chủ dịch vụ của hệ thống.

## 🗂️ Các thông tin chứa đựng
Thư mục này bao gồm:
1. **Các file đặc tả tính năng (`FEA_XXX_<slug>.md`)**: Được sinh bởi skill `/spec-feature`, mô tả chi tiết các endpoint API liên quan đến một tính năng nghiệp vụ cụ thể.
2. **Hợp đồng API chuẩn**: Danh sách các tài liệu về endpoints, phương thức (GET, POST, PUT, DELETE), cấu trúc dữ liệu yêu cầu/phản hồi (DTO Payload Schemas), mã lỗi (Error Codes) và các trường hợp biên (Edge Cases).

## 📐 Cấu trúc & Quy tắc Định dạng
Để đảm bảo chất lượng tài liệu hóa tự động từ mã nguồn, mọi file trong `04_API_Specs/` bắt buộc phải tuân theo cấu trúc **4 phần nghiêm ngặt (Strict 4-Section Format)**:

### 1. Cấu trúc 4 phần bắt buộc
1. **Contract (Hợp đồng)**: URL Endpoint, HTTP Method, cấu trúc Payload Request & Response mẫu kèm kiểu dữ liệu.
2. **Source of Truth (Nguồn gốc mã nguồn)**: Đường dẫn tương đối tới file code Controller/Route tại local path kèm theo số dòng cụ thể.
3. **Business Rule (Quy tắc nghiệp vụ)**: Các luồng điều kiện kiểm tra (validation), logic xử lý chính kèm link tới tài liệu nghiệp vụ `[[01_Business/README]]`.
4. **Edge Cases & Error Codes (Trường hợp biên & Mã lỗi)**: Các trường hợp thất bại (ví dụ: quá tải, không tìm thấy thực thể, hết hạn token) và mã lỗi HTTP tương ứng (400, 401, 403, 404, 500).

### 2. Hướng dẫn sinh tự động (AI Skill)
Nhà phát triển có thể gọi lệnh sau để tự động phân tích code backend và sinh tài liệu:
```bash
/spec-feature FEA_XXX
```
AI sẽ tự động đọc cấu trúc tệp đăng ký tại `01_Raw/features/Features.json`, sử dụng công cụ phân tích AST (`ts-morph`) hoặc `CodeGraph` để quét mã nguồn tại local path của dự án và xuất ra tệp Markdown chuẩn hóa tại thư mục này.

### 3. Định dạng Frontmatter Mẫu
```yaml
---
title: "Tính năng: [Tên tính năng]"
type: api
source:
  - "01_Raw/features/Features.json#FEA_XXX"
  - "local: <local_path_tới_controller_hoặc_service>"
status: draft | reviewed | stale
last_synced: YYYY-MM-DD
tags:
  - api-spec
  - fea_xxx
  - backend
---
```

## 🔗 Liên kết Hữu ích
- [[Index]] — Quay lại Trang chủ chính.
- [[02_Design/README|Đặc tả Giao diện]] — Xem các giao diện tiêu dùng các API này.
- [[05_Database/README|Cơ sở dữ liệu]] — Các bảng cơ sở dữ liệu mà các API này đọc/ghi.
