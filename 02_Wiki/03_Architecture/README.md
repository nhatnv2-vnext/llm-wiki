---
title: "Hướng dẫn thư mục: 03_Architecture"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed
last_synced: "2026-06-02"
tags:
  - architecture
  - readme
---

## 📂 Thư mục: 03_Architecture (Kiến trúc Hệ thống)

## 🎯 Tác dụng & Vai trò
Thư mục `03_Architecture/` lưu trữ các tài liệu đặc tả kiến trúc kỹ thuật (Technical & Software Architecture) ở mức độ từ tổng quan hệ thống đến chi tiết từng thành phần. Đây là nơi chứa đựng các quyết định thiết kế quan trọng, sơ đồ tích hợp dịch vụ và luồng xử lý phi đồng bộ của hệ thống.

## 🗂️ Các thông tin chứa đựng
Thư mục này bao gồm:
1. **Kiến trúc Tổng quan (System Overview)**: Sơ đồ toàn cảnh hệ thống (C4 Model - Level 1 & 2), mô tả cách thức giao diện Frontend, dịch vụ Backend, Cơ sở dữ liệu và các bên thứ ba (Third-party APIs) tương tác với nhau.
2. **Luồng tích hợp & Đọc ghi dữ liệu (Data & Integration Flows)**:
   - **Cronjob Flow**: Các tác vụ chạy ngầm định kỳ (dọn dẹp log, đồng bộ dữ liệu).
   - **Queue Flow (Bull/Redis)**: Luồng xử lý hàng đợi sự kiện phi đồng bộ (gửi Email, xử lý thông báo).
3. **Thiết kế hạ tầng & Deployment**: Cấu hình cơ sở hạ tầng, sơ đồ mạng, cơ chế cân bằng tải và bảo mật.

## 📐 Cấu trúc & Quy tắc Định dạng
Mọi sơ đồ kỹ thuật trong thư mục này bắt buộc phải sử dụng **Mermaid** để đảm bảo khả năng quản lý phiên bản (version control) bằng git và dễ dàng chỉnh sửa bởi nhà phát triển hoặc AI.

### 1. Quy tắc Vẽ Sơ đồ (Mermaid Guidelines)
- Đặt code block ```mermaid``` ngay sau heading mô tả sơ đồ.
- Sử dụng các định dạng sơ đồ phù hợp:
  - **Sơ đồ kiến trúc tổng**: Sử dụng `graph TD` hoặc `graph LR` để vẽ mô hình C4.
  - **Sơ đồ luồng giao dịch**: Sử dụng `sequenceDiagram` để mô tả tương tác qua lại giữa User, Frontend, Backend và DB.
- Sơ đồ mẫu:
  ```mermaid
  graph TD
      Client[Angular Client] -->|API HTTPS| Gateway[NestJS Gateway]
      Gateway -->|Read/Write| DB[(MySQL Database)]
      Gateway -->|Enqueue| Queue[Bull/Redis Queue]
      Queue -->|Process| Worker[Background Worker]
  ```

### 2. Định dạng Frontmatter Mẫu
```yaml
---
title: "Kiến trúc: [Tên thành phần kiến trúc]"
type: architecture
source:
  - System/agent_skills/generate_mermaid.js
  - "local: <local_path_tới_hạ_tầng>"
status: reviewed | draft | stale
last_synced: YYYY-MM-DD
tags:
  - architecture
  - technical-design
  - mermaid
---
```

## 🔗 Liên kết Hữu ích
- [[Index]] — Quay lại Trang chủ chính.
- [[04_API_Specs/README|Đặc tả API & Logic]] — Giao tiếp giữa các thành phần thông qua API.
- [[05_Database/README|Cơ sở dữ liệu]] — Sơ đồ thực thể cơ sở dữ liệu lưu trữ phía dưới.
