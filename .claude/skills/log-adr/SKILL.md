---
name: log-adr
description: Ghi nhận một Architecture Decision Record (ADR) — quyết định kiến trúc quan trọng kèm bối cảnh, các lựa chọn đã cân nhắc và hệ quả — vào 02_Wiki/08_ADR/. Trigger khi user gõ /log-adr <tiêu_đề>, nói "ghi nhận quyết định kiến trúc", "tạo ADR cho", "log lý do chọn X thay vì Y", "tại sao team chọn công nghệ Z", "document technical decision", hoặc khi một skill khác (spec-architecture/spec-feature) phát hiện quyết định thiết kế quan trọng cần lưu lại.
---

# Skill: log-adr

Bạn được gọi để **ghi nhận một Architecture Decision Record (ADR)** — tài liệu hóa một quyết định thiết kế quan trọng kèm bối cảnh đầy đủ để team (và AI) có thể hiểu lý do trong tương lai.

> **Triết lý:** ADR không phải là nhật ký — nó là "tại sao" của kiến trúc. Một ADR tốt giúp người mới tham gia hiểu được ràng buộc và đánh đổi đã được cân nhắc, thay vì phải đoán.

## Đầu vào

User gõ `/log-adr <tiêu_đề>` (vd: `/log-adr Chọn LanceDB thay vì Pinecone cho RAG vector store`).
Nếu user không cung cấp đủ thông tin, hỏi ngắn gọn để lấp 3 trường cốt lõi: **Bối cảnh**, **Quyết định**, **Hệ quả / Đánh đổi**.

## Quy trình 5 bước (BẮT BUỘC)

### Bước 1 — Xác định số ADR tiếp theo

1. Liệt kê `02_Wiki/08_ADR/` (bỏ qua `README.md`).
2. Tìm file có số `ADR_NNN` cao nhất. Số tiếp theo = NNN + 1 (bắt đầu từ `001` nếu chưa có).
3. Slugify tiêu đề: bỏ dấu tiếng Việt, Snake_Case_With_Capital (vd: `Chon_LanceDB_Thay_Vi_Pinecone`).

### Bước 2 — Thu thập ngữ cảnh (nếu thiếu)

Nếu user chỉ cung cấp tiêu đề mà không có chi tiết, hỏi tối đa 3 câu:
1. **Bối cảnh:** Vấn đề/yêu cầu nào dẫn tới quyết định này?
2. **Lựa chọn đã cân nhắc:** Những phương án nào đã được xem xét (kể cả phương án bị loại)?
3. **Đánh đổi:** Quyết định này đánh đổi điều gì? (vd: đơn giản hơn nhưng ít tính năng hơn)

Nếu skill được gọi từ skill khác (spec-architecture, spec-feature) và đã có ngữ cảnh → bỏ qua bước hỏi, dùng ngữ cảnh đã có.

### Bước 3 — Đọc template và soạn nội dung

1. Đọc `02_Wiki/_Templates/adr_template.md`.
2. Điền vào template với thông tin đã thu thập:
   - **Ngày**: hôm nay `YYYY-MM-DD`
   - **Trạng thái**: `Accepted` (nếu đã quyết định) hoặc `Proposed` (nếu đang đề xuất)
   - **Bối cảnh**: mô tả vấn đề, ràng buộc, yêu cầu
   - **Các lựa chọn**: ít nhất 2 lựa chọn với Ưu/Nhược rõ ràng
   - **Quyết định**: phương án được chọn + lý do cụ thể
   - **Hệ quả**: tích cực + tiêu cực + hành động cần làm

> **Nguyên tắc viết ADR tốt:** Giải thích "tại sao không chọn" lựa chọn còn lại quan trọng không kém giải thích "tại sao chọn". Điều này ngăn team đi vòng tròn với quyết định tương tự trong tương lai.

### Bước 4 — Ghi file (KHÔNG archive)

- Path: `02_Wiki/08_ADR/ADR_<NNN>_<Slug>.md`
- **ADR là IMMUTABLE** sau khi `Accepted` — KHÔNG có bước archive. Nếu file đã tồn tại (chưa `Accepted`), hỏi user có muốn ghi đè không.
- Ghi nội dung mới.

### Bước 5 — Cập nhật bảng danh sách trong README

1. Mở `02_Wiki/08_ADR/README.md`.
2. Tìm bảng "Danh sách ADR" (phần `| # | Tiêu đề | Ngày | Status |`).
3. Thêm dòng mới cho ADR vừa tạo. Xóa dòng placeholder "Chưa có ADR nào" nếu còn.
4. Ghi lại `README.md`.

### Cuối cùng — Trả output cho user

```markdown
✅ Đã ghi nhận **ADR-<NNN>: <Tiêu đề>**

📄 [[08_ADR/ADR_<NNN>_<Slug>|ADR-<NNN>: <Tiêu đề>]]

**Tóm tắt quyết định:**
- Chọn: <Lựa chọn được chọn>
- Vì: <1-2 lý do cốt lõi>
- Đánh đổi: <điểm tiêu cực chính>

**Trạng thái:** `<Accepted / Proposed>`
```

## Ràng buộc

- KHÔNG sửa ADR đã có status `Accepted` — quyết định đã chốt là BẤT BIẾN. Nếu cần thay đổi → tạo ADR mới với `Supersedes: ADR-<số cũ>`.
- KHÔNG ghi ADR mà không có ít nhất 2 lựa chọn đã cân nhắc. ADR một lựa chọn không có giá trị.
- KHÔNG lưu thông tin nhạy cảm (key, password, credential) vào ADR.
- Mỗi ADR phải rõ ràng có thể trả lời: "Nếu tôi vào team hôm nay, tôi có hiểu tại sao kiến trúc này được chọn không?"

## Ví dụ

> User: `/log-adr Chọn ts-morph thay vì babel-parser để parse TypeScript AST`
>
> 1. Liệt kê `08_ADR/` → chưa có file nào → số tiếp theo: `001`.
> 2. Slug: `Chon_ts_morph_Thay_Vi_Babel_Parser`.
> 3. Thu thập: Bối cảnh = cần parse Angular/NestJS TypeScript với tsconfig.paths; Lựa chọn = ts-morph (wraps TypeScript compiler) vs babel-parser (nhanh hơn, ít type info); Quyết định = ts-morph vì cần resolve paths từ tsconfig.
> 4. Ghi `02_Wiki/08_ADR/ADR_001_Chon_ts_morph_Thay_Vi_Babel_Parser.md`.
> 5. Cập nhật bảng trong `README.md`.
> 6. Trả wikilink + tóm tắt.
