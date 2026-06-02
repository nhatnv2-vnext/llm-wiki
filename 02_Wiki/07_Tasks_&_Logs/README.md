---
title: "Hướng dẫn thư mục: 07_Tasks_&_Logs"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed
last_synced: "2026-06-02"
tags:
  - tasks-logs
  - readme
---

## 📂 Thư mục: 07_Tasks_&_Logs (Nhiệm vụ & Nhật ký vận hành)

## 🎯 Tác dụng & Vai trò
Thư mục `07_Tasks_&_Logs/` đóng vai trò là **Nhật ký Hành trình** và **Trung tâm Quản trị Vận hành** của Vault. Đây là nơi ghi nhận tiến độ thực hiện các nhiệm vụ phát triển, theo dõi nhật ký hoạt động của các script tự động hóa, và đặc biệt là nơi lưu trữ các báo cáo xung đột thông tin giữa tài liệu thiết kế và mã nguồn thực tế.

## 🗂️ Các thông tin chứa đựng
Thư mục này bao gồm:
1. **`Conflict_Reports.md` (Báo cáo Xung đột)**: File cực kỳ quan trọng ghi nhận các điểm không khớp nhau giữa tài liệu đặc tả nghiệp vụ (PRD từ Google Drive) và mã nguồn thực tế đang chạy. Được cập nhật tự động bởi AI trong quá trình ingest hoặc do con người ghi lại.
2. **Nhật ký Đồng bộ & Vận hành (Sync Logs)**: Nhật ký ghi nhận thời gian, trạng thái thành công/thất bại của các tiến trình tự động như `sync-drive`, `ingest`, `code-graph`, `index-vault`.
3. **Checklists & TODOs**: Các danh sách công việc cần làm của đội ngũ phát triển để duy trì và nâng cấp tri thức của Vault.

## 📐 Cấu trúc & Quy tắc Định dạng

### 1. Báo cáo Xung đột (`Conflict_Reports.md`)
Bắt buộc phải được cấu trúc rõ ràng dưới dạng bảng để dễ theo dõi và lọc thông tin:
- **ID / Module**: Mã định danh tính năng hoặc màn hình gặp xung đột.
- **Mô tả Xung đột**: Điểm khác biệt cụ thể (ví dụ: *"PRD yêu cầu nút Xác nhận nằm ở cuối màn hình và gửi API POST /orders/confirm, nhưng thực tế code Angular đang gọi API PUT /orders/update"*).
- **Trạng thái**: `Open` (Chưa xử lý) | `In Progress` (Đang giải quyết) | `Resolved` (Đã xử lý).
- **Người chịu trách nhiệm / Ghi nhận**: Ai đã phát hiện ra lỗi (Developer hay AI Agent).

### 2. Định dạng Frontmatter Mẫu
```yaml
---
title: "Báo cáo xung đột tri thức"
type: log
source:
  - System/agent_skills/ingest_codebase.js
status: draft | reviewed
last_synced: YYYY-MM-DD
tags:
  - conflict-report
  - logs
  - audit
---
```

## 🔗 Liên kết Hữu ích
- [[Index]] — Quay lại Trang chủ chính.
- [CLAUDE.md](../../System/CLAUDE.md) — Đọc thêm về luật vàng xử lý xung đột thông tin tại mục 1.
