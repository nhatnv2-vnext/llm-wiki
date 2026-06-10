---
title: "Hướng dẫn thư mục: 08_ADR"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed
last_synced: "2026-06-09"
tags:
  - adr
  - architecture
  - readme
---

## 📂 Thư mục: 08_ADR (Architecture Decision Records)

## 🎯 Tác dụng & Vai trò

Thư mục `08_ADR/` là nơi lưu trữ chính thức các **Quyết định Kiến trúc (Architecture Decision Records)**. Mỗi ADR ghi lại một quyết định thiết kế quan trọng kèm theo bối cảnh, lý do, các lựa chọn đã cân nhắc và hệ quả — giúp team hiểu tại sao hệ thống được xây dựng theo cách hiện tại.

> **Tại sao cần ADR?** Khi kiến trúc thay đổi (ví dụ: chuyển từ GitNexus → CodeGraph, chọn LanceDB thay vì Pinecone, adopt Bull Queue thay vì Kafka), quyết định đó thường bị "mất" sau vài tháng. ADR bảo tồn bối cảnh của quyết định để người mới tham gia hoặc AI có thể hiểu được lý do thiết kế.

## 🗂️ Quy tắc đặt tên file

```
ADR_<NNN>_<Slug_Quyết_Định>.md
```

**Ví dụ:**
- `ADR_001_Chon_CodeGraph_Thay_GitNexus.md`
- `ADR_002_Dung_LanceDB_Cho_RAG_Vector_Store.md`
- `ADR_003_Chon_ts_morph_De_Parse_Angular_AST.md`

- Số `<NNN>` tăng dần, bắt đầu từ `001`.
- `<Slug>` viết dạng `Snake_Case_With_Capital`, không dấu tiếng Việt.

## 📐 Vòng đời (Status) của một ADR

| Status | Ý nghĩa |
|--------|---------|
| `Proposed` | Đang đề xuất, chưa được chốt |
| `Accepted` | Đã được chấp nhận và đang áp dụng |
| `Deprecated` | Không còn áp dụng nhưng giữ lại làm lịch sử |
| `Superseded` | Bị thay thế bởi ADR khác (ghi rõ ADR mới) |

> **Quy tắc bất khả xâm phạm:** ADR là **IMMUTABLE** sau khi `Accepted`. KHÔNG chỉnh sửa nội dung gốc — nếu quyết định thay đổi, hãy tạo ADR mới với status `Superseded` trỏ về ADR cũ. AI KHÔNG được sửa ADR đã `Accepted`.

## 🔧 Cách tạo ADR mới

### Cách 1 — Dùng AI Skill (khuyến nghị)
```
/log-adr <Tiêu đề quyết định>
```
Ví dụ: `/log-adr Chọn Redis Pub/Sub thay vì WebSocket thuần cho realtime`

AI sẽ tự động:
1. Tạo số ADR tiếp theo
2. Dùng template `_Templates/adr_template.md`
3. Ghi vào thư mục này

### Cách 2 — Tạo thủ công
1. Copy từ `02_Wiki/_Templates/adr_template.md`
2. Đặt tên theo quy tắc trên
3. Điền đầy đủ các section

## 📋 Danh sách ADR

_(Danh sách này được cập nhật tự động bởi skill `/log-adr` hoặc thủ công khi thêm ADR mới)_

| # | Tiêu đề | Ngày | Status |
|---|---------|------|--------|
| — | _Chưa có ADR nào. Chạy `/log-adr` để tạo ADR đầu tiên._ | — | — |

## 🔗 Liên kết Hữu ích

- [[Index]] — Quay lại Trang chủ chính.
- [[03_Architecture/README|Kiến trúc Hệ thống]] — Sơ đồ kiến trúc hiện tại.
- [CLAUDE.md](../../System/CLAUDE.md) — Nguyên tắc vận hành vault.
