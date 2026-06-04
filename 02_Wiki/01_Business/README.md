---
title: "Hướng dẫn thư mục: 01_Business"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed
last_synced: "2026-06-02"
tags:
  - business
  - readme
---

## 📂 Thư mục: 01_Business (Nghiệp vụ & Đặc tả sản phẩm)

## 🎯 Tác dụng & Vai trò
Thư mục `01_Business/` là nơi lưu trữ toàn bộ các tài liệu liên quan đến **Yêu cầu Sản phẩm (Product Requirements)** và **Logic Nghiệp vụ (Business Logic)**. Thư mục này đóng vai trò cầu nối giữa đội ngũ sản phẩm (Product Owners/Analysts) và đội ngũ kỹ thuật (Developers/AI Agents), đảm bảo hệ thống xây dựng đúng với định hướng giá trị cốt lõi của doanh nghiệp.

## 🗂️ Các thông tin chứa đựng
Thư mục này bao gồm:
1. **Tài liệu PRD (Product Requirement Documents)**: Chi tiết về mục tiêu, đối tượng sử dụng (User Personas), phạm vi sản phẩm và các tiêu chí chấp nhận (Acceptance Criteria).
2. **Sơ đồ Luồng Nghiệp vụ (Business Flowcharts)**: Mô hình hóa các luồng nghiệp vụ lớn (ví dụ: quy trình thanh toán, quy trình đăng ký tài khoản, xử lý đơn hàng hoàn trả) bằng sơ đồ trực quan.
3. **Các Quy định Nghiệp vụ (Business Rules)**: Các quy tắc ràng buộc chặt chẽ của doanh nghiệp (ví dụ: công thức tính chiết khấu, điều kiện áp dụng khuyến mãi, phân quyền tài khoản).

## 📐 Cấu trúc & Quy tắc Định dạng
Các tệp đặc tả nghiệp vụ trong thư mục này cần tuân thủ các hướng dẫn sau:

### 1. Cấu trúc File Đặc tả Nghiệp vụ
Mỗi tài liệu nghiệp vụ chi tiết nên tuân theo định dạng:
- **Tổng quan (Overview)**: Lý do tính năng tồn tại và bài toán nó giải quyết.
- **Tác nhân (Actors / Personas)**: Ai là người sử dụng luồng nghiệp vụ này.
- **Luồng xử lý chính (Happy Path)**: Các bước thực hiện thành công.
- **Ràng buộc nghiệp vụ (Business Rules)**: Liệt kê rõ ràng bằng danh sách ký hiệu (bullet points).
- **Mermaid Sơ đồ Luồng**: Đặt khối sơ đồ Mermaid ngay dưới phần mô tả quy trình để trực quan hóa logic nghiệp vụ.

### 2. Định dạng Frontmatter Mẫu
```yaml
---
title: "Đặc tả Nghiệp vụ: [Tên nghiệp vụ]"
type: dashboard
source:
  - 01_Raw/drive_docs/[File_PRD_gốc].md
status: reviewed | draft | stale
last_synced: YYYY-MM-DD
tags:
  - business
  - core-logic
---
```

## 🔗 Liên kết Hữu ích
- [[Index]] — Quay lại Trang chủ chính.
- [[02_Design/README|Đặc tả Giao diện]] — Các màn hình giao diện cụ thể để hiện thực hóa nghiệp vụ này.
- [[04_API_Specs/README|Đặc tả API & Logic]] — Cách các API hiện thực hóa các quy tắc nghiệp vụ trong mã nguồn.
