---
title: "Hướng dẫn thư mục: 00_Overview"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed
last_synced: "2026-06-02"
tags:
  - overview
  - readme
---

## 📂 Thư mục: 00_Overview (Tổng quan & Dashboard)

## 🎯 Tác dụng & Vai trò
Thư mục `00_Overview/` đóng vai trò là **Bộ não Trung tâm** và **Điểm xuất phát (Map of Content - MOC)** cho toàn bộ dự án Wiki. Đây là nơi đầu tiên mà các nhà phát triển (Developers) và các trợ lý AI (AI Agents) truy cập để nắm bắt bản đồ tổng quan của toàn bộ kiến thức hệ thống.

## 🗂️ Các thông tin chứa đựng
Thư mục này bao gồm:
1. **`Index.md` (Single Source of Truth cho cấu trúc Wiki)**: Bản đồ liên kết chéo tới tất cả các thư mục chức năng khác trong Vault.
2. **`Vault_Index.json` (File Auto-generated)**: Cơ sở dữ liệu metadata dạng JSON chứa toàn bộ headings, tags, wikilinks của mọi file trong Vault, được sử dụng để tối ưu ngữ cảnh cho các công cụ AI (RAG).
3. **Các tài liệu Onboarding**: Hướng dẫn thiết lập ban đầu, giới thiệu dự án nhanh cho thành viên mới của team phát triển.

## 📐 Cấu trúc & Quy tắc Định dạng
Các tệp tin trong thư mục này phải tuân thủ nghiêm ngặt các quy tắc sau:

### 1. File `Index.md`
- Phải chứa đầy đủ liên kết wikilink `[[Thư_mục/README|Tên hiển thị]]` tới 6 thư mục chức năng còn lại.
- Phải có hai khối marker bình luận HTML để script thống kê tự động cập nhật số liệu:
  ```markdown
  <!-- VAULT_STATS:START -->
  (Nội dung bảng stats được sinh tự động bởi npm run stats)
  <!-- VAULT_STATS:END -->
  ```
- Frontmatter bắt buộc có tag `#map-of-content` và `#dashboard`.

### 2. Định dạng Frontmatter Mẫu
```yaml
---
title: "Tiêu đề Dashboard"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed | draft
last_synced: YYYY-MM-DD
tags:
  - overview
  - dashboard
---
```

## 🔗 Liên kết Hữu ích
- [[Index]] — Quay lại Trang chủ chính.
- [CLAUDE.md](../../System/CLAUDE.md) — Đọc quy tắc vận hành tổng thể của Vault.
