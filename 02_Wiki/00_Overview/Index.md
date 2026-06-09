---
title: "Mục lục Dự án"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed
last_synced: "2026-06-09"
tags:
  - map-of-content
  - index
  - dashboard
---

## 📚 Mục lục Dự án (Wiki Index)

Chào mừng bạn đến với **Knowledge Vault** của dự án. Đây là Bản đồ nội dung (Map of Content - MOC) đóng vai trò là điểm bắt đầu hành trình khám phá kiến thức hệ thống. 

Vault này được vận hành tự động bằng các AI agents phối hợp với **Obsidian** để trực quan hóa kiến thức thông qua liên kết mạng lưới (Wikilinks).

---

## 🗺️ Bản đồ Tri thức (Map of Content)

### 1. 🏗️ Kiến trúc & Tổng quan (`03_Architecture/`)
*Tài liệu về kiến trúc tổng thể, mô hình hệ thống, sơ đồ C4 và các luồng xử lý nền.*
- [[03_Architecture/README|Kiến trúc Tổng quan]] — Hướng dẫn cấu trúc thư mục kiến trúc.
- _Các sơ đồ luồng dữ liệu, cronjobs và queue sẽ được liệt kê tại đây._

### 2. 🖥️ Giao diện Frontend (`02_Design/`)
*Danh sách các màn hình giao diện ứng dụng (Screens) và tài liệu đặc tả chức năng.*
- [[02_Design/README|Đặc tả Giao diện]] — Hướng dẫn đặc tả màn hình.
- _Các đặc tả màn hình dạng `[[02_Design/SCR_XXX_<slug>|SCR_XXX]]` sẽ được tự động cập nhật bởi skill `/spec-screen`._

### 3. ⚙️ APIs & Logic Backend (`04_API_Specs/`)
*Đặc tả hợp đồng API (REST, WebSocket, gRPC) và các quy tắc nghiệp vụ.*
- [[04_API_Specs/README|Đặc tả API & Logic]] — Hướng dẫn đặc tả tính năng.
- _Các đặc tả API dạng `[[04_API_Specs/FEA_XXX_<slug>|FEA_XXX]]` sẽ được tự động cập nhật bởi skill `/spec-feature`._

### 4. 🗄️ Cơ sở dữ liệu (`05_Database/`)
*Mô tả cấu trúc dữ liệu, sơ đồ thực thể mối quan hệ ERD và cấu hình schema.*
- [[05_Database/README|Cơ sở dữ liệu]] — Hướng dẫn tài liệu hóa schema.
- _Sơ đồ ERD và chi tiết các bảng sẽ được tự động cập nhật tại đây._

### 5. 🔍 Phân tích mã nguồn (`06_Code_Graph/`)
*Sơ đồ tri thức tự động trích xuất trực tiếp từ mã nguồn thông qua CodeGraph.*
- [[06_Code_Graph/README|Bản đồ Code Graph]] — Sơ đồ cấu trúc các area/components của mã nguồn.

### 6. 📝 Quản lý công việc & Vận hành (`07_Tasks_&_Logs/`)
*Nhật ký đồng bộ, danh sách công việc và báo cáo xung đột tài liệu.*
- [[07_Tasks_&_Logs/README|Nhiệm vụ & Nhật ký]] — Hướng dẫn quản lý công việc và báo cáo lỗi đồng bộ.

### 7. 🏛️ Quyết định Kiến trúc (`08_ADR/`)
*Lịch sử các quyết định thiết kế quan trọng kèm bối cảnh, lý do và đánh đổi.*
- [[08_ADR/README|Architecture Decision Records]] — Tại sao hệ thống được xây dựng theo cách hiện tại.
- _Các ADR dạng `ADR_NNN_<slug>.md` được tạo bởi skill `/log-adr`._

### 8. 🧪 Kiểm thử (`09_Testing/`)
*Chiến lược kiểm thử, kịch bản test quan trọng và báo cáo coverage.*
- [[09_Testing/README|Chiến lược Kiểm thử]] — Test strategy, test pyramid và coverage guide.

### 9. 🔐 Bảo mật (`10_Security/`)
*Cơ chế xác thực, phân quyền RBAC, chính sách API security và bản đồ dữ liệu nhạy cảm.*
- [[10_Security/README|Bảo mật & Audit]] — Auth flow, RBAC matrix, security checklist.

---

## 📊 Vault Stats

<!-- VAULT_STATS:START — auto-generated, do not edit by hand. Run `npm run stats`. -->

| Metric | Count |
|--------|-------|
| Wiki notes | **8** |
| Wikilinks | **27** |
| Code-graph skills | **0** |
| API endpoints documented | **0** |
| Prisma models | **0** |
| Last updated | 2026-06-02 |

<!-- VAULT_STATS:END -->

---

## 🚀 Lệnh nhanh (NPM Scripts)

Chạy các lệnh sau trong thư mục `System/` để kích hoạt bộ công cụ tự động hóa:

- `npm run sync-drive` — Đồng bộ tài liệu gốc từ Google Drive vào `01_Raw/drive_docs/`.
- `npm run ingest` — Quét mã nguồn tại local path để tự động sinh tài liệu kiến trúc.
- `npm run code-graph` — Chạy CodeGraph phân tích sâu cấu trúc AST mã nguồn.
- `npm run stats` — Cập nhật bảng thống kê số liệu động phía trên.
- `npm run validate` — Chạy lint kiểm tra chất lượng định dạng và các liên kết trong Vault.
