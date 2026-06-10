---
name: plan-wiki
description: Lên dàn ý (Table of Contents) cho Wiki bằng cách đọc các file catalog từ 01_Raw. Sinh ra file 02_Wiki/00_Overview/Index.md. Trigger khi user gõ /plan-wiki.
---

# Skill: plan-wiki

Bạn được gọi để **tự động thiết kế Dàn ý (Table of Contents)** cho toàn bộ dự án Wiki. Quá trình này giúp hệ thống hóa lại các tính năng, màn hình đã được quét ở bước trước thành một cấu trúc dễ theo dõi.

## Đầu vào
User gõ `/plan-wiki`.

## Quy trình 4 bước

### Bước 1 — Đọc Dữ liệu Thô (Catalogs)
1. Đọc file `01_Raw/screens/Screens.json` (Danh sách màn hình Frontend).
2. Đọc file `01_Raw/features/Features.json` (Danh sách API/Backend features).
3. Đọc file `01_Raw/database/schemas.json` (Cấu trúc cơ sở dữ liệu).

### Bước 2 — Xây dựng Dàn ý (Table of Contents)
Dựa trên các ID và Name lấy được từ Bước 1, bạn sẽ nhóm chúng lại theo một cấu trúc logic (ví dụ nhóm theo Module, hoặc Frontend vs Backend).

**Cấu trúc thư mục mong đợi trong `02_Wiki/`**:
- `02_Design/`: Nơi chứa tài liệu về màn hình (`SCR_XXX`).
- `04_API_Specs/`: Nơi chứa tài liệu về API/Feature (`FEA_XXX`).
- `05_Database/`: Nơi chứa tài liệu về schema.

**Định dạng `Index.md` sẽ sinh ra:**
Tạo nội dung cho file `02_Wiki/00_Overview/Index.md` theo mẫu sau. Thay vì chỉ liệt kê ID, hãy đọc trạng thái từ file `WikiState.json` (nếu có) để gắn prefix `[ ]` (chưa tạo), `[x]` (đã tạo, up-to-date), hoặc `[~]` (needs update) trước mỗi item:

```markdown
# 📚 Mục lục Dự án (Wiki Index)

*Dàn ý này được sinh tự động từ các file Catalog ở `01_Raw`.*

## 1. Cấu trúc Database
*(Liệt kê các bảng/schemas từ schemas.json, tạo wikilink dạng `[[05_Database/<Tên_Bảng>]]`)*

## 2. Frontend Screens (Giao diện)
*(Liệt kê các màn hình từ Screens.json. Nhóm theo dự án)*
- **[Project Name]**
  - `[ ]` `[SCR_XXX]` [[02_Design/SCR_XXX_<slug>|<Tên Màn Hình>]]
  - `[x]` `[SCR_YYY]` [[02_Design/SCR_YYY_<slug>|<Tên Màn Hình Khác>]]
  - ...

## 3. Backend Features (API & Logic)
*(Liệt kê các tính năng từ Features.json. Nhóm theo dự án)*
- **[Project Name]**
  - `[~]` `[FEA_XXX]` [[04_API_Specs/FEA_XXX_<slug>|<Tên Tính Năng>]]
  - ...
```

*Lưu ý: Bạn sử dụng chuẩn Wikilink `[[Path/To/File|Display Text]]`. File đích chưa cần phải tồn tại lúc này.*

### Bước 3 — Quản lý State (WikiState.json)
1. Đọc file `.claude/state/WikiState.json` (nếu chưa có thì tạo mới file này và folder `state` nếu cần).
2. Duyệt qua tất cả các `FEA_XXX` và `SCR_XXX` vừa lấy được.
3. Nếu ID chưa tồn tại trong `WikiState.json`, thêm mới với trạng thái `status: "pending"`, khởi tạo mảng `source_files: []` (lấy từ dữ liệu trong file Catalog) và `doc_files: []` (mặc định rỗng hoặc map từ `01_Raw/drive_docs` nếu có link tương ứng).
4. Ghi lại nội dung vào `.claude/state/WikiState.json`.

### Bước 4 — Ghi file
Ghi nội dung đã xây dựng vào file `02_Wiki/00_Overview/Index.md`. Nếu file đã có, thay thế nội dung (hoặc hỏi người dùng có muốn ghi đè toàn bộ không nếu trong code của bạn cần xác nhận).
Khuyến nghị tạo một bản backup ra `02_Wiki/_Archive/Index_v<timestamp>.md` trước khi ghi đè.

### Cuối cùng — Trả output cho user
```markdown
✅ Đã tạo dàn ý (Index.md) cho toàn bộ dự án.

Bạn có thể mở file [[Index]] để xem tổng quan. 
Bước tiếp theo, bạn có thể gọi `/spec-screen <ID>` hoặc `/spec-feature <ID>` để sinh chi tiết cho từng mục!

💡 Nhớ cập nhật bảng thống kê: `cd apps/System && npm run stats`
```
